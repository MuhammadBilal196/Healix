import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, Award, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { useAuthStore, api } from '../store/auth';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function Login() {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'INVITED'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [code, setCode] = useState('');
  const [roleTab, setRoleTab] = useState<'ADMIN' | 'DOCTOR'>('ADMIN');
  const [invite, setInvite] = useState({
    invitationToken: '',
    fullName: '',
    email: '',
    phone: '',
    cnic: '',
    professionalId: '',
    password: '',
  });
  const [darkTheme, setDarkTheme] = useState(
    () => localStorage.getItem('healix_web_theme') === 'dark'
  );
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle, verifyMfa, token, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.dataset.theme = darkTheme ? 'dark' : 'light';
    localStorage.setItem('healix_web_theme', darkTheme ? 'dark' : 'light');
  }, [darkTheme]);

  useEffect(() => {
    if (token && user) {
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'DOCTOR') navigate('/doctor');
    }
  }, [token, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');
    setLoading(true);
    try {
      if (mfaRequired) await verifyMfa(email.trim(), code.trim());
      else {
        const challenge = await login(email.trim(), password);
        setMfaRequired(challenge);
        if (challenge) setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleInvitedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');
    setLoading(true);
    try {
      const res: any = await api('POST', '/auth/register-invited', {
        invitationToken: invite.invitationToken.trim(),
        fullName: invite.fullName.trim(),
        email: invite.email.trim(),
        phone: invite.phone.trim(),
        cnic: invite.cnic.trim(),
        professionalId: invite.professionalId.trim() || undefined,
        password: invite.password,
      });
      setStatusMessage(
        res?.emailVerificationRequired
          ? 'Account activated. Check your email OTP in the mobile app or sign in after verification.'
          : 'Account created successfully. Sign in with your new email and password.'
      );
      setEmail(invite.email.trim());
      setPassword('');
      setAuthMode('LOGIN');
    } catch (err: any) {
      setError(err.message || 'Invitation activation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-split">
        <section className="login-brand-pane">
          <div>
            <div className="login-brand-top">
              <div className="login-logo-icon">H</div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>Healix Operations</div>
                <div style={{ fontSize: '11px', color: '#7DD3FC', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Clinical Command Portal
                </div>
              </div>
            </div>

            <h2 className="login-brand-headline">
              Clinical precision for home healthcare &amp; emergency triage.
            </h2>
            <p className="login-brand-copy">
              Unified governance workspace for Medical Consultants (PMDC) and System Administrators overseeing SLA broadcasts, ambulance fleet dispatch, credential verification, and compliance auditing.
            </p>
          </div>

          <div className="login-trust-list">
            <div className="login-trust-item">
              <ShieldCheck size={18} color="#29A9F5" />
              <span>HIPAA-Aligned Immutable Audit Trail</span>
            </div>
            <div className="login-trust-item">
              <Clock size={18} color="#10B981" />
              <span>Real-Time 5m / 15m Clinical SLA Escalation</span>
            </div>
            <div className="login-trust-item">
              <Award size={18} color="#7DD3FC" />
              <span>Verified PMDC &amp; PNC Credential Registry</span>
            </div>
          </div>
        </section>

        <section className="login-form-pane">
          <div className="login-pane-topbar">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setDarkTheme((prev) => !prev)}
            >
              {darkTheme ? <Sun size={15} /> : <Moon size={15} />}
              <span>{darkTheme ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>

          <div className="login-card">
            <div className="login-logo">
              <h1 className="login-title">
                {authMode === 'LOGIN' ? 'Sign in to Healix' : 'Activate Portal Invitation'}
              </h1>
              <p className="login-subtitle">
                {authMode === 'LOGIN'
                  ? 'Authorized Administrator and Doctor Portal accounts'
                  : 'Complete sign up using your 7-day administrator invitation token'}
              </p>
            </div>

            <div className="role-tabs" style={{ marginBottom: '14px' }}>
              <button
                type="button"
                className={`role-tab ${authMode === 'LOGIN' ? 'active' : ''}`}
                onClick={() => { setAuthMode('LOGIN'); setError(''); }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`role-tab ${authMode === 'INVITED' ? 'active' : ''}`}
                onClick={() => { setAuthMode('INVITED'); setError(''); }}
              >
                Accept Invitation (Sign Up)
              </button>
            </div>

            {statusMessage ? (
              <div className="login-success" role="status">{statusMessage}</div>
            ) : null}
            {error ? <div className="login-error" role="alert">{error}</div> : null}

            {authMode === 'LOGIN' ? (
              <>
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

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder={roleTab === 'ADMIN' ? 'admin1@gmail.com' : 'doctor1@gmail.com'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{mfaRequired ? 'Email verification code' : 'Password'}</label>
                    <div className="password-input-wrap">
                      <input
                        type={mfaRequired ? 'text' : showPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="••••••••"
                        value={mfaRequired ? code : password}
                        onChange={(e) => mfaRequired ? setCode(e.target.value.replace(/\D/g, '').slice(0, 6)) : setPassword(e.target.value)}
                        autoComplete={mfaRequired ? 'one-time-code' : 'current-password'}
                        required
                      />
                      {!mfaRequired && (
                        <button
                          type="button"
                          className="password-eye-btn"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <button type="submit" className="btn-login" disabled={loading}>
                    {loading ? 'Verifying...' : mfaRequired ? 'Verify and sign in' : `Sign In as ${roleTab === 'ADMIN' ? 'Administrator' : 'Doctor'}`}
                  </button>
                </form>

                <GoogleSignInButton
                  disabled={loading}
                  onError={setError}
                  onCredential={async (credential) => {
                    setError('');
                    setLoading(true);
                    try {
                      const result = await loginWithGoogle(credential);
                      if (result.mfaRequired) {
                        setEmail(result.email || '');
                        setMfaRequired(true);
                        setPassword('');
                      }
                    } catch (err: any) {
                      setError(err.message || 'Google sign-in failed');
                    } finally {
                      setLoading(false);
                    }
                  }}
                />

                {mfaRequired && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ width: '100%', marginTop: '10px' }}
                    onClick={() => { setMfaRequired(false); setCode(''); }}
                  >
                    Back to sign in
                  </button>
                )}
              </>
            ) : (
              <form onSubmit={handleInvitedSubmit}>
                <div className="form-group">
                  <label className="form-label">Invitation Token</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Paste your 7-day token"
                    value={invite.invitationToken}
                    onChange={(e) => setInvite({ ...invite, invitationToken: e.target.value })}
                    required
                  />
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Dr. Ahmed Khan"
                      value={invite.fullName}
                      onChange={(e) => setInvite({ ...invite, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="03001234567"
                      value={invite.phone}
                      onChange={(e) => setInvite({ ...invite, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Invited Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="doctor@healix.pk"
                    value={invite.email}
                    onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">CNIC</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="37405-1234567-1"
                      value={invite.cnic}
                      onChange={(e) => setInvite({ ...invite, cnic: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PMDC / Cert ID (Clinicians)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="PMDC-12345"
                      value={invite.professionalId}
                      onChange={(e) => setInvite({ ...invite, professionalId: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Min 8 chars, 1 number & 1 symbol"
                    value={invite.password}
                    onChange={(e) => setInvite({ ...invite, password: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn-login" disabled={loading}>
                  {loading ? 'Activating Account...' : 'Activate & Create Account'}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
