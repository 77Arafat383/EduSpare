'use client';

import React, { useState } from 'react';
import { MaterialItem } from '@/types/eduspare';
import { Link as LinkIcon, FileText, Download, Trash2, Plus, ExternalLink } from 'lucide-react';

interface TaskMaterialsListProps {
  materials: MaterialItem[];
  onUpdateMaterials: (materials: MaterialItem[]) => void;
}

export const TaskMaterialsList: React.FC<TaskMaterialsListProps> = ({
  materials,
  onUpdateMaterials,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'link' | 'pdf' | 'document' | 'video' | 'code'>('pdf');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const newMat: MaterialItem = {
      id: `mat-${Date.now()}`,
      title,
      type,
      url: url || 'https://example.com/resource',
      notes,
      createdAt: new Date().toISOString(),
    };

    onUpdateMaterials([...materials, newMat]);
    setTitle('');
    setUrl('');
    setNotes('');
    setShowAddForm(false);
  };

  const handleDeleteMaterial = (id: string) => {
    onUpdateMaterials(materials.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-on-surface">Study Materials & Attachments</h4>
          <p className="text-xs text-outline">Reference PDFs, documentation, links, and code snippets</p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Resource
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddMaterial} className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-outline uppercase">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. RFC 6455 Spec or Textbook Chapter 4"
                className="w-full px-3 py-1.5 rounded-lg bg-surface-lowest text-xs border border-outline-variant/60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-outline uppercase">Material Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg bg-surface-lowest text-xs border border-outline-variant/60"
              >
                <option value="pdf">PDF Document</option>
                <option value="link">Web Link / Article</option>
                <option value="document">Doc / Notes</option>
                <option value="video">Video Lecture</option>
                <option value="code">Code Snippet</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-outline uppercase">URL / Location</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-1.5 rounded-lg bg-surface-lowest text-xs border border-outline-variant/60"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 text-xs text-outline font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1 text-xs font-bold text-white bg-primary rounded-lg shadow-sm"
            >
              Save Material
            </button>
          </div>
        </form>
      )}

      {materials.length === 0 ? (
        <div className="p-4 text-center text-xs text-outline bg-surface-container-low rounded-xl">
          No resources added yet. Click "+ Add Resource" to attach study files or documentation links.
        </div>
      ) : (
        <div className="space-y-2">
          {materials.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-between gap-3 group transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                  {item.type === 'pdf' ? (
                    <FileText className="w-4 h-4 text-rose-600" />
                  ) : (
                    <LinkIcon className="w-4 h-4 text-primary" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-on-surface hover:text-primary transition-colors flex items-center gap-1 truncate"
                  >
                    <span>{item.title}</span>
                    <ExternalLink className="w-3 h-3 text-outline shrink-0" />
                  </a>
                  {item.notes && <p className="text-[11px] text-outline truncate">{item.notes}</p>}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-outline hover:text-primary hover:bg-surface-lowest rounded-lg transition-colors"
                  title="Open / Download"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDeleteMaterial(item.id)}
                  className="p-1.5 text-outline hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Delete Resource"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
