'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CommunityItem, User } from '@/types/eduspare';
import { DEFAULT_COMMUNITY_RULES } from './communityConstants';
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
  Trash2,
  ScrollText,
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
  onDeleteCommunity: () => void;
  onCancelRequest?: () => void;
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
  onDeleteCommunity,
  onCancelRequest,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isViewRulesModalOpen, setIsViewRulesModalOpen] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState(false);
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
    <div className="bg-surface-lowest rounded-3xl border border-outline-variant/60 shadow-sm space-y-4 relative z-10">
      {/* 1. Cover Photo Banner Backdrop */}
      <div className="h-44 relative bg-gradient-to-r from-primary via-primary-container to-purple-600 rounded-t-3xl overflow-hidden">
        <img
          src={community.image}
          alt={community.name}
          className="w-full h-full object-cover"
        />
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
          {!isMember && currentUser && (
            isPending ? (
              <button
                onClick={() => {
                  if (confirm(`Cancel your pending join request for ${community.name}?`)) {
                    onCancelRequest?.();
                  }
                }}
                className="px-4 py-2 bg-amber-500/10 hover:bg-rose-500/10 text-amber-600 hover:text-rose-600 font-bold text-xs rounded-xl border border-amber-500/30 hover:border-rose-500/30 flex items-center gap-1.5 shadow-xs transition-all group"
                title="Click to cancel pending join request"
              >
                <Clock className="w-4 h-4 animate-pulse text-amber-600 group-hover:text-rose-600" /> Request Sent (Undo)
              </button>
            ) : (
              <button
                onClick={() => setIsRulesModalOpen(true)}
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
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-outline-variant/60 rounded-2xl shadow-2xl py-1.5 z-[100] animate-in fade-in duration-100 opacity-100 space-y-0.5">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsViewRulesModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-on-surface hover:bg-surface-container-low flex items-center gap-2 transition-colors"
                  >
                    <ScrollText className="w-4 h-4 text-outline" /> Rules & Guidelines
                  </button>

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenEditCover();
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-semibold text-on-surface hover:bg-surface-container-low flex items-center gap-2 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-outline" /> Edit Group
                      </button>

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          if (confirm(`Are you sure you want to permanently delete "${community.name}"? This action cannot be undone.`)) {
                            onDeleteCommunity();
                          }
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" /> Delete Group
                      </button>
                    </>
                  )}

                  {isMember && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        if (confirm(`Are you sure you want to leave ${community.name}?`)) {
                          onLeave();
                        }
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 flex items-center gap-2 transition-colors border-t border-outline-variant/30"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" /> Leave Group
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rules Approval & Agreement Modal */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface-lowest rounded-3xl shadow-2xl border border-outline-variant/80 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <h3 className="text-sm font-bold text-on-surface">Community Rules & Agreement</h3>
              <button
                onClick={() => setIsRulesModalOpen(false)}
                className="p-1 rounded-full text-outline hover:bg-surface-container-low"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-outline font-medium">
              Please review and accept the rules of <span className="font-bold text-on-surface">{community.name}</span> before sending your join request:
            </p>

            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-mono text-on-surface-variant max-h-48 overflow-y-auto leading-relaxed whitespace-pre-line">
              {community.rules || '1. Be respectful to all members.\n2. Share verified academic content.\n3. No unauthorized self-promotion.'}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="accept-rules"
                checked={acceptedRules}
                onChange={(e) => setAcceptedRules(e.target.checked)}
                className="w-4 h-4 accent-primary rounded"
              />
              <label htmlFor="accept-rules" className="text-xs font-bold text-on-surface">
                I have read and agree to follow all community rules
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/40">
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-outline hover:text-on-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!acceptedRules}
                onClick={() => {
                  setIsRulesModalOpen(false);
                  setAcceptedRules(false);
                  if (community.isPrivate) {
                    onRequestJoin();
                  } else {
                    onJoin();
                  }
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-primary disabled:opacity-50 rounded-xl hover:bg-primary-container shadow-md transition-all"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Read-Only Community Guidelines & Rules Modal */}
      {isViewRulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface-lowest rounded-3xl shadow-2xl border border-outline-variant/80 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-primary" /> Guidelines & Rules
              </h3>
              <button
                onClick={() => setIsViewRulesModalOpen(false)}
                className="p-1 rounded-full text-outline hover:bg-surface-container-low"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-mono text-on-surface-variant max-h-64 overflow-y-auto leading-relaxed whitespace-pre-line">
              {community.rules || DEFAULT_COMMUNITY_RULES}
            </div>

            <div className="flex justify-end pt-2 border-t border-outline-variant/40">

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
