/**
 * Split Calculation and Mathematical Validation Engine
 * 
 * Handles split computations (Equal, Exact, Percentage, Shares)
 * with precise rounding to 2 decimal places (paise/cents)
 * to ensure that splits strictly add up to the total amount without penny leaks.
 */

const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

/**
 * Validates and computes splits based on splitType.
 * 
 * @param {number} totalAmount 
 * @param {string} splitType 'equal' | 'exact' | 'percentage' | 'shares'
 * @param {Array} participants Array of { user, amount?, percentage?, shares? }
 * @returns {Array} Calculated splits [{ user, amount, percentage?, shares? }]
 */
function calculateSplits(totalAmount, splitType, participants) {
  if (!totalAmount || totalAmount <= 0) {
    throw new Error('Total amount must be greater than zero');
  }

  if (!participants || participants.length === 0) {
    throw new Error('At least one split participant is required');
  }

  const count = participants.length;
  const totalCents = Math.round(totalAmount * 100);

  let calculatedSplits = [];

  switch (splitType) {
    case 'equal': {
      // Divide total in cents to handle remainder accurately
      const baseCents = Math.floor(totalCents / count);
      const remainderCents = totalCents % count;

      calculatedSplits = participants.map((p, idx) => {
        // Distribute 1 remainder cent to the first 'remainderCents' participants
        const cents = baseCents + (idx < remainderCents ? 1 : 0);
        return {
          user: p.user,
          amount: round2(cents / 100),
          percentage: round2(100 / count),
          shares: 1,
        };
      });
      break;
    }

    case 'exact': {
      let sumAmount = 0;
      calculatedSplits = participants.map((p) => {
        const amt = round2(Number(p.amount) || 0);
        if (amt < 0) {
          throw new Error('Exact share amount cannot be negative');
        }
        sumAmount = round2(sumAmount + amt);
        return {
          user: p.user,
          amount: amt,
        };
      });

      if (Math.abs(sumAmount - totalAmount) > 0.01) {
        throw new Error(
          `Sum of exact shares (${sumAmount.toFixed(2)}) does not match total amount (${totalAmount.toFixed(2)})`
        );
      }
      break;
    }

    case 'percentage': {
      let sumPct = 0;
      participants.forEach((p) => {
        const pct = Number(p.percentage) || 0;
        if (pct < 0 || pct > 100) {
          throw new Error('Percentage must be between 0% and 100%');
        }
        sumPct = round2(sumPct + pct);
      });

      if (Math.abs(sumPct - 100) > 0.1) {
        throw new Error(`Total percentage must add up to 100% (currently ${sumPct}%)`);
      }

      let runningCents = 0;
      let highestIdx = 0;
      let highestAmt = -1;

      calculatedSplits = participants.map((p, idx) => {
        const pct = Number(p.percentage);
        const cents = Math.round((totalCents * pct) / 100);
        runningCents += cents;

        if (cents > highestAmt) {
          highestAmt = cents;
          highestIdx = idx;
        }

        return {
          user: p.user,
          amount: round2(cents / 100),
          percentage: pct,
        };
      });

      // Compensate for rounding difference on the largest share
      const diffCents = totalCents - runningCents;
      if (diffCents !== 0 && calculatedSplits[highestIdx]) {
        calculatedSplits[highestIdx].amount = round2(
          calculatedSplits[highestIdx].amount + diffCents / 100
        );
      }
      break;
    }

    case 'shares': {
      let totalShares = 0;
      participants.forEach((p) => {
        const s = Number(p.shares) || 0;
        if (s <= 0) {
          throw new Error('Shares must be greater than zero');
        }
        totalShares += s;
      });

      let runningCents = 0;
      let highestIdx = 0;
      let highestShares = -1;

      calculatedSplits = participants.map((p, idx) => {
        const s = Number(p.shares);
        const cents = Math.round((totalCents * s) / totalShares);
        runningCents += cents;

        if (s > highestShares) {
          highestShares = s;
          highestIdx = idx;
        }

        return {
          user: p.user,
          amount: round2(cents / 100),
          shares: s,
        };
      });

      const diffCents = totalCents - runningCents;
      if (diffCents !== 0 && calculatedSplits[highestIdx]) {
        calculatedSplits[highestIdx].amount = round2(
          calculatedSplits[highestIdx].amount + diffCents / 100
        );
      }
      break;
    }

    default:
      throw new Error(`Unsupported split type: ${splitType}`);
  }

  // Final check: total of calculated splits must equal totalAmount exactly
  const finalSum = round2(calculatedSplits.reduce((acc, curr) => acc + curr.amount, 0));
  if (Math.abs(finalSum - totalAmount) > 0.01) {
    throw new Error(`Split validation error: calculated sum ${finalSum} != total ${totalAmount}`);
  }

  return calculatedSplits;
}

/**
 * Validates payers array against total amount
 */
function validatePayers(totalAmount, paidBy) {
  if (!paidBy || paidBy.length === 0) {
    throw new Error('At least one payer is required');
  }

  let sumPaid = 0;
  paidBy.forEach((p) => {
    const amt = Number(p.amount) || 0;
    if (amt <= 0) {
      throw new Error('Each payer amount must be greater than zero');
    }
    sumPaid = round2(sumPaid + amt);
  });

  if (Math.abs(sumPaid - totalAmount) > 0.01) {
    throw new Error(
      `Total amount paid (${sumPaid.toFixed(2)}) must equal total expense amount (${totalAmount.toFixed(2)})`
    );
  }

  return true;
}

module.exports = {
  calculateSplits,
  validatePayers,
  round2,
};
