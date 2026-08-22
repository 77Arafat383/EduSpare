'use client';

import React from 'react';
import { User, MessageItem, BlogPost, ActiveTab } from '@/types/eduspare';
import {
  Check,
  CheckCheck,
  MoreVertical,
  Reply,
  Forward,
  Edit2,
  Trash2,
  BookOpen,
} from 'lucide-react';

interface ChatMessageItemProps {
  msg: MessageItem;
  currentUser: User | null;
  activeChatUser: User;
  blogs: BlogPost[];
  openMsgMenuId: string | null;
  setOpenMsgMenuId: (id: string | null) => void;
  editingMsgId: string | null;
  editMsgText: string;
  setEditMsgText: (text: string) => void;
  handleStartEditMsg: (msg: MessageItem) => void;
  handleSaveEditMsg: (msgId: string) => void;
  handleDeleteMsg: (msgId: string) => void;
  setReplyingToMsg: (msg: MessageItem) => void;
  setForwardingMsg: (msg: MessageItem) => void;
  handleVisitProfile: (user: User) => void;
  setSelectedBlogId: (id: string | null) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  msg,
  currentUser,
  activeChatUser,
  blogs,
  openMsgMenuId,
  setOpenMsgMenuId,
  editingMsgId,
  editMsgText,
  setEditMsgText,
  handleStartEditMsg,
  handleSaveEditMsg,
  handleDeleteMsg,
  setReplyingToMsg,
  setForwardingMsg,
  handleVisitProfile,
  setSelectedBlogId,
  setActiveTab,
}) => {
  const isMe = msg.senderId === currentUser?.id;
  const isEditing = editingMsgId === msg.id;

  return (
    <div className={`flex items-start gap-2 group ${isMe ? 'justify-end' : 'justify-start'}`}>
      {!isMe && (
        <img
          src={msg.sender?.avatar || activeChatUser.avatar}
          alt="Avatar"
          onClick={() => handleVisitProfile(activeChatUser)}
          className="w-7 h-7 rounded-full object-cover shrink-0 cursor-pointer mt-1"
        />
      )}

      {/* Container wrapping Message Card & 3-Dot Button Outside Top Right */}
      <div className={`relative flex items-start gap-1 max-w-[85%] sm:max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Message Bubble Card */}
        <div
          className={`p-2.5 sm:p-3.5 rounded-2xl text-xs space-y-1.5 ${
            isMe
              ? 'bg-primary/10 text-on-surface border border-primary/25 rounded-tr-none shadow-2xs'
              : 'bg-surface-container-high text-on-surface rounded-tl-none border border-outline-variant/40'
          }`}
        >
          {isEditing ? (
            <div className="space-y-2 pt-0.5">
              <textarea
                rows={2}
                value={editMsgText}
                onChange={(e) => setEditMsgText(e.target.value)}
                className="w-full p-2 text-xs bg-surface-container text-on-surface font-normal rounded-xl border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => handleStartEditMsg(msg)}
                  className="px-2 py-1 text-[11px] font-semibold text-outline hover:bg-surface-container rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveEditMsg(msg.id)}
                  className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {(() => {
                // Regex for Reply parsing
                const replyMatch = msg.content.match(
                  /^(?:Replying to|💬 Replying to[^:]*:)\s*"([\s\S]*?)"\n\n([\s\S]*)$/
                );
                const forwardMatch = !replyMatch ? msg.content.match(/^(?:↪️ Forwarded:)\n([\s\S]*)$/) : null;

                const quotedText = replyMatch ? replyMatch[1] : forwardMatch ? forwardMatch[1] : null;
                const userText = replyMatch ? replyMatch[2] : forwardMatch ? '' : msg.content;
                const blogMatch = msg.content.match(/(?:https?:\/\/[^\s]+)?\/blog\?post=([a-zA-Z0-9_-]+)/);

                return (
                  <>
                    {/* Quoted Message in Opposite Color Contrast */}
                    {quotedText && (
                      <div
                        className={`p-2.5 rounded-xl text-xs border-l-4 border-primary space-y-0.5 ${
                          isMe
                            ? 'bg-surface-lowest text-on-surface border border-outline-variant/50 shadow-2xs'
                            : 'bg-primary/15 text-on-surface border border-primary/20 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                          <Reply className="w-3 h-3 text-primary" />
                          <span>{forwardMatch ? 'Forwarded' : 'Replying to'}</span>
                        </div>
                        <p className="text-[11px] text-outline font-medium italic line-clamp-3">
                          "{quotedText}"
                        </p>
                      </div>
                    )}

                    {/* User Reply / Main Message Content */}
                    {userText && (
                      <p className="leading-relaxed whitespace-pre-line font-normal text-xs sm:text-[13px] text-on-surface font-sans">
                        {userText}
                      </p>
                    )}

                    {/* Interactive Shared Blog Link Card */}
                    {blogMatch &&
                      (() => {
                        const postId = blogMatch[1];
                        const sharedBlog = blogs.find((b) => b.id === postId);

                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBlogId(postId);
                              setActiveTab('blog');
                            }}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 shadow-xs ${
                              isMe
                                ? 'bg-surface-lowest hover:bg-surface-container-low border-outline-variant/60 text-on-surface'
                                : 'bg-primary/10 hover:bg-primary/20 border-primary/20 text-on-surface'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <BookOpen className="w-4 h-4 text-primary shrink-0" />
                              <div className="min-w-0">
                                <span className="text-xs font-bold block truncate">
                                  {sharedBlog ? sharedBlog.title : 'Shared Article'}
                                </span>
                                <span className="text-[10px] text-outline block truncate">
                                  Click to view full article
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-primary underline shrink-0">
                              Open Article →
                            </span>
                          </button>
                        );
                      })()}
                  </>
                );
              })()}
            </div>
          )}

          <div className="text-[10px] text-right flex items-center justify-end gap-1 text-outline">
            <span>
              {new Date(msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {isMe &&
              (msg.isSeen ? (
                <span title="Delivered & Seen">
                  <CheckCheck className="w-3.5 h-3.5 text-primary" />
                </span>
              ) : (
                <span title="Delivered / Unseen">
                  <Check className="w-3 h-3 text-outline" />
                </span>
              ))}
          </div>
        </div>

        {/* 3-Dot Options Button Outside Top Right Corner of Message Card */}
        <div className="relative chat-msg-menu-container shrink-0 mt-0.5">
          <button
            onClick={() => setOpenMsgMenuId(openMsgMenuId === msg.id ? null : msg.id)}
            className="p-1 text-outline hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
            title="Message options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {/* Dropdown Menu (Centered Middle Overlay on Mobile, Positioned Dropdown on Desktop) */}
          {openMsgMenuId === msg.id && (
            <>
              {/* Mobile Backdrop */}
              <div
                className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-2xs sm:hidden"
                onClick={() => setOpenMsgMenuId(null)}
              />

              <div
                className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 p-1 sm:p-0 sm:w-32 sm:fixed-none sm:translate-x-0 sm:translate-y-0 sm:absolute sm:top-full sm:mt-1 bg-white dark:bg-slate-900 border border-outline-variant/60 rounded-2xl sm:rounded-xl shadow-2xl py-1 z-50 space-y-0.5 opacity-100 animate-in zoom-in-95 sm:animate-in sm:fade-in duration-100 ${
                  isMe ? 'sm:right-0 sm:left-auto' : 'sm:left-0 sm:right-auto'
                }`}
              >
                <button
                  onClick={() => {
                    setReplyingToMsg(msg);
                    setOpenMsgMenuId(null);
                  }}
                  className="w-full px-3.5 py-2 sm:px-3 sm:py-1.5 text-left text-xs font-semibold text-on-surface hover:bg-surface-container-low rounded-xl sm:rounded-none flex items-center gap-2.5 sm:gap-2 transition-colors"
                >
                  <Reply className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-primary" />
                  <span>Reply</span>
                </button>

                <button
                  onClick={() => {
                    setForwardingMsg(msg);
                    setOpenMsgMenuId(null);
                  }}
                  className="w-full px-3.5 py-2 sm:px-3 sm:py-1.5 text-left text-xs font-semibold text-on-surface hover:bg-surface-container-low rounded-xl sm:rounded-none flex items-center gap-2.5 sm:gap-2 transition-colors"
                >
                  <Forward className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-purple-600" />
                  <span>Forward</span>
                </button>

                {isMe && (
                  <button
                    onClick={() => handleStartEditMsg(msg)}
                    className="w-full px-3.5 py-2 sm:px-3 sm:py-1.5 text-left text-xs font-semibold text-on-surface hover:bg-surface-container-low rounded-xl sm:rounded-none flex items-center gap-2.5 sm:gap-2 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-outline" />
                    <span>Edit</span>
                  </button>
                )}

                <button
                  onClick={() => handleDeleteMsg(msg.id)}
                  className="w-full px-3.5 py-2 sm:px-3 sm:py-1.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-500/10 rounded-xl sm:rounded-none flex items-center gap-2.5 sm:gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-rose-600" />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
