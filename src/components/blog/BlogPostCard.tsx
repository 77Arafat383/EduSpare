'use client';

import React, { useState, useEffect } from 'react';
import { BlogPost } from '@/types/eduspare';
import { useEduSpare } from '@/context/EduSpareContext';
import { CommentSection } from './CommentSection';
import { CreateBlogModal } from './CreateBlogModal';
import { ShareModal } from './ShareModal';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  FileText,
  Download,
  Trash2,
  Edit2,
  MoreVertical,
  Check,
  Users,
} from 'lucide-react';

interface BlogPostCardProps {
  post: BlogPost;
}

export const BlogPostCard: React.FC<BlogPostCardProps> = ({ post }) => {
  const {
    currentUser,
    toggleLikeBlog,
    toggleSaveBlogOrItem,
    deleteBlog,
    setSelectedUsername,
    setActiveTab,
    selectedBlogId,
    communities,
    setSelectedCommunityId,
  } = useEduSpare();

  const isSelectedFromNotification = selectedBlogId === post.id;

  const [showComments, setShowComments] = useState(isSelectedFromNotification);
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const isAuthor = currentUser?.id === post.authorId;
  const targetCommunity = post.communityId ? communities.find((c) => c.id === post.communityId) : null;

  useEffect(() => {
    if (isSelectedFromNotification) {
      setShowComments(true);
    }
  }, [isSelectedFromNotification]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen && !(event.target as HTMLElement).closest('.post-menu-container')) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleProfileClick = () => {
    setSelectedUsername(post.author.username);
    setActiveTab('profile');
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleSave = () => {
    toggleSaveBlogOrItem({
      title: post.title,
      itemType: 'blog',
      itemId: post.id,
      url: `/blog?post=${post.id}`,
    });
  };

  return (
    <div
      className={`bg-surface-lowest rounded-3xl border ${
        isSelectedFromNotification
          ? 'border-primary ring-2 ring-primary/30 shadow-lg'
          : 'border-outline-variant/60 shadow-sm'
      } p-6 space-y-4 hover:shadow-md transition-all`}
    >
      {/* Post Author Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            onClick={handleProfileClick}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20 cursor-pointer hover:ring-primary transition-all"
          />
          <div>
            <div className="flex items-center gap-2">
              <span
                onClick={handleProfileClick}
                className="font-bold text-sm text-on-surface hover:text-primary cursor-pointer transition-colors"
              >
                {post.author.name}
              </span>
              <span className="text-xs text-outline font-medium">@{post.author.username}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[11px] text-outline font-medium">
                {new Date(post.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              {targetCommunity && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCommunityId(targetCommunity.id);
                    setActiveTab('communities');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 border border-purple-500/20 text-[10px] font-bold cursor-pointer transition-all"
                  title={`Click to open ${targetCommunity.name} community`}
                >
                  <Users className="w-3 h-3 text-purple-600" />
                  <span>{targetCommunity.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3-Dot Vertically Menu (Top Right Corner of Post Card) */}
        {isAuthor && (
          <div className="relative post-menu-container">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-outline hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-surface-container-high border border-outline-variant/50 rounded-xl shadow-lg py-1 z-20 space-y-0.5">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsEditModalOpen(true);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-on-surface hover:bg-surface-container-highest flex items-center gap-2 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-outline" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (confirm('Are you sure you want to delete this blog post?')) {
                      deleteBlog(post.id);
                    }
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Title & Body Content */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-on-surface leading-snug">{post.title}</h3>
        <MarkdownRenderer content={post.content} />
      </div>

      {/* Cover Image if present */}
      {post.coverImage && (
        <div className="relative rounded-2xl overflow-hidden max-h-80 border border-outline-variant/40">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          <button
            onClick={() =>
              toggleSaveBlogOrItem({
                title: `${post.title} Image`,
                itemType: 'image',
                url: post.coverImage || undefined,
              })
            }
            className="absolute top-3 right-3 p-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-xl backdrop-blur-sm text-xs font-bold flex items-center gap-1.5 shadow-md"
          >
            <Bookmark className="w-3.5 h-3.5" /> Save Image
          </button>
        </div>
      )}

      {/* Downloadable PDF / Document Attachments */}
      {post.attachments && post.attachments.length > 0 && (
        <div className="space-y-2 pt-2">
          {post.attachments.map((att) => (
            <div
              key={att.id}
              className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-on-surface truncate">{att.name}</div>
                  <div className="text-[10px] text-outline">{att.size || 'Attachment file'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    toggleSaveBlogOrItem({
                      title: att.name,
                      itemType: 'pdf',
                      url: att.url,
                    })
                  }
                  className="px-2.5 py-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-lg transition-colors flex items-center gap-1"
                >
                  <Bookmark className="w-3.5 h-3.5" /> Save PDF
                </button>
                <a
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-outline hover:text-on-surface rounded-lg"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tags Bar */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-semibold text-primary px-2.5 py-0.5 rounded-full bg-primary/10"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Reactions & Comments Stats */}
      <div className="flex items-center justify-between text-xs text-outline pt-2 border-t border-outline-variant/30 font-medium">
        <div className="flex items-center gap-1 text-rose-600 font-bold">
          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
          <span>{post.likesCount || 0} Reactions</span>
        </div>

        <div className="flex items-center gap-4">
          <span
            onClick={() => setShowComments(!showComments)}
            className="hover:text-on-surface cursor-pointer"
          >
            {post.comments?.length || 0} Comments
          </span>
          <span onClick={handleShare} className="hover:text-on-surface cursor-pointer">
            {post.sharesCount || 0} {post.sharesCount === 1 ? 'Share' : 'Shares'}
          </span>
        </div>
      </div>

      {/* Interactive Action Bar (Facebook Post Style) */}
      <div className="grid grid-cols-4 gap-1 pt-1 border-t border-outline-variant/30 text-xs font-bold text-outline">
        <button
          onClick={() => toggleLikeBlog(post.id)}
          className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
            post.isLikedByMe
              ? 'text-rose-600 bg-rose-500/10'
              : 'hover:bg-surface-container-low hover:text-on-surface'
          }`}
        >
          <Heart className={`w-4 h-4 ${post.isLikedByMe ? 'fill-rose-600' : ''}`} />
          <span>{post.isLikedByMe ? 'Liked' : 'Like'}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="py-2 rounded-xl hover:bg-surface-container-low hover:text-on-surface flex items-center justify-center gap-1.5 transition-colors"
        >
          <MessageCircle className="w-4 h-4 text-primary" />
          <span>Comment</span>
        </button>

        <button
          onClick={handleSave}
          className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
            post.isSavedByMe
              ? 'text-primary bg-primary/10'
              : 'hover:bg-surface-container-low hover:text-on-surface'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${post.isSavedByMe ? 'fill-primary' : ''}`} />
          <span>{post.isSavedByMe ? 'Saved' : 'Save'}</span>
        </button>

        <button
          onClick={handleShare}
          className="py-2 rounded-xl hover:bg-surface-container-low hover:text-on-surface flex items-center justify-center gap-1.5 transition-colors"
        >
          <Share2 className="w-4 h-4 text-purple-600" />
          <span>Share</span>
        </button>
      </div>

      {/* Expandable Comments Section */}
      {showComments && (
        <CommentSection
          blogId={post.id}
          blogAuthorId={post.authorId || post.author?.id}
          comments={post.comments || []}
        />
      )}

      {/* Edit Post Modal */}
      {isEditModalOpen && (
        <CreateBlogModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          postToEdit={post}
        />
      )}

      {/* Share Post Modal (Direct Message or Reshare to Feed with Credit) */}
      {isShareModalOpen && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          post={post}
        />
      )}
    </div>
  );
};
