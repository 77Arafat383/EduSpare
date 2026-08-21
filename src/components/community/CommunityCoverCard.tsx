'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CommunityItem, User } from '@/types/eduspare';
import {
  Lock,
  Globe,
  ShieldCheck,
  Edit2,
  PenSquare,
  Plus,
  Clock,
  CheckCircle2,
  MoreVertical,
  LogOut,
} from 'lucide-react';

interface CommunityCoverCardProps {
  community: CommunityItem;
  currentUser: User | null;
  communityBlogsCount: number;
  isMember: boolean;
  isAdmin: boolean;
  isPending: boolean;
  onOpenEditCover: () => void;
  onOpenCreatePost: () => void;
  onJoin: () => void;
  onRequestJoin: () => void;
  onLeave: () => void;
}

export const CommunityCoverCard: React.FC<CommunityCoverCardProps> = ({
  community,
  currentUser,
  communityBlogsCount,
  isMember,
  isAdmin,
  isPending,
  onOpenEditCover,
  onOpenCreatePost,
  onJoin,
  onRequestJoin,
  onLeave,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-surface-lowest rounded-3xl border border-outline-variant/60 shadow-sm overflow-hidden space-y-4">
      {/* 1. Cover Photo Banner Backdrop */}
      <div className="h-44 relative bg-gradient-to-r from-primary via-primary-container to-purple-600 overflow-hidden">
        <img
          src={community.image}
          alt={community.name}
          className="w-full h-full object-cover"
        />
        {isAdmin && (
          <button
            onClick={onOpenEditCover}
            className="absolute top-4 right-4 px-3 py-1.5 bg-slate-950/70 hover:bg-slate-950 text-white font-bold text-xs rounded-xl backdrop-blur-md transition-all flex items-center gap-1.5 shadow-md"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Cover & Rules
          </button>
        )}
      </div>

      {/* 2. Community Info Row */}
      <div className="p-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
          <img
            src={community.avatarImage || community.image}
            alt={community.name}
            className="w-20 h-20 rounded-3xl object-cover ring-4 ring-white shadow-xl bg-surface-lowest shrink-0"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-2xl font-black text-on-surface tracking-tight">{community.name}</h3>
              {community.isPrivate ? (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Private Hub
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Public Hub
                </span>
              )}
              {isAdmin && (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-purple-600" /> Community Admin
                </span>
              )}
            </div>
            <p className="text-xs text-outline font-medium max-w-xl">{community.description}</p>
          </div>
        </div>

        {/* Action CTAs & 3-Dots Menu (Leave Group Option) */}
        <div className="flex items-center gap-2 shrink-0">
          {isMember && (
            <button
              onClick={onOpenCreatePost}
              className="px-4 py-2 bg-primary hover:bg-primary-container text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <PenSquare className="w-4 h-4" /> Write Article
            </button>
          )}

          {!isMember && currentUser && (
            isPending ? (
              <span className="px-4 py-2 bg-amber-500/10 text-amber-600 font-bold text-xs rounded-xl border border-amber-500/30 flex items-center gap-1.5">
                <Clock className="w-4 h-4 animate-pulse" /> Pending Approval
              </span>
            ) : (
              <button
                onClick={community.isPrivate ? onRequestJoin : onJoin}
                className="px-5 py-2 bg-primary hover:bg-primary-container text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                {community.isPrivate ? 'Request to Join' : 'Join Community'}
              </button>
            )
          )}

          {/* 3-Dots Dropdown Options Menu */}
          {isMember && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-outline hover:text-on-surface rounded-xl hover:bg-surface-container-high transition-colors"
                title="Community Options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-900 border border-outline-variant/60 rounded-2xl shadow-2xl py-1 z-50 animate-in fade-in duration-100 opacity-100">
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenEditCover();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-on-surface hover:bg-surface-container-low flex items-center gap-2 transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-outline" /> Edit Community
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (confirm(`Are you sure you want to leave ${community.name}?`)) {
                        onLeave();
                      }
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" /> Leave Group
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
