'use client';

import React, { useState } from 'react';
import { X, Image as ImageIcon, FileText, Tag, Upload } from 'lucide-react';
import { useEduSpare } from '@/context/EduSpareContext';

interface CreateBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateBlogModal: React.FC<CreateBlogModalProps> = ({ isOpen, onClose }) => {
  const { createBlog } = useEduSpare();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [tagInput, setTagInput] = useState('WebSockets, System Architecture');
  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    const tags = tagInput.split(',').map((t) => t.trim()).filter(Boolean);
    const attachments = docName
      ? [
          {
            id: `att-${Date.now()}`,
            name: docName,
            type: 'pdf' as const,
            url: docUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            size: '1.5 MB',
          },
        ]
      : [];

    await createBlog({
      title,
      content,
      coverImage: coverImage || null,
      tags,
      attachments,
    });

    setTitle('');
    setContent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-surface-lowest rounded-3xl shadow-2xl border border-outline-variant/80 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
          <h3 className="text-lg font-bold text-on-surface">Publish New Article or Note</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-outline hover:bg-surface-container-low hover:text-on-surface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
              Blog Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Building High-Throughput Real-Time Systems"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
              Cover Image URL (Optional)
            </label>
            <div className="relative">
              <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
              Content Body (Markdown supported) *
            </label>
            <textarea
              rows={6}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article, research notes, code snippets, or thoughts here..."
              className="w-full p-4 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                Attach Document / PDF Title
              </label>
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="e.g. Architecture_Blueprint.pdf"
                className="w-full px-4 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-outline-variant/60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                Document URL
              </label>
              <input
                type="text"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-outline-variant/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
              Topic Tags (Comma-separated)
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="WebSockets, Node.js, Systems Architecture"
              className="w-full px-4 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-outline-variant/60"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-outline hover:text-on-surface rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-container rounded-xl shadow-md transition-all"
            >
              Publish Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
