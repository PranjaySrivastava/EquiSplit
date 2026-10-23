import React from 'react';
import { PieChart, TrendingUp, DollarSign, Wallet } from 'lucide-react';

const CATEGORY_COLORS = {
  food: '#f59e0b',
  transport: '#3b82f6',
  housing: '#8b5cf6',
  entertainment: '#ec4899',
  utilities: '#06b6d4',
  groceries: '#10b981',
  shopping: '#f97316',
  other: '#64748b',
};

export default function CategoryBreakdown({ analytics, currency = 'INR' }) {
  if (!analytics) return null;

  const { totalAmount = 0, categoryBreakdown = [], memberPaid = [], memberConsumed = [] } = analytics;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
      {/* Category Spending Card */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
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
            <PieChart size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.0625rem' }}>Expenses by Category</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Total Group Spend: <strong>{currency} {totalAmount.toFixed(2)}</strong>
            </p>
          </div>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No expense data available yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {categoryBreakdown.map((cat) => {
              const color = CATEGORY_COLORS[cat.category] || '#6366f1';
              return (
                <div key={cat.category}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8125rem',
                    marginBottom: '6px',
                  }}>
                    <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{cat.category}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {currency} {cat.amount.toFixed(2)} ({cat.percentage}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div style={{
                    height: '8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-input)',
                    overflow: 'hidden',
                  }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${cat.percentage}%`,
                        background: color,
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Member Spending vs Share Comparison */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-emerald)',
          }}>
            <TrendingUp size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.0625rem' }}>Paid vs Consumed</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Total paid into expenses vs total share consumed
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {memberPaid.map((item) => {
            const uId = item.user?._id?.toString();
            const consumedItem = memberConsumed.find((c) => c.user?._id?.toString() === uId);
            const paidAmt = item.amount || 0;
            const consumedAmt = consumedItem ? consumedItem.amount : 0;
            const net = paidAmt - consumedAmt;

            return (
              <div
                key={uId}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.user?.name || 'Member'}</span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: net >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  }}>
                    {net >= 0 ? `+${currency} ${net.toFixed(2)}` : `-${currency} ${Math.abs(net).toFixed(2)}`}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}>
                  <span>Paid: {currency} {paidAmt.toFixed(2)}</span>
                  <span>Share: {currency} {consumedAmt.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
