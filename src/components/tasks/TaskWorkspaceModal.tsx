'use client';

import React from 'react';
import { TaskItem, MaterialItem } from '@/types/eduspare';
import { useEduSpare } from '@/context/EduSpareContext';
import { formatTimeRemaining } from '@/lib/priorityAlgorithm';
import { NotionKeepNotes } from './NotionKeepNotes';
import { TaskMaterialsList } from './TaskMaterialsList';
import { AITutorPanel } from './AITutorPanel';
import { X, Clock, Flame, CheckCircle, Trash2, Tag, Calendar } from 'lucide-react';

interface TaskWorkspaceModalProps {
  task: TaskItem;
  onClose: () => void;
}

export const TaskWorkspaceModal: React.FC<TaskWorkspaceModalProps> = ({
  task,
  onClose,
}) => {
  const { updateTask, deleteTask } = useEduSpare();
  const timeInfo = formatTimeRemaining(task.dueAt);

  const handleUpdateNotes = (newNotes: string) => {
    updateTask(task.id, { notes: newNotes });
  };

  const handleUpdateMaterials = (newMaterials: MaterialItem[]) => {
    updateTask(task.id, { materials: newMaterials });
  };

  const handleToggleStatus = () => {
    const nextStatus =
      task.status === 'Completed'
        ? 'Pending'
        : task.status === 'Pending'
        ? 'In Progress'
        : 'Completed';
    updateTask(task.id, { status: nextStatus as any });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-5xl bg-surface-lowest rounded-3xl shadow-2xl border border-outline-variant/80 overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-6 bg-surface-container-low border-b border-outline-variant/40 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={handleToggleStatus}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                task.status === 'Completed'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : task.status === 'In Progress'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-surface-variant text-on-surface-variant hover:bg-primary hover:text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{task.status}</span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  {task.category}
                </span>
                <span className="text-xs text-outline">•</span>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                  <Flame className="w-3.5 h-3.5" />
                  Importance: {task.importance}/100
                </div>
              </div>
              <h2 className="text-xl font-black text-on-surface truncate">{task.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20 text-xs font-bold">
              <Clock className="w-4 h-4" />
              <span>{timeInfo.text}</span>
            </div>

            <button
              onClick={() => {
                deleteTask(task.id);
                onClose();
              }}
              className="p-2 text-outline hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-outline hover:text-on-surface hover:bg-surface-container-high rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body Layout */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* AI Tutor Notebook Integration */}
          <AITutorPanel
            taskTitle={task.title}
            category={task.category}
            notes={task.notes || undefined}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Notion Notes & Materials */}
            <div className="lg:col-span-2 space-y-6">
              <NotionKeepNotes
                initialNotes={task.notes}
                onSaveNotes={handleUpdateNotes}
              />

              <TaskMaterialsList
                materials={task.materials || []}
                onUpdateMaterials={handleUpdateMaterials}
              />
            </div>

            {/* Right 1 Column: Meta Details & Quick Controls */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 space-y-3">
                <h4 className="text-xs font-bold text-outline uppercase tracking-wider">
                  Task Parameters
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-outline-variant/30">
                    <span className="text-outline">Due Date:</span>
                    <span className="font-bold text-on-surface">
                      {new Date(task.dueAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-outline-variant/30">
                    <span className="text-outline">Priority Rank Score:</span>
                    <span className="font-bold text-amber-600">{task.importance}/100</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-outline-variant/30">
                    <span className="text-outline">Attached Resources:</span>
                    <span className="font-bold text-primary">
                      {task.materials?.length || 0} items
                    </span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-outline">Created:</span>
                    <span className="font-semibold text-on-surface">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
