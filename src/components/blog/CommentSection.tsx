'use client';

import React, { useState } from 'react';
import { CommentItem } from '@/types/eduspare';
import { useEduSpare } from '@/context/EduSpareContext';
import { Send, Edit2, Trash2, Check, X } from 'lucide-react';

interface CommentSectionProps {
  blogId: string;
  blogAuthorId?: string;
  comments: CommentItem[];
}

export const CommentSection: React.FC<CommentSectionProps> = ({ blogId, blogAuthorId, comments }) => {
  const { currentUser, addComment, updateComment, deleteComment, setSelectedUsername, setActiveTab } = useEduSpare();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Comment State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editingSubmitting, setEditingSubmitting] = useState(false);

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

  const handleStartEdit = (comment: CommentItem) => {
    setEditingCommentId(comment.id);
    setEditText(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim() || !currentUser) return;
    setEditingSubmitting(true);
    await updateComment(blogId, commentId, editText);
    setEditingCommentId(null);
    setEditText('');
    setEditingSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    await deleteComment(blogId, commentId);
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
        {comments.map((comment) => {
          const isCommentAuthor =
            currentUser && (currentUser.id === comment.authorId || currentUser.id === comment.author?.id);
          const isBlogAuthor = currentUser && blogAuthorId && currentUser.id === blogAuthorId;
          const canDelete = isCommentAuthor || isBlogAuthor;
          const canEdit = isCommentAuthor;
          const isEditing = editingCommentId === comment.id;

          return (
            <div key={comment.id} className="flex items-start gap-3 text-xs group">
              <img
                src={comment.author.avatar}
                alt={comment.author.name}
                onClick={() => handleProfileClick(comment.author.username)}
                className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              />
              <div className="bg-surface-container-low p-3 rounded-2xl flex-1 border border-outline-variant/30 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
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

                  {/* Comment Actions (Edit & Delete) */}
                  {!isEditing && (canEdit || canDelete) && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canEdit && (
                        <button
                          onClick={() => handleStartEdit(comment)}
                          className="p-1 text-outline hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                          title="Edit Comment"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="p-1 text-outline hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete Comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Comment Content / Inline Edit Form */}
                {isEditing ? (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 px-3 py-1 text-xs bg-surface-container text-on-surface rounded-xl border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={() => handleSaveEdit(comment.id)}
                      disabled={editingSubmitting || !editText.trim()}
                      className="p-1 text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-40"
                      title="Save"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-outline hover:bg-surface-container rounded-lg transition-colors"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-on-surface-variant leading-relaxed font-medium">
                    {comment.content}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
