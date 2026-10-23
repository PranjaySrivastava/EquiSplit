const ActivityLog = require('../models/ActivityLog');
const Group = require('../models/Group');

// @route   GET /api/groups/:groupId/activity
// @desc    Get group audit activity history
// @access  Private (Group member only)
const getGroupActivity = async (req, res, next) => {
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

    const activities = await ActivityLog.find({ group: groupId })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGroupActivity,
};
