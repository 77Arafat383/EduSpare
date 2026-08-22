'use client';

import React, { useState } from 'react';
import { useEduSpare } from '@/context/EduSpareContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { TaskListView } from '@/components/tasks/TaskListView';
import { BlogFeedView } from '@/components/blog/BlogFeedView';
import { ChatView } from '@/components/chat/ChatView';
import { ProfileView } from '@/components/profile/ProfileView';
import { CommunityView } from '@/components/community/CommunityView';
import { LoginPage } from '@/components/auth/LoginPage';
import {
  Loader2,
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  MessageSquare,
  Users,
  User,
} from 'lucide-react';
import { ActiveTab } from '@/types/eduspare';

export default function Home() {
  const { activeTab, setActiveTab, currentUser, loading, recentConversations, setSelectedUsername } = useEduSpare();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <div className="text-sm font-bold text-on-surface">Initializing EduSpare Platform...</div>
      </div>
    );
  }

  // Without login and registration no one can enter and watch the features
  if (!currentUser) {
    return <LoginPage />;
  }

  const unreadUsersCount = Object.values(recentConversations).filter(
    (c) => c && c.unseenCount > 0
  ).length;

  const bottomNavItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'blog', label: 'Blogs', icon: <BookOpen className="w-5 h-5" /> },
    {
      id: 'chat',
      label: 'Chat',
      icon: <MessageSquare className="w-5 h-5" />,
      badge: unreadUsersCount > 0 ? `${unreadUsersCount}` : undefined,
    },
    { id: 'communities', label: 'Groups', icon: <Users className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'tasks':
        return <TaskListView />;
      case 'blog':
        return <BlogFeedView />;
      case 'chat':
        return <ChatView />;
      case 'profile':
        return <ProfileView />;
      case 'communities':
        return <CommunityView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      {/* Top Navbar */}
      <Header onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

      {/* Main Content Layout with Responsive Sidebar */}
      <div className="flex flex-1 relative">
        <Sidebar
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 p-3 sm:p-4 md:p-8 pb-24 lg:pb-8 overflow-y-auto max-w-7xl mx-auto w-full min-w-0">
          {renderActiveView()}
        </main>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar (Visible on Mobile/Tablet < lg) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-outline-variant/60 flex items-center justify-around py-1.5 px-2 shadow-xl backdrop-blur-md bg-opacity-95">
        {bottomNavItems.map((item) => {
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
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all relative ${
                isActive ? 'text-primary font-bold' : 'text-outline hover:text-on-surface font-medium'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[9px] font-extrabold px-1 rounded-full ring-1 ring-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {isActive && <span className="w-1.5 h-1.5 bg-primary rounded-full mt-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

