const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  recordSettlement,
  getGroupSettlements,
} = require('../controllers/settlementController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').post(recordSettlement).get(getGroupSettlements);

module.exports = router;
