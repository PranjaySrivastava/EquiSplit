import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Plus, CheckCircle2, UserPlus, Users, 
  Receipt, Scale, PieChart, History, Copy, Check, AlertCircle 
} from 'lucide-react';

import ExpenseList from '../components/ExpenseList';
import DebtSimplificationCard from '../components/DebtSimplificationCard';
import BalancesLedger from '../components/BalancesLedger';
import CategoryBreakdown from '../components/CategoryBreakdown';
import ActivityStream from '../components/ActivityStream';
import ExpenseModal from '../components/ExpenseModal';
import SettleModal from '../components/SettleModal';
import AddMemberModal from '../components/AddMemberModal';

export default function GroupDetail({ groupId, onBack }) {
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balanceData, setBalanceData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionNotice, setActionNotice] = useState(null); // { type: 'success'|'error', text: '' }

  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' | 'balances' | 'analytics' | 'activity'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleInitialData, setSettleInitialData] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch all group data
  const loadAllData = async () => {
    try {
      setLoading(true);
      setError('');

      const [groupRes, expRes, balRes, anaRes, actRes] = await Promise.all([
        api.getGroupById(groupId),
        api.getExpenses(groupId, { search: searchQuery, category: categoryFilter }),
        api.getGroupBalances(groupId),
        api.getGroupAnalytics(groupId),
        api.getGroupActivity(groupId),
      ]);

      setGroup(groupRes.data);
      setExpenses(expRes.data || []);
      setBalanceData(balRes.data || null);
      setAnalytics(anaRes.data || null);
      setActivities(actRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [groupId, categoryFilter]);

  // Handle Search input change
  const handleSearchChange = async (val) => {
    setSearchQuery(val);
    try {
      const res = await api.getExpenses(groupId, { search: val, category: categoryFilter });
      setExpenses(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyCode = () => {
    if (!group?.inviteCode) return;
    navigator.clipboard.writeText(group.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Add / Edit expense
  const handleSaveExpense = async (expensePayload) => {
    if (editingExpense) {
      await api.updateExpense(editingExpense._id, expensePayload);
      setActionNotice({ type: 'success', text: 'Expense updated successfully!' });
    } else {
      await api.addExpense(groupId, expensePayload);
      setActionNotice({ type: 'success', text: 'Expense added successfully!' });
    }
    setEditingExpense(null);
    await loadAllData();
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Delete expense
  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.deleteExpense(expenseId);
      setActionNotice({ type: 'success', text: 'Expense deleted successfully!' });
      await loadAllData();
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      setActionNotice({ type: 'error', text: err.message || 'Failed to delete expense' });
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  // Record settlement
  const handleSettled = async (settlementPayload) => {
    await api.recordSettlement(groupId, settlementPayload);
    setActionNotice({ type: 'success', text: 'Payment recorded and balances updated!' });
    await loadAllData();
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Add member
  const handleAddMember = async (email) => {
    await api.addMember(groupId, email);
    setActionNotice({ type: 'success', text: `Added member successfully!` });
    await loadAllData();
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Remove member (Tests natural business logic: rejects if balance != 0)
  const handleRemoveMember = async (userId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName || 'this member'}?`)) return;
    try {
      await api.removeMember(groupId, userId);
      setActionNotice({ type: 'success', text: 'Member removed successfully.' });
      await loadAllData();
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      setActionNotice({ type: 'error', text: err.message || 'Could not remove member' });
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  // Quick settle triggers
  const handleSettleFromTransfer = (transfer) => {
    setSettleInitialData({
      fromUserId: transfer.fromUserId || transfer.from?._id,
      toUserId: transfer.toUserId || transfer.to?._id,
      amount: transfer.amount,
    });
    setShowSettleModal(true);
  };

  const handleSettleUser = (debtorUserId, debtAmount) => {
    setSettleInitialData({
      fromUserId: debtorUserId,
      toUserId: user?._id,
      amount: debtAmount,
    });
    setShowSettleModal(true);
  };

  if (loading && !group) {
    return (
      <div style={{ maxWidth: '1200px', margin: '60px auto', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading group workspace...
      </div>
    );
  }

  if (error || !group) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '24px' }}>
        <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
          <AlertCircle size={36} color="var(--accent-rose)" style={{ margin: '0 auto 12px' }} />
          <h3>Error loading group</h3>
          <p style={{ color: 'var(--text-muted)', margin: '8px 0 20px' }}>{error}</p>
          <button onClick={onBack} className="btn btn-secondary">
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currency = group.currency || 'INR';
  const myNetBalance = balanceData?.myBalance || 0;
  const isCreator = group.createdBy?._id?.toString() === user?._id?.toString();
  const isAdmin = group.members?.some(
    (m) => m.user?._id?.toString() === user?._id?.toString() && m.role === 'admin'
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Toast Notice Banner */}
      {actionNotice && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          background: actionNotice.type === 'success' ? '#064e3b' : '#881337',
          border: actionNotice.type === 'success' ? '1px solid #10b981' : '1px solid #f43f5e',
          color: '#ffffff',
          boxShadow: 'var(--shadow-lg)',
          fontSize: '0.875rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          {actionNotice.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{actionNotice.text}</span>
        </div>
      )}

      {/* Top Navigation & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={onBack}
          className="btn btn-ghost"
          style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
        >
          <ArrowLeft size={16} /> Groups
        </button>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          {group.name}
        </span>
      </div>

      {/* Group Header Card */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '20px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-neutral">{group.category || 'Trip'}</span>
              {/* Invite Code Pill */}
              <button
                onClick={handleCopyCode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '3px 10px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  color: 'var(--text-secondary)',
                }}
                title="Click to copy invite code"
              >
                <span>Code: <strong>{group.inviteCode}</strong></span>
                {copiedCode ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
              </button>
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>
              {group.name}
            </h1>
            {group.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '600px', lineHeight: 1.5 }}>
                {group.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="btn btn-secondary"
            >
              <UserPlus size={16} /> Invite
            </button>
            <button
              onClick={() => {
                setSettleInitialData(null);
                setShowSettleModal(true);
              }}
              className="btn btn-secondary"
            >
              <CheckCircle2 size={16} /> Settle Up
            </button>
            <button
              onClick={() => {
                setEditingExpense(null);
                setShowExpenseModal(true);
              }}
              className="btn btn-primary"
            >
              <Plus size={16} /> Add Expense
            </button>
          </div>
        </div>

        {/* Quick Stat Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Group Spend</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700 }}>
              {currency} {(balanceData?.totalSpent || 0).toFixed(2)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Group Members</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={18} color="var(--primary)" />
              {group.members?.length || 0}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Settled</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              {currency} {(balanceData?.totalSettled || 0).toFixed(2)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Your Net Balance</div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: myNetBalance > 0.01
                ? 'var(--accent-emerald)'
                : myNetBalance < -0.01
                ? 'var(--accent-rose)'
                : 'var(--text-muted)',
            }}>
              {myNetBalance > 0.01
                ? `+${currency} ${myNetBalance.toFixed(2)}`
                : myNetBalance < -0.01
                ? `-${currency} ${Math.abs(myNetBalance).toFixed(2)}`
                : 'Settled'}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '24px',
        overflowX: 'auto',
      }}>
        {[
          { id: 'expenses', label: 'Expenses', icon: Receipt, count: expenses.length },
          { id: 'balances', label: 'Balances & Settle Up', icon: Scale, count: balanceData?.simplifiedTransfers?.length },
          { id: 'analytics', label: 'Analytics & Spend', icon: PieChart },
          { id: 'activity', label: 'Audit Trail', icon: History, count: activities.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                border: 'none',
                background: 'transparent',
                borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="badge badge-neutral" style={{ fontSize: '0.6875rem', padding: '1px 6px' }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'expenses' && (
        <ExpenseList
          expenses={expenses}
          currency={currency}
          onEditExpense={(exp) => {
            setEditingExpense(exp);
            setShowExpenseModal(true);
          }}
          onDeleteExpense={handleDeleteExpense}
          currentUserId={user?._id?.toString()}
          isAdmin={isAdmin}
          onSearchChange={handleSearchChange}
          onCategoryFilterChange={(cat) => setCategoryFilter(cat)}
          activeCategory={categoryFilter}
        />
      )}

      {activeTab === 'balances' && (
        <div>
          {/* Min-Cash-Flow Debt Simplification Card */}
          <DebtSimplificationCard
            simplifiedTransfers={balanceData?.simplifiedTransfers || []}
            rawTransfers={balanceData?.rawTransfers || []}
            currency={currency}
            onSettleClick={handleSettleFromTransfer}
            currentUserId={user?._id?.toString()}
          />

          {/* Member Ledger */}
          <BalancesLedger
            balances={balanceData?.balances || []}
            currency={currency}
            onSettleUser={handleSettleUser}
            onRemoveMember={handleRemoveMember}
            currentUserId={user?._id?.toString()}
          />
        </div>
      )}

      {activeTab === 'analytics' && (
        <CategoryBreakdown analytics={analytics} currency={currency} />
      )}

      {activeTab === 'activity' && (
        <ActivityStream activities={activities} />
      )}

      {/* Modals */}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => {
          setShowExpenseModal(false);
          setEditingExpense(null);
        }}
        group={group}
        onExpenseSaved={handleSaveExpense}
        existingExpense={editingExpense}
      />

      <SettleModal
        isOpen={showSettleModal}
        onClose={() => setShowSettleModal(false)}
        group={group}
        initialData={settleInitialData}
        onSettled={handleSettled}
      />

      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        group={group}
        onAddMember={handleAddMember}
      />
    </div>
  );
}
