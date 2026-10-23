import React from 'react';
import { User, CheckCircle, ArrowUpRight, ArrowDownLeft, Trash2 } from 'lucide-react';

export default function BalancesLedger({ balances = [], currency = 'INR', onSettleUser, onRemoveMember, currentUserId }) {
  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ marginBottom: '18px' }}>
        <h3 style={{ fontSize: '1.125rem', marginBottom: '4px' }}>Individual Member Balances</h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Net derived balance per member across all expenses and settlements
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {balances.map((item) => {
          const u = item.user;
          const uId = u?._id?.toString();
          const isMe = currentUserId && uId === currentUserId;
          const isSettled = Math.abs(item.balance) <= 0.01;
          const isCreditor = item.balance > 0.01;
          const isDebtor = item.balance < -0.01;

          return (
            <div
              key={uId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {u?.avatar ? (
                  <img
                    src={u.avatar}
                    alt={u.name}
                    style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#fff',
                  }}>
                    {u?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{u?.name || 'Member'}</span>
                    {isMe && <span className="badge badge-neutral" style={{ fontSize: '0.625rem', padding: '1px 6px' }}>You</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {u?.email}
                  </div>
                </div>
              </div>

              {/* Balance status pill & action */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ textAlign: 'right' }}>
                  {isSettled ? (
                    <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                      <CheckCircle size={13} color="#10b981" /> Settled Up
                    </span>
                  ) : isCreditor ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span className="badge badge-emerald" style={{ fontSize: '0.8125rem' }}>
                        <ArrowUpRight size={14} /> gets back {currency} {item.balance.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span className="badge badge-rose" style={{ fontSize: '0.8125rem' }}>
                        <ArrowDownLeft size={14} /> owes {currency} {Math.abs(item.balance).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Settle button if indebted */}
                {isDebtor && onSettleUser && (
                  <button
                    type="button"
                    onClick={() => onSettleUser(uId, Math.abs(item.balance))}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    Settle
                  </button>
                )}

                {/* Remove member button */}
                {onRemoveMember && (
                  <button
                    type="button"
                    onClick={() => onRemoveMember(uId, u?.name)}
                    className="btn btn-ghost"
                    style={{ padding: '6px', color: 'var(--text-muted)' }}
                    title="Remove member (allowed only if balance is zero)"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
