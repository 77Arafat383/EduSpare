'use client';

import React, { useState } from 'react';
import { useEduSpare } from '@/context/EduSpareContext';
import { LogIn, UserPlus, ArrowRight, Sparkles, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginOrRegister, allUsers, setCurrentUser } = useEduSpare();
  const [tab, setTab] = useState<'login' | 'signup'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (loginPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    const res = await loginOrRegister('login', {
      username: loginEmail,
      password: loginPassword,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Invalid credentials.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (signupPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (signupPassword !== signupConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await loginOrRegister('register', {
      name: signupName,
      username: signupUsername,
      email: signupEmail,
      password: signupPassword,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8FF] via-[#E2E7FF] to-[#D0E1FB] flex items-center justify-center p-4 sm:p-6 antialiased">
      <main className="w-full max-w-[440px] bg-surface-lowest border border-outline-variant/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200">

        {/* Header & Logo */}
        <header className="pt-8 px-6 pb-4 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border border-outline-variant/40 bg-surface-container-low mb-4 p-1 flex items-center justify-center">
            <img loading="eager" fetchPriority="high" decoding="async"
              src="/assets/eduspare_brain_icon.png"
              alt="EduSpare Brain Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-black text-on-surface tracking-tight">
            Welcome to Edu<span className="text-primary">Spare</span>
          </h1>
          <p className="text-xs font-semibold text-outline mt-1">
            Your Educational Guardian & Learning Hub
          </p>
        </header>

        {/* Tab Selection */}
        <div className="px-6 border-b border-outline-variant/40 flex space-x-6">
          <button
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 pb-3 font-bold text-sm border-b-2 transition-colors flex items-center justify-center gap-1.5 ${tab === 'login'
              ? 'border-primary text-primary'
              : 'border-transparent text-outline hover:text-on-surface'
              }`}
          >
            <LogIn className="w-4 h-4" />
            Login
          </button>

          <button
            onClick={() => {
              setTab('signup');
              setError(null);
            }}
            className={`flex-1 pb-3 font-bold text-sm border-b-2 transition-colors flex items-center justify-center gap-1.5 ${tab === 'signup'
              ? 'border-primary text-primary'
              : 'border-transparent text-outline hover:text-on-surface'
              }`}
          >
            <UserPlus className="w-4 h-4" />
            Sign Up
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-500/10 border border-rose-500/20 rounded-xl font-bold">
              {error}
            </div>
          )}

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                  Email or Username
                </label>
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Username or Email"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-container transition-colors shadow-md flex items-center justify-center gap-2"
              >
                {loading ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Registration Form */}
          {tab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Md. Yeasin Arafat"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  placeholder="arafat383"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={signupConfirm}
                  onChange={(e) => setSignupConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-container transition-colors shadow-md flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
                <UserPlus className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Demo Login Switcher 
          <div className="pt-3 border-t border-outline-variant/40 space-y-2">
            <div className="text-[11px] font-bold text-outline text-center uppercase tracking-wider">
              Quick 1-Click Demo Login
            </div>
            <div className="grid grid-cols-2 gap-2">
              {allUsers.slice(0, 4).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setCurrentUser(u)}
                  className="p-2 rounded-xl bg-surface-container-low hover:bg-primary/10 hover:border-primary border border-outline-variant/40 text-left transition-colors flex items-center gap-2 group"
                >
                  <img loading="lazy" decoding="async"
                    src={u.avatar}
                    alt={u.name}
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-on-surface group-hover:text-primary truncate">
                      {u.name}
                    </div>
                    <div className="text-[9px] text-outline truncate">@{u.username}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          */}

          <p className="text-[11px] text-center text-outline pt-2">
            By continuing, you agree to EduSpare's Terms of Service and Privacy Policy.
          </p>
        </div>
      </main>
    </div>
  );
};
