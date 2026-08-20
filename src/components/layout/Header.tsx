'use client';

import React, { useState } from 'react';
import { UniversalSearchBar } from '../search/UniversalSearchBar';
import { useEduSpare } from '@/context/EduSpareContext';
import { Flame, Bell, User as UserIcon, LogOut, ChevronDown } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentUser, allUsers, setCurrentUser, setActiveTab, setSelectedUsername, logout } = useEduSpare();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="h-16 bg-surface-lowest border-b border-outline-variant/50 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between gap-4">
      {/* Brand & Search */}
      <div className="flex items-center gap-6 flex-1 max-w-2xl">
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md group-hover:scale-105 transition-transform shrink-0 border border-outline-variant/40 bg-surface-container-low">
            <img
              src="/assets/eduspare_brain_icon.png"
              alt="EduSpare Brain Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-bold text-xl text-on-surface tracking-tight hidden sm:inline">
            Edu<span className="text-primary">Spare</span>
          </span>
        </div>

        <div className="flex-1">
          <UniversalSearchBar />
        </div>
      </div>

      {/* Right User Bar & Streak */}
      {currentUser && (
        <div className="flex items-center gap-3 md:gap-4">
          {/* Active Streak Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 font-semibold text-xs shadow-sm">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
            <span>{currentUser.activeStreak} Day Streak</span>
          </div>

          {/* User Switcher / Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full hover:bg-surface-container-low border border-outline-variant/40 transition-colors"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/30"
              />
              <span className="text-sm font-semibold text-on-surface hidden md:inline truncate max-w-[120px]">
                {currentUser.name}
              </span>
              <ChevronDown className="w-4 h-4 text-outline" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-surface-lowest rounded-2xl shadow-xl border border-outline-variant/80 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-3 border-b border-outline-variant/40">
                  <p className="text-sm font-bold text-on-surface">{currentUser.name}</p>
                  <p className="text-xs text-outline">@{currentUser.username}</p>
                </div>

                <div className="py-2 space-y-1">
                  <button
                    onClick={() => {
                      setSelectedUsername(currentUser.username);
                      setActiveTab('profile');
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low rounded-xl flex items-center gap-2 font-medium"
                  >
                    <UserIcon className="w-4 h-4 text-primary" />
                    My Profile
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-500/10 rounded-xl flex items-center gap-2 font-semibold transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    Logout
                  </button>
                </div>

                {/* Switch Demo User 
                <div className="border-t border-outline-variant/40 pt-2">
                  <p className="px-3 py-1 text-[11px] font-semibold text-outline uppercase tracking-wider">
                    Switch Active Demo User
                  </p>
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-xl flex items-center justify-between ${u.id === currentUser.id
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'hover:bg-surface-container-low text-on-surface'
                        }`}
                    >
                      <span className="truncate">{u.name} (@{u.username})</span>
                      {u.id === currentUser.id && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
                */}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
