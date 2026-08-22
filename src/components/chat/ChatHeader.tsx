'use client';

import React from 'react';
import { User, isUserActive } from '@/types/eduspare';
import {
  ArrowLeft,
  MoreVertical,
  User as UserIcon,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

interface ChatHeaderProps {
  activeChatUser: User;
  setActiveChatUser: (user: User | null) => void;
  handleVisitProfile: (user: User) => void;
  isChatBlocked: boolean;
  toggleBlockUser: (userId: string) => Promise<void>;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  menuRef: React.RefObject<HTMLDivElement>;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeChatUser,
  setActiveChatUser,
  handleVisitProfile,
  isChatBlocked,
  toggleBlockUser,
  isMenuOpen,
  setIsMenuOpen,
  menuRef,
}) => {
  return (
    <div className="p-2.5 sm:p-4 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-lowest shrink-0">
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        {/* Back Button on Mobile */}
        <button
          onClick={() => setActiveChatUser(null)}
          className="md:hidden p-1.5 text-primary hover:bg-primary/10 rounded-xl transition-colors shrink-0"
          title="Back to messages list"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div
          onClick={() => handleVisitProfile(activeChatUser)}
          className="relative cursor-pointer group shrink-0"
        >
          <img
            src={activeChatUser.avatar}
            alt={activeChatUser.name}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary transition-all"
          />
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-surface-lowest ${
              isUserActive(activeChatUser.lastActiveAt) ? 'bg-emerald-500' : 'bg-slate-400'
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3
            onClick={() => handleVisitProfile(activeChatUser)}
            className="font-bold text-xs sm:text-sm text-on-surface hover:text-primary cursor-pointer transition-colors truncate max-w-[110px] min-[360px]:max-w-[180px] sm:max-w-none"
          >
            {activeChatUser.name}
          </h3>
          <p className="text-[10px] sm:text-[11px] text-outline font-medium truncate">
            {isUserActive(activeChatUser.lastActiveAt) ? (
              <span className="text-emerald-600 font-bold">● Active Now</span>
            ) : (
              `@${activeChatUser.username}`
            )}
          </p>
        </div>
      </div>

      {/* Header 3-Dots Dropdown Options (Solid Opaque White Background) */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-1.5 sm:p-2 text-outline hover:text-on-surface rounded-xl hover:bg-surface-container transition-colors"
          title="Options"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-1 w-40 sm:w-44 bg-white dark:bg-slate-900 border border-outline-variant/60 rounded-2xl shadow-2xl py-1 z-50 space-y-0.5 animate-in fade-in duration-100 opacity-100">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                handleVisitProfile(activeChatUser);
              }}
              className="w-full px-3 py-2 text-left text-xs font-semibold text-on-surface hover:bg-surface-container-low flex items-center gap-2 transition-colors"
            >
              <UserIcon className="w-4 h-4 text-outline" />
              View Profile
            </button>

            <button
              onClick={async () => {
                setIsMenuOpen(false);
                await toggleBlockUser(activeChatUser.id);
              }}
              className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center gap-2 transition-colors ${
                isChatBlocked
                  ? 'text-emerald-600 hover:bg-emerald-500/10'
                  : 'text-rose-600 hover:bg-rose-500/10'
              }`}
            >
              {isChatBlocked ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Unblock User
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Block User
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
