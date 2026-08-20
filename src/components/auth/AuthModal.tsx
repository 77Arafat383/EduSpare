'use client';

import React, { useState } from 'react';
import { useEduSpare } from '@/context/EduSpareContext';
import { X, Lock, Mail, User as UserIcon, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginOrRegister } = useEduSpare();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await loginOrRegister(mode, {
      name,
      username: username || email.split('@')[0],
      email,
      password,
    });

    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Authentication failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-surface-lowest rounded-3xl shadow-2xl border border-outline-variant/80 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
              E
            </div>
            <h3 className="text-lg font-bold text-on-surface">
              {mode === 'login' ? 'Welcome Back to EduSpare' : 'Join EduSpare Platform'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-outline hover:bg-surface-container-low hover:text-on-surface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs text-rose-700 bg-rose-500/10 border border-rose-500/20 rounded-xl font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-outline uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full px-4 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-outline uppercase mb-1">
              Username or Email
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setEmail(e.target.value);
              }}
              placeholder="alex_dev or alex@eduspare.io"
              className="w-full px-4 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-outline uppercase mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-xs font-bold text-white bg-primary hover:bg-primary-container rounded-xl shadow-md transition-all"
          >
            {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-xs text-outline pt-2 border-t border-outline-variant/40">
          {mode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button
                onClick={() => setMode('register')}
                className="font-bold text-primary hover:underline"
              >
                Register Now
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                onClick={() => setMode('login')}
                className="font-bold text-primary hover:underline"
              >
                Sign In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
