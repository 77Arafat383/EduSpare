'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Flame,
  Calendar,
  Clock,
  Timer,
  Bell,
  Upload,
  FileText,
  FileCode,
  Film,
  Paperclip,
  Trash2,
} from 'lucide-react';
import { useEduSpare } from '@/context/EduSpareContext';
import { MaterialItem, TaskItem } from '@/types/eduspare';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: TaskItem | null;
}

export function parseDurationString(input?: string | null): { days: number; hours: number; mins: number } {
  if (!input || !input.trim()) return { days: 0, hours: 2, mins: 30 };

  const str = input.toLowerCase().trim();
  const dayMatch = str.match(/(\d+)\s*d/);
  const hourMatch = str.match(/(\d+)\s*h/);
  const minMatch = str.match(/(\d+)\s*m/);

  let days = dayMatch ? parseInt(dayMatch[1], 10) : 0;
  let hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
  let mins = minMatch ? parseInt(minMatch[1], 10) : 0;

  if (!dayMatch && !hourMatch && !minMatch) {
    const num = parseInt(str, 10);
    if (!isNaN(num) && num > 0) hours = num;
  }

  return { days, hours, mins };
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, taskToEdit }) => {
  const { createTask, updateTask, tasks } = useEduSpare();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [importance, setImportance] = useState(75); // 0 to 100

  // Digital Time Selector State (Days, Hours, Minutes)
  const [estDays, setEstDays] = useState<number>(0);
  const [estHours, setEstHours] = useState<number>(2);
  const [estMins, setEstMins] = useState<number>(30);

  // Separated Date and Time states
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const defaultDate = tomorrow.toISOString().slice(0, 10);
  const defaultTime = '23:59';

  const [dueDate, setDueDate] = useState(defaultDate);
  const [dueTime, setDueTime] = useState(defaultTime);

  // Uploaded Resources / Materials State
  const [resources, setResources] = useState<MaterialItem[]>([]);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setCategory(taskToEdit.category || '');
      setImportance(taskToEdit.importance ?? 75);

      if (taskToEdit.dueAt) {
        const d = new Date(taskToEdit.dueAt);
        setDueDate(d.toISOString().slice(0, 10));
        setDueTime(d.toTimeString().slice(0, 5));
      }

      if (taskToEdit.estimatedTime) {
        const { days, hours, mins } = parseDurationString(taskToEdit.estimatedTime);
        setEstDays(days);
        setEstHours(hours);
        setEstMins(mins);
      }

      setResources(taskToEdit.materials || []);
    } else {
      setTitle('');
      setDescription('');
      setCategory('');
      setImportance(75);
      setEstDays(0);
      setEstHours(2);
      setEstMins(30);
      setDueDate(defaultDate);
      setDueTime(defaultTime);
      setResources([]);
    }
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  // User created categories ONLY (NO DEMO CATEGORIES)
  const userCategories = useMemo(() => {
    return Array.from(
      new Set(
        tasks
          .map((t) => t.category)
          .filter((c): c is string => Boolean(c && c.trim()))
      )
    );
  }, [tasks]);

  // Recommended categories sorted by similarity to current input
  const recommendedCategories = useMemo(() => {
    if (!category.trim()) return userCategories;
    const query = category.toLowerCase().trim();
    return userCategories
      .map((cat: string) => {
        const text = cat.toLowerCase();
        let score = 0;
        if (text === query) score = 100;
        else if (text.startsWith(query)) score = 80;
        else if (text.includes(query)) score = 50;
        return { cat, score };
      })
      .filter((item: { cat: string; score: number }) => item.score > 0)
      .sort((a: { cat: string; score: number }, b: { cat: string; score: number }) => b.score - a.score)
      .map((item: { cat: string; score: number }) => item.cat);
  }, [userCategories, category]);

  // Calculate total duration in milliseconds
  const totalMs = (estDays * 24 * 60 + estHours * 60 + estMins) * 60 * 1000;
  const formattedEstimatedTime =
    `${estDays > 0 ? estDays + 'd ' : ''}${estHours > 0 ? estHours + 'h ' : ''}${estMins > 0 ? estMins + 'm' : ''}`.trim() ||
    '0m';

  const computeStartTime = () => {
    if (!dueDate || !dueTime || totalMs <= 0) return null;
    const deadlineMs = new Date(`${dueDate}T${dueTime}`).getTime();
    if (isNaN(deadlineMs)) return null;

    const startMs = deadlineMs - totalMs;
    return new Date(startMs);
  };

  const calculatedStartDate = computeStartTime();

  // Multi-File Upload Handler
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
          id: Math.random().toString(36).slice(2),
          title: file.name,
          type: fileType,
          url: dataUrl || '',
          size: sizeStr,
          createdAt: new Date().toISOString(),
        };

        setResources((prev) => [...prev, newMaterial]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveResource = (id: string) => {
    setResources((prev) => prev.filter((item) => item.id !== id));
  };

  const renderFileIcon = (type: string) => {
    if (type === 'pdf') return <FileText className="w-4 h-4 text-rose-500 shrink-0" />;
    if (type === 'code') return <FileCode className="w-4 h-4 text-amber-500 shrink-0" />;
    if (type === 'video') return <Film className="w-4 h-4 text-purple-500 shrink-0" />;
    return <Paperclip className="w-4 h-4 text-primary shrink-0" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate || !dueTime || totalMs <= 0) return;

    const combinedDueAt = new Date(`${dueDate}T${dueTime}`).toISOString();
    const startTimeIso = calculatedStartDate ? calculatedStartDate.toISOString() : null;

    if (taskToEdit) {
      await updateTask(taskToEdit.id, {
        title,
        description,
        category: category.trim() || 'General',
        importance: Number(importance),
        dueAt: combinedDueAt,
        estimatedTime: formattedEstimatedTime,
        startTime: startTimeIso,
        materials: resources,
      });
    } else {
      await createTask({
        title,
        description,
        category: category.trim() || 'General',
        importance: Number(importance),
        dueAt: combinedDueAt,
        estimatedTime: formattedEstimatedTime,
        startTime: startTimeIso,
        materials: resources,
        status: 'Pending',
      });
    }

    setTitle('');
    setDescription('');
    setCategory('');
    setEstDays(0);
    setEstHours(2);
    setEstMins(30);
    setResources([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-surface-lowest rounded-2xl sm:rounded-3xl shadow-2xl border border-outline-variant/80 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-surface-container-low border-b border-outline-variant/40 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-on-surface">
              {taskToEdit ? 'Edit Task' : 'Create New Task'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Task Title */}
          <div>
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. EduSpare Project submission"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Optional Category Field */}
          <div>
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
              Category
            </label>
            <input
              type="text"
              list="category-suggestions"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Select or type new category..."
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <datalist id="category-suggestions">
              {recommendedCategories.map((cat: string) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          {/* Separated Date & Time Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Deadline Date Box */}
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Deadline Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Deadline Time Box */}
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Deadline Time *
              </label>
              <input
                type="time"
                required
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Compulsory Task Completion Estimated Time - Digital Time Selector Only */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-primary" />
                Estimated Time to Complete *
              </span>
              <span className="text-primary font-mono font-bold text-xs bg-primary/10 px-2.5 py-0.5 rounded-lg">
                {estDays > 0 ? `${estDays}d ` : ''}
                {estHours}h {estMins}m
              </span>
            </label>

            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/60">
              {/* Days */}
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container text-xs space-y-1">
                <span className="font-bold text-[11px] text-outline uppercase tracking-wider">Days</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEstDays(Math.max(0, estDays - 1))}
                    className="w-6 h-6 rounded-lg bg-surface-container-high hover:bg-primary/20 flex items-center justify-center font-bold text-on-surface transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={estDays === 0 ? '0' : estDays}
                    onChange={(e) => setEstDays(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-10 text-center font-mono font-bold text-sm bg-surface-container-high/60 focus:bg-surface-container-high text-on-surface rounded-md focus:outline-none focus:ring-1 focus:ring-primary py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setEstDays(estDays + 1)}
                    className="w-6 h-6 rounded-lg bg-surface-container-high hover:bg-primary/20 flex items-center justify-center font-bold text-on-surface transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Hours */}
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container text-xs space-y-1">
                <span className="font-bold text-[11px] text-outline uppercase tracking-wider">Hours</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEstHours(Math.max(0, estHours - 1))}
                    className="w-6 h-6 rounded-lg bg-surface-container-high hover:bg-primary/20 flex items-center justify-center font-bold text-on-surface transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={estHours === 0 ? '0' : estHours}
                    onChange={(e) => setEstHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-10 text-center font-mono font-bold text-sm bg-surface-container-high/60 focus:bg-surface-container-high text-on-surface rounded-md focus:outline-none focus:ring-1 focus:ring-primary py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setEstHours(estHours + 1)}
                    className="w-6 h-6 rounded-lg bg-surface-container-high hover:bg-primary/20 flex items-center justify-center font-bold text-on-surface transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Minutes */}
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container text-xs space-y-1">
                <span className="font-bold text-[11px] text-outline uppercase tracking-wider">Minutes</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEstMins(Math.max(0, estMins - 5))}
                    className="w-6 h-6 rounded-lg bg-surface-container-high hover:bg-primary/20 flex items-center justify-center font-bold text-on-surface transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={estMins === 0 ? '0' : estMins}
                    onChange={(e) => setEstMins(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-10 text-center font-mono font-bold text-sm bg-surface-container-high/60 focus:bg-surface-container-high text-on-surface rounded-md focus:outline-none focus:ring-1 focus:ring-primary py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setEstMins(estMins + 5)}
                    className="w-6 h-6 rounded-lg bg-surface-container-high hover:bg-primary/20 flex items-center justify-center font-bold text-on-surface transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Live Calculated System Start Time Notification Preview */}
            {calculatedStartDate && totalMs > 0 && (
              <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 text-xs text-on-surface space-y-0.5 animate-in fade-in">
                <p className="font-bold text-primary flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-primary" /> Start Time Notification:
                </p>
                <p className="text-on-surface font-semibold text-[11px]">
                  {calculatedStartDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                  <span className="font-bold text-primary">
                    {calculatedStartDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Study Resources Upload Option */}
          <div className="space-y-2 border-t border-outline-variant/30 pt-3">
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1">
              <Paperclip className="w-3.5 h-3.5 text-primary" />
              Upload Study Resources & Materials (Optional)
            </label>

            {/* Drag & Drop / Click Upload Dropzone */}
            <div className="border-2 border-dashed border-outline-variant/60 hover:border-primary/60 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-surface-container-low/50 relative">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center gap-1 text-xs">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1">
                  <Upload className="w-4 h-4" />
                </div>
                <p className="font-bold text-on-surface">Click or drag files to upload study resources</p>
                <p className="text-[10px] text-outline">Upload PDFs, Documents, Code, Images, or Videos</p>
              </div>
            </div>

            {/* List of Uploaded Resources */}
            {resources.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-bold text-outline uppercase">Uploaded Resources ({resources.length})</p>
                {resources.map((res) => (
                  <div
                    key={res.id}
                    className="p-2 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {renderFileIcon(res.type)}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-on-surface truncate">{res.title}</p>
                        {res.size && <p className="text-[10px] text-outline font-mono">{res.size}</p>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveResource(res.id)}
                      className="p-1.5 text-outline hover:text-rose-600 hover:bg-rose-500/10 rounded-lg shrink-0 transition-colors"
                      title="Delete Resource"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
              Description / Study Notes Summary
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add task specifications, links, or objectives..."
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Action Buttons */}
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
              disabled={totalMs <= 0 || !title.trim()}
              className="px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-container disabled:opacity-40 rounded-xl shadow-md transition-all"
            >
              {taskToEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
