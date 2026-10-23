const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getGroupBalances,
  getGroupAnalytics,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/balances', getGroupBalances);
router.get('/analytics', getGroupAnalytics);

module.exports = router;
