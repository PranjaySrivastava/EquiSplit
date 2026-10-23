import React, { useState } from 'react';
import { 
  Search, Filter, Edit2, Trash2, Calendar, 
  Utensils, Plane, Home, Film, Zap, ShoppingBag, ShoppingCart, HelpCircle 
} from 'lucide-react';

const CATEGORY_MAP = {
  food: { icon: Utensils, color: '#f59e0b', label: 'Food' },
  transport: { icon: Plane, color: '#3b82f6', label: 'Transport' },
  housing: { icon: Home, color: '#8b5cf6', label: 'Housing' },
  entertainment: { icon: Film, color: '#ec4899', label: 'Entertainment' },
  utilities: { icon: Zap, color: '#06b6d4', label: 'Utilities' },
  groceries: { icon: ShoppingCart, color: '#10b981', label: 'Groceries' },
  shopping: { icon: ShoppingBag, color: '#f97316', label: 'Shopping' },
  other: { icon: HelpCircle, color: '#64748b', label: 'Other' },
};

export default function ExpenseList({
  expenses = [],
  currency = 'INR',
  onEditExpense,
  onDeleteExpense,
  currentUserId,
  isAdmin = false,
  onSearchChange,
  onCategoryFilterChange,
  activeCategory = 'all',
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onSearchChange) onSearchChange(val);
  };

  return (
    <div>
      {/* Search and Category Filter Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}>
        {/* Search input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 14px',
          flex: '1',
          minWidth: '240px',
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search expenses by title or note..."
            value={searchTerm}
            onChange={handleSearch}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              width: '100%',
            }}
          />
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select
            className="form-select"
            value={activeCategory}
            onChange={(e) => onCategoryFilterChange && onCategoryFilterChange(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '0.8125rem', width: 'auto' }}
          >
            <option value="all">All Categories</option>
            <option value="food">Food & Dining</option>
            <option value="transport">Transport</option>
            <option value="housing">Housing & Rent</option>
            <option value="entertainment">Entertainment</option>
            <option value="utilities">Utilities</option>
            <option value="groceries">Groceries</option>
            <option value="shopping">Shopping</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Expenses Cards */}
      {expenses.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--bg-surface-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            color: 'var(--text-muted)',
          }}>
            <Search size={22} />
          </div>
          <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>No expenses found</h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Try adjusting your search filter or click "+ Add Expense" above.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {expenses.map((exp) => {
            const cat = CATEGORY_MAP[exp.category] || CATEGORY_MAP.other;
            const Icon = cat.icon;
            const expDate = new Date(exp.date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            // Payer description
            let payerText = '';
            if (exp.paidBy?.length === 1) {
              const p = exp.paidBy[0];
              const pName = p.user?.name || 'Someone';
              const isMe = currentUserId && (p.user?._id || p.user)?.toString() === currentUserId;
              payerText = isMe ? 'You paid' : `${pName} paid`;
            } else if (exp.paidBy?.length > 1) {
              payerText = `${exp.paidBy.length} people paid`;
            }

            // User's own share in this expense
            const mySplit = exp.splits?.find(
              (s) => (s.user?._id || s.user)?.toString() === currentUserId
            );
            const myShareAmount = mySplit ? mySplit.amount : null;

            // Authorization: creator, payer, or admin
            const isCreator = currentUserId && exp.createdBy?._id?.toString() === currentUserId;
            const isPayer = exp.paidBy?.some(
              (p) => (p.user?._id || p.user)?.toString() === currentUserId
            );
            const canModify = isCreator || isPayer || isAdmin;

            return (
              <div
                key={exp._id}
                className="glass-card"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                {/* Left: Category Icon & Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1', minWidth: '240px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: `${cat.color}18`,
                    border: `1px solid ${cat.color}35`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: cat.color,
                    flexShrink: 0,
                  }}>
                    <Icon size={20} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{exp.description}</h4>
                      <span className="badge badge-neutral" style={{ fontSize: '0.625rem', textTransform: 'capitalize' }}>
                        {exp.splitType} split
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      marginTop: '3px',
                      flexWrap: 'wrap',
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {expDate}
                      </span>
                      <span>•</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{payerText}</span>
                      {exp.notes && (
                        <>
                          <span>•</span>
                          <span style={{ fontStyle: 'italic' }}>"{exp.notes}"</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amounts & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.125rem',
                      fontWeight: 700,
                    }}>
                      {currency} {exp.amount.toFixed(2)}
                    </div>
                    {myShareAmount !== null && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        your share: {currency} {myShareAmount.toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Edit/Delete Actions */}
                  {canModify && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => onEditExpense(exp)}
                        className="btn btn-ghost"
                        style={{ padding: '6px', color: 'var(--text-muted)' }}
                        title="Edit expense"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(exp._id)}
                        className="btn btn-ghost"
                        style={{ padding: '6px', color: 'var(--text-muted)' }}
                        title="Delete expense"
                        onMouseOver={(e) => (e.currentTarget.style.color = 'var(--accent-rose)')}
                        onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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
