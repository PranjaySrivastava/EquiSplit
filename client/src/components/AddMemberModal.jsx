import React, { useState } from 'react';
import { X, Copy, Check, UserPlus, Link, AlertCircle } from 'lucide-react';

export default function AddMemberModal({ isOpen, onClose, group, onAddMember }) {
  if (!isOpen || !group) return null;

  const [email, setEmail] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const inviteCode = group.inviteCode || 'N/A';
  const inviteUrl = `${window.location.origin}?join=${inviteCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddByEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError('');
    setSubmitting(true);
    try {
      await onAddMember(email.trim());
      setEmail('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
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
              <UserPlus size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem' }}>Invite Group Members</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{group.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-rose-bg)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--accent-rose)',
              fontSize: '0.875rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Share Code Card */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Share this 6-Character Group Code:
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 16px',
            }}>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '1.5rem',
                fontWeight: 800,
                letterSpacing: '0.2em',
                color: 'var(--primary)',
              }}>
                {inviteCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
              >
                {copiedCode ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                {copiedCode ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                onClick={handleCopyLink}
                className="btn btn-ghost"
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              >
                <Link size={14} />
                {copiedLink ? 'Link Copied!' : 'Copy Invite Link'}
              </button>
            </div>
          </div>

          {/* Add directly by registered email */}
          <form onSubmit={handleAddByEmail}>
            <div className="input-group">
              <label className="input-label">Or Add Member by Email</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <UserPlus size={16} />
                  {submitting ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
