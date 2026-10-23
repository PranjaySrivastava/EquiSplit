const Group = require('../models/Group');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const {
  calculateNetBalances,
  simplifyDebts,
  computePairwiseDebts,
  round2,
} = require('../services/debtSimplifier');

// @route   GET /api/groups/:groupId/balances
// @desc    Get group balances, simplified settle-up transfers, and pairwise matrix
// @access  Private (Group member only)
const getGroupBalances = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId).populate(
      'members.user',
      'name email avatar'
    );
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const expenses = await Expense.find({ group: groupId }).populate(
      'paidBy.user splits.user',
      'name email avatar'
    );
    const settlements = await Settlement.find({ group: groupId }).populate(
      'fromUser toUser',
      'name email avatar'
    );

    // Build user details lookup map
    const userDetailsMap = {};
    group.members.forEach((m) => {
      if (m.user && m.user._id) {
        userDetailsMap[m.user._id.toString()] = {
          _id: m.user._id,
          name: m.user.name,
          email: m.user.email,
          avatar: m.user.avatar,
        };
      }
    });

    // 1. Calculate Net Balances
    const netBalanceMap = calculateNetBalances(group.members, expenses, settlements);

    // Format member balances array
    const balances = group.members.map((m) => {
      const uId = m.user._id.toString();
      const balance = netBalanceMap[uId] || 0;
      return {
        user: userDetailsMap[uId],
        balance: round2(balance),
        status:
          balance > 0.01
            ? 'gets_back'
            : balance < -0.01
            ? 'owes'
            : 'settled',
      };
    });

    // Sort: creditors first, then settled, then debtors
    balances.sort((a, b) => b.balance - a.balance);

    // 2. Compute Simplified Min-Cash-Flow Transfers
    const simplifiedTransfers = simplifyDebts(netBalanceMap, userDetailsMap);

    // 3. Compute Raw Pairwise Debts
    const rawTransfers = computePairwiseDebts(
      group.members,
      expenses,
      settlements,
      userDetailsMap
    );

    // 4. Group spend totals
    const totalSpent = round2(
      expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    );
    const totalSettled = round2(
      settlements.reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
    );

    const currentUserId = req.user._id.toString();
    const myNetBalance = round2(netBalanceMap[currentUserId] || 0);

    res.json({
      success: true,
      data: {
        currency: group.currency,
        totalSpent,
        totalSettled,
        myBalance: myNetBalance,
        balances,
        simplifiedTransfers,
        rawTransfers,
        savingTransactionCount: Math.max(0, rawTransfers.length - simplifiedTransfers.length),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/groups/:groupId/analytics
// @desc    Get category breakdown and spending insights for charts
// @access  Private (Group member only)
const getGroupAnalytics = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId).populate('members.user', 'name email');
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const expenses = await Expense.find({ group: groupId })
      .populate('paidBy.user splits.user', 'name email')
      .sort({ date: 1 });

    const categoryMap = {};
    const memberPaidMap = {};
    const memberConsumedMap = {};

    group.members.forEach((m) => {
      const uId = m.user._id.toString();
      memberPaidMap[uId] = { user: m.user, amount: 0 };
      memberConsumedMap[uId] = { user: m.user, amount: 0 };
    });

    let totalAmount = 0;

    expenses.forEach((e) => {
      const amt = Number(e.amount) || 0;
      totalAmount = round2(totalAmount + amt);

      // Category breakdown
      const cat = e.category || 'other';
      categoryMap[cat] = round2((categoryMap[cat] || 0) + amt);

      // Paid breakdown
      e.paidBy.forEach((p) => {
        const uId = (p.user?._id || p.user).toString();
        if (memberPaidMap[uId]) {
          memberPaidMap[uId].amount = round2(memberPaidMap[uId].amount + Number(p.amount));
        }
      });

      // Consumed share breakdown
      e.splits.forEach((s) => {
        const uId = (s.user?._id || s.user).toString();
        if (memberConsumedMap[uId]) {
          memberConsumedMap[uId].amount = round2(memberConsumedMap[uId].amount + Number(s.amount));
        }
      });
    });

    const categoryBreakdown = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalAmount > 0 ? round2((amount / totalAmount) * 100) : 0,
    }));

    categoryBreakdown.sort((a, b) => b.amount - a.amount);

    res.json({
      success: true,
      data: {
        totalAmount,
        expenseCount: expenses.length,
        categoryBreakdown,
        memberPaid: Object.values(memberPaidMap),
        memberConsumed: Object.values(memberConsumedMap),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGroupBalances,
  getGroupAnalytics,
};
