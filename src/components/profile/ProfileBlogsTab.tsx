'use client';

import React from 'react';
import { User, BlogPost } from '@/types/eduspare';
import { BlogPostCard } from '../blog/BlogPostCard';
import { PenSquare, Plus } from 'lucide-react';

interface ProfileBlogsTabProps {
  user: User;
  blogs: BlogPost[];
  isOwnProfile: boolean;
  setIsCreateBlogOpen: (open: boolean) => void;
}

export const ProfileBlogsTab: React.FC<ProfileBlogsTabProps> = ({
  user,
  blogs,
  isOwnProfile,
  setIsCreateBlogOpen,
}) => {
  return (
    <div className="space-y-3.5">
      {isOwnProfile ? (
        /* Create Blog Quick Trigger Card (Styled like Blog Feed / Community Post Prompt) */
        <div
          onClick={() => setIsCreateBlogOpen(true)}
          className="p-3.5 rounded-3xl bg-surface-lowest hover:bg-surface-container-low border border-outline-variant/60 shadow-sm flex items-center gap-3 cursor-pointer transition-all group"
        >
          <img loading="lazy" decoding="async"
            src={user.avatar || '/assets/default_avatar.png'}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-primary/20"
          />
          <div className="flex-1 min-w-0 text-xs font-semibold text-outline group-hover:text-on-surface transition-colors truncate">
            Share an article, research note, or academic insight, {user.name.split(' ')[0]}...
          </div>
        </div>
      ) : (
        /* Other User Profile Header Banner */
        <div className="p-4 rounded-3xl bg-surface-lowest border border-outline-variant/60 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface">Published Articles</h3>
          <p className="text-xs text-outline">
            Articles and research notes authored by @{user.username}
          </p>
        </div>
      )}

      {blogs.length === 0 ? (
        <div className="p-12 text-center text-xs text-outline bg-surface-lowest rounded-3xl border border-outline-variant/60 space-y-3">
          <p className="font-semibold text-sm text-on-surface">No blogs authored yet by @{user.username}.</p>
          {isOwnProfile && (
            <button
              onClick={() => setIsCreateBlogOpen(true)}
              className="px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 hover:bg-primary-container transition-all"
            >
              <Plus className="w-4 h-4" /> Publish First Article
            </button>
          )}
        </div>
      ) : (
        blogs.map((b) => <BlogPostCard key={b.id} post={b} />)
      )}
    </div>
  );
};
