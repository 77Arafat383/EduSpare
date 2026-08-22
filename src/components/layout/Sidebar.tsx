'use client';

import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  MessageSquare,
  Users,
  User,
  Bookmark,
  Sparkles,
} from 'lucide-react';
import { useEduSpare } from '@/context/EduSpareContext';
import { ActiveTab } from '@/types/eduspare';

import { X } from 'lucide-react';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, currentUser, setSelectedUsername, recentConversations } = useEduSpare();

  const unreadUsersCount = Object.values(recentConversations).filter(
    (c) => c && c.unseenCount > 0
  ).length;

  const menuItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: <CheckSquare className="w-5 h-5" />,
    },
    {
      id: 'blog',
      label: 'Blogs',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      id: 'chat',
      label: 'Messages',
      icon: <MessageSquare className="w-5 h-5" />,
      badge: unreadUsersCount > 0 ? `${unreadUsersCount}` : undefined,
    },
    {
      id: 'communities',
      label: 'Communities',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="w-5 h-5" />,
    },
  ];

  const handleSelectTab = (id: ActiveTab) => {
    if (id === 'profile' && currentUser) {
      setSelectedUsername(currentUser.username);
    }
    setActiveTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  const renderContent = () => (
    <div className="space-y-1">
      {menuItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleSelectTab(item.id)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${isActive
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'text-on-surface hover:bg-surface-container-high'
              }`}
          >
            <div className="flex items-center gap-3">
              <span className={isActive ? 'text-white' : 'text-primary'}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                  }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-64 bg-surface border-r border-outline-variant/50 flex-col shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto z-30 p-4">
        {renderContent()}
      </aside>

      {/* Mobile & Tablet Drawer Menu Slide-over */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          {/* Drawer Sidebar */}
          <div className="relative w-72 max-w-[80vw] bg-surface-lowest border-r border-outline-variant/60 h-full p-4 flex flex-col space-y-4 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-outline-variant/40">
                  <img src="/assets/eduspare_brain_icon.png" alt="EduSpare" className="w-full h-full object-cover" />
                </div>
                <span className="font-bold text-base text-on-surface">EduSpare Menu</span>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-1 text-outline hover:text-on-surface hover:bg-surface-container-low rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {renderContent()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

