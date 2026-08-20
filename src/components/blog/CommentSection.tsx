'use client';

import React, { useState } from 'react';
import { CommentItem } from '@/types/eduspare';
import { useEduSpare } from '@/context/EduSpareContext';
import { Send } from 'lucide-react';

interface CommentSectionProps {
  blogId: string;
  comments: CommentItem[];
}

export const CommentSection: React.FC<CommentSectionProps> = ({ blogId, comments }) => {
  const { currentUser, addComment, setSelectedUsername, setActiveTab } = useEduSpare();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleProfileClick = (username: string) => {
    setSelectedUsername(username);
    setActiveTab('profile');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;
    setSubmitting(true);
    await addComment(blogId, newComment);
    setNewComment('');
    setSubmitting(false);
  };

  return (
    <div className="pt-4 border-t border-outline-variant/40 space-y-4">
      {/* Input box with current user profile avatar */}
      {currentUser && (
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-primary/20"
          />
          <div className="flex-1 relative">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full pl-4 pr-10 py-2 text-xs bg-surface-container-low text-on-surface rounded-full border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-primary hover:text-primary-container disabled:opacity-30 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* List of comments displaying author profile icon alongside comments */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex items-start gap-3 text-xs group">
            <img
              src={comment.author.avatar}
              alt={comment.author.name}
              onClick={() => handleProfileClick(comment.author.username)}
              className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            />
            <div className="bg-surface-container-low p-3 rounded-2xl flex-1 border border-outline-variant/30 space-y-1">
              <div className="flex items-center justify-between">
                <span
                  onClick={() => handleProfileClick(comment.author.username)}
                  className="font-bold text-on-surface hover:text-primary cursor-pointer transition-colors"
                >
                  {comment.author.name}
                </span>
                <span className="text-[10px] text-outline">
                  {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-on-surface-variant leading-relaxed font-medium">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
