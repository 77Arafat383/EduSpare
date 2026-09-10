'use client';

import dynamic from 'next/dynamic';

import React, { useState } from 'react';
import { ProfileSummaryCard } from './ProfileSummaryCard';
import { ActivityHeatmap } from './ActivityHeatmap';
import { RemainingTasksWidget } from './RemainingTasksWidget';
import { TopPriorityTasksWidget } from './TopPriorityTasksWidget';
const CreateTaskModal = dynamic(() => import('../tasks/CreateTaskModal').then((m) => m.CreateTaskModal), { ssr: false });
import { useEduSpare } from '@/context/EduSpareContext';

export const DashboardView: React.FC = () => {
  const { currentUser } = useEduSpare();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      {/* Top Profile Summary Card */}
      <ProfileSummaryCard />

      {/* Codeforces Activity Heatmap Grid */}
      <ActivityHeatmap username={currentUser.username} />

      {/* Bottom Grid Layout: Remaining Tasks on Left/Center (desktop), Top 5 Priority Tasks on Right (desktop) & First (mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 lg:order-2">
          <TopPriorityTasksWidget />
        </div>
        <div className="lg:col-span-2 lg:order-1">
          <RemainingTasksWidget onOpenCreateModal={() => setIsCreateModalOpen(true)} />
        </div>
      </div>

      {/* Create Task Modal */}
      {isCreateModalOpen && (
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      )}
    </div>
  );
};
