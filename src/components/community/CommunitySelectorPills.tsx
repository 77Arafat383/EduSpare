'use client';

import React, { useState } from 'react';
import { CommunityItem, User } from '@/types/eduspare';
import { Lock, Globe, Shield } from 'lucide-react';

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

  React.useEffect(() => {
    if (activeCommunityId) {
      const activeInList = communities.find((c) => c.id === activeCommunityId);
      if (activeInList) {
        if (filterTab === 'joined' && currentUser && !activeInList.memberIds?.includes(currentUser.id)) {
          setFilterTab('all');
        } else if (
          filterTab === 'admin' &&
          currentUser &&
          activeInList.createdById !== currentUser.id &&
          !activeInList.adminIds?.includes(currentUser.id)
        ) {
          setFilterTab('all');
        }
      }
    }
  }, [activeCommunityId, communities, currentUser, filterTab]);

  const filteredCommunities = communities.filter((comm) => {
    if (filterTab === 'joined' && currentUser) {
      return comm.memberIds?.includes(currentUser.id);
    }
    if (filterTab === 'admin' && currentUser) {
      return comm.createdById === currentUser.id || comm.adminIds?.includes(currentUser.id);
    }
    return true;
  });

  return (
    <div className="space-y-3">
      {/* Category Filter Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-2 text-xs font-bold text-outline">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-3 py-1.5 rounded-xl transition-all ${filterTab === 'all'
            ? 'bg-primary/10 text-primary border border-primary/20'
            : 'hover:bg-surface-container-high text-on-surface-variant'
            }`}
        >
          All Groups ({communities.length})
        </button>

        {currentUser && (
          <button
            onClick={() => setFilterTab('joined')}
            className={`px-3 py-1.5 rounded-xl transition-all ${filterTab === 'joined'
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'hover:bg-surface-container-high text-on-surface-variant'
              }`}
          >
            Joined Groups ({communities.filter((c) => c.memberIds?.includes(currentUser.id)).length})
          </button>
        )}

        {currentUser && (
          <button
            onClick={() => setFilterTab('admin')}
            className={`px-3 py-1.5 rounded-xl transition-all ${filterTab === 'admin'
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'hover:bg-surface-container-high text-on-surface-variant'
              }`}
          >
            Admin Groups (
            {
              communities.filter(
                (c) => c.createdById === currentUser.id || c.adminIds?.includes(currentUser.id)
              ).length
            }
            )
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
            return (
              <button
                key={comm.id}
                onClick={() => onSelectCommunity(comm.id)}
                className={`px-4 py-3 rounded-2xl border transition-all text-left shrink-0 min-w-[210px] ${isSelected
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
                  {comm.createdById === currentUser?.id && (
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
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
