import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';
import toast from '../utils/toast';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Forgot password states
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotToken, setForgotToken] = useState('');

  // Reset password states
  const [showReset, setShowReset] = useState(false);
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await login(email, password);
      toast.success('Successfully logged in!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
      toast.error(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError('Please enter your email address');
      return;
    }

    setForgotError('');
    setForgotSuccess('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request reset');

      setForgotSuccess('If registered, a reset code was generated.');
      setForgotToken(data.token); // return in dev so users can copy
      toast.success('Reset code generated successfully');
    } catch (err) {
      setForgotError(err.message);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetTokenInput || !newPassword) {
      setForgotError('Please enter both the reset code and the new password');
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetTokenInput, password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');

      setResetSuccess('Password reset successfully. You can now login.');
      toast.success('Password reset completed');
      setTimeout(() => {
        setShowReset(false);
        setShowForgot(false);
        setResetSuccess('');
        setForgotToken('');
        setForgotEmail('');
      }, 3000);
    } catch (err) {
      setForgotError(err.message);
    }
  };

  return (
    <div className="container-md section flex justify-center items-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div className="card w-full max-w-md p-8 animate-fade-in">
        <h2 className="text-center font-display font-bold mb-2 text-[var(--text-primary)]">Welcome Back</h2>
        <p className="text-center text-xs text-[var(--text-secondary)] mb-6">Access your legal document demystifier tools</p>

        {error && (
          <div className="p-3 bg-red-100 text-red-800 rounded flex items-center gap-2 mb-4 text-xs font-semibold">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="relative">
              <input
                id="email"
                type="email"
                className="form-input pl-10"
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            </div>
          </div>

          <div className="form-group">
            <div className="flex justify-between items-center mb-1">
              <label className="form-label mb-0" htmlFor="password">Password</label>
              <button
                type="button"
                onClick={() => { setShowForgot(true); setForgotError(''); setForgotSuccess(''); }}
                className="text-xs text-[var(--primary)] hover:underline font-semibold"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type="password"
                className="form-input pl-10"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2"
            disabled={submitting}
          >
            {submitting ? 'Signing In...' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>

        <p className="text-center text-xs text-[var(--text-secondary)] mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-[var(--primary)] hover:underline font-semibold">
            Register for free
          </Link>
        </p>
      </div>

      {/* Forgot Password / Reset Password Modal */}
      {showForgot && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Reset Password</h3>
              <button onClick={() => setShowForgot(false)} className="modal-close">×</button>
            </div>
            
            {forgotError && (
              <div className="p-3 bg-red-100 text-red-800 rounded flex items-center gap-2 mb-4 text-xs font-semibold">
                <AlertCircle size={16} />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3 bg-green-100 text-green-800 rounded flex items-center gap-2 mb-4 text-xs font-semibold">
                <CheckCircle size={16} />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 bg-green-100 text-green-800 rounded flex items-center gap-2 mb-4 text-xs font-semibold">
                <CheckCircle size={16} />
                <span>{resetSuccess}</span>
              </div>
            )}

            {!showReset ? (
              <form onSubmit={handleForgotSubmit}>
                <p className="text-xs text-[var(--text-secondary)] mb-4">
                  Enter your email address and we will generate a password reset code.
                </p>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="name@company.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                  />
                </div>

                {forgotToken && (
                  <div className="p-3 bg-blue-50 text-blue-800 rounded mb-4 text-xs border border-blue-200">
                    <p className="font-bold mb-1">Development Reset Code (Copy this):</p>
                    <code className="bg-white p-1 rounded font-mono select-all block text-center text-sm font-semibold">{forgotToken}</code>
                  </div>
                )}

                <div className="flex gap-3 justify-end mt-6">
                  {forgotToken && (
                    <button
                      type="button"
                      onClick={() => setShowReset(true)}
                      className="btn btn-secondary btn-sm"
                    >
                      Enter Code
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary btn-sm">Generate Code</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit}>
                <div className="form-group">
                  <label className="form-label">Reset Code</label>
                  <input
                    type="text"
                    className="form-input font-mono text-center font-bold text-lg"
                    placeholder="Reset Code"
                    value={resetTokenInput}
                    onChange={e => setResetTokenInput(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-3 justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => setShowReset(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Back
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">Reset Password</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
