'use client';

import React, { useState } from 'react';
import { ProfileSummaryCard } from './ProfileSummaryCard';
import { ActivityHeatmap } from './ActivityHeatmap';
import { RemainingTasksWidget } from './RemainingTasksWidget';
import { TopPriorityTasksWidget } from './TopPriorityTasksWidget';
import { CreateTaskModal } from '../tasks/CreateTaskModal';
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

      {/* Bottom Grid Layout: Remaining Tasks on Left/Center, Top 5 Priority Tasks on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RemainingTasksWidget onOpenCreateModal={() => setIsCreateModalOpen(true)} />
        </div>
        <div className="lg:col-span-1">
          <TopPriorityTasksWidget />
        </div>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
