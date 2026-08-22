'use client';

import React from 'react';
import { User, MessageItem } from '@/types/eduspare';
import { Forward, X, Search } from 'lucide-react';

interface ForwardMessageModalProps {
  forwardingMsg: MessageItem | null;
  setForwardingMsg: (msg: MessageItem | null) => void;
  allUsers: User[];
  currentUser: User | null;
  forwardSelectedUsers: User[];
  setForwardSelectedUsers: (users: User[]) => void;
  forwardSearch: string;
  setForwardSearch: (search: string) => void;
  forwardSubmitting: boolean;
  handleForwardMsgSubmit: () => Promise<void>;
  toggleForwardUserSelect: (user: User) => void;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  forwardingMsg,
  setForwardingMsg,
  allUsers,
  currentUser,
  forwardSelectedUsers,
  setForwardSelectedUsers,
  forwardSearch,
  setForwardSearch,
  forwardSubmitting,
  handleForwardMsgSubmit,
  toggleForwardUserSelect,
}) => {
  if (!forwardingMsg) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-surface-lowest rounded-3xl shadow-2xl border border-outline-variant/80 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <Forward className="w-4 h-4 text-purple-600" /> Forward Message
          </h3>
          <button
            onClick={() => {
              setForwardingMsg(null);
              setForwardSelectedUsers([]);
            }}
            className="p-1 rounded-full text-outline hover:bg-surface-container-low hover:text-on-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Preview */}
        <div className="p-3 bg-surface-container-low rounded-2xl border border-outline-variant/40 text-xs space-y-1">
          <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Message snippet</p>
          <p className="text-on-surface font-medium truncate">{forwardingMsg.content}</p>
        </div>

        {/* User Search & Multi-Select */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Select Recipients ({forwardSelectedUsers.length})
            </span>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={forwardSearch}
              onChange={(e) => setForwardSearch(e.target.value)}
              placeholder="Search user..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-container text-on-surface rounded-xl border border-outline-variant/60"
            />
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1 border border-outline-variant/40 rounded-xl p-1.5 bg-surface-container-low">
            {allUsers
              .filter(
                (u) =>
                  u.id !== currentUser?.id &&
                  (u.name.toLowerCase().includes(forwardSearch.toLowerCase()) ||
                    u.username.toLowerCase().includes(forwardSearch.toLowerCase()))
              )
              .map((u) => {
                const isSel = forwardSelectedUsers.some((sel) => sel.id === u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleForwardUserSelect(u)}
                    className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                      isSel ? 'bg-primary/10 border border-primary/40 font-bold text-primary' : 'hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input type="checkbox" checked={isSel} onChange={() => {}} className="w-3.5 h-3.5 accent-primary" />
                      <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full shrink-0 object-cover" />
                      <span className="text-xs truncate">{u.name}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setForwardingMsg(null);
              setForwardSelectedUsers([]);
            }}
            className="px-4 py-2 text-xs font-bold text-outline hover:text-on-surface rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleForwardMsgSubmit}
            disabled={forwardSubmitting || forwardSelectedUsers.length === 0}
            className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-container disabled:opacity-40"
          >
            Forward Message
          </button>
        </div>
      </div>
    </div>
  );
};
