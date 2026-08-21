'use client';

import React from 'react';
import { Users, Plus } from 'lucide-react';

interface CommunityHeaderProps {
  onOpenCreate: () => void;
}

export const CommunityHeader: React.FC<CommunityHeaderProps> = ({ onOpenCreate }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-lowest p-6 rounded-3xl border border-outline-variant/60 shadow-sm">
      <div>
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-black text-on-surface tracking-tight">Study Communities</h2>
        </div>
        <p className="text-xs text-outline font-medium mt-1">
          Join member-gated hubs to share research papers, study notes, and admin-moderated articles
        </p>
      </div>

      <button
        onClick={onOpenCreate}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-container text-white font-bold text-sm rounded-2xl shadow-md transition-all self-start sm:self-auto"
      >
        <Plus className="w-5 h-5" />
        Create Community
      </button>
    </div>
  );
};
