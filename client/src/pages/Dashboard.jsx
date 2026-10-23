import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Plus, ArrowRight, ArrowUpRight, ArrowDownLeft, 
  CheckCircle, Sparkles, FolderPlus, KeyRound, X, Check 
} from 'lucide-react';

export default function Dashboard({ onSelectGroup }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Create form state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('Trip');
  const [newGroupCurrency, setNewGroupCurrency] = useState('INR');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Join form state
  const [joinCode, setJoinCode] = useState('');
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [joinError, setJoinError] = useState('');

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await api.getGroups();
      setGroups(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Handle URL join code if present in query param (?join=XYZ123)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('join');
    if (code) {
      setJoinCode(code.toUpperCase());
      setShowJoinModal(true);
    }
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSubmitting(true);
    try {
      const res = await api.createGroup({
        name: newGroupName,
        description: newGroupDesc,
        category: newGroupCategory,
        currency: newGroupCurrency,
      });
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      await fetchGroups();
      if (res.data?._id) {
        onSelectGroup(res.data);
      }
    } catch (err) {
      setCreateError(err.message || 'Failed to create group');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    setJoinError('');
    setJoinSubmitting(true);
    try {
      const res = await api.joinGroupByCode(joinCode.trim().toUpperCase());
      setShowJoinModal(false);
      setJoinCode('');
      // Clean URL params if any
      window.history.replaceState({}, document.title, window.location.pathname);
      await fetchGroups();
      if (res.data?._id) {
        onSelectGroup(res.data);
      }
    } catch (err) {
      setJoinError(err.message || 'Failed to join group');
    } finally {
      setJoinSubmitting(false);
    }
  };

  // Overall calculations across all user groups
  const totalOwedToMe = groups.reduce((acc, g) => (g.myBalance > 0 ? acc + g.myBalance : acc), 0);
  const totalIOwe = groups.reduce((acc, g) => (g.myBalance < 0 ? acc + Math.abs(g.myBalance) : acc), 0);
  const netTotal = totalOwedToMe - totalIOwe;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Top Banner / Hero Summary */}
      <div className="glass-card" style={{
        padding: '32px',
        marginBottom: '32px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 27, 75, 0.3) 100%)',
      }}>
        <div>
          <span className="badge badge-emerald" style={{ marginBottom: '10px' }}>
            <Sparkles size={12} /> Dashboard Overview
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>
            Welcome back, {user?.name}!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Here is your financial balance across all active groups.
          </p>
        </div>

        {/* Aggregate Balance Stat Pills */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            minWidth: '160px',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              You are owed
            </div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.375rem',
              fontWeight: 800,
              color: 'var(--accent-emerald)',
            }}>
              +{totalOwedToMe.toFixed(2)}
            </div>
          </div>

          <div style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            minWidth: '160px',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              You owe
            </div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.375rem',
              fontWeight: 800,
              color: totalIOwe > 0 ? 'var(--accent-rose)' : 'var(--text-muted)',
            }}>
              -{totalIOwe.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div>
          <h3 style={{ fontSize: '1.25rem' }}>Your Groups</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Select a group to manage expenses, view simplified debts, and settle up
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowJoinModal(true)}
            className="btn btn-secondary"
          >
            <KeyRound size={16} /> Join with Code
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus size={16} /> Create Group
          </button>
        </div>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Loading your groups...
        </div>
      ) : groups.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'var(--bg-surface-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--primary)',
          }}>
            <Users size={26} />
          </div>
          <h4 style={{ fontSize: '1.125rem', marginBottom: '6px' }}>No groups found</h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 20px' }}>
            You haven't joined or created any groups yet. Create a group for a trip or flat, or join one with an invite code!
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <Plus size={16} /> Create New Group
            </button>
            <button onClick={() => setShowJoinModal(true)} className="btn btn-secondary">
              <KeyRound size={16} /> Join Existing Group
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '20px',
        }}>
          {groups.map((grp) => {
            const isSettled = Math.abs(grp.myBalance) <= 0.01;
            const isOwed = grp.myBalance > 0.01;
            const owes = grp.myBalance < -0.01;

            return (
              <div
                key={grp._id}
                onClick={() => onSelectGroup(grp)}
                className="glass-card"
                style={{
                  padding: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  transition: 'transform var(--transition-fast), border-color var(--transition-fast)',
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                      {grp.category || 'General'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      Code: {grp.inviteCode}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
                    {grp.name}
                  </h4>
                  {grp.description && (
                    <p style={{
                      fontSize: '0.8125rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.4,
                      marginBottom: '12px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {grp.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <Users size={14} />
                    <span>{grp.members?.length || 0} members</span>
                    <span>•</span>
                    <span>{grp.expenseCount || 0} expenses</span>
                    <span>•</span>
                    <span>Total: {grp.currency} {(grp.totalSpent || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Bottom Balance & Action */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-subtle)',
                }}>
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Your Balance</div>
                    {isSettled ? (
                      <span className="badge badge-neutral" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                        <CheckCircle size={12} color="#10b981" /> Settled
                      </span>
                    ) : isOwed ? (
                      <span className="badge badge-emerald" style={{ fontSize: '0.8125rem', marginTop: '2px' }}>
                        <ArrowUpRight size={13} /> +{grp.currency} {grp.myBalance.toFixed(2)}
                      </span>
                    ) : (
                      <span className="badge badge-rose" style={{ fontSize: '0.8125rem', marginTop: '2px' }}>
                        <ArrowDownLeft size={13} /> -{grp.currency} {Math.abs(grp.myBalance).toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--primary)',
                  }}>
                    <span>Open</span>
                    <ArrowRight size={15} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FolderPlus size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.125rem' }}>Create New Group</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost" style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} style={{ padding: '24px' }}>
              {createError && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-rose-bg)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: 'var(--accent-rose)',
                  fontSize: '0.875rem',
                  marginBottom: '16px',
                }}>
                  {createError}
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Group Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Manali Trip, Room 304, Wedding Gift"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select
                    className="form-select"
                    value={newGroupCategory}
                    onChange={(e) => setNewGroupCategory(e.target.value)}
                  >
                    <option value="Trip">Trip</option>
                    <option value="Home">Home / Flat</option>
                    <option value="Couple">Couple</option>
                    <option value="Project">Project</option>
                    <option value="Friends">Friends</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Currency</label>
                  <select
                    className="form-select"
                    value={newGroupCurrency}
                    onChange={(e) => setNewGroupCurrency(e.target.value)}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Description (Optional)</label>
                <textarea
                  className="form-textarea"
                  placeholder="What is this group for?"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={createSubmitting} className="btn btn-primary">
                  <Check size={16} />
                  {createSubmitting ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <KeyRound size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.125rem' }}>Join Group via Code</h3>
              </div>
              <button onClick={() => setShowJoinModal(false)} className="btn btn-ghost" style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleJoinGroup} style={{ padding: '24px' }}>
              {joinError && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-rose-bg)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: 'var(--accent-rose)',
                  fontSize: '0.875rem',
                  marginBottom: '16px',
                }}>
                  {joinError}
                </div>
              )}

              <div className="input-group">
                <label className="input-label">6-Character Invite Code</label>
                <input
                  type="text"
                  maxLength={6}
                  className="form-input"
                  placeholder="e.g. GOA202"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '1.25rem',
                    textAlign: 'center',
                    letterSpacing: '0.2em',
                    fontWeight: 700,
                  }}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowJoinModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={joinSubmitting} className="btn btn-primary">
                  <Check size={16} />
                  {joinSubmitting ? 'Joining...' : 'Join Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
