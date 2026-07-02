import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { User, Lock, Sun, Moon, Shield, AlertCircle, CheckCircle, Save } from 'lucide-react';
import toast from '../utils/toast';

const SettingsPage = () => {
  const { user, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (password && password !== confirmPassword) {
      setProfileError('New passwords do not match');
      return;
    }
    if (password && password.length < 6) {
      setProfileError('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(name || user?.name, password || undefined);
      setProfileSuccess('Profile updated successfully!');
      toast.success('Profile saved!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
      toast.error(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-8 animate-fade-in max-w-3xl">
      <h2 className="font-display font-bold text-[var(--text-primary)] mb-8">Settings & Profile</h2>

      <div className="space-y-8">
        {/* Profile Information */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-display font-bold text-[var(--text-primary)]">{user?.name}</h3>
              <p className="text-xs text-[var(--text-secondary)]">{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {user?.verified ? (
                  <span className="text-[10px] text-green-600 font-semibold flex items-center gap-1">
                    <CheckCircle size={10} /> Email Verified
                  </span>
                ) : (
                  <span className="text-[10px] text-yellow-600 font-semibold flex items-center gap-1">
                    <AlertCircle size={10} /> Not Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {profileError && (
            <div className="p-3 bg-red-100 text-red-800 rounded flex items-center gap-2 mb-4 text-xs font-semibold">
              <AlertCircle size={14} />
              {profileError}
            </div>
          )}
          {profileSuccess && (
            <div className="p-3 bg-green-100 text-green-800 rounded flex items-center gap-2 mb-4 text-xs font-semibold">
              <CheckCircle size={14} />
              {profileSuccess}
            </div>
          )}

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="form-group mb-0">
              <label className="form-label flex items-center gap-1.5">
                <User size={12} /> Display Name
              </label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="grid-2 gap-4">
              <div className="form-group mb-0">
                <label className="form-label flex items-center gap-1.5">
                  <Lock size={12} /> New Password
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label flex items-center gap-1.5">
                  <Lock size={12} /> Confirm Password
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary flex items-center gap-2"
              disabled={saving}
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Appearance Settings */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-sm mb-4 text-[var(--text-primary)]">Appearance</h3>
          <div className="flex items-center justify-between p-4 bg-[var(--surface-2)] rounded-lg border border-[var(--border)]">
            <div>
              <h4 className="font-bold text-sm text-[var(--text-primary)]">Dark Mode</h4>
              <p className="text-xs text-[var(--text-secondary)]">Toggle between light and dark theme for your workspace</p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300'}`}
              aria-label="Toggle dark mode"
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 flex items-center justify-center ${theme === 'dark' ? 'translate-x-6' : ''}`}>
                {theme === 'dark' ? <Moon size={10} className="text-blue-600" /> : <Sun size={10} className="text-yellow-500" />}
              </span>
            </button>
          </div>
        </div>

        {/* Security Info */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-sm mb-4 text-[var(--text-primary)] flex items-center gap-2">
            <Shield size={16} className="text-green-500" />
            Security & Privacy
          </h3>
          <div className="space-y-3 text-xs text-[var(--text-secondary)]">
            <div className="flex items-start gap-2 p-3 bg-[var(--surface-2)] rounded border border-[var(--border)]">
              <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>Passwords are hashed with bcrypt before storage. Plain-text passwords are never stored.</span>
            </div>
            <div className="flex items-start gap-2 p-3 bg-[var(--surface-2)] rounded border border-[var(--border)]">
              <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>JWT-based authentication with short-lived access tokens and 7-day refresh tokens.</span>
            </div>
            <div className="flex items-start gap-2 p-3 bg-[var(--surface-2)] rounded border border-[var(--border)]">
              <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>Rate limiting (150 requests per 15 min) protects against brute-force attacks.</span>
            </div>
            <div className="flex items-start gap-2 p-3 bg-[var(--surface-2)] rounded border border-[var(--border)]">
              <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>File uploads are validated. Executable files and malformed PDFs are rejected by the server.</span>
            </div>
            <div className="flex items-start gap-2 p-3 bg-[var(--surface-2)] rounded border border-[var(--border)]">
              <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
              <span>The AI model (Gemini 2.5 Pro) is instructed to never hallucinate or invent information not present in the document.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
