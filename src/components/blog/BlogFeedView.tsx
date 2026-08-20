'use client';

import React, { useState } from 'react';
import { useEduSpare } from '@/context/EduSpareContext';
import { BlogPostCard } from './BlogPostCard';
import { CreateBlogModal } from './CreateBlogModal';
import { BookOpen, Plus, Search, Bookmark, X } from 'lucide-react';

export const BlogFeedView: React.FC = () => {
  const { blogs, currentUser, selectedBlogId, setSelectedBlogId } = useEduSpare();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBlogs = blogs.filter((b) => {
    if (selectedBlogId) {
      return b.id === selectedBlogId;
    }
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.title.toLowerCase().includes(term) ||
      b.content.toLowerCase().includes(term) ||
      b.tags?.some((t) => t.toLowerCase().includes(term)) ||
      b.author.name.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header & New Post Bar */}
      <div className="bg-surface-lowest p-6 rounded-3xl border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-black text-on-surface">Blog & Knowledge Hub</h2>
            </div>
            <p className="text-xs text-outline font-medium">
              Share articles, research PDFs, code blueprints, and discuss topics with scholars
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-container text-white font-bold text-sm rounded-2xl shadow-md transition-all self-start sm:self-auto"
          >
            <Plus className="w-5 h-5" />
            Publish Article
          </button>
        </div>

        {/* Saved Blog Filter Banner if active */}
        {selectedBlogId && (
          <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-between gap-3 text-xs font-bold text-primary animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-primary" />
              <span>Viewing Bookmarked Saved Article</span>
            </div>
            <button
              onClick={() => setSelectedBlogId(null)}
              className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-container shadow-xs flex items-center gap-1 transition-all"
            >
              <X className="w-3.5 h-3.5" /> View All Articles
            </button>
          </div>
        )}

        {/* Quick Post Prompt trigger */}
        {currentUser && !selectedBlogId && (
          <div
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/40 cursor-pointer transition-colors"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/20"
            />
            <span className="text-xs text-outline font-semibold flex-1">
              What research, notes, or ideas are you working on today, {currentUser.name.split(' ')[0]}?
            </span>
            <span className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-xl">
              Post Note
            </span>
          </div>
        )}
      </div>

      {/* Filter / Search Bar */}
      {!selectedBlogId && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search blogs by title, tags (e.g. #WebSockets), or author name..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-surface-lowest border border-outline-variant/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-on-surface shadow-sm"
          />
        </div>
      )}

      {/* Blog Feed Cards */}
      <div className="space-y-6">
        {filteredBlogs.length === 0 ? (
          <div className="p-12 text-center bg-surface-lowest rounded-3xl border border-outline-variant/60 text-outline space-y-2">
            <p className="text-base font-bold">No articles found.</p>
            <button
              onClick={() => {
                setSelectedBlogId(null);
                setSearchTerm('');
              }}
              className="px-4 py-1.5 text-xs font-bold text-white bg-primary rounded-xl"
            >
              Clear Filters & View All
            </button>
          </div>
        ) : (
          filteredBlogs.map((post) => (
            <div key={post.id} className={selectedBlogId === post.id ? 'ring-2 ring-primary rounded-3xl' : ''}>
              <BlogPostCard post={post} />
            </div>
          ))
        )}
      </div>

      {/* Create Blog Modal */}
      <CreateBlogModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
};
