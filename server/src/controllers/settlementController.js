const Settlement = require('../models/Settlement');
const Group = require('../models/Group');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const { round2 } = require('../services/debtSimplifier');

// @route   POST /api/groups/:groupId/settlements
// @desc    Record a settlement payment between two group members
// @access  Private (Group member only)
const recordSettlement = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { toUserId, amount, currency, notes, date } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const fromUserId = req.user._id.toString();

    // Verify both are group members
    const fromIsMember = group.members.some((m) => m.user.toString() === fromUserId);
    const toIsMember = group.members.some((m) => m.user.toString() === toUserId);

    if (!fromIsMember || !toIsMember) {
      return res.status(400).json({
        success: false,
        message: 'Both payer and recipient must be members of this group',
      });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot record a settlement to yourself',
      });
    }

    const numAmount = round2(Number(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Settlement amount must be greater than zero',
      });
    }

    const settlement = await Settlement.create({
      group: groupId,
      fromUser: fromUserId,
      toUser: toUserId,
      amount: numAmount,
      currency: currency || group.currency || 'INR',
      notes: notes || 'Settlement payment',
      date: date ? new Date(date) : new Date(),
      recordedBy: req.user._id,
    });

    const recipient = await User.findById(toUserId);

    await ActivityLog.create({
      group: groupId,
      user: req.user._id,
      action: 'SETTLEMENT_RECORDED',
      message: `${req.user.name} paid ${recipient?.name || 'a member'} ${settlement.currency} ${settlement.amount.toFixed(2)} (Settled up)`,
      metadata: { settlementId: settlement._id, amount: settlement.amount },
    });

    const populated = await Settlement.findById(settlement._id)
      .populate('fromUser', 'name email avatar')
      .populate('toUser', 'name email avatar')
      .populate('recordedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Settlement recorded successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/groups/:groupId/settlements
// @desc    Get all settlement payments in a group
// @access  Private (Group member only)
const getGroupSettlements = async (req, res, next) => {
  try {
    const { groupId } = req.params;

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

    const settlements = await Settlement.find({ group: groupId })
      .populate('fromUser', 'name email avatar')
      .populate('toUser', 'name email avatar')
      .sort({ date: -1, createdAt: -1 });

    res.json({
      success: true,
      count: settlements.length,
      data: settlements,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordSettlement,
  getGroupSettlements,
};
