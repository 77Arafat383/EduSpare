'use client';

import React, { useState } from 'react';
import { CommunityItem, User } from '@/types/eduspare';
import { DEFAULT_COMMUNITY_RULES } from './communityConstants';
import { ScrollText, Users, UserMinus, UserPlus, Search, X } from 'lucide-react';

interface CommunityMembersCardProps {
  community: CommunityItem;
  allUsers: User[];
  isAdmin: boolean;
  onRemoveMember: (memberId: string) => void;
  onInviteMember: (targetUserId: string) => void;
}

export const CommunityMembersCard: React.FC<CommunityMembersCardProps> = ({
  community,
  allUsers,
  isAdmin,
  onRemoveMember,
  onInviteMember,
}) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');

  const membersList = allUsers.filter((u) => community.memberIds?.includes(u.id));

  const nonMembersList = allUsers.filter(
    (u) =>
      !community.memberIds?.includes(u.id) &&
      (u.name.toLowerCase().includes(inviteSearch.toLowerCase()) ||
        u.username.toLowerCase().includes(inviteSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* 1. Community Rules Section */}
      <div className="p-6 rounded-3xl bg-surface-lowest border border-outline-variant/60 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-primary" />
          <h4 className="text-sm font-bold text-on-surface">Community Guidelines & Rules</h4>
        </div>
        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium text-on-surface-variant leading-relaxed whitespace-pre-line">
          {community.rules || DEFAULT_COMMUNITY_RULES}
        </div>
      </div>

      {/* 2. Community Members Grid & Admin Invite */}
      <div className="p-6 rounded-3xl bg-surface-lowest border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h4 className="text-sm font-bold text-on-surface">
              Community Members ({membersList.length})
            </h4>
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="px-4 py-2 bg-primary hover:bg-primary-container text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
            >
              <UserPlus className="w-4 h-4" /> Send Invitation Request
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {membersList.map((member) => {
            const isMemberAdmin =
              community.createdById === member.id || community.adminIds?.includes(member.id);

            return (
              <div
                key={member.id}
                className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={member.avatar || '/assets/default_avatar.png'}
                    alt={member.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-on-surface truncate block">
                        {member.name}
                      </span>
                      {isMemberAdmin && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600">
                          Admin
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-outline block truncate">@{member.username}</span>
                  </div>
                </div>

                {isAdmin && !isMemberAdmin && (
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${member.name} from ${community.name}?`)) {
                        onRemoveMember(member.id);
                      }
                    }}
                    className="p-1.5 text-outline hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Remove Member"
                  >
                    <UserMinus className="w-4 h-4 text-rose-600" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Admin Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface-lowest rounded-3xl shadow-2xl border border-outline-variant/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" /> Invite User to Community
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-full text-outline hover:bg-surface-container-low"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                type="text"
                value={inviteSearch}
                onChange={(e) => setInviteSearch(e.target.value)}
                placeholder="Search user by name or username..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-surface-container text-on-surface rounded-xl border border-outline-variant/60"
              />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 border border-outline-variant/40 rounded-2xl p-2 bg-surface-container-low">
              {nonMembersList.length === 0 ? (
                <div className="p-4 text-center text-xs text-outline italic">No eligible users found.</div>
              ) : (
                nonMembersList.map((u) => (
                  <div
                    key={u.id}
                    className="p-2.5 rounded-xl bg-surface-lowest flex items-center justify-between gap-2 border border-outline-variant/30"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={u.avatar || '/assets/default_avatar.png'}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-on-surface truncate block">{u.name}</span>
                        <span className="text-[10px] text-outline">@{u.username}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onInviteMember(u.id);
                        setIsInviteModalOpen(false);
                      }}
                      className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-container shadow-xs"
                    >
                      Send Invite
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
