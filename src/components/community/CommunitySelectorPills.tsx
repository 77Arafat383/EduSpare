'use client';

import React from 'react';
import { CommunityItem, User } from '@/types/eduspare';
import { Lock, Globe } from 'lucide-react';

export type CommunityFilterTab = 'all' | 'joined' | 'admin';

interface CommunitySelectorPillsProps {
  filterTab: CommunityFilterTab;
  onTabChange: (tab: CommunityFilterTab) => void;
  communities: CommunityItem[];
  activeCommunityId?: string;
  currentUser: User | null;
  onSelectCommunity: (id: string) => void;
  allCount: number;
  joinedCount: number;
  adminCount: number;
}

export const CommunitySelectorPills: React.FC<CommunitySelectorPillsProps> = ({
  filterTab,
  onTabChange,
  communities,
  activeCommunityId,
  currentUser,
  onSelectCommunity,
  allCount,
  joinedCount,
  adminCount,
}) => {
  return (
    <div className="space-y-3">
      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-2 text-xs font-bold text-outline">
        <button
          type="button"
          onClick={() => onTabChange('all')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
            filterTab === 'all'
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'hover:bg-surface-container-high text-on-surface-variant'
          }`}
        >
          All Groups ({allCount})
        </button>

        {currentUser && (
          <button
            type="button"
            onClick={() => onTabChange('joined')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
              filterTab === 'joined'
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'hover:bg-surface-container-high text-on-surface-variant'
            }`}
          >
            Joined Groups ({joinedCount})
          </button>
        )}

        {currentUser && (
          <button
            type="button"
            onClick={() => onTabChange('admin')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
              filterTab === 'admin'
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'hover:bg-surface-container-high text-on-surface-variant'
            }`}
          >
            Admin Groups ({adminCount})
          </button>
        )}
      </div>

      {/* Horizontal Scrollable Pills */}
      {communities.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {communities.map((comm) => {
            const isSelected = activeCommunityId === comm.id;
            const isUserAdmin =
              currentUser &&
              (comm.createdById === currentUser.id ||
                comm.adminIds?.includes(currentUser.id) ||
                (currentUser.username &&
                  (comm.createdById === currentUser.username ||
                    comm.adminIds?.includes(currentUser.username))));

            return (
              <button
                key={comm.id}
                type="button"
                onClick={() => onSelectCommunity(comm.id)}
                className={`px-4 py-3 rounded-2xl border transition-all text-left shrink-0 min-w-[210px] cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-surface-lowest hover:bg-surface-container-low text-on-surface border-outline-variant/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs truncate max-w-[140px]">{comm.name}</span>
                  {comm.isPrivate ? (
                    <Lock className={`w-3 h-3 ${isSelected ? 'text-amber-300' : 'text-amber-500'}`} />
                  ) : (
                    <Globe className={`w-3 h-3 ${isSelected ? 'text-emerald-300' : 'text-emerald-500'}`} />
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-outline'}`}>
                    {comm.memberIds?.length || 0} Members
                  </span>
                  {isUserAdmin && (
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                      }`}
                    >
                      Admin
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
