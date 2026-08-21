'use client';

import React, { useState, useEffect } from 'react';
import { CommunityItem } from '@/types/eduspare';
import { DEFAULT_COMMUNITY_COVERS, DEFAULT_COMMUNITY_RULES } from './communityConstants';
import { X, Upload, ScrollText, Lock } from 'lucide-react';

interface EditCommunityCoverModalProps {
  isOpen: boolean;
  community: CommunityItem | null;
  onClose: () => void;
  onSubmit: (data: {
    image: string;
    avatarImage?: string;
    name: string;
    description: string;
    rules?: string;
    isPrivate: boolean;
  }) => Promise<void>;
}

export const EditCommunityCoverModal: React.FC<EditCommunityCoverModalProps> = ({
  isOpen,
  community,
  onClose,
  onSubmit,
}) => {
  const [coverImage, setCoverImage] = useState('');
  const [avatarImage, setAvatarImage] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (community) {
      setCoverImage(community.image || DEFAULT_COMMUNITY_COVERS[0]);
      setAvatarImage(community.avatarImage || community.image || '/assets/default_avatar.png');
      setName(community.name || '');
      setDescription(community.description || '');
      setRules(community.rules || DEFAULT_COMMUNITY_RULES);
      setIsPrivate(Boolean(community.isPrivate));
    }
  }, [community, isOpen]);

  if (!isOpen || !community) return null;

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCoverImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        image: coverImage,
        avatarImage,
        name,
        description,
        rules,
        isPrivate,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-surface-lowest rounded-3xl shadow-2xl border border-outline-variant/80 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-surface-container-low border-b border-outline-variant/40 px-6 py-5 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-bold text-on-surface">Edit Community Details & Rules</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-outline hover:text-on-surface hover:bg-surface-container-high"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-outline uppercase mb-1">
              Community Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 text-xs rounded-xl bg-surface-container-low border border-outline-variant/60 focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-outline uppercase mb-1">
              Community Description *
            </label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 text-xs rounded-xl bg-surface-container-low border border-outline-variant/60 focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Cover Photo Backdrop Upload */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/50">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-on-surface uppercase">
                Cover Photo Backdrop
              </label>
              <label
                htmlFor="edit-cover-file"
                className="px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-container rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Cover File
              </label>
              <input
                id="edit-cover-file"
                type="file"
                accept="image/*"
                onChange={handleCoverFileChange}
                className="hidden"
              />
            </div>
            <div className="h-20 rounded-xl overflow-hidden bg-surface-container">
              <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Profile Photo Upload */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/50">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-on-surface uppercase">
                Profile Photo
              </label>
              <label
                htmlFor="edit-avatar-file"
                className="px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-container rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Profile Photo
              </label>
              <input
                id="edit-avatar-file"
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
            </div>
            <img src={avatarImage} alt="Profile Photo Preview" className="w-12 h-12 rounded-2xl object-cover" />
          </div>

          {/* Community Guidelines & Rules */}
          <div>
            <label className="block text-xs font-bold text-outline uppercase mb-1 flex items-center gap-1">
              <ScrollText className="w-3.5 h-3.5 text-primary" /> Guidelines & Rules
            </label>
            <textarea
              rows={3}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              className="w-full p-3 text-xs rounded-xl bg-surface-container-low border border-outline-variant/60 font-mono"
            />
          </div>

          {/* Private Hub Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="edit-private"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4 accent-primary rounded"
            />
            <label htmlFor="edit-private" className="text-xs font-bold text-on-surface flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-amber-500" /> Private Hub (Requires Admin Membership Approval)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-outline hover:text-on-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-primary rounded-xl hover:bg-primary-container shadow-md"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
