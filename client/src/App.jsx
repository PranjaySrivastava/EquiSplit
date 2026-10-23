import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import GroupDetail from './pages/GroupDetail';

function MainApp() {
  const { user, loading } = useAuth();
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-app)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-heading)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border-medium)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div>Initializing EquiSplit...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleSelectGroup = (group) => {
    setSelectedGroupId(group._id);
    setSelectedGroup(group);
  };

  const handleBackToDashboard = () => {
    setSelectedGroupId(null);
    setSelectedGroup(null);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeGroup={selectedGroup}
        onBackToGroups={handleBackToDashboard}
      />

      <main style={{ flex: 1 }}>
        {selectedGroupId ? (
          <GroupDetail
            groupId={selectedGroupId}
            onBack={handleBackToDashboard}
          />
        ) : (
          <Dashboard
            onSelectGroup={handleSelectGroup}
          />
        )}
      </main>

      <footer style={{
        padding: '24px 20px',
        textAlign: 'center',
        fontSize: '0.8125rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(9, 13, 22, 0.6)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <strong>EquiSplit</strong> — Shared Expense Splitter & Min-Cash-Flow Simplification Engine
          </div>
          <div>
            End-Term Software Project • MERN Stack
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
