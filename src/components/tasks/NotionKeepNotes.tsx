'use client';

import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Edit3, Save } from 'lucide-react';

interface NotionKeepNotesProps {
  initialNotes?: string | null;
  onSaveNotes: (notes: string) => void;
}

export const NotionKeepNotes: React.FC<NotionKeepNotesProps> = ({
  initialNotes,
  onSaveNotes,
}) => {
  const [notes, setNotes] = useState(initialNotes || '');
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    setNotes(initialNotes || '');
  }, [initialNotes]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    setIsSaved(false);
  };

  const handleSave = () => {
    onSaveNotes(notes);
    setIsSaved(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-bold text-on-surface">Notion Workspace Notes</h4>
        </div>
        <div className="flex items-center gap-2">
          {isSaved ? (
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-amber-600">Unsaved changes</span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaved}
            className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-primary disabled:opacity-40 rounded-lg shadow-sm transition-all"
          >
            <Save className="w-3.5 h-3.5" /> Save Notes
          </button>
        </div>
      </div>

      <div className="relative">
        <textarea
          rows={10}
          value={notes}
          onChange={handleChange}
          placeholder="Start typing your study notes, code snippets, formulas, or bullet points here... (Markdown supported)"
          className="w-full p-4 rounded-2xl bg-surface-container-low text-on-surface text-sm font-mono border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-lowest leading-relaxed transition-colors resize-y"
        />
      </div>
    </div>
  );
};
