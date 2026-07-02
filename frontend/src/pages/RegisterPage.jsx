import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Lock, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';
import toast from '../utils/toast';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Email verification dialog state
  const [verifyToken, setVerifyToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await register(name, email, password);
      toast.success('Registration successful!');
      if (result.verificationToken) {
        // Display email verification helper token in development
        setVerifyToken(result.verificationToken);
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
      toast.error(err.message || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyNow = async () => {
    setVerifying(true);
    try {
      const res = await fetch(`/api/auth/verify-email?token=${verifyToken}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      
      setVerifySuccess(true);
      toast.success('Email verified successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(`Verification failed: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="container-md section flex justify-center items-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div className="card w-full max-w-md p-8 animate-fade-in">
        <h2 className="text-center font-display font-bold mb-2 text-[var(--text-primary)]">Create Account</h2>
        <p className="text-center text-xs text-[var(--text-secondary)] mb-6">Register to analyze documents for free</p>

        {error && (
          <div className="p-3 bg-red-100 text-red-800 rounded flex items-center gap-2 mb-4 text-xs font-semibold">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {!verifyToken ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  className="form-input pl-10"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  className="form-input pl-10"
                  placeholder="john@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  className="form-input pl-10"
                  placeholder="•••••••• (Min 6 chars)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-input pl-10"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
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
              {submitting ? 'Registering...' : 'Register'} <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <div className="text-center py-4">
            <div className="flex justify-center mb-4 text-blue-500">
              <Mail size={48} className="animate-bounce" />
            </div>
            <h3 className="font-bold text-lg mb-2">Verify Your Email</h3>
            
            {verifySuccess ? (
              <div className="p-4 bg-green-50 text-green-800 rounded border border-green-200 mb-6 flex items-center gap-2 justify-center">
                <CheckCircle size={20} />
                <span className="text-sm font-semibold">Email Verified! Redirecting to login...</span>
              </div>
            ) : (
              <>
                <p className="text-xs text-[var(--text-secondary)] mb-6">
                  Account created! Click the button below to verify your email instantly in development mode.
                </p>
                
                <div className="p-3 bg-blue-50 text-blue-800 rounded mb-6 text-xs border border-blue-200">
                  <p className="font-semibold mb-1">Email Verification Token:</p>
                  <code className="bg-white p-1 rounded font-mono select-all block text-center font-bold text-sm">{verifyToken}</code>
                </div>

                <button
                  onClick={handleVerifyNow}
                  className="btn btn-primary w-full flex items-center justify-center gap-2"
                  disabled={verifying}
                >
                  {verifying ? 'Verifying...' : 'Verify Email Instantly'} <ArrowRight size={16} />
                </button>
              </>
            )}
          </div>
        )}

        <p className="text-center text-xs text-[var(--text-secondary)] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--primary)] hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
