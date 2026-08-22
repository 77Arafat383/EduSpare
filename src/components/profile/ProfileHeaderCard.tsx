'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User, isUserActive } from '@/types/eduspare';
import { GraduationCap, MessageSquare, Edit2, MoreVertical, Trash2, Link, Award } from 'lucide-react';

interface ProfileHeaderCardProps {
  user: User;
  isOwnProfile: boolean;
  isEditingBio: boolean;
  setIsEditingBio: (editing: boolean) => void;
  handleStartChat: () => void;
  handleDeleteProfile: () => void;
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  user,
  isOwnProfile,
  isEditingBio,
  setIsEditingBio,
  handleStartChat,
  handleDeleteProfile,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isActive = isUserActive(user.lastActiveAt);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderDropdownMenu = () => (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="p-2 text-outline hover:text-on-surface rounded-xl hover:bg-surface-container-high transition-colors"
        title="Profile Options"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-outline-variant/60 rounded-2xl shadow-2xl py-1.5 z-[100] animate-in fade-in duration-100 opacity-100 space-y-0.5">
          {isOwnProfile ? (
            <>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsEditingBio(!isEditingBio);
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-on-surface hover:bg-surface-container-low flex items-center gap-2 transition-colors"
              >
                <Edit2 className="w-4 h-4 text-primary" /> Edit Profile
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleDeleteProfile();
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-500/10 flex items-center gap-2 transition-colors border-t border-outline-variant/30"
              >
                <Trash2 className="w-4 h-4 text-rose-600" /> Delete Profile
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleStartChat();
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-on-surface hover:bg-surface-container-low flex items-center gap-2 transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-primary" /> Message User
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  navigator.clipboard.writeText(window.location.href);
                  alert('Profile link copied to clipboard!');
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-on-surface hover:bg-surface-container-low flex items-center gap-2 transition-colors"
              >
                <Link className="w-4 h-4 text-outline" /> Copy Profile Link
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-surface-lowest rounded-3xl border border-outline-variant/60 shadow-sm relative z-10">
      {/* Cover Backdrop */}
      <div className="h-32 sm:h-44 relative bg-gradient-to-r from-primary via-primary-container to-purple-600 rounded-t-3xl overflow-hidden">
        <img
          src={user.coverImage || '/assets/default_cover.png'}
          alt="Cover Backdrop"
          className="w-full h-full object-cover"
        />
      </div>

      {/* User Info Row Below Cover Photo */}
      <div className="p-4 sm:p-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        {/* Top Right 3-Dots Options Menu (Placed below cover photo) */}
        <div className="absolute right-3 top-3 sm:right-6 sm:top-4 z-20 flex items-center gap-2">
          {!isOwnProfile && (
            <button
              onClick={handleStartChat}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-primary text-white font-bold text-xs rounded-xl sm:rounded-2xl shadow-sm hover:bg-primary-container transition-all flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Message
            </button>
          )}
          {renderDropdownMenu()}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 -mt-10 sm:-mt-12 pr-12 sm:pr-0">
          {/* Avatar with Glowing Blue Light Circle Ring for Active Status */}
          <img
            src={user.avatar || '/assets/default_avatar.png'}
            alt={user.name}
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-xl bg-surface-lowest shrink-0 transition-all ${
              isActive
                ? 'ring-4 ring-blue-500 shadow-blue-500/40'
                : 'ring-4 ring-white dark:ring-slate-800'
            }`}
          />

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-on-surface">{user.name}</h1>
              <span className="text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                @{user.username}
              </span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>{user.rank || 'Scholar'}</span>
              </span>
            </div>
            <p className="text-xs font-semibold text-outline flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-primary" />
              {user.university || 'Educational Scholar'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
