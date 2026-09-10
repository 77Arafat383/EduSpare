'use client';

import dynamic from 'next/dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { useEduSpare } from '@/context/EduSpareContext';
import { User, MessageItem } from '@/types/eduspare';
import { Send, ShieldAlert, Reply, X } from 'lucide-react';
import { ChatSidebar } from './ChatSidebar';
import { ChatHeader } from './ChatHeader';
import { ChatMessageItem } from './ChatMessageItem';
const ForwardMessageModal = dynamic(() => import('./ForwardMessageModal').then((m) => m.ForwardMessageModal), { ssr: false });

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
    setSelectedBlogId,
    blogs,
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

  // Default select first contact at top of list if none selected ONLY on desktop screens (window width >= 768)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      if (!activeChatUser && filteredContacts.length > 0) {
        setActiveChatUser(filteredContacts[0]);
      }
    }
  }, [filteredContacts, activeChatUser, setActiveChatUser]);

  // Periodically poll messages for active chat
  useEffect(() => {
    if (activeChatUser) {
      userScrolledUpRef.current = false;
      fetchMessages(activeChatUser.id);

      // Poll the open thread only while the tab is visible (responses are ETag'd,
      // so an unchanged thread costs a body-less 304).
      const interval = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
        fetchMessages(activeChatUser.id);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeChatUser]);

  // Scroll listener to detect if user manually scrolled up
  const handleScroll = () => {
    if (!chatFeedRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatFeedRef.current;
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
      finalContent = `Replying to "${replyingToMsg.content}"\n\n${finalContent}`;
    }

    await sendMessage(activeChatUser.id, finalContent);
    setInputMessage('');
    setReplyingToMsg(null);

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
      await sendMessage(targetUser.id, `↪️ Forwarded:\n${forwardingMsg.content}`);
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

  const unreadUsersCount = Object.values(recentConversations).filter(
    (c) => c && c.unseenCount > 0
  ).length;

  return (
    <div className="h-[calc(100vh-9.5rem)] md:h-[calc(100vh-8rem)] flex rounded-3xl border border-outline-variant/60 bg-surface-lowest shadow-sm overflow-hidden">
      {/* Left Sidebar Contact List */}
      <ChatSidebar
        filteredContacts={filteredContacts}
        activeChatUser={activeChatUser}
        recentConversations={recentConversations}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setActiveChatUser={setActiveChatUser}
        unreadUsersCount={unreadUsersCount}
        formatRelativeTime={formatRelativeTime}
      />

      {/* Right Main Chat Container */}
      {activeChatUser ? (
        <div className="fixed inset-0 z-50 md:static md:inset-auto md:z-auto flex-1 flex flex-col bg-surface-lowest w-full h-full md:h-auto animate-in fade-in duration-150">
          {/* Active Contact Header */}
          <ChatHeader
            activeChatUser={activeChatUser}
            setActiveChatUser={setActiveChatUser}
            handleVisitProfile={handleVisitProfile}
            isChatBlocked={isChatBlocked}
            toggleBlockUser={toggleBlockUser}
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={setIsMenuOpen}
            menuRef={menuRef}
          />

          {/* Messages Feed with Scroll Listener */}
          <div
            ref={chatFeedRef}
            onScroll={handleScroll}
            className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4"
          >
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-outline font-medium">
                No messages yet. Say hello to {activeChatUser.name}!
              </div>
            ) : (
              messages.map((msg) => (
                <ChatMessageItem
                  key={msg.id}
                  msg={msg}
                  currentUser={currentUser}
                  activeChatUser={activeChatUser}
                  blogs={blogs}
                  openMsgMenuId={openMsgMenuId}
                  setOpenMsgMenuId={setOpenMsgMenuId}
                  editingMsgId={editingMsgId}
                  editMsgText={editMsgText}
                  setEditMsgText={setEditMsgText}
                  handleStartEditMsg={handleStartEditMsg}
                  handleSaveEditMsg={handleSaveEditMsg}
                  handleDeleteMsg={handleDeleteMsg}
                  setReplyingToMsg={setReplyingToMsg}
                  setForwardingMsg={setForwardingMsg}
                  handleVisitProfile={handleVisitProfile}
                  setSelectedBlogId={setSelectedBlogId}
                  setActiveTab={setActiveTab}
                />
              ))
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
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-normal bg-surface-container-low text-on-surface rounded-full border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/60 font-sans"
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
      <ForwardMessageModal
        forwardingMsg={forwardingMsg}
        setForwardingMsg={setForwardingMsg}
        allUsers={allUsers}
        currentUser={currentUser}
        forwardSelectedUsers={forwardSelectedUsers}
        setForwardSelectedUsers={setForwardSelectedUsers}
        forwardSearch={forwardSearch}
        setForwardSearch={setForwardSearch}
        forwardSubmitting={forwardSubmitting}
        handleForwardMsgSubmit={handleForwardMsgSubmit}
        toggleForwardUserSelect={toggleForwardUserSelect}
      />
      )}
    </div>
  );
};
