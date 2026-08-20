'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEduSpare } from '@/context/EduSpareContext';
import { User } from '@/types/eduspare';
import {
  MessageSquare,
  Send,
  User as UserIcon,
  ShieldAlert,
  ShieldCheck,
  Search,
  CheckCheck,
} from 'lucide-react';

export const ChatView: React.FC = () => {
  const {
    currentUser,
    allUsers,
    messages,
    activeChatUser,
    setActiveChatUser,
    isChatBlocked,
    fetchMessages,
    sendMessage,
    toggleBlockUser,
    setSelectedUsername,
    setActiveTab,
  } = useEduSpare();

  const [inputMessage, setInputMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Available users to chat with (excluding current user)
  const chatContacts = allUsers.filter((u) => u.id !== currentUser?.id);

  const filteredContacts = chatContacts.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return u.name.toLowerCase().includes(term) || u.username.toLowerCase().includes(term);
  });

  // Default select first contact if none selected
  useEffect(() => {
    if (!activeChatUser && filteredContacts.length > 0) {
      setActiveChatUser(filteredContacts[0]);
    }
  }, [filteredContacts, activeChatUser]);

  // Fetch message thread when activeChatUser changes
  useEffect(() => {
    if (activeChatUser && currentUser) {
      fetchMessages(activeChatUser.id);
    }
  }, [activeChatUser, currentUser]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChatUser || isChatBlocked) return;
    const msg = inputMessage;
    setInputMessage('');
    await sendMessage(activeChatUser.id, msg);
  };

  const handleVisitProfile = (user: User) => {
    setSelectedUsername(user.username);
    setActiveTab('profile');
  };

  return (
    <div className="bg-surface-lowest rounded-3xl border border-outline-variant/60 shadow-sm overflow-hidden flex h-[calc(100vh-8rem)]">
      {/* Left Contacts Sidebar */}
      <div className="w-80 border-r border-outline-variant/50 flex flex-col bg-surface">
        <div className="p-4 border-b border-outline-variant/40 space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-base text-on-surface">Conversations</h3>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search chat contacts..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-on-surface"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/30 p-2 space-y-1">
          {filteredContacts.map((contact) => {
            const isSelected = activeChatUser?.id === contact.id;
            return (
              <div
                key={contact.id}
                onClick={() => setActiveChatUser(contact)}
                className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-primary text-white shadow-md'
                    : 'hover:bg-surface-container-high text-on-surface'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div className="min-w-0">
                    <h4
                      className={`text-xs font-bold truncate ${
                        isSelected ? 'text-white' : 'text-on-surface'
                      }`}
                    >
                      {contact.name}
                    </h4>
                    <p
                      className={`text-[11px] truncate ${
                        isSelected ? 'text-white/80' : 'text-outline'
                      }`}
                    >
                      @{contact.username} • {contact.university || 'Scholar'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Chat Thread Panel */}
      {activeChatUser ? (
        <div className="flex-1 flex flex-col bg-surface-lowest">
          {/* Chat Window Header */}
          <div className="p-4 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-low/50">
            <div className="flex items-center gap-3">
              <img
                src={activeChatUser.avatar}
                alt={activeChatUser.name}
                onClick={() => handleVisitProfile(activeChatUser)}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20 cursor-pointer hover:scale-105 transition-transform"
                title="Click to visit profile"
              />
              <div>
                <h3
                  onClick={() => handleVisitProfile(activeChatUser)}
                  className="font-bold text-sm text-on-surface hover:text-primary cursor-pointer transition-colors"
                >
                  {activeChatUser.name}
                </h3>
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Now
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleVisitProfile(activeChatUser)}
                className="px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-xl transition-colors flex items-center gap-1.5"
              >
                <UserIcon className="w-3.5 h-3.5" /> Profile
              </button>

              <button
                onClick={() => toggleBlockUser(activeChatUser.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
                  isChatBlocked
                    ? 'bg-rose-500 text-white'
                    : 'bg-surface-variant text-on-surface-variant hover:bg-rose-500/10 hover:text-rose-600'
                }`}
              >
                {isChatBlocked ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" /> Unblock
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" /> Block User
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-outline font-medium">
                No messages yet. Say hello to {activeChatUser.name}!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUser?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <img
                        src={msg.sender?.avatar || activeChatUser.avatar}
                        alt="Avatar"
                        onClick={() => handleVisitProfile(activeChatUser)}
                        className="w-7 h-7 rounded-full object-cover shrink-0 cursor-pointer"
                      />
                    )}

                    <div
                      className={`max-w-[70%] p-3.5 rounded-2xl text-xs space-y-1 ${
                        isMe
                          ? 'bg-primary text-white rounded-br-none shadow-sm'
                          : 'bg-surface-container-high text-on-surface rounded-bl-none border border-outline-variant/40'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-line font-medium">
                        {msg.content}
                      </p>
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
                        {isMe && <CheckCheck className="w-3 h-3 text-white/90" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

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
    </div>
  );
};
