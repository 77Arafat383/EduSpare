'use client';

import React from 'react';
import { SavedVaultItem, ActiveTab } from '@/types/eduspare';
import { Bookmark, BookOpen, Trash2 } from 'lucide-react';

interface ProfileSavedVaultTabProps {
  savedItems: SavedVaultItem[];
  setSelectedBlogId: (id: string | null) => void;
  setActiveTab: (tab: ActiveTab) => void;
  deleteSavedItem: (id: string) => void;
}

export const ProfileSavedVaultTab: React.FC<ProfileSavedVaultTabProps> = ({
  savedItems,
  setSelectedBlogId,
  setActiveTab,
  deleteSavedItem,
}) => {
  return (
    <div className="bg-surface-lowest p-6 rounded-3xl border border-outline-variant/60 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Bookmark className="w-5 h-5 text-primary" />
        <h3 className="text-base font-bold text-on-surface">Personal Saved Vault</h3>
      </div>
      <p className="text-xs text-outline">
        Saved blogs, research PDFs, document attachments, and study notes
      </p>

      {savedItems.length === 0 ? (
        <div className="p-8 text-center text-xs text-outline bg-surface-container-low rounded-2xl">
          Your saved vault is empty. Click "Save" on blogs or PDFs to bookmark items here.
        </div>
      ) : (
        <div className="space-y-2.5">
          {savedItems.map((item) => {
            const isBlogItem =
              item.itemType === 'blog' ||
              Boolean(item.itemId) ||
              Boolean(item.url && !item.url.startsWith('http'));
            const blogTargetId = item.itemId || item.url?.replace('/blog?post=', '');

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isBlogItem && blogTargetId) {
                    setSelectedBlogId(blogTargetId);
                    setActiveTab('blog');
                  }
                }}
                className="p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-between gap-3 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold uppercase text-xs shadow-xs">
                    {item.itemType}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-outline">
                      Saved on {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isBlogItem && blogTargetId) {
                        setSelectedBlogId(blogTargetId);
                        setActiveTab('blog');
                        return;
                      }
                      if (item.url && item.url.startsWith('http')) {
                        window.open(item.url, '_blank');
                      }
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-container rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Reopen Article
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSavedItem(item.id);
                    }}
                    title="Remove from Saved Vault"
                    className="p-2 text-outline hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
