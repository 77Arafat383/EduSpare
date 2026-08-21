'use client';

import React, { useState } from 'react';
import { BlogPost, User } from '@/types/eduspare';
import { useEduSpare } from '@/context/EduSpareContext';
import { X, MessageSquare, Repeat, Link, Check, Send, Search, UserCheck } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: BlogPost;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, post }) => {
  const { currentUser, allUsers, sendMessage, createBlog, incrementShareCount } = useEduSpare();

  const [shareType, setShareType] = useState<'message' | 'blog'>('message');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const defaultBlogLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/blog?post=${post.id}`;
  const [messageText, setMessageText] = useState(
    `Check out this article: "${post.title}"\n${defaultBlogLink}`
  );
  const [thoughtsText, setThoughtsText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  if (!isOpen) return null;

  // Filter users for direct message selection
  const availableUsers = allUsers.filter(
    (u) =>
      u.id !== currentUser?.id &&
      (u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.username.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const toggleSelectUser = (user: User) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleSelectAllToggle = () => {
    if (selectedUsers.length === availableUsers.length && availableUsers.length > 0) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(availableUsers);
    }
  };

  const handleShareInMessage = async () => {
    if (selectedUsers.length === 0 || !currentUser || !messageText.trim()) return;
    setSubmitting(true);
    
    // Send message to each selected recipient
    for (const user of selectedUsers) {
      await sendMessage(user.id, messageText);
    }
    
    await incrementShareCount(post.id, selectedUsers.length);

    setSubmitting(false);
    const count = selectedUsers.length;
    setSuccessMessage(`Successfully sent message to ${count} recipient${count > 1 ? 's' : ''}!`);
    setTimeout(() => {
      setSuccessMessage('');
      onClose();
    }, 1500);
  };

  const handleShareAsBlog = async () => {
    if (!currentUser) return;
    setSubmitting(true);

    const originalAuthorCredit = `> 🔄 **Reshared from @${post.author.username} (${post.author.name})**`;
    const formattedContent = thoughtsText.trim()
      ? `${thoughtsText.trim()}\n\n---\n${originalAuthorCredit}\n\n${post.content}`
      : `${originalAuthorCredit}\n\n${post.content}`;

    await createBlog({
      title: post.title,
      content: formattedContent,
      coverImage: post.coverImage || null,
      tags: post.tags || [],
      attachments: post.attachments || [],
    });

    await incrementShareCount(post.id, 1);

    setSubmitting(false);
    setSuccessMessage('Successfully reshared to your blog feed with author credit!');
    setTimeout(() => {
      setSuccessMessage('');
      onClose();
    }, 1500);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/blog?post=${post.id}`;
    navigator.clipboard.writeText(link);
    incrementShareCount(post.id, 1);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-surface-lowest rounded-3xl shadow-2xl border border-outline-variant/80 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-on-surface">Share Post</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-outline hover:bg-surface-container-low hover:text-on-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Post Preview Card */}
        <div className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/50 flex items-center gap-3">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-primary/20"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-on-surface truncate">{post.author.name}</span>
              <span className="text-[10px] text-outline">@{post.author.username}</span>
            </div>
            <p className="text-xs font-semibold text-on-surface truncate mt-0.5">{post.title}</p>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab Buttons for Share Option 1 vs Share Option 2 */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container-low rounded-2xl border border-outline-variant/40">
          <button
            type="button"
            onClick={() => setShareType('message')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              shareType === 'message'
                ? 'bg-primary text-white shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Share in Message</span>
          </button>

          <button
            type="button"
            onClick={() => setShareType('blog')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              shareType === 'blog'
                ? 'bg-primary text-white shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <Repeat className="w-4 h-4" />
            <span>Share as Blog Post</span>
          </button>
        </div>

        {/* Tab Content 1: Share in Direct Message (Multi-Select Users) */}
        {shareType === 'message' && (
          <div className="space-y-4 pt-1">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Select Recipients ({selectedUsers.length} selected) *
                </label>
                {availableUsers.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllToggle}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    {selectedUsers.length === availableUsers.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              <div className="relative mb-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user by name or username..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-surface-container text-on-surface rounded-xl border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Multi-User Selection List */}
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 border border-outline-variant/40 rounded-xl p-1.5 bg-surface-container-low">
                {availableUsers.length > 0 ? (
                  availableUsers.map((u) => {
                    const isSelected = selectedUsers.some((selected) => selected.id === u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleSelectUser(u)}
                        className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-primary/10 border border-primary/40 text-primary font-bold'
                            : 'hover:bg-surface-container text-on-surface border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by div onClick
                            className="w-4 h-4 accent-primary rounded cursor-pointer shrink-0"
                          />
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-semibold truncate block">{u.name}</span>
                            <span className="text-[10px] text-outline truncate block">@{u.username}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10 shrink-0">
                            Selected
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-outline text-center py-4 italic">No users found.</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                Message Content
              </label>
              <textarea
                rows={2}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-surface-container text-on-surface text-xs border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary font-sans"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-xs font-semibold text-outline hover:text-primary flex items-center gap-1 transition-colors"
              >
                {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link className="w-3.5 h-3.5" />}
                <span>{linkCopied ? 'Link Copied!' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareInMessage}
                disabled={submitting || selectedUsers.length === 0}
                className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-container disabled:opacity-40 transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {selectedUsers.length > 0
                    ? `Send to ${selectedUsers.length} User${selectedUsers.length > 1 ? 's' : ''}`
                    : 'Send Message'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Content 2: Share as Blog Post */}
        {shareType === 'blog' && (
          <div className="space-y-4 pt-1">
            <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 text-xs space-y-1">
              <p className="font-bold text-primary flex items-center gap-1.5">
                <Repeat className="w-4 h-4" /> Reshare to Blog Feed
              </p>
              <p className="text-on-surface-variant text-[11px]">
                This will publish the post to your profile feed. Original author credit will be given to{' '}
                <span className="font-bold text-primary">@{post.author.username} ({post.author.name})</span>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                Add Your Thoughts (Optional)
              </label>
              <textarea
                rows={3}
                value={thoughtsText}
                onChange={(e) => setThoughtsText(e.target.value)}
                placeholder="Why are you sharing this post? Add your commentary or insights..."
                className="w-full p-3 rounded-xl bg-surface-container text-on-surface text-xs border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary font-sans leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-xs font-semibold text-outline hover:text-primary flex items-center gap-1 transition-colors"
              >
                {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link className="w-3.5 h-3.5" />}
                <span>{linkCopied ? 'Link Copied!' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareAsBlog}
                disabled={submitting}
                className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-container disabled:opacity-40 transition-colors flex items-center gap-1.5"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>Reshare Post</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
