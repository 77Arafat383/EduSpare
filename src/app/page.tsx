'use client';

import React from 'react';
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
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { activeTab, currentUser, loading } = useEduSpare();

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
      <Header />

      {/* Main Content Layout with Sidebar */}
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}
