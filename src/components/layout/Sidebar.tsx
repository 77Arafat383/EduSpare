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

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, setSelectedUsername } = useEduSpare();

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

  return (
    <aside className="w-64 bg-surface border-r border-outline-variant/50 flex flex-col shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto z-30 p-4">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-bold text-outline uppercase tracking-wider">

        </div>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'profile' && currentUser) {
                  setSelectedUsername(currentUser.username);
                }
                setActiveTab(item.id);
              }}
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

      {/* SaaS Feature Highlights Pro Banner 
      <div className="mt-auto pt-6">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-surface-container-high to-surface-variant border border-primary/20 relative overflow-hidden">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>EduSpare AI Tutor</span>
          </div>
          <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
            Need help with complex tasks? Use our built-in AI tutor inside any task workspace!
          </p>
        </div>
      </div>
      */}

    </aside>
  );
};
