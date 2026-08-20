'use client';

import React, { useState } from 'react';
import { X, Calendar, Flame, AlertCircle } from 'lucide-react';
import { useEduSpare } from '@/context/EduSpareContext';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose }) => {
  const { createTask } = useEduSpare();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Backend Engineering');
  const [importance, setImportance] = useState(75); // 0 to 100
  const [dueAt, setDueAt] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueAt) return;

    await createTask({
      title,
      description,
      category,
      importance: Number(importance),
      dueAt: new Date(dueAt).toISOString(),
      status: 'Pending',
    });

    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-surface-lowest rounded-3xl shadow-2xl border border-outline-variant/80 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              +
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface">Create New Task</h3>
              <p className="text-xs text-outline font-medium">
                Tasks are prioritized by remaining time and importance rating (0-100)
              </p>
            </div>
          </div>
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
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement WebSockets with JWT Authentication"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                Subject / Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Backend Engineering">Backend Engineering</option>
                <option value="AI & Mathematics">AI & Mathematics</option>
                <option value="Physics & Quantum">Physics & Quantum</option>
                <option value="Database Systems">Database Systems</option>
                <option value="Frontend Engineering">Frontend Engineering</option>
                <option value="General Study">General Study</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                Deadline Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Importance Slider (0 to 100) */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface">
                <Flame className="w-4 h-4 text-amber-500" />
                Importance Rating (0 - 100)
              </div>
              <span className="text-sm font-black text-primary px-2.5 py-0.5 rounded-md bg-primary/10">
                {importance} / 100
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={importance}
              onChange={(e) => setImportance(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <p className="text-[11px] text-outline font-medium">
              If two tasks have identical deadlines, the task with higher importance rating takes priority.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
              Description / Study Notes Summary
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add task specifications, links, or objectives..."
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
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
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
