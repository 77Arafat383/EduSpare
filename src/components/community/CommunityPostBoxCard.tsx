'use client';

import React from 'react';
import { CommunityItem, User } from '@/types/eduspare';
import { PenSquare } from 'lucide-react';

interface CommunityPostBoxCardProps {
  community: CommunityItem;
  currentUser: User | null;
  onOpenCreatePost: () => void;
}

export const CommunityPostBoxCard: React.FC<CommunityPostBoxCardProps> = ({
  community,
  currentUser,
  onOpenCreatePost,
}) => {
  if (!currentUser) return null;

  return (
    <div
      onClick={onOpenCreatePost}
      className="p-4 rounded-3xl bg-surface-lowest hover:bg-surface-container-low border border-outline-variant/60 shadow-sm flex items-center gap-3 cursor-pointer transition-all group"
    >
      <img
        src={currentUser.avatar || '/assets/default_avatar.png'}
        alt={currentUser.name}
        className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-primary/20"
      />
      <div className="flex-1 min-w-0 text-xs font-semibold text-outline group-hover:text-on-surface transition-colors truncate">
        Write a community article or research note in {community.name}...
      </div>
      <button
        type="button"
        className="px-4 py-2 bg-primary group-hover:bg-primary-container text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 shrink-0 transition-all"
      >
        <PenSquare className="w-4 h-4" /> Write Article
      </button>
    </div>
  );
};
