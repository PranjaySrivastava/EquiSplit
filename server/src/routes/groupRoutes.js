const express = require('express');
const router = express.Router();
const {
  createGroup,
  getUserGroups,
  getGroupById,
  joinGroupByCode,
  addMember,
  removeMember,
} = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').post(createGroup).get(getUserGroups);
router.post('/join', joinGroupByCode);
router.route('/:id').get(getGroupById);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;
