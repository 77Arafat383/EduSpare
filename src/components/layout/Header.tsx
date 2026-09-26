'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UniversalSearchBar } from '../search/UniversalSearchBar';
import { useEduSpare } from '@/context/EduSpareContext';
import { Flame, Bell, User as UserIcon, LogOut, ChevronDown, CheckCheck, Users, Menu, Search, X, CheckSquare, BookOpen } from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const {
    currentUser,
    setCurrentUser,
    setActiveTab,
    setSelectedUsername,
    setSelectedBlogId,
    setSelectedCommunityId,
    setSelectedTaskId,
    tasks,
    blogs,
    communities,
    logout,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useEduSpare();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setIsMobileSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-surface-lowest border-b border-outline-variant/50 sticky top-0 z-40 px-3 md:px-8 flex items-center justify-between gap-2 sm:gap-4">
      {/* Brand & Search */}
      <div className="flex items-center gap-2 sm:gap-6 flex-1 max-w-2xl min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container-low border border-outline-variant/40 transition-colors shrink-0"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md group-hover:scale-105 transition-transform shrink-0 border border-outline-variant/40 bg-surface-container-low">
            <img loading="eager" fetchPriority="high" decoding="async"
              src="/assets/eduspare_brain_icon_128.png"
              alt="EduSpare Brain Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-bold text-lg sm:text-xl text-on-surface tracking-tight inline">
            Edu<span className="text-primary">Spare</span>
          </span>
        </div>

        <div className="hidden sm:block flex-1 min-w-0">
          <UniversalSearchBar />
        </div>
      </div>

      {/* Right User Bar & Streak */}
      {currentUser && (
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Mobile Search Icon Button Trigger */}
          <button
            onClick={() => setIsMobileSearchOpen(true)}
            className="sm:hidden p-2 rounded-full hover:bg-surface-container-low border border-outline-variant/40 text-outline hover:text-on-surface transition-colors shrink-0"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Active Streak Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 font-semibold text-xs shadow-sm">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
            <span>{currentUser.activeStreak} Day Streak</span>
          </div>

          {/* Notifications Icon Button & Dropdown Menu */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                setShowUserDropdown(false);
              }}
              className="p-2 rounded-full hover:bg-surface-container-low border border-outline-variant/40 text-outline hover:text-on-surface transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white font-bold text-[9px] rounded-full flex items-center justify-center ring-2 ring-surface-lowest animate-in zoom-in">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Menu (Solid Opaque White Background) */}
            {showNotifDropdown && (
              <div className="fixed top-16 left-1/2 -translate-x-1/2 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:translate-x-0 mt-0 sm:mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-outline-variant/60 p-3.5 sm:p-4 z-50 animate-in fade-in slide-in-from-top-2 opacity-100">
                <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-on-surface">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/10 text-rose-600 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => markAllNotificationsAsRead()}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto space-y-1 divide-y divide-outline-variant/20 pr-0.5">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 space-y-1">
                      <Bell className="w-8 h-8 text-outline mx-auto opacity-40" />
                      <p className="text-xs font-medium text-outline">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const type = n.type?.toLowerCase() || '';
                      const isCommunityNotif = type.includes('community');
                      const isTaskNotif = type.includes('task') || n.title?.toLowerCase().includes('task');

                      const linkedCommunity = isCommunityNotif && n.linkId ? communities.find((c) => c.id === n.linkId) : null;
                      const linkedTask = isTaskNotif && n.linkId ? tasks.find((t) => t.id === n.linkId) : null;
                      const linkedBlog = !isCommunityNotif && !isTaskNotif && n.linkId ? blogs.find((b) => b.id === n.linkId) : null;

                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationAsRead(n.id);
                            if (isTaskNotif) {
                              if (n.linkId) setSelectedTaskId(n.linkId);
                              setActiveTab('tasks');
                            } else if (isCommunityNotif) {
                              if (n.linkId) setSelectedCommunityId(n.linkId);
                              setActiveTab('communities');
                            } else if (n.linkId) {
                              setSelectedBlogId(n.linkId);
                              setActiveTab('blog');
                            }
                            setShowNotifDropdown(false);
                          }}
                          className={`p-3 rounded-2xl flex items-start gap-3 transition-colors cursor-pointer ${
                            !n.isRead
                              ? 'bg-primary/5 hover:bg-primary/10 font-medium'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {/* Actor Avatar Profile Link */}
                          <img loading="lazy" decoding="async"
                            src={n.actor?.avatar || '/assets/default_avatar.png'}
                            alt={n.actor?.name || 'User'}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (n.actor?.username) {
                                setSelectedUsername(n.actor.username);
                                setActiveTab('profile');
                                setShowNotifDropdown(false);
                              }
                            }}
                            className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-primary/20 mt-0.5 cursor-pointer hover:ring-primary transition-all"
                            title={`View @${n.actor?.username}'s profile`}
                          />

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="text-xs text-on-surface leading-snug">
                              {/* Actor Username Profile Link */}
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (n.actor?.username) {
                                    setSelectedUsername(n.actor.username);
                                    setActiveTab('profile');
                                    setShowNotifDropdown(false);
                                  }
                                }}
                                className="font-bold text-on-surface hover:text-primary cursor-pointer transition-colors"
                              >
                                @{n.actor?.username || n.actor?.name}
                              </span>{' '}
                              <span className="text-on-surface-variant font-normal">
                                {type === 'comment' && 'commented on'}
                                {type === 'mention' && 'mentioned you in'}
                                {type === 'reaction' && 'reacted to'}
                                {type === 'community_invite' && 'invited you to'}
                                {type === 'community_request' && 'requested to join'}
                                {!['comment', 'mention', 'reaction', 'community_invite', 'community_request'].includes(type) && n.title}
                              </span>{' '}

                              {/* Target Item Link (Community, Task, or Blog) */}
                              {linkedCommunity ? (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markNotificationAsRead(n.id);
                                    setSelectedCommunityId(linkedCommunity.id);
                                    setActiveTab('communities');
                                    setShowNotifDropdown(false);
                                  }}
                                  className="font-extrabold text-primary hover:underline cursor-pointer transition-colors inline-flex items-center gap-1"
                                >
                                  <Users className="w-3 h-3 text-primary inline" />
                                  {linkedCommunity.name}
                                </span>
                              ) : linkedTask ? (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markNotificationAsRead(n.id);
                                    setSelectedTaskId(linkedTask.id);
                                    setActiveTab('tasks');
                                    setShowNotifDropdown(false);
                                  }}
                                  className="font-extrabold text-primary hover:underline cursor-pointer transition-colors inline-flex items-center gap-1"
                                >
                                  <CheckSquare className="w-3 h-3 text-primary inline" />
                                  "{linkedTask.title}"
                                </span>
                              ) : linkedBlog ? (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markNotificationAsRead(n.id);
                                    setSelectedBlogId(linkedBlog.id);
                                    setActiveTab('blog');
                                    setShowNotifDropdown(false);
                                  }}
                                  className="font-extrabold text-primary hover:underline cursor-pointer transition-colors inline-flex items-center gap-1"
                                >
                                  <BookOpen className="w-3 h-3 text-primary inline" />
                                  "{linkedBlog.title}"
                                </span>
                              ) : n.linkId ? (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markNotificationAsRead(n.id);
                                    if (isTaskNotif) {
                                      setSelectedTaskId(n.linkId!);
                                      setActiveTab('tasks');
                                    } else if (isCommunityNotif) {
                                      setSelectedCommunityId(n.linkId!);
                                      setActiveTab('communities');
                                    } else {
                                      setSelectedBlogId(n.linkId!);
                                      setActiveTab('blog');
                                    }
                                    setShowNotifDropdown(false);
                                  }}
                                  className="font-extrabold text-primary hover:underline cursor-pointer transition-colors"
                                >
                                  {isTaskNotif ? 'View Task' : 'View Item'}
                                </span>
                              ) : null}
                            </div>

                            {n.content && (
                              <p className="text-[11px] text-outline truncate italic">
                                "{n.content}"
                              </p>
                            )}

                            <span className="text-[10px] text-outline block font-medium">
                              {formatRelativeTime(n.createdAt)}
                            </span>
                          </div>

                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Switcher / Profile Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setShowUserDropdown(!showUserDropdown);
                setShowNotifDropdown(false);
              }}
              className="flex items-center gap-2 sm:p-1 sm:pl-2 sm:pr-3 rounded-full hover:bg-surface-container-low sm:border sm:border-outline-variant/40 transition-colors shrink-0"
              title="User Profile Menu"
            >
              <img loading="lazy" decoding="async"
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/30"
              />
              <span className="text-sm font-semibold text-on-surface hidden md:inline truncate max-w-[120px]">
                {currentUser.name}
              </span>
              <ChevronDown className="w-4 h-4 text-outline hidden sm:inline" />
            </button>

            {/* User Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-outline-variant/60 p-2 z-50 animate-in fade-in slide-in-from-top-2 opacity-100">
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Full-Width Expandable Search Bar Overlay */}
      {isMobileSearchOpen && (
        <div
          ref={mobileSearchRef}
          className="sm:hidden absolute inset-0 bg-surface-lowest z-50 px-3 flex items-center gap-2 border-b border-outline-variant/50 animate-in fade-in slide-in-from-top-1"
        >
          <div className="flex-1 min-w-0">
            <UniversalSearchBar onSelectResult={() => setIsMobileSearchOpen(false)} />
          </div>
          <button
            onClick={() => setIsMobileSearchOpen(false)}
            className="p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container-low border border-outline-variant/40 shrink-0"
            title="Close Search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </header>
  );
};
