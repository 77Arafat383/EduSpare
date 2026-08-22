'use client';

import React, { useState } from 'react';
import { MaterialItem } from '@/types/eduspare';
import {
  Link as LinkIcon,
  FileText,
  Download,
  Trash2,
  Upload,
  FileCode,
  Film,
  Paperclip,
  Eye,
  MoreVertical,
} from 'lucide-react';

interface TaskMaterialsListProps {
  materials: MaterialItem[];
  onUpdateMaterials: (materials: MaterialItem[]) => void;
  onReadMaterial?: (item: MaterialItem) => void;
}

export const TaskMaterialsList: React.FC<TaskMaterialsListProps> = ({
  materials,
  onUpdateMaterials,
  onReadMaterial,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'link' | 'pdf' | 'document' | 'video' | 'code'>('pdf');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;

        let fileType: 'pdf' | 'document' | 'video' | 'code' | 'link' = 'document';
        if (file.type.includes('pdf') || file.name.endsWith('.pdf')) fileType = 'pdf';
        else if (file.type.includes('video')) fileType = 'video';
        else if (
          file.name.endsWith('.js') ||
          file.name.endsWith('.ts') ||
          file.name.endsWith('.py') ||
          file.name.endsWith('.json') ||
          file.name.endsWith('.html') ||
          file.name.endsWith('.css')
        )
          fileType = 'code';

        let sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
        if (file.size >= 1024 * 1024) {
          sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
        }

        const newMaterial: MaterialItem = {
          id: `mat-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          title: file.name,
          type: fileType,
          url: dataUrl || '',
          size: sizeStr,
          createdAt: new Date().toISOString(),
        };

        onUpdateMaterials([...materials, newMaterial]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

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

  const renderFileIcon = (type: string) => {
    if (type === 'pdf') return <FileText className="w-4 h-4 text-rose-500 shrink-0" />;
    if (type === 'code') return <FileCode className="w-4 h-4 text-amber-500 shrink-0" />;
    if (type === 'video') return <Film className="w-4 h-4 text-purple-500 shrink-0" />;
    return <Paperclip className="w-4 h-4 text-primary shrink-0" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-on-surface">Study Materials</h4>
        </div>

        <div className="flex gap-2">
          {/* Direct File Upload Button */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary text-white hover:bg-primary-container rounded-xl cursor-pointer shadow-sm transition-all">
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
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
              Save Link
            </button>
          </div>
        </form>
      )}

      {materials.length === 0 ? (
        <div className="p-6 text-center text-xs text-outline bg-surface-container-low border border-dashed border-outline-variant/60 rounded-2xl space-y-2">
          <Upload className="w-6 h-6 text-outline mx-auto" />
          <p className="font-semibold text-on-surface">No resources added yet</p>
          <p>Click "Upload File" to attach study PDFs/materials or documentation links.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {materials.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-between gap-3 group transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 font-bold">
                  {renderFileIcon(item.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onReadMaterial && onReadMaterial(item)}
                    className="text-xs font-bold text-on-surface hover:text-primary transition-colors flex items-center gap-1.5 truncate text-left"
                  >
                    <span>{item.title}</span>
                  </button>
                  <div className="flex items-center gap-2 text-[10px] text-outline">
                    {item.size && <span className="font-mono">{item.size}</span>}
                    {item.notes && <span className="truncate">{item.notes}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">

                {/* 3-Dot Options Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === item.id ? null : item.id);
                    }}
                    className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
                    title="Resource options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* 3-Dot Dropdown Menu */}
                  {openMenuId === item.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-8 z-50 w-36 bg-white dark:bg-slate-900 border border-outline-variant/60 rounded-2xl shadow-2xl p-1.5 space-y-1 opacity-100 animate-in fade-in zoom-in-95 duration-100"
                    >
                      <a
                        href={item.url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        download={item.title}
                        onClick={() => setOpenMenuId(null)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-low rounded-xl transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-primary" />
                        <span>Download</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          handleDeleteMaterial(item.id);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
