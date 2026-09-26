'use client';

import React, { useState, useMemo } from 'react';
import { useEduSpare } from '@/context/EduSpareContext';
import { LogIn, UserPlus, ArrowRight, Sparkles, UserCheck, Loader2 } from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    name: 'Alex Rivera',
    username: 'alex_dev',
    role: 'CS & AI • MIT',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Sarah Jenkins',
    username: 'sarah_j',
    role: 'Systems Architect',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Dr. Marcus Vance',
    username: 'marcus_v',
    role: 'Quantum Physics',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Elena Rostova',
    username: 'elena_r',
    role: 'Data Science Fellow',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  },
];

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
  const [demoLoadingUser, setDemoLoadingUser] = useState<string | null>(null);

  const displayDemoUsers = useMemo(() => {
    return DEMO_ACCOUNTS.map((demo) => {
      const liveUser = allUsers.find(
        (u) => u.username.toLowerCase() === demo.username.toLowerCase()
      );
      if (!liveUser) return demo;
      return {
        name: liveUser.name || demo.name,
        username: liveUser.username,
        role: liveUser.university || liveUser.rank || demo.role,
        avatar: liveUser.avatar || demo.avatar,
      };
    });
  }, [allUsers]);

  const handleDemoLogin = async (username: string = 'alex_dev') => {
    setError(null);
    setDemoLoadingUser(username);
    setLoading(true);

    try {
      const res = await loginOrRegister('login', {
        username,
        password: 'password123',
      });

      if (!res.success) {
        const userObj = allUsers.find(
          (u) => u.username.toLowerCase() === username.toLowerCase()
        );
        if (userObj) {
          setCurrentUser(userObj);
        } else {
          const fallbackDemo = DEMO_ACCOUNTS.find(
            (d) => d.username.toLowerCase() === username.toLowerCase()
          ) || DEMO_ACCOUNTS[0];
          setCurrentUser({
            id: `demo-${username}`,
            name: fallbackDemo.name,
            username: fallbackDemo.username,
            email: `${fallbackDemo.username}@eduspare.edu`,
            avatar: fallbackDemo.avatar,
            rank: 'Scholar',
            totalPoints: 1250,
            activeStreak: 7,
            university: 'MIT',
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch {
      const userObj = allUsers.find(
        (u) => u.username.toLowerCase() === username.toLowerCase()
      );
      if (userObj) {
        setCurrentUser(userObj);
      } else {
        const fallbackDemo = DEMO_ACCOUNTS.find(
          (d) => d.username.toLowerCase() === username.toLowerCase()
        ) || DEMO_ACCOUNTS[0];
        setCurrentUser({
          id: `demo-${username}`,
          name: fallbackDemo.name,
          username: fallbackDemo.username,
          email: `${fallbackDemo.username}@eduspare.edu`,
          avatar: fallbackDemo.avatar,
          rank: 'Scholar',
          totalPoints: 1250,
          activeStreak: 7,
          university: 'MIT',
          createdAt: new Date().toISOString(),
        });
      }
    } finally {
      setDemoLoadingUser(null);
      setLoading(false);
    }
  };

  const handleFillDemoCredentials = (username: string = 'alex_dev') => {
    setTab('login');
    setLoginEmail(username);
    setLoginPassword('password123');
    setError(null);
  };

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
              src="/assets/eduspare_brain_icon_128.png"
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
          {/* Prominent 1-Click Instant Demo Login Button */}
          <div className="space-y-1.5 bg-gradient-to-br from-primary/10 via-primary/5 to-amber-500/10 p-3.5 rounded-2xl border border-primary/20 shadow-xs">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('alex_dev')}
              className="w-full py-3 px-4 bg-primary hover:bg-primary-container text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70"
            >
              {demoLoadingUser === 'alex_dev' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging in as Alex Rivera...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
                  <span>1-Click Quick Demo Login</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                </>
              )}
            </button>
            <div className="flex items-center justify-between text-[11px] text-outline px-1 pt-0.5">
              <span className="font-medium">Instant access as Alex Rivera (MIT)</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                1-Click • No Password
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-outline-variant/40" />
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider">or continue with account</span>
            <div className="flex-1 h-px bg-outline-variant/40" />
          </div>

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

              <div className="flex items-center justify-between text-xs text-outline px-0.5">
                <button
                  type="button"
                  onClick={() => handleFillDemoCredentials('alex_dev')}
                  className="hover:text-primary transition-colors flex items-center gap-1 font-semibold text-[11px]"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Auto-fill demo credentials
                </button>
                <span className="text-[10px] text-outline/80 font-mono">pass: password123</span>
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

          {/* Quick Demo Login Switcher */}
          <div className="pt-3.5 border-t border-outline-variant/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-on-surface flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick 1-Click Demo Login
              </div>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Instant Access
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {displayDemoUsers.map((u) => {
                const isCurrentLoading = demoLoadingUser === u.username;
                return (
                  <button
                    key={u.username}
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemoLogin(u.username)}
                    className="p-2.5 rounded-2xl bg-surface-container-low hover:bg-primary/10 hover:border-primary/50 border border-outline-variant/50 text-left transition-all duration-150 flex items-center gap-2.5 group relative disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-sm"
                  >
                    <div className="relative shrink-0">
                      <img
                        loading="lazy"
                        decoding="async"
                        src={u.avatar}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant/60 group-hover:ring-primary transition-all"
                      />
                      {isCurrentLoading && (
                        <div className="absolute inset-0 bg-primary/80 rounded-full flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-on-surface group-hover:text-primary truncate">
                        {u.name}
                      </div>
                      <div className="text-[10px] text-outline truncate">{u.role}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-center text-outline pt-2">
            By continuing, you agree to EduSpare's Terms of Service and Privacy Policy.
          </p>
        </div>
      </main>
    </div>
  );
};
