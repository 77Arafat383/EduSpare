'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEduSpare } from '@/context/EduSpareContext';
import { User, MessageItem, isUserActive } from '@/types/eduspare';
import {
  MessageSquare,
  Send,
  User as UserIcon,
  ShieldAlert,
  ShieldCheck,
  Search,
  Check,
  CheckCheck,
  MoreVertical,
  Reply,
  Forward,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export const ChatView: React.FC = () => {
  const {
    currentUser,
    allUsers,
    messages,
    recentConversations,
    activeChatUser,
    setActiveChatUser,
    isChatBlocked,
    fetchConversations,
    fetchMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleBlockUser,
    setSelectedUsername,
    setActiveTab,
  } = useEduSpare();

  const [inputMessage, setInputMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Message Menu & Action States
  const [openMsgMenuId, setOpenMsgMenuId] = useState<string | null>(null);
  const [replyingToMsg, setReplyingToMsg] = useState<MessageItem | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editMsgText, setEditMsgText] = useState('');

  // Forward Modal State
  const [forwardingMsg, setForwardingMsg] = useState<MessageItem | null>(null);
  const [forwardSelectedUsers, setForwardSelectedUsers] = useState<User[]>([]);
  const [forwardSearch, setForwardSearch] = useState('');
  const [forwardSubmitting, setForwardSubmitting] = useState(false);

  // Refs for Chat Auto-Scroll Stability
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatFeedRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close header 3-dots menu & message 3-dots menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (openMsgMenuId && !(event.target as HTMLElement).closest('.chat-msg-menu-container')) {
        setOpenMsgMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMsgMenuId]);

  // Fetch user conversations on mount / user change
  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser]);

  // Available users to chat with, sorted by latest conversation timestamp descending
  const chatContacts = [...allUsers]
    .filter((u) => u.id !== currentUser?.id)
    .sort((a, b) => {
      const convA = recentConversations[a.id];
      const convB = recentConversations[b.id];
      const timeA = convA ? new Date(convA.lastMessageAt).getTime() : 0;
      const timeB = convB ? new Date(convB.lastMessageAt).getTime() : 0;

      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return a.name.localeCompare(b.name);
    });

  const filteredContacts = chatContacts.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return u.name.toLowerCase().includes(term) || u.username.toLowerCase().includes(term);
  });

  // Default select first contact at top of list if none selected
  useEffect(() => {
    if (!activeChatUser && filteredContacts.length > 0) {
      setActiveChatUser(filteredContacts[0]);
    }
  }, [filteredContacts, activeChatUser, setActiveChatUser]);

  // Periodically poll messages for active chat
  useEffect(() => {
    if (activeChatUser) {
      // Reset scrolled up state when switching contacts
      userScrolledUpRef.current = false;
      fetchMessages(activeChatUser.id);

      const interval = setInterval(() => {
        fetchMessages(activeChatUser.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeChatUser]);

  // Scroll listener to detect if user manually scrolled up
  const handleScroll = () => {
    if (!chatFeedRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatFeedRef.current;
    // Consider at bottom if within 80px of bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 80;
    userScrolledUpRef.current = !isAtBottom;
  };

  // Auto scroll to bottom only when user has NOT manually scrolled up
  useEffect(() => {
    if (!userScrolledUpRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChatUser) return;

    let finalContent = inputMessage.trim();
    if (replyingToMsg) {
      const senderName =
        replyingToMsg.sender?.name ||
        (replyingToMsg.senderId === currentUser?.id ? 'Yourself' : activeChatUser.name);
      finalContent = `> 💬 **Replying to ${senderName}**: "${replyingToMsg.content}"\n\n${finalContent}`;
    }

    await sendMessage(activeChatUser.id, finalContent);
    setInputMessage('');
    setReplyingToMsg(null);

    // Force scroll to bottom when user sends a message
    userScrolledUpRef.current = false;
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleStartEditMsg = (msg: MessageItem) => {
    setEditingMsgId(msg.id);
    setEditMsgText(msg.content);
    setOpenMsgMenuId(null);
  };

  const handleSaveEditMsg = async (msgId: string) => {
    if (!editMsgText.trim() || !activeChatUser) return;
    await editMessage(msgId, editMsgText, activeChatUser.id);
    setEditingMsgId(null);
    setEditMsgText('');
  };

  const handleDeleteMsg = async (msgId: string) => {
    if (!activeChatUser) return;
    if (!confirm('Are you sure you want to delete this message?')) return;
    await deleteMessage(msgId, activeChatUser.id);
    setOpenMsgMenuId(null);
  };

  const handleForwardMsgSubmit = async () => {
    if (!forwardingMsg || forwardSelectedUsers.length === 0) return;
    setForwardSubmitting(true);
    for (const targetUser of forwardSelectedUsers) {
      await sendMessage(targetUser.id, `↪️ **Forwarded message**:\n${forwardingMsg.content}`);
    }
    setForwardSubmitting(false);
    setForwardingMsg(null);
    setForwardSelectedUsers([]);
  };

  const toggleForwardUserSelect = (user: User) => {
    if (forwardSelectedUsers.some((u) => u.id === user.id)) {
      setForwardSelectedUsers(forwardSelectedUsers.filter((u) => u.id !== user.id));
    } else {
      setForwardSelectedUsers([...forwardSelectedUsers, user]);
    }
  };

  const handleVisitProfile = (user: User) => {
    setSelectedUsername(user.username);
    setActiveTab('profile');
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-3xl border border-outline-variant/60 bg-surface-lowest shadow-sm overflow-hidden">
      {/* Left Sidebar - Chat List */}
      <div className="w-80 border-r border-outline-variant/40 flex flex-col bg-surface-container-lowest">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-outline-variant/40 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> Messages
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
                    <img
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

      {/* Right Main Chat Container */}
      {activeChatUser ? (
        <div className="flex-1 flex flex-col bg-surface-lowest">
          {/* Active Contact Header */}
          <div className="p-4 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-lowest">
            <div className="flex items-center gap-3">
              <div
                onClick={() => handleVisitProfile(activeChatUser)}
                className="relative cursor-pointer group shrink-0"
              >
                <img
                  src={activeChatUser.avatar}
                  alt={activeChatUser.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary transition-all"
                />
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface-lowest ${
                    isUserActive(activeChatUser.lastActiveAt) ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
              </div>

              <div>
                <h3
                  onClick={() => handleVisitProfile(activeChatUser)}
                  className="font-bold text-sm text-on-surface hover:text-primary cursor-pointer transition-colors"
                >
                  {activeChatUser.name}
                </h3>
                <p className="text-[11px] text-outline font-medium">
                  {isUserActive(activeChatUser.lastActiveAt) ? (
                    <span className="text-emerald-600 font-bold">● Active Now</span>
                  ) : (
                    `@${activeChatUser.username}`
                  )}
                </p>
              </div>
            </div>

            {/* Header 3-Dots Dropdown Options (Solid Opaque White Background) */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-outline hover:text-on-surface rounded-xl hover:bg-surface-container transition-colors"
                title="Options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-900 border border-outline-variant/60 rounded-2xl shadow-2xl py-1 z-50 space-y-0.5 animate-in fade-in duration-100 opacity-100">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleVisitProfile(activeChatUser);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-on-surface hover:bg-surface-container-low flex items-center gap-2 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-outline" />
                    View Profile
                  </button>

                  <button
                    onClick={async () => {
                      setIsMenuOpen(false);
                      await toggleBlockUser(activeChatUser.id);
                    }}
                    className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2 transition-colors ${
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

          {/* Messages Feed with Scroll Listener */}
          <div
            ref={chatFeedRef}
            onScroll={handleScroll}
            className="flex-1 p-6 overflow-y-auto space-y-4"
          >
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-outline font-medium">
                No messages yet. Say hello to {activeChatUser.name}!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUser?.id;
                const isEditing = editingMsgId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 group ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <img
                        src={msg.sender?.avatar || activeChatUser.avatar}
                        alt="Avatar"
                        onClick={() => handleVisitProfile(activeChatUser)}
                        className="w-7 h-7 rounded-full object-cover shrink-0 cursor-pointer mt-1"
                      />
                    )}

                    {/* Container wrapping Message Card & 3-Dot Button Outside Top Right */}
                    <div className={`relative flex items-start gap-1 max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Message Bubble Card */}
                      <div
                        className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                          isMe
                            ? 'bg-primary text-white rounded-tr-none shadow-sm'
                            : 'bg-surface-container-high text-on-surface rounded-tl-none border border-outline-variant/40'
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-2 pt-0.5">
                            <textarea
                              rows={2}
                              value={editMsgText}
                              onChange={(e) => setEditMsgText(e.target.value)}
                              className="w-full p-2 text-xs bg-surface-container text-on-surface rounded-xl border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setEditingMsgId(null)}
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
                          <p className="leading-relaxed whitespace-pre-line font-medium">
                            {msg.content}
                          </p>
                        )}

                        <div
                          className={`text-[10px] text-right flex items-center justify-end gap-1 ${
                            isMe ? 'text-white/70' : 'text-outline'
                          }`}
                        >
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isMe &&
                            (msg.isSeen ? (
                              <span title="Delivered & Seen">
                                <CheckCheck className="w-3.5 h-3.5 text-sky-200" />
                              </span>
                            ) : (
                              <span title="Delivered / Unseen">
                                <Check className="w-3 h-3 text-white/70" />
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

                        {/* Dropdown Menu (Solid Opaque White Background) */}
                        {openMsgMenuId === msg.id && (
                          <div
                            className={`absolute top-full mt-1 w-32 bg-white dark:bg-slate-900 border border-outline-variant/60 rounded-xl shadow-2xl py-1 z-50 space-y-0.5 opacity-100 ${
                              isMe ? 'right-0' : 'left-0'
                            }`}
                          >
                            <button
                              onClick={() => {
                                setReplyingToMsg(msg);
                                setOpenMsgMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-xs font-medium text-on-surface hover:bg-surface-container-low flex items-center gap-2 transition-colors"
                            >
                              <Reply className="w-3.5 h-3.5 text-primary" />
                              <span>Reply</span>
                            </button>

                            <button
                              onClick={() => {
                                setForwardingMsg(msg);
                                setOpenMsgMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left text-xs font-medium text-on-surface hover:bg-surface-container-low flex items-center gap-2 transition-colors"
                            >
                              <Forward className="w-3.5 h-3.5 text-purple-600" />
                              <span>Forward</span>
                            </button>

                            {isMe && (
                              <button
                                onClick={() => handleStartEditMsg(msg)}
                                className="w-full px-3 py-1.5 text-left text-xs font-medium text-on-surface hover:bg-surface-container-low flex items-center gap-2 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-outline" />
                                <span>Edit</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteMsg(msg.id)}
                              className="w-full px-3 py-1.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Preview Banner */}
          {replyingToMsg && (
            <div className="px-4 py-2 bg-primary/10 border-t border-primary/20 flex items-center justify-between text-xs text-on-surface">
              <div className="flex items-center gap-2 min-w-0">
                <Reply className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-primary block">
                    Replying to{' '}
                    {replyingToMsg.sender?.name ||
                      (replyingToMsg.senderId === currentUser?.id ? 'Yourself' : activeChatUser.name)}
                  </span>
                  <span className="text-[11px] text-outline truncate block">
                    {replyingToMsg.content}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setReplyingToMsg(null)}
                className="p-1 text-outline hover:text-on-surface rounded-full shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Bar or Blocked Notice */}
          {isChatBlocked ? (
            <div className="p-4 bg-rose-500/10 border-t border-rose-500/20 text-center text-xs text-rose-700 font-bold flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Messaging is disabled because this user is blocked.
            </div>
          ) : (
            <form onSubmit={handleSend} className="p-4 border-t border-outline-variant/40 flex items-center gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Message ${activeChatUser.name}...`}
                className="flex-1 px-4 py-2.5 text-xs bg-surface-container-low text-on-surface rounded-full border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-2.5 bg-primary text-white rounded-full hover:bg-primary-container disabled:opacity-40 transition-colors shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-outline">
          Select a contact to start chatting.
        </div>
      )}

      {/* Forward Message Modal */}
      {forwardingMsg && (
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
      )}
    </div>
  );
};
