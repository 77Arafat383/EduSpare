'use client';

import React, { useState } from 'react';
import { useEduSpare } from '@/context/EduSpareContext';
import { CommunityItem } from '@/types/eduspare';
import { BlogPostCard } from '../blog/BlogPostCard';
import { Users, Plus, Lock, Globe, Shield, Sparkles, Check } from 'lucide-react';

export const CommunityView: React.FC = () => {
  const {
    communities,
    blogs,
    currentUser,
    createCommunity,
    toggleJoinCommunity,
    selectedCommunityId,
    setSelectedCommunityId,
  } = useEduSpare();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('Systems, Backend, Research');
  const [isPrivate, setIsPrivate] = useState(false);

  const activeCommunity =
    communities.find((c) => c.id === selectedCommunityId) || communities[0];

  const isMember = currentUser && activeCommunity
    ? activeCommunity.memberIds.includes(currentUser.id)
    : false;

  // Filter blogs created inside this community
  const communityBlogs = blogs.filter((b) => b.communityId === activeCommunity?.id);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) return;
    await createCommunity({
      name,
      description,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      isPrivate,
    });
    setName('');
    setDescription('');
    setIsCreateOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-lowest p-6 rounded-3xl border border-outline-variant/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-black text-on-surface">Study Communities</h2>
          </div>
          <p className="text-xs text-outline font-medium">
            Join member-gated hubs to share research papers, PDFs, notes, and exclusive blogs
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-container text-white font-bold text-sm rounded-2xl shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          Create Community
        </button>
      </div>

      {/* Community Selector Pills */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {communities.map((comm) => {
          const isSelected = activeCommunity?.id === comm.id;
          return (
            <button
              key={comm.id}
              onClick={() => setSelectedCommunityId(comm.id)}
              className={`px-4 py-3 rounded-2xl border transition-all text-left shrink-0 min-w-[200px] ${
                isSelected
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-surface-lowest hover:bg-surface-container-low text-on-surface border-outline-variant/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs truncate">{comm.name}</span>
                {comm.isPrivate ? <Lock className="w-3 h-3 text-amber-400" /> : <Globe className="w-3 h-3 text-emerald-400" />}
              </div>
              <div className={`text-[10px] mt-1 ${isSelected ? 'text-white/80' : 'text-outline'}`}>
                {comm.memberIds?.length || 0} Members
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Community Workspace */}
      {activeCommunity && (
        <div className="space-y-6">
          <div className="bg-surface-lowest rounded-3xl border border-outline-variant/60 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={activeCommunity.image}
                  alt={activeCommunity.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-primary/20"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-on-surface">{activeCommunity.name}</h3>
                    {activeCommunity.isPrivate ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Private Hub
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Public Community
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-outline mt-0.5 font-medium">{activeCommunity.description}</p>
                </div>
              </div>

              {currentUser && (
                <button
                  onClick={() =>
                    toggleJoinCommunity(activeCommunity.id, isMember ? 'leave' : 'join')
                  }
                  className={`px-5 py-2.5 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center gap-2 ${
                    isMember
                      ? 'bg-surface-variant text-on-surface-variant hover:bg-rose-500 hover:text-white'
                      : 'bg-primary text-white hover:bg-primary-container'
                  }`}
                >
                  {isMember ? (
                    <>
                      <Check className="w-4 h-4" /> Joined Member
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Join Community
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Member Access Control Enforcement (Requirement 9.c) */}
          {!isMember ? (
            <div className="p-8 rounded-3xl bg-surface-container-low border border-outline-variant/60 text-center space-y-3">
              <Shield className="w-10 h-10 text-primary mx-auto" />
              <h4 className="text-base font-bold text-on-surface">Member-Only Access Gated</h4>
              <p className="text-xs text-outline max-w-md mx-auto font-medium">
                Only community members can view shared notes, PDFs, react, and comment on exclusive blogs in this hub. Click "Join Community" above to participate.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-on-surface">Community Feed & Shared Resources</h4>
              {communityBlogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-outline bg-surface-lowest rounded-3xl border">
                  No community posts created yet in this hub. Share an article from the Blog section to post here!
                </div>
              ) : (
                communityBlogs.map((b) => <BlogPostCard key={b.id} post={b} />)
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Community Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-surface-lowest rounded-3xl shadow-2xl border border-outline-variant/80 p-6 space-y-4">
            <h3 className="text-lg font-bold text-on-surface">Create New Study Community</h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-1">Community Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Quantum Computing & Physics Lab"
                  className="w-full px-4 py-2 text-xs rounded-xl bg-surface-container-low border"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the research goals, study topics..."
                  className="w-full p-3 text-xs rounded-xl bg-surface-container-low border"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="priv"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded accent-primary"
                />
                <label htmlFor="priv" className="text-xs font-bold text-on-surface">
                  Private Hub (Requires membership approval)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-primary rounded-xl"
                >
                  Create Hub
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
