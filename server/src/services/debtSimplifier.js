/**
 * Debt Simplification & Balance Calculation Service
 * 
 * Implements the Min-Cash-Flow greedy algorithm to simplify peer-to-peer debts,
 * reducing a complex web of mutual debts to the absolute minimum number of transactions.
 */

// Helper to round to 2 decimal places to avoid floating point imprecision
const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

/**
 * Computes net balances for each member in a group based on expenses and settlements.
 * 
 * Net Balance Definition:
 *   Positive (+) = Creditor (Group owes this person money / they get back)
 *   Negative (-) = Debtor (This person owes money to the group)
 *   Zero (0)     = Fully settled
 */
function calculateNetBalances(members, expenses = [], settlements = []) {
  const balanceMap = {};

  // Initialize all members with 0.00
  members.forEach((m) => {
    const userId = (m.user?._id || m.user || m._id || m).toString();
    balanceMap[userId] = 0;
  });

  // 1. Process Expenses
  expenses.forEach((expense) => {
    // Add amounts paid by payers (+)
    if (expense.paidBy && expense.paidBy.length > 0) {
      expense.paidBy.forEach((p) => {
        const payerId = (p.user?._id || p.user).toString();
        if (balanceMap[payerId] !== undefined) {
          balanceMap[payerId] = round2(balanceMap[payerId] + Number(p.amount));
        }
      });
    }

    // Subtract share amounts owed by split participants (-)
    if (expense.splits && expense.splits.length > 0) {
      expense.splits.forEach((s) => {
        const participantId = (s.user?._id || s.user).toString();
        if (balanceMap[participantId] !== undefined) {
          balanceMap[participantId] = round2(balanceMap[participantId] - Number(s.amount));
        }
      });
    }
  });

  // 2. Process Settlements (direct payments between members)
  // When A pays B:
  // A's debt is reduced (or balance increases by amount: +)
  // B's credit is reduced (or balance decreases by amount: -)
  settlements.forEach((settlement) => {
    const fromId = (settlement.fromUser?._id || settlement.fromUser).toString();
    const toId = (settlement.toUser?._id || settlement.toUser).toString();

    if (balanceMap[fromId] !== undefined) {
      balanceMap[fromId] = round2(balanceMap[fromId] + Number(settlement.amount));
    }
    if (balanceMap[toId] !== undefined) {
      balanceMap[toId] = round2(balanceMap[toId] - Number(settlement.amount));
    }
  });

  return balanceMap;
}

/**
 * Min-Cash-Flow Greedy Algorithm
 * 
 * Takes net balances and computes the minimum number of payment transfers
 * to settle all outstanding balances in the group.
 * 
 * Time Complexity: O(N log N) with sorting / priority queue
 * Guarantees at most (N - 1) transactions where N is the number of indebted members.
 */
function simplifyDebts(balanceMap, userDetailsMap = {}) {
  const debtors = [];   // People who owe money (balance < -0.01)
  const creditors = []; // People who are owed money (balance > 0.01)

  for (const [userId, balance] of Object.entries(balanceMap)) {
    const rounded = round2(balance);
    if (rounded < -0.01) {
      debtors.push({
        userId,
        amount: Math.abs(rounded),
        user: userDetailsMap[userId] || { _id: userId, name: 'Unknown User' },
      });
    } else if (rounded > 0.01) {
      creditors.push({
        userId,
        amount: rounded,
        user: userDetailsMap[userId] || { _id: userId, name: 'Unknown User' },
      });
    }
  }

  // Sort descending by amount
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions = [];

  let i = 0; // Debtor pointer
  let j = 0; // Creditor pointer

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    // Find the minimum of what debtor owes and creditor is owed
    const transferAmount = round2(Math.min(debtor.amount, creditor.amount));

    if (transferAmount > 0.01) {
      transactions.push({
        from: debtor.user,
        fromUserId: debtor.userId,
        to: creditor.user,
        toUserId: creditor.userId,
        amount: transferAmount,
      });
    }

    debtor.amount = round2(debtor.amount - transferAmount);
    creditor.amount = round2(creditor.amount - transferAmount);

    if (debtor.amount <= 0.01) {
      i++;
    }
    if (creditor.amount <= 0.01) {
      j++;
    }
  }

  return transactions;
}

/**
 * Computes pair-wise pairwise raw debts without simplification,
 * allowing users to view both "Raw Debt Matrix" and "Simplified Settle-up Plan".
 */
function computePairwiseDebts(members, expenses = [], settlements = [], userDetailsMap = {}) {
  const pairMatrix = {}; // pairMatrix[A][B] = how much A owes B directly

  // Initialize matrix
  const userIds = members.map((m) => (m.user?._id || m.user || m._id || m).toString());
  userIds.forEach((u1) => {
    pairMatrix[u1] = {};
    userIds.forEach((u2) => {
      pairMatrix[u1][u2] = 0;
    });
  });

  // Calculate from expenses
  expenses.forEach((expense) => {
    // If multiple payers, distribute proportionally
    const totalExpenseAmount = Number(expense.amount);
    if (!totalExpenseAmount || totalExpenseAmount <= 0) return;

    expense.splits.forEach((split) => {
      const splitUserId = (split.user?._id || split.user).toString();
      const splitAmount = Number(split.amount);

      expense.paidBy.forEach((payer) => {
        const payerUserId = (payer.user?._id || payer.user).toString();
        const payerAmount = Number(payer.amount);

        if (splitUserId !== payerUserId && pairMatrix[splitUserId] && pairMatrix[splitUserId][payerUserId] !== undefined) {
          // splitUserId owes payerUserId their proportion of this expense
          const owedPortion = round2((payerAmount / totalExpenseAmount) * splitAmount);
          pairMatrix[splitUserId][payerUserId] = round2(pairMatrix[splitUserId][payerUserId] + owedPortion);
        }
      });
    });
  });

  // Factor in settlements
  settlements.forEach((settlement) => {
    const fromId = (settlement.fromUser?._id || settlement.fromUser).toString();
    const toId = (settlement.toUser?._id || settlement.toUser).toString();
    const amount = Number(settlement.amount);

    if (pairMatrix[fromId] && pairMatrix[fromId][toId] !== undefined) {
      pairMatrix[fromId][toId] = round2(pairMatrix[fromId][toId] - amount);
    }
  });

  // Simplify net pairwise (if A owes B 50 and B owes A 20, A owes B 30)
  const pairwiseTransfers = [];
  for (let u1 = 0; u1 < userIds.length; u1++) {
    for (let u2 = u1 + 1; u2 < userIds.length; u2++) {
      const id1 = userIds[u1];
      const id2 = userIds[u2];
      const diff = round2((pairMatrix[id1][id2] || 0) - (pairMatrix[id2][id1] || 0));

      if (diff > 0.01) {
        pairwiseTransfers.push({
          from: userDetailsMap[id1] || { _id: id1 },
          fromUserId: id1,
          to: userDetailsMap[id2] || { _id: id2 },
          toUserId: id2,
          amount: diff,
        });
      } else if (diff < -0.01) {
        pairwiseTransfers.push({
          from: userDetailsMap[id2] || { _id: id2 },
          fromUserId: id2,
          to: userDetailsMap[id1] || { _id: id1 },
          toUserId: id1,
          amount: Math.abs(diff),
        });
      }
    }
  }

  return pairwiseTransfers;
}

module.exports = {
  calculateNetBalances,
  simplifyDebts,
  computePairwiseDebts,
  round2,
};
