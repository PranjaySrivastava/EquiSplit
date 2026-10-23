const express = require('express');
const router = express.Router({ mergeParams: true });
const { getGroupActivity } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/activity', getGroupActivity);

module.exports = router;
