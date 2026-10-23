import React, { useState, useEffect } from 'react';
import { 
  X, Check, AlertCircle, Utensils, Plane, Home, Film, 
  Zap, ShoppingBag, ShoppingCart, HelpCircle, Users, Split 
} from 'lucide-react';

const CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: Utensils, color: '#f59e0b' },
  { id: 'transport', label: 'Transport', icon: Plane, color: '#3b82f6' },
  { id: 'housing', label: 'Rent & Stay', icon: Home, color: '#8b5cf6' },
  { id: 'entertainment', label: 'Fun & Outing', icon: Film, color: '#ec4899' },
  { id: 'utilities', label: 'Utilities & Bills', icon: Zap, color: '#06b6d4' },
  { id: 'groceries', label: 'Groceries', icon: ShoppingCart, color: '#10b981' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: '#f97316' },
  { id: 'other', label: 'General / Other', icon: HelpCircle, color: '#64748b' },
];

export default function ExpenseModal({ isOpen, onClose, group, onExpenseSaved, existingExpense = null }) {
  if (!isOpen || !group) return null;

  const members = group.members || [];
  const currency = group.currency || 'INR';

  const [description, setDescription] = useState(existingExpense?.description || '');
  const [amount, setAmount] = useState(existingExpense?.amount ? existingExpense.amount.toString() : '');
  const [category, setCategory] = useState(existingExpense?.category || 'food');
  const [date, setDate] = useState(
    existingExpense?.date ? new Date(existingExpense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(existingExpense?.notes || '');

  // Payer state
  const [payerMode, setPayerMode] = useState('single'); // 'single' | 'multiple'
  const [singlePayer, setSinglePayer] = useState(() => {
    if (existingExpense?.paidBy?.length === 1) {
      return (existingExpense.paidBy[0].user?._id || existingExpense.paidBy[0].user).toString();
    }
    return members[0]?.user?._id ? members[0].user._id.toString() : '';
  });
  const [multiPayers, setMultiPayers] = useState(() => {
    const map = {};
    members.forEach((m) => {
      const uId = (m.user?._id || m.user).toString();
      const existing = existingExpense?.paidBy?.find((p) => (p.user?._id || p.user).toString() === uId);
      map[uId] = existing ? existing.amount.toString() : '';
    });
    return map;
  });

  // Split state
  const [splitType, setSplitType] = useState(existingExpense?.splitType || 'equal');
  
  // Equal: which members participate
  const [equalIncluded, setEqualIncluded] = useState(() => {
    const map = {};
    members.forEach((m) => {
      const uId = (m.user?._id || m.user).toString();
      if (existingExpense?.splits) {
        map[uId] = existingExpense.splits.some((s) => (s.user?._id || s.user).toString() === uId);
      } else {
        map[uId] = true;
      }
    });
    return map;
  });

  // Exact amounts per member
  const [exactAmounts, setExactAmounts] = useState(() => {
    const map = {};
    members.forEach((m) => {
      const uId = (m.user?._id || m.user).toString();
      const existing = existingExpense?.splits?.find((s) => (s.user?._id || s.user).toString() === uId);
      map[uId] = existing ? existing.amount.toString() : '';
    });
    return map;
  });

  // Percentages per member
  const [percentages, setPercentages] = useState(() => {
    const map = {};
    members.forEach((m) => {
      const uId = (m.user?._id || m.user).toString();
      const existing = existingExpense?.splits?.find((s) => (s.user?._id || s.user).toString() === uId);
      map[uId] = existing && existing.percentage ? existing.percentage.toString() : '';
    });
    return map;
  });

  // Shares per member
  const [shares, setShares] = useState(() => {
    const map = {};
    members.forEach((m) => {
      const uId = (m.user?._id || m.user).toString();
      const existing = existingExpense?.splits?.find((s) => (s.user?._id || s.user).toString() === uId);
      map[uId] = existing && existing.shares ? existing.shares.toString() : '1';
    });
    return map;
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const numAmount = parseFloat(amount) || 0;

  // Validation calculations
  const calculateExactTotal = () => {
    return Object.values(exactAmounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  };

  const calculatePercentageTotal = () => {
    return Object.values(percentages).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  };

  const calculateMultiPayerTotal = () => {
    return Object.values(multiPayers).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('Please provide an expense description');
      return;
    }

    if (numAmount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    // Build paidBy
    let paidByList = [];
    if (payerMode === 'single') {
      if (!singlePayer) {
        setError('Please select who paid for this expense');
        return;
      }
      paidByList = [{ user: singlePayer, amount: numAmount }];
    } else {
      const totalPaid = calculateMultiPayerTotal();
      if (Math.abs(totalPaid - numAmount) > 0.01) {
        setError(`Total amount paid (${totalPaid.toFixed(2)}) must equal expense total (${numAmount.toFixed(2)})`);
        return;
      }
      paidByList = Object.entries(multiPayers)
        .filter(([_, val]) => parseFloat(val) > 0)
        .map(([uId, val]) => ({ user: uId, amount: parseFloat(val) }));
      
      if (paidByList.length === 0) {
        setError('Please allocate payments among members');
        return;
      }
    }

    // Build splits
    let splitsList = [];
    if (splitType === 'equal') {
      const selected = members.filter((m) => equalIncluded[(m.user?._id || m.user).toString()]);
      if (selected.length === 0) {
        setError('At least one member must be included in the split');
        return;
      }
      splitsList = selected.map((m) => ({ user: (m.user?._id || m.user).toString() }));
    } else if (splitType === 'exact') {
      const totalExact = calculateExactTotal();
      if (Math.abs(totalExact - numAmount) > 0.01) {
        setError(`Sum of exact shares (${totalExact.toFixed(2)}) must equal total (${numAmount.toFixed(2)})`);
        return;
      }
      splitsList = Object.entries(exactAmounts)
        .filter(([_, val]) => parseFloat(val) >= 0)
        .map(([uId, val]) => ({ user: uId, amount: parseFloat(val) || 0 }));
    } else if (splitType === 'percentage') {
      const totalPct = calculatePercentageTotal();
      if (Math.abs(totalPct - 100) > 0.1) {
        setError(`Sum of percentages (${totalPct}%) must equal 100%`);
        return;
      }
      splitsList = Object.entries(percentages)
        .filter(([_, val]) => parseFloat(val) > 0)
        .map(([uId, val]) => ({ user: uId, percentage: parseFloat(val) }));
    } else if (splitType === 'shares') {
      splitsList = Object.entries(shares)
        .filter(([_, val]) => parseFloat(val) > 0)
        .map(([uId, val]) => ({ user: uId, shares: parseFloat(val) }));
      if (splitsList.length === 0) {
        setError('At least one member must have shares > 0');
        return;
      }
    }

    setSubmitting(true);
    try {
      await onExpenseSaved({
        description: description.trim(),
        amount: numAmount,
        currency,
        paidBy: paidByList,
        splitType,
        splits: splitsList,
        category,
        date,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px' }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'var(--primary-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}>
              <Split size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem' }}>
                {existingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {group.name} • {currency}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-ghost" 
            style={{ padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-rose-bg)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--accent-rose)',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Description & Amount row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Description *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Dinner, Villa rent, Cab"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="input-group">
              <label className="input-label">Amount ({currency}) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                style={{ fontWeight: 700, fontSize: '1.05rem' }}
              />
            </div>
          </div>

          {/* Category Picker */}
          <div className="input-group">
            <label className="input-label">Category</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
            }}>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 6px',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? `2px solid ${cat.color}` : '1px solid var(--border-subtle)',
                      background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'var(--bg-input)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <Icon size={18} color={cat.color} />
                    <span style={{
                      fontSize: '0.6875rem',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}>
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payer Section */}
          <div className="input-group" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="input-label">Paid By</label>
              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '2px', borderRadius: 'var(--radius-md)' }}>
                <button
                  type="button"
                  onClick={() => setPayerMode('single')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: 'none',
                    background: payerMode === 'single' ? 'var(--primary)' : 'transparent',
                    color: payerMode === 'single' ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Single Payer
                </button>
                <button
                  type="button"
                  onClick={() => setPayerMode('multiple')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: 'none',
                    background: payerMode === 'multiple' ? 'var(--primary)' : 'transparent',
                    color: payerMode === 'multiple' ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Multiple Payers
                </button>
              </div>
            </div>

            {payerMode === 'single' ? (
              <select
                className="form-select"
                value={singlePayer}
                onChange={(e) => setSinglePayer(e.target.value)}
              >
                {members.map((m) => {
                  const uId = (m.user?._id || m.user).toString();
                  const name = m.user?.name || 'Member';
                  return (
                    <option key={uId} value={uId}>
                      {name}
                    </option>
                  );
                })}
              </select>
            ) : (
              <div style={{
                background: 'var(--bg-surface-elevated)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                {members.map((m) => {
                  const uId = (m.user?._id || m.user).toString();
                  const name = m.user?.name || 'Member';
                  return (
                    <div key={uId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <span style={{ fontSize: '0.875rem' }}>{name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{currency}</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="form-input"
                          style={{ width: '110px', padding: '6px 10px' }}
                          value={multiPayers[uId] || ''}
                          onChange={(e) => setMultiPayers({ ...multiPayers, [uId]: e.target.value })}
                        />
                      </div>
                    </div>
                  );
                })}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--border-subtle)',
                  color: Math.abs(calculateMultiPayerTotal() - numAmount) < 0.01 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  fontWeight: 600,
                }}>
                  <span>Total Paid: {currency} {calculateMultiPayerTotal().toFixed(2)}</span>
                  <span>Required: {currency} {numAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Split Type Selector */}
          <div className="input-group" style={{ marginTop: '20px' }}>
            <label className="input-label">Split Among Members</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
              background: 'var(--bg-input)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '12px',
            }}>
              {[
                { id: 'equal', label: '= Equal' },
                { id: 'exact', label: '1.23 Exact' },
                { id: 'percentage', label: '% Percent' },
                { id: 'shares', label: 'x Shares' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSplitType(tab.id)}
                  style={{
                    padding: '8px 4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: 'none',
                    background: splitType === tab.id ? 'var(--primary)' : 'transparent',
                    color: splitType === tab.id ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Split Details by Type */}
            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
            }}>
              {splitType === 'equal' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Select members included in this split (remainder paise/cents auto-adjusted):
                  </div>
                  {members.map((m) => {
                    const uId = (m.user?._id || m.user).toString();
                    const name = m.user?.name || 'Member';
                    const isChecked = !!equalIncluded[uId];
                    const selectedCount = Object.values(equalIncluded).filter(Boolean).length;
                    const perPersonShare = selectedCount > 0 && numAmount > 0 ? (numAmount / selectedCount).toFixed(2) : '0.00';

                    return (
                      <label
                        key={uId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-md)',
                          background: isChecked ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => setEqualIncluded({ ...equalIncluded, [uId]: e.target.checked })}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                          />
                          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{name}</span>
                        </div>
                        {isChecked && (
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {currency} {perPersonShare}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              {splitType === 'exact' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {members.map((m) => {
                    const uId = (m.user?._id || m.user).toString();
                    const name = m.user?.name || 'Member';
                    return (
                      <div key={uId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <span style={{ fontSize: '0.875rem' }}>{name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{currency}</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="form-input"
                            style={{ width: '110px', padding: '6px 10px' }}
                            value={exactAmounts[uId] || ''}
                            onChange={(e) => setExactAmounts({ ...exactAmounts, [uId]: e.target.value })}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-subtle)',
                    color: Math.abs(calculateExactTotal() - numAmount) < 0.01 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                    fontWeight: 600,
                  }}>
                    <span>Total Allocated: {currency} {calculateExactTotal().toFixed(2)}</span>
                    <span>Remaining: {currency} {(numAmount - calculateExactTotal()).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {splitType === 'percentage' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {members.map((m) => {
                    const uId = (m.user?._id || m.user).toString();
                    const name = m.user?.name || 'Member';
                    const pctVal = parseFloat(percentages[uId]) || 0;
                    const computedShare = numAmount > 0 ? ((numAmount * pctVal) / 100).toFixed(2) : '0.00';

                    return (
                      <div key={uId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <span style={{ fontSize: '0.875rem' }}>{name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            ({currency} {computedShare})
                          </span>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="0"
                            className="form-input"
                            style={{ width: '80px', padding: '6px 10px', textAlign: 'right' }}
                            value={percentages[uId] || ''}
                            onChange={(e) => setPercentages({ ...percentages, [uId]: e.target.value })}
                          />
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>%</span>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-subtle)',
                    color: Math.abs(calculatePercentageTotal() - 100) < 0.1 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                    fontWeight: 600,
                  }}>
                    <span>Total Percentage: {calculatePercentageTotal()}%</span>
                    <span>Required: 100%</span>
                  </div>
                </div>
              )}

              {splitType === 'shares' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Allocate weighted shares (e.g., 2 shares for couples, 1 for singles):
                  </div>
                  {members.map((m) => {
                    const uId = (m.user?._id || m.user).toString();
                    const name = m.user?.name || 'Member';
                    return (
                      <div key={uId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <span style={{ fontSize: '0.875rem' }}>{name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            placeholder="1"
                            className="form-input"
                            style={{ width: '80px', padding: '6px 10px', textAlign: 'center' }}
                            value={shares[uId] || ''}
                            onChange={(e) => setShares({ ...shares, [uId]: e.target.value })}
                          />
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>shares</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Date & Notes row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '16px', marginTop: '16px' }}>
            <div className="input-group">
              <label className="input-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Notes (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Additional details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
          }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              <Check size={16} />
              {submitting ? 'Saving...' : existingExpense ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
