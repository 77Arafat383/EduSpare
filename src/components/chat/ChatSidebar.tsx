'use client';

import React from 'react';
import { User, isUserActive } from '@/types/eduspare';
import { MessageSquare, Search } from 'lucide-react';

interface ChatSidebarProps {
  filteredContacts: User[];
  activeChatUser: User | null;
  recentConversations: Record<
    string,
    { lastMessageAt: string; lastMessageSnippet: string; isMeSender: boolean; unseenCount: number }
  >;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  setActiveChatUser: (user: User | null) => void;
  unreadUsersCount: number;
  formatRelativeTime: (dateStr?: string) => string;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  filteredContacts,
  activeChatUser,
  recentConversations,
  searchTerm,
  setSearchTerm,
  setActiveChatUser,
  unreadUsersCount,
  formatRelativeTime,
}) => {
  return (
    <div
      className={`w-full md:w-80 border-r border-outline-variant/40 flex flex-col bg-surface-container-lowest shrink-0 ${
        activeChatUser ? 'hidden md:flex' : 'flex'
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-outline-variant/40 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> Messages
            {unreadUsersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-primary text-white shadow-xs">
                {unreadUsersCount} {unreadUsersCount === 1 ? 'Unread User' : 'Unread Users'}
              </span>
            )}
          </h2>
        </div>

        {/* Search Contacts */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/20">
        {filteredContacts.length === 0 ? (
          <div className="p-4 text-center text-xs text-outline italic">No contacts found.</div>
        ) : (
          filteredContacts.map((user) => {
            const isSelected = activeChatUser?.id === user.id;
            const isActive = isUserActive(user.lastActiveAt);
            const convInfo = recentConversations[user.id];

            return (
              <div
                key={user.id}
                onClick={() => setActiveChatUser(user)}
                className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-primary/10 border-l-4 border-primary'
                    : 'hover:bg-surface-container-low'
                }`}
              >
                {/* User Avatar + Active Online Badge */}
                <div className="relative shrink-0">
                  <img loading="lazy" decoding="async"
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/10"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface-lowest ${
                      isActive ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                    title={isActive ? 'Active Now' : 'Offline'}
                  />
                </div>

                {/* Contact Info & Unseen Badge */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-on-surface truncate">{user.name}</span>
                    {convInfo?.lastMessageAt && (
                      <span className="text-[10px] text-outline">
                        {formatRelativeTime(convInfo.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[11px] text-outline truncate max-w-[140px]">
                      {convInfo?.lastMessageSnippet
                        ? (convInfo.isMeSender ? 'You: ' : '') + convInfo.lastMessageSnippet
                        : `@${user.username}`}
                    </p>
                    {convInfo && convInfo.unseenCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white shrink-0">
                        {convInfo.unseenCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
