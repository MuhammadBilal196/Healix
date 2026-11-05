import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [code, setCode] = useState('');
  const [roleTab, setRoleTab] = useState<'ADMIN' | 'DOCTOR'>('ADMIN');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle, verifyMfa, token, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (token && user) {
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'DOCTOR') navigate('/doctor');
    }
  }, [token, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mfaRequired) await verifyMfa(email.trim(), code.trim());
      else { const challenge = await login(email.trim(), password); setMfaRequired(challenge); if (challenge) setPassword(''); }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">H</div>
          <h1 className="login-title">Healix Operations</h1>
          <p className="login-subtitle">Sign in to manage clinical services</p>
        </div>

        <div className="role-tabs">
          <button
            type="button"
            className={`role-tab ${roleTab === 'ADMIN' ? 'active' : ''}`}
            onClick={() => setRoleTab('ADMIN')}
          >
            Administrator
          </button>
          <button
            type="button"
            className={`role-tab ${roleTab === 'DOCTOR' ? 'active' : ''}`}
            onClick={() => setRoleTab('DOCTOR')}
          >
            Doctor Portal
          </button>
        </div>

        {error ? <div className="login-error">{error}</div> : null}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. name@healix.pk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{mfaRequired ? 'Email verification code' : 'Password'}</label>
            <input
              type={mfaRequired ? 'text' : 'password'}
              className="form-input"
              placeholder="••••••••"
              value={mfaRequired ? code : password}
              onChange={(e) => mfaRequired ? setCode(e.target.value.replace(/\D/g, '').slice(0,6)) : setPassword(e.target.value)}
              autoComplete={mfaRequired ? 'one-time-code' : 'current-password'}
              required
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Verifying...' : mfaRequired ? 'Verify and sign in' : 'Sign In'}
          </button>
        </form>
        <GoogleSignInButton disabled={loading} onError={setError} onCredential={async credential => {
          setError(''); setLoading(true);
          try {
            const result = await loginWithGoogle(credential);
            if (result.mfaRequired) { setEmail(result.email || ''); setMfaRequired(true); setPassword(''); }
          } catch (err: any) { setError(err.message || 'Google sign-in failed'); }
          finally { setLoading(false); }
        }} />
        {mfaRequired && <button type="button" className="btn" onClick={() => { setMfaRequired(false); setCode(''); }}>Back to sign in</button>}
      </div>
    </div>
  );
}
