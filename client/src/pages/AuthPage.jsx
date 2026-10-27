import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Layers, Sparkles, Check, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { name: 'Rahul Sharma', email: 'rahul@example.com', role: 'Goa Trip Organizer' },
  { name: 'Priya Patel', email: 'priya@example.com', role: 'Flat 402 Admin' },
  { name: 'Aman Verma', email: 'aman@example.com', role: 'Trip Member' },
  { name: 'Neha Gupta', email: 'neha@example.com', role: 'Trip Member' },
];

export default function AuthPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (acc) => {
    setEmail(acc.email);
    setPassword('password123');
    setError('');
    setLoading(true);
    try {
      await login(acc.email, 'password123');
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(ellipse at 50% 20%, rgba(99, 102, 241, 0.15), transparent 70%)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1000px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '40px',
        alignItems: 'center',
      }}>
        {/* Left: Product Hero & Highlights */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px var(--primary-glow)',
            }}>
              <Layers size={24} color="#ffffff" />
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(to right, #ffffff, #cbd5e1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              EquiSplit
            </h1>
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '16px' }}>
            Split expenses intelligently. Settle debts with fewer payments.
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '28px' }}>
            Built for roommates, trips, and friends. Powered by the <strong>Min-Cash-Flow Greedy Algorithm</strong> to eliminate circular debt and save unnecessary transfers.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { title: 'Debt Simplification Engine', desc: 'Reduces 10+ mutual debts to minimal direct transfers' },
              { title: 'Penny-Accurate Splits', desc: 'Equal, exact, percentage, and shares with remainder penny distribution' },
              { title: 'Natural Authorization & Error Guards', desc: 'Guards against removing indebted members and invalid splits' },
            ].map((feature, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--accent-emerald-bg)',
                  color: 'var(--accent-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}>
                  <Check size={14} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{feature.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Demo Account Pills */}
          <div style={{
            marginTop: '32px',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-amber)', marginBottom: '10px' }}>
              <Zap size={14} /> ONE-CLICK DEMO ACCOUNTS (PASSWORD: password123)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickLogin(acc)}
                  className="btn btn-secondary"
                  style={{
                    padding: '8px 10px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '2px',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{acc.name}</span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{acc.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Auth Card */}
        <div className="glass-card" style={{ padding: '36px' }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-input)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
          }}>
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '0.875rem',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                background: !isRegister ? 'var(--primary)' : 'transparent',
                color: !isRegister ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '0.875rem',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                background: isRegister ? 'var(--primary)' : 'transparent',
                color: isRegister ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-rose-bg)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--accent-rose)',
              fontSize: '0.875rem',
              marginBottom: '20px',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isRegister}
                />
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '12px', padding: '12px' }}
            >
              {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Backend Connection Config Drawer */}
          <div style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}>
            <BackendSettingsWidget />
          </div>
        </div>
      </div>
    </div>
  );
}

function BackendSettingsWidget() {
  const [showConfig, setShowConfig] = useState(false);
  const [backendUrl, setBackendUrl] = useState(() => localStorage.getItem('equisplit_backend_url') || '');
  const [testStatus, setTestStatus] = useState(null); // { type: 'success'|'error'|'testing', message: '' }

  const handleSaveAndTest = async (e) => {
    e.preventDefault();
    const cleanUrl = backendUrl.trim().replace(/\/+$/, '');
    if (cleanUrl) {
      localStorage.setItem('equisplit_backend_url', cleanUrl);
    } else {
      localStorage.removeItem('equisplit_backend_url');
    }

    setTestStatus({ type: 'testing', message: 'Testing connection to backend...' });

    const target = cleanUrl ? `${cleanUrl}/api/health` : '/api/health';
    try {
      const res = await fetch(target, { signal: AbortSignal.timeout(12000) });
      const data = await res.json();
      if (data.status === 'ok') {
        setTestStatus({ type: 'success', message: 'Connected successfully to backend!' });
      } else {
        setTestStatus({ type: 'error', message: 'Connected, but received unexpected response.' });
      }
    } catch (err) {
      setTestStatus({
        type: 'error',
        message: 'Could not reach backend. If on Render free tier, server may be waking up (~40s), or check URL.'
      });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Backend API: <code style={{ color: 'var(--text-secondary)' }}>{localStorage.getItem('equisplit_backend_url') || import.meta.env.VITE_API_URL || '/api'}</code></span>
        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          {showConfig ? 'Hide' : 'Change URL'}
        </button>
      </div>

      {showConfig && (
        <form onSubmit={handleSaveAndTest} style={{ marginTop: '10px', background: 'var(--bg-input)', padding: '10px', borderRadius: '8px' }}>
          <label style={{ display: 'block', fontSize: '0.6875rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
            Render Backend URL (e.g. <code>https://your-service.onrender.com</code>):
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="https://equisplit-xxx.onrender.com"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.75rem', padding: '6px 8px' }}
            />
            <button
              type="submit"
              className="btn btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
            >
              Connect
            </button>
          </div>
          {testStatus && (
            <div style={{
              marginTop: '6px',
              fontSize: '0.6875rem',
              color: testStatus.type === 'success' ? 'var(--accent-emerald)' : testStatus.type === 'testing' ? 'var(--accent-amber)' : 'var(--accent-rose)'
            }}>
              {testStatus.message}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
