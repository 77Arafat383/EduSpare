'use client';

import React, { useState, useEffect } from 'react';
import { CommentItem } from '@/types/eduspare';
import { useEduSpare } from '@/context/EduSpareContext';
import { Send, Edit2, Trash2, Check, X, MoreHorizontal, Heart, Reply } from 'lucide-react';

interface CommentSectionProps {
  blogId: string;
  blogAuthorId?: string;
  comments: CommentItem[];
}

export const CommentSection: React.FC<CommentSectionProps> = ({ blogId, blogAuthorId, comments }) => {
  const {
    currentUser,
    addComment,
    updateComment,
    deleteComment,
    toggleLikeComment,
    setSelectedUsername,
    setActiveTab,
  } = useEduSpare();

  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Comment State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editingSubmitting, setEditingSubmitting] = useState(false);

  // Reply State
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Dropdown Menu State
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && !(event.target as HTMLElement).closest('.comment-menu-container')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const handleProfileClick = (username: string) => {
    setSelectedUsername(username);
    setActiveTab('profile');
  };

  const handleSubmitNewComment = async (e: React.FormEvent) => {
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

  const handleStartReply = (comment: CommentItem) => {
    setReplyingCommentId(comment.id);
    setReplyText(`@${comment.author.username} `);
  };

  const handleCancelReply = () => {
    setReplyingCommentId(null);
    setReplyText('');
  };

  const handleSubmitReply = async (parentCommentId: string) => {
    if (!replyText.trim() || !currentUser) return;
    setReplySubmitting(true);
    await addComment(blogId, replyText, parentCommentId);
    setReplyingCommentId(null);
    setReplyText('');
    setReplySubmitting(false);
  };

  const renderCommentCard = (comment: CommentItem, isReply = false) => {
    const isCommentAuthor =
      currentUser && (currentUser.id === comment.authorId || currentUser.id === comment.author?.id);
    const isBlogAuthor = currentUser && blogAuthorId && currentUser.id === blogAuthorId;
    const canDelete = isCommentAuthor || isBlogAuthor;
    const canEdit = isCommentAuthor;
    const isEditing = editingCommentId === comment.id;
    const isReplying = replyingCommentId === comment.id;

    return (
      <div key={comment.id} className="space-y-2">
        <div className="flex items-start gap-2.5 text-xs group">
          <img
            src={comment.author.avatar}
            alt={comment.author.name}
            onClick={() => handleProfileClick(comment.author.username)}
            className={`${
              isReply ? 'w-6 h-6' : 'w-7 h-7'
            } rounded-full object-cover shrink-0 mt-0.5 cursor-pointer hover:ring-2 hover:ring-primary transition-all`}
          />
          <div className="bg-surface-container-low p-3 rounded-2xl flex-1 border border-outline-variant/30 space-y-1.5">
            {/* Header with name, timestamp & 3-dot dropdown menu at top-right corner */}
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

              {/* 3-dot Menu Section (Top Right Corner of Comment Card) */}
              {!isEditing && (canEdit || canDelete) && (
                <div className="relative comment-menu-container">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === comment.id ? null : comment.id)}
                    className="p-1 text-outline hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
                    title="More options"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>

                  {openMenuId === comment.id && (
                    <div className="absolute right-0 top-full mt-1 w-28 bg-surface-container-high border border-outline-variant/50 rounded-xl shadow-lg py-1 z-20 space-y-0.5">
                      {canEdit && (
                        <button
                          onClick={() => {
                            handleStartEdit(comment);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs text-on-surface hover:bg-surface-container-highest flex items-center gap-2 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-outline" />
                          <span>Edit</span>
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => {
                            handleDelete(comment.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comment Body / Inline Edit Form */}
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

            {/* Comment Actions Footer: Reaction/Like & Reply */}
            {!isEditing && (
              <div className="flex items-center gap-4 pt-1 text-[11px]">
                <button
                  onClick={() => toggleLikeComment(blogId, comment.id)}
                  className={`flex items-center gap-1 font-semibold transition-colors ${
                    comment.isLikedByMe
                      ? 'text-rose-500 hover:text-rose-600'
                      : 'text-outline hover:text-on-surface'
                  }`}
                  title="React to comment"
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      comment.isLikedByMe ? 'fill-rose-500 text-rose-500' : ''
                    }`}
                  />
                  <span>{comment.likesCount && comment.likesCount > 0 ? comment.likesCount : 'Like'}</span>
                </button>

                {currentUser && (
                  <button
                    onClick={() => (isReplying ? handleCancelReply() : handleStartReply(comment))}
                    className="flex items-center gap-1 font-semibold text-outline hover:text-primary transition-colors"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reply Input Form */}
        {isReplying && (
          <div className="pl-9 pt-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 px-3 py-1.5 text-xs bg-surface-container text-on-surface rounded-xl border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <button
                onClick={() => handleSubmitReply(comment.parentId || comment.id)}
                disabled={replySubmitting || !replyText.trim()}
                className="px-3 py-1.5 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-primary-container disabled:opacity-40 transition-colors"
              >
                Reply
              </button>
              <button
                onClick={handleCancelReply}
                className="p-1.5 text-outline hover:bg-surface-container rounded-xl transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Render Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="pl-6 border-l-2 border-outline-variant/30 space-y-2 mt-2">
            {comment.replies.map((reply) => renderCommentCard(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pt-4 border-t border-outline-variant/40 space-y-4">
      {/* Input box with current user profile avatar */}
      {currentUser && (
        <form onSubmit={handleSubmitNewComment} className="flex items-center gap-3">
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

      {/* List of top-level comments and nested replies */}
      <div className="space-y-4">
        {comments.map((comment) => renderCommentCard(comment, false))}
      </div>
    </div>
  );
};
