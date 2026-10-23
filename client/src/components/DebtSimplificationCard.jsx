import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Sliders, Info, DollarSign } from 'lucide-react';

export default function DebtSimplificationCard({ 
  simplifiedTransfers = [], 
  rawTransfers = [], 
  currency = 'INR', 
  onSettleClick,
  currentUserId 
}) {
  const [viewMode, setViewMode] = useState('simplified'); // 'simplified' | 'raw'
  const [showExplanation, setShowExplanation] = useState(false);

  const activeTransfers = viewMode === 'simplified' ? simplifiedTransfers : rawTransfers;
  const transactionSavings = Math.max(0, rawTransfers.length - simplifiedTransfers.length);

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px var(--primary-glow)',
          }}>
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.125rem' }}>Simplified Settle-Up Plan</h3>
              {transactionSavings > 0 && viewMode === 'simplified' && (
                <span className="badge badge-emerald" style={{ fontSize: '0.6875rem' }}>
                  Saves {transactionSavings} {transactionSavings === 1 ? 'payment' : 'payments'}!
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Computed via Min-Cash-Flow Greedy Algorithm
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="btn btn-ghost"
            style={{ padding: '6px 10px', fontSize: '0.75rem' }}
            title="Algorithm explanation"
          >
            <Info size={14} /> How it works
          </button>
          <div style={{
            display: 'flex',
            background: 'var(--bg-input)',
            padding: '3px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}>
            <button
              onClick={() => setViewMode('simplified')}
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'simplified' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'simplified' ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Simplified ({simplifiedTransfers.length})
            </button>
            <button
              onClick={() => setViewMode('raw')}
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'raw' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: viewMode === 'raw' ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Raw Pairwise ({rawTransfers.length})
            </button>
          </div>
        </div>
      </div>

      {/* Explanation Banner */}
      {showExplanation && (
        <div style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          marginBottom: '18px',
          fontSize: '0.8125rem',
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <strong style={{ color: 'var(--text-primary)' }}>Algorithm Logic:</strong> Instead of making multiple back-and-forth payments between each pair of friends, the system computes the <em>net balance</em> for each member. It then greedily matches the person with the largest overall debt to the person who is owed the largest credit. This mathematical optimization collapses complex cycles of debt into at most <strong>(N - 1) total transfers</strong>.
        </div>
      )}

      {/* Transfers List */}
      {activeTransfers.length === 0 ? (
        <div style={{
          padding: '36px',
          textAlign: 'center',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface-elevated)',
          border: '1px dashed var(--border-medium)',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--accent-emerald-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            color: 'var(--accent-emerald)',
          }}>
            <CheckCircle2 size={24} />
          </div>
          <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>All settled up!</h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            No pending debts in this group. Everyone is even.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activeTransfers.map((t, idx) => {
            const fromId = t.fromUserId || t.from?._id;
            const toId = t.toUserId || t.to?._id;
            const isMePayer = currentUserId && fromId === currentUserId;
            const isMePayee = currentUserId && toId === currentUserId;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: isMePayer
                    ? 'rgba(244, 63, 94, 0.05)'
                    : isMePayee
                    ? 'rgba(16, 185, 129, 0.05)'
                    : 'var(--bg-surface-elevated)',
                  border: isMePayer
                    ? '1px solid rgba(244, 63, 94, 0.2)'
                    : isMePayee
                    ? '1px solid rgba(16, 185, 129, 0.2)'
                    : '1px solid var(--border-subtle)',
                  transition: 'transform var(--transition-fast)',
                }}
              >
                {/* Visual Transfer Chain */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--accent-rose-bg)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      color: 'var(--accent-rose)',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {t.from?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                        {t.from?.name || 'Someone'} {isMePayer && <span className="badge badge-rose" style={{ padding: '1px 6px', fontSize: '0.625rem' }}>You</span>}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>pays</div>
                    </div>
                  </div>

                  <ArrowRight size={18} color="var(--primary)" />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--accent-emerald-bg)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: 'var(--accent-emerald)',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {t.to?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                        {t.to?.name || 'Someone'} {isMePayee && <span className="badge badge-emerald" style={{ padding: '1px 6px', fontSize: '0.625rem' }}>You</span>}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>receives</div>
                    </div>
                  </div>
                </div>

                {/* Amount & Settle Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: isMePayer ? 'var(--accent-rose)' : isMePayee ? 'var(--accent-emerald)' : 'var(--text-primary)',
                    }}>
                      {currency} {t.amount.toFixed(2)}
                    </div>
                  </div>
                  {onSettleClick && (
                    <button
                      type="button"
                      onClick={() => onSettleClick(t)}
                      className="btn btn-success"
                      style={{ padding: '7px 14px', fontSize: '0.75rem' }}
                    >
                      <CheckCircle2 size={14} /> Settle
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
