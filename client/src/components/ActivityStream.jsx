import React from 'react';
import { History, PlusCircle, Edit3, Trash2, CheckCircle2, UserPlus, UserMinus, FolderPlus } from 'lucide-react';

const ACTION_ICONS = {
  EXPENSE_ADDED: { icon: PlusCircle, color: '#6366f1' },
  EXPENSE_UPDATED: { icon: Edit3, color: '#f59e0b' },
  EXPENSE_DELETED: { icon: Trash2, color: '#ef4444' },
  SETTLEMENT_RECORDED: { icon: CheckCircle2, color: '#10b981' },
  MEMBER_JOINED: { icon: UserPlus, color: '#06b6d4' },
  MEMBER_REMOVED: { icon: UserMinus, color: '#f43f5e' },
  GROUP_CREATED: { icon: FolderPlus, color: '#8b5cf6' },
};

export default function ActivityStream({ activities = [] }) {
  if (activities.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <History size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
        <p>No recent activity recorded for this group</p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
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
          <History size={18} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.0625rem' }}>Audit Trail & Activity Log</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Transparent timeline of all group events
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {activities.map((act) => {
          const config = ACTION_ICONS[act.action] || { icon: History, color: '#94a3b8' };
          const Icon = config.icon;
          const formattedDate = new Date(act.createdAt).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={act._id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--bg-input)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px',
              }}>
                <Icon size={16} color={config.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  {act.message}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formattedDate}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
