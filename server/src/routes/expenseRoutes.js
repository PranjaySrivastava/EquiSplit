const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  addExpense,
  getGroupExpenses,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Mounted under /api/groups/:groupId/expenses or /api/expenses
router.route('/').post(addExpense).get(getGroupExpenses);
router.route('/:id').put(updateExpense).delete(deleteExpense);

module.exports = router;
