import React, { useState, useEffect } from 'react';
import { X, Check, CheckCircle2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SettleModal({ isOpen, onClose, group, initialData = null, onSettled }) {
  if (!isOpen || !group) return null;

  const members = group.members || [];
  const currency = group.currency || 'INR';

  const [fromUser, setFromUser] = useState(initialData?.fromUserId || members[0]?.user?._id || '');
  const [toUser, setToUser] = useState(initialData?.toUserId || members[1]?.user?._id || '');
  const [amount, setAmount] = useState(initialData?.amount ? initialData.amount.toString() : '');
  const [notes, setNotes] = useState('Settlement payment');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      if (initialData.fromUserId) setFromUser(initialData.fromUserId);
      if (initialData.toUserId) setToUser(initialData.toUserId);
      if (initialData.amount) setAmount(initialData.amount.toString());
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    if (!fromUser || !toUser) {
      setError('Please select both payer and recipient');
      return;
    }

    if (fromUser === toUser) {
      setError('Payer and recipient cannot be the same person');
      return;
    }

    setSubmitting(true);
    try {
      await onSettled({
        toUserId: toUser,
        amount: numAmount,
        currency,
        notes: notes.trim(),
        date,
      });

      // Fire celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#6366f1', '#f59e0b', '#3b82f6'],
      });

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record settlement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        {/* Header */}
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
              background: 'var(--accent-emerald-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-emerald)',
            }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem' }}>Record a Payment</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Settle up debts in {group.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-rose-bg)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--accent-rose)',
              fontSize: '0.875rem',
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          {/* Transfer visualizer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            background: 'var(--bg-surface-elevated)',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '16px',
          }}>
            <div style={{ flex: 1 }}>
              <label className="input-label" style={{ fontSize: '0.75rem' }}>Payer (Who paid)</label>
              <select
                className="form-select"
                value={fromUser}
                onChange={(e) => setFromUser(e.target.value)}
                style={{ fontSize: '0.875rem', padding: '8px 10px' }}
              >
                {members.map((m) => {
                  const uId = (m.user?._id || m.user).toString();
                  return (
                    <option key={uId} value={uId}>
                      {m.user?.name || 'Member'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '18px', color: 'var(--text-muted)' }}>
              <ArrowRight size={20} />
            </div>

            <div style={{ flex: 1 }}>
              <label className="input-label" style={{ fontSize: '0.75rem' }}>Payee (Recipient)</label>
              <select
                className="form-select"
                value={toUser}
                onChange={(e) => setToUser(e.target.value)}
                style={{ fontSize: '0.875rem', padding: '8px 10px' }}
              >
                {members.map((m) => {
                  const uId = (m.user?._id || m.user).toString();
                  return (
                    <option key={uId} value={uId}>
                      {m.user?.name || 'Member'}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Amount Paid ({currency}) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="form-input"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              style={{ fontSize: '1.25rem', fontWeight: 700 }}
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">Payment Date</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Notes (e.g. UPI / Cash)</label>
              <input
                type="text"
                className="form-input"
                placeholder="UPI / GPay reference..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
          }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-success">
              <Check size={16} />
              {submitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
