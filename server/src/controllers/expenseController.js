const Expense = require('../models/Expense');
const Group = require('../models/Group');
const ActivityLog = require('../models/ActivityLog');
const { calculateSplits, validatePayers, round2 } = require('../services/splitCalculator');

// @route   POST /api/groups/:groupId/expenses
// @desc    Add a new expense to a group
// @access  Private (Group member only)
const addExpense = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const {
      description,
      amount,
      currency,
      paidBy,
      splitType,
      splits,
      category,
      date,
      notes,
    } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Verify user is group member
    const isMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of this group to add expenses',
      });
    }

    const numAmount = round2(Number(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Expense amount must be a positive number',
      });
    }

    // Default paidBy: if single payer not formatted as array, format it
    let payersList = paidBy;
    if (!payersList || payersList.length === 0) {
      payersList = [{ user: req.user._id, amount: numAmount }];
    }

    // Validate payers sum to total
    try {
      validatePayers(numAmount, payersList);
    } catch (payerErr) {
      return res.status(400).json({ success: false, message: payerErr.message });
    }

    // Compute splits based on splitType
    let participants = splits;
    if (!participants || participants.length === 0) {
      // Default: split equally among all group members
      participants = group.members.map((m) => ({ user: m.user }));
    }

    let calculatedSplits;
    try {
      calculatedSplits = calculateSplits(numAmount, splitType || 'equal', participants);
    } catch (splitErr) {
      return res.status(400).json({ success: false, message: splitErr.message });
    }

    const expense = await Expense.create({
      group: groupId,
      description: description.trim(),
      amount: numAmount,
      currency: currency || group.currency || 'INR',
      paidBy: payersList,
      splitType: splitType || 'equal',
      splits: calculatedSplits,
      category: category || 'food',
      date: date ? new Date(date) : new Date(),
      notes: notes || '',
      createdBy: req.user._id,
    });

    await ActivityLog.create({
      group: groupId,
      user: req.user._id,
      action: 'EXPENSE_ADDED',
      message: `${req.user.name} added "${expense.description}" (${expense.currency} ${expense.amount.toFixed(2)})`,
      metadata: { expenseId: expense._id, amount: expense.amount },
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy.user', 'name email avatar')
      .populate('splits.user', 'name email avatar')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedExpense,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/groups/:groupId/expenses
// @desc    Get all expenses for a group (with optional search & category filter)
// @access  Private (Group member only)
const getGroupExpenses = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { search, category, startDate, endDate } = req.query;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const filter = { group: groupId };

    if (search && search.trim() !== '') {
      filter.description = { $regex: search.trim(), $options: 'i' };
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter)
      .populate('paidBy.user', 'name email avatar')
      .populate('splits.user', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ date: -1, createdAt: -1 });

    res.json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/expenses/:id
// @desc    Update an expense (Payer, Creator, or Group Admin only)
// @access  Private
const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const group = await Group.findById(expense.group);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Authorization check: Only payer, creator, or group admin can edit
    const isCreator = expense.createdBy.toString() === req.user._id.toString();
    const isPayer = expense.paidBy.some(
      (p) => p.user.toString() === req.user._id.toString()
    );
    const isAdmin = group.members.some(
      (m) => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );

    if (!isCreator && !isPayer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the expense payer, creator, or a group admin can edit this expense',
      });
    }

    const {
      description,
      amount,
      paidBy,
      splitType,
      splits,
      category,
      date,
      notes,
    } = req.body;

    const numAmount = round2(Number(amount ?? expense.amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Expense amount must be a positive number',
      });
    }

    let payersList = paidBy || expense.paidBy;
    try {
      validatePayers(numAmount, payersList);
    } catch (payerErr) {
      return res.status(400).json({ success: false, message: payerErr.message });
    }

    let effectiveSplitType = splitType || expense.splitType;
    let participants = splits || expense.splits;
    let calculatedSplits;

    try {
      calculatedSplits = calculateSplits(numAmount, effectiveSplitType, participants);
    } catch (splitErr) {
      return res.status(400).json({ success: false, message: splitErr.message });
    }

    expense.description = description !== undefined ? description.trim() : expense.description;
    expense.amount = numAmount;
    expense.paidBy = payersList;
    expense.splitType = effectiveSplitType;
    expense.splits = calculatedSplits;
    if (category) expense.category = category;
    if (date) expense.date = new Date(date);
    if (notes !== undefined) expense.notes = notes;
    expense.updatedBy = req.user._id;

    await expense.save();

    await ActivityLog.create({
      group: expense.group,
      user: req.user._id,
      action: 'EXPENSE_UPDATED',
      message: `${req.user.name} edited "${expense.description}"`,
      metadata: { expenseId: expense._id, amount: expense.amount },
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy.user', 'name email avatar')
      .populate('splits.user', 'name email avatar')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      data: populatedExpense,
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense (Payer, Creator, or Group Admin only)
// @access  Private
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const group = await Group.findById(expense.group);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Authorization check
    const isCreator = expense.createdBy.toString() === req.user._id.toString();
    const isPayer = expense.paidBy.some(
      (p) => p.user.toString() === req.user._id.toString()
    );
    const isAdmin = group.members.some(
      (m) => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );

    if (!isCreator && !isPayer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the expense payer, creator, or a group admin can delete this expense',
      });
    }

    const expenseDesc = expense.description;
    const expenseAmt = expense.amount;
    const groupId = expense.group;

    await Expense.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      group: groupId,
      user: req.user._id,
      action: 'EXPENSE_DELETED',
      message: `${req.user.name} deleted expense "${expenseDesc}" (${expenseAmt})`,
    });

    res.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addExpense,
  getGroupExpenses,
  updateExpense,
  deleteExpense,
};
