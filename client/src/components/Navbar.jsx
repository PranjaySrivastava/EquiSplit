import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Layers, LogOut, User, Sparkles, Plus } from 'lucide-react';

export default function Navbar({ onOpenCreateGroup, onOpenJoinGroup, activeGroup, onBackToGroups }) {
  const { user, logout } = useAuth();

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        {/* Brand */}
        <div 
          onClick={onBackToGroups}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px var(--primary-glow)',
          }}>
            <Layers size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(to right, #ffffff, #cbd5e1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                EquiSplit
              </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.6875rem', padding: '2px 8px' }}>
                <Sparkles size={11} /> Smart Engine
              </span>
            </div>
            {activeGroup && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Viewing: <strong style={{ color: 'var(--text-secondary)' }}>{activeGroup.name}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Center / Right controls */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {onOpenJoinGroup && (
              <button 
                onClick={onOpenJoinGroup} 
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.8125rem' }}
              >
                Join Group
              </button>
            )}
            {onOpenCreateGroup && (
              <button 
                onClick={onOpenCreateGroup} 
                className="btn btn-primary"
                style={{ padding: '8px 14px', fontSize: '0.8125rem' }}
              >
                <Plus size={16} /> New Group
              </button>
            )}

            {/* User Profile Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 12px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
            }}>
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
                />
              ) : (
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#fff',
                }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.name}
              </span>
              <button 
                onClick={logout}
                title="Log out"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px',
                  transition: 'color var(--transition-fast)',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = 'var(--accent-rose)')}
                onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
