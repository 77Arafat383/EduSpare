'use client';

import React, { useState } from 'react';
import { CommunityItem, User } from '@/types/eduspare';
import { Lock, Globe } from 'lucide-react';

interface CommunitySelectorPillsProps {
  communities: CommunityItem[];
  activeCommunityId?: string;
  currentUser: User | null;
  onSelectCommunity: (id: string) => void;
}

export const CommunitySelectorPills: React.FC<CommunitySelectorPillsProps> = ({
  communities,
  activeCommunityId,
  currentUser,
  onSelectCommunity,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'joined' | 'admin'>('all');

  const joinedCommunities = communities.filter((c) =>
    currentUser ? Boolean(c.memberIds?.includes(currentUser.id)) : false
  );

  const adminCommunities = communities.filter((c) =>
    currentUser ? Boolean(c.createdById === currentUser.id || c.adminIds?.includes(currentUser.id)) : false
  );

  const handleSelectAll = () => {
    setFilterTab('all');
  };

  const handleSelectJoined = () => {
    setFilterTab('joined');
    if (joinedCommunities.length > 0) {
      const isCurrentInJoined = joinedCommunities.some((c) => c.id === activeCommunityId);
      if (!isCurrentInJoined) {
        onSelectCommunity(joinedCommunities[0].id);
      }
    }
  };

  const handleSelectAdmin = () => {
    setFilterTab('admin');
    if (adminCommunities.length > 0) {
      const isCurrentInAdmin = adminCommunities.some((c) => c.id === activeCommunityId);
      if (!isCurrentInAdmin) {
        onSelectCommunity(adminCommunities[0].id);
      }
    }
  };

  const filteredCommunities =
    filterTab === 'joined'
      ? joinedCommunities
      : filterTab === 'admin'
      ? adminCommunities
      : communities;

  return (
    <div className="space-y-3">
      {/* Category Filter Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-2 text-xs font-bold text-outline">
        <button
          type="button"
          onClick={handleSelectAll}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
            filterTab === 'all'
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'hover:bg-surface-container-high text-on-surface-variant'
          }`}
        >
          All Groups ({communities.length})
        </button>

        {currentUser && (
          <button
            type="button"
            onClick={handleSelectJoined}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
              filterTab === 'joined'
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'hover:bg-surface-container-high text-on-surface-variant'
            }`}
          >
            Joined Groups ({joinedCommunities.length})
          </button>
        )}

        {currentUser && (
          <button
            type="button"
            onClick={handleSelectAdmin}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
              filterTab === 'admin'
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'hover:bg-surface-container-high text-on-surface-variant'
            }`}
          >
            Admin Groups ({adminCommunities.length})
          </button>
        )}
      </div>

      {/* Horizontal Scrollable Pills */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {filteredCommunities.length === 0 ? (
          <div className="p-3 text-xs text-outline italic">No communities in this section.</div>
        ) : (
          filteredCommunities.map((comm) => {
            const isSelected = activeCommunityId === comm.id;
            const isUserAdmin =
              currentUser && (comm.createdById === currentUser.id || comm.adminIds?.includes(currentUser.id));

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
          })
        )}
      </div>
    </div>
  );
};
