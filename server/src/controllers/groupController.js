const Group = require('../models/Group');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const { calculateNetBalances, round2 } = require('../services/debtSimplifier');

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
const createGroup = async (req, res, next) => {
  try {
    const { name, description, currency, category } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Group name is required',
      });
    }

    const group = await Group.create({
      name: name.trim(),
      description: description || '',
      currency: currency || 'INR',
      category: category || 'General',
      createdBy: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'admin',
          joinedAt: new Date(),
        },
      ],
    });

    await ActivityLog.create({
      group: group._id,
      user: req.user._id,
      action: 'GROUP_CREATED',
      message: `${req.user.name} created group "${group.name}"`,
    });

    const populatedGroup = await Group.findById(group._id).populate('members.user', 'name email avatar');

    res.status(201).json({
      success: true,
      data: populatedGroup,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/groups
// @desc    Get all groups the logged-in user belongs to
// @access  Private
const getUserGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({
      'members.user': req.user._id,
    })
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });

    // Compute user's quick balance status for each group
    const enrichedGroups = await Promise.all(
      groups.map(async (grp) => {
        const expenses = await Expense.find({ group: grp._id });
        const settlements = await Settlement.find({ group: grp._id });

        const balances = calculateNetBalances(grp.members, expenses, settlements);
        const myBalance = balances[req.user._id.toString()] || 0;

        const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        return {
          ...grp.toObject(),
          myBalance: round2(myBalance),
          totalSpent: round2(totalSpent),
          expenseCount: expenses.length,
        };
      })
    );

    res.json({
      success: true,
      data: enrichedGroups,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/groups/:id
// @desc    Get group details by ID
// @access  Private (Group member only)
const getGroupById = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Verify membership
    const isMember = group.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this group',
      });
    }

    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/groups/join
// @desc    Join group via 6-character invite code
// @access  Private
const joinGroupByCode = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: 'Invite code is required',
      });
    }

    const group = await Group.findOne({ inviteCode: inviteCode.trim().toUpperCase() })
      .populate('members.user', 'name email avatar');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite code. No group found with this code.',
      });
    }

    // Check if already a member
    const alreadyMember = group.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this group',
      });
    }

    group.members.push({
      user: req.user._id,
      role: 'member',
      joinedAt: new Date(),
    });

    await group.save();

    await ActivityLog.create({
      group: group._id,
      user: req.user._id,
      action: 'MEMBER_JOINED',
      message: `${req.user.name} joined the group via invite code`,
    });

    const updatedGroup = await Group.findById(group._id).populate('members.user', 'name email avatar');

    res.json({
      success: true,
      message: `Successfully joined ${group.name}!`,
      data: updatedGroup,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/groups/:id/members
// @desc    Add member to group by email
// @access  Private (Group member/admin)
const addMember = async (req, res, next) => {
  try {
    const { email } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Must be existing group member
    const isMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'No registered user found with that email address',
      });
    }

    const alreadyMember = group.members.some(
      (m) => m.user.toString() === userToAdd._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this group',
      });
    }

    group.members.push({
      user: userToAdd._id,
      role: 'member',
      joinedAt: new Date(),
    });

    await group.save();

    await ActivityLog.create({
      group: group._id,
      user: req.user._id,
      action: 'MEMBER_JOINED',
      message: `${userToAdd.name} was added to the group by ${req.user.name}`,
    });

    const updatedGroup = await Group.findById(group._id).populate('members.user', 'name email avatar');

    res.json({
      success: true,
      message: `${userToAdd.name} added to group successfully`,
      data: updatedGroup,
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/groups/:id/members/:userId
// @desc    Remove member from group (Natural Business Logic: balance must be 0)
// @access  Private (Admin or Self)
const removeMember = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const targetUserId = req.params.userId;
    const isSelf = req.user._id.toString() === targetUserId;
    const isAdmin = group.members.some(
      (m) => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );

    if (!isSelf && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only group admins or the member themselves can perform removal',
      });
    }

    // Verify member exists in group
    const memberIndex = group.members.findIndex(
      (m) => m.user.toString() === targetUserId
    );
    if (memberIndex === -1) {
      return res.status(404).json({ success: false, message: 'User is not in this group' });
    }

    // CRITICAL VALIDATION: Calculate net balance for this user
    const expenses = await Expense.find({ group: group._id });
    const settlements = await Settlement.find({ group: group._id });
    const balances = calculateNetBalances(group.members, expenses, settlements);

    const userBalance = round2(balances[targetUserId] || 0);

    if (Math.abs(userBalance) > 0.01) {
      const verb = userBalance > 0 ? 'is owed' : 'owes';
      return res.status(400).json({
        success: false,
        message: `Cannot remove member! This user still ${verb} ${group.currency} ${Math.abs(userBalance).toFixed(2)}. Please settle all balances first.`,
      });
    }

    // Safe to remove
    const removedUser = await User.findById(targetUserId);
    group.members.splice(memberIndex, 1);
    await group.save();

    await ActivityLog.create({
      group: group._id,
      user: req.user._id,
      action: 'MEMBER_REMOVED',
      message: `${removedUser ? removedUser.name : 'A member'} left or was removed from the group`,
    });

    const updatedGroup = await Group.findById(group._id).populate('members.user', 'name email avatar');

    res.json({
      success: true,
      message: 'Member removed successfully',
      data: updatedGroup,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGroup,
  getUserGroups,
  getGroupById,
  joinGroupByCode,
  addMember,
  removeMember,
};
