import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, LogIn, UserPlus, AlertCircle } from 'lucide-react';

const API = 'http://localhost:5000/api';
const ROLES = ['farmer', 'buyer'];

interface AuthProps {
  onSuccess: (role: string) => void;
}

const Auth = ({ onSuccess }: AuthProps) => {
  const [isLogin, setIsLogin]       = useState(true);
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [name, setName]             = useState('');
  const [role, setRole]             = useState('farmer');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? `${API}/auth/login` : `${API}/auth/register`;
      const body: any = { email, password };
      if (!isLogin) { body.name = name; body.role = role; }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.msg || 'Authentication failed');
        return;
      }

      // Store real JWT and user from backend
      login(data.user, data.token);
      onSuccess(data.user.role);

    } catch (err) {
      setError('Cannot connect to server. Make sure the backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '1.1rem',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '14px', color: '#1e293b',
    fontWeight: 600, outline: 'none',
    fontSize: '1rem', transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'white' }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '6rem', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: 'white', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
          backgroundSize: '40px 40px', opacity: 0.5
        }} />
        <div style={{ maxWidth: '540px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
            <div style={{
              width: '48px', height: '48px', background: 'var(--accent-orange)',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Shield size={28} color="white" />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 950, letterSpacing: '-1px' }}>
              Orange<span style={{ color: 'var(--accent-orange)' }}>Chain</span>
            </h1>
          </div>
          <h2 style={{ fontSize: '4rem', fontWeight: 950, lineHeight: 1, marginBottom: '2rem', letterSpacing: '-3px' }}>
            The Future of <br />
            <span style={{ background: 'linear-gradient(to right, #f97316, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Agri-Finance.
            </span>
          </h2>
          <p style={{ fontSize: '1.2rem', color: '#94a3b8', lineHeight: 1.6, fontWeight: 500, borderLeft: '3px solid var(--accent-orange)', paddingLeft: '1.5rem' }}>
            Secure, blockchain-backed orange marketplace with real-time escrow and immutable transaction records.
          </p>
          <div style={{ marginTop: '4rem', display: 'flex', gap: '3rem' }}>
            <div><p style={{ fontSize: '2rem', fontWeight: 900 }}>14K+</p><p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Active Nodes</p></div>
            <div><p style={{ fontSize: '2rem', fontWeight: 900 }}>₹4.2M</p><p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Locked Value</p></div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#f8fafc' }}>
        <div style={{
          width: '100%', maxWidth: '480px', padding: '3.5rem',
          background: 'white', borderRadius: '32px',
          boxShadow: '0 40px 80px -20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 950, marginBottom: '0.5rem', color: '#1e293b', letterSpacing: '-1px' }}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '2.5rem', fontWeight: 600 }}>
            {isLogin ? 'Access your operations hub' : 'Join the OrangeChain network'}
          </p>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', color: '#dc2626'
            }}>
              <AlertCircle size={18} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
            {!isLogin && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Full Name</label>
                  <input type="text" placeholder="e.g. Ravi Sharma" value={name}
                    onChange={e => setName(e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Role</label>
                  <select value={role} onChange={e => setRole(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Email</label>
              <input type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Password</label>
              <input type="password" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} required style={inputStyle} />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '1.2rem',
                backgroundColor: loading ? '#f4a261' : 'var(--accent-orange)',
                color: 'white', border: 'none', borderRadius: '14px',
                fontWeight: 900, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                marginTop: '0.5rem', transition: 'all 0.2s'
              }}
            >
              {loading ? (
                <span>Connecting...</span>
              ) : (
                <>{isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                  {isLogin ? 'Sign In' : 'Create Account'}</>
              )}
            </button>
          </form>

          <p style={{ marginTop: '2.5rem', fontSize: '1rem', color: '#64748b', textAlign: 'center', fontWeight: 600 }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
              style={{ color: 'var(--accent-orange)', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}>
              {isLogin ? 'Register' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
