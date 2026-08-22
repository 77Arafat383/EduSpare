'use client';

import React, { useState } from 'react';
import { TaskItem, MaterialItem } from '@/types/eduspare';
import { useEduSpare } from '@/context/EduSpareContext';
import { formatTimeRemaining } from '@/lib/priorityAlgorithm';
import { NotionKeepNotes } from './NotionKeepNotes';
import { TaskMaterialsList } from './TaskMaterialsList';
import { AITutorPanel } from './AITutorPanel';
import {
  X,
  Clock,
  Flame,
  CheckCircle,
  Minus,
  Maximize2,
  Minimize2,
  Calendar,
  Paperclip,
  Tag,
  Timer,
  BookOpen,
  Download,
  FileText,
  ExternalLink,
} from 'lucide-react';

interface TaskWorkspaceModalProps {
  task: TaskItem;
  onClose: () => void;
}

export const TaskWorkspaceModal: React.FC<TaskWorkspaceModalProps> = ({
  task,
  onClose,
}) => {
  const { updateTask } = useEduSpare();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Multi-Tab Edge Style PDF & Document Reader State
  const [openTabs, setOpenTabs] = useState<MaterialItem[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

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

  const handleOpenMaterialTab = (item: MaterialItem) => {
    if (!openTabs.some((t) => t.id === item.id)) {
      setOpenTabs((prev) => [...prev, item]);
    }
    setActiveTabId(item.id);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextTabs = openTabs.filter((t) => t.id !== id);
    setOpenTabs(nextTabs);
    if (activeTabId === id) {
      setActiveTabId(nextTabs.length > 0 ? nextTabs[nextTabs.length - 1].id : null);
    }
  };

  const activeTab = openTabs.find((t) => t.id === activeTabId);

  // If minimized, render a sleek floating dock pill at bottom right
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-surface-lowest dark:bg-slate-900 border border-outline-variant/80 shadow-2xl p-3 rounded-2xl animate-in slide-in-from-bottom-5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-on-surface max-w-[200px] truncate">
              {task.title}
            </p>
            <p className="text-[10px] text-outline truncate">{task.category}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(false)}
            className="px-3 py-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-xl transition-all"
            title="Restore Workspace"
          >
            Restore
          </button>
          <button
            onClick={onClose}
            className="p-1 text-outline hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
            title="Exit Workspace"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150 ${isFullScreen ? 'p-0' : 'p-2 sm:p-4 overflow-y-auto'}`}>
      <div className={`w-full bg-surface-lowest shadow-2xl border border-outline-variant/80 overflow-hidden flex flex-col transition-all duration-200 ${isFullScreen ? 'w-screen h-screen max-w-none rounded-none' : 'max-w-6xl rounded-2xl sm:rounded-3xl my-2 sm:my-6 max-h-[95vh]'}`}>
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-surface-container-low border-b border-outline-variant/40 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
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
              <h2 className="text-base sm:text-xl font-black text-on-surface truncate">{task.title}</h2>
            </div>
          </div>

          {/* Controls: Due Badge, Minimize, Maximize/Full Display, Exit */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20 text-[11px] sm:text-xs font-bold">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{timeInfo.text}</span>
            </div>

            {/* Minimize Button */}
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 sm:p-2 text-outline hover:text-on-surface hover:bg-surface-container-high rounded-xl transition-colors"
              title="Minimize Workspace"
            >
              <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Full Display / Maximize Toggle Button */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 sm:p-2 text-outline hover:text-on-surface hover:bg-surface-container-high rounded-xl transition-colors"
              title={isFullScreen ? 'Exit Full Display' : 'Full Display'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Exit / Cross Button */}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-outline hover:text-on-surface hover:bg-surface-container-high rounded-xl transition-colors"
              title="Exit Workspace"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Content Body Layout */}
        <div className="p-3 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1">
          {/* Top Section: Task Parameters Banner */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 space-y-2">
            <h4 className="text-[11px] font-bold text-outline uppercase tracking-wider">
              Task Parameters
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-lowest border border-outline-variant/30 space-y-0.5">
                <span className="text-[10px] font-bold text-outline uppercase flex items-center gap-1">
                  <Tag className="w-3 h-3 text-primary" /> Category
                </span>
                <p className="font-bold text-on-surface truncate">{task.category}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-lowest border border-outline-variant/30 space-y-0.5">
                <span className="text-[10px] font-bold text-outline uppercase flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-primary" /> Deadline
                </span>
                <p className="font-bold text-on-surface truncate">
                  {new Date(task.dueAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                  {new Date(task.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-lowest border border-outline-variant/30 space-y-0.5">
                <span className="text-[10px] font-bold text-outline uppercase flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-500" /> Priority Rank
                </span>
                <p className="font-bold text-amber-600">{task.importance} / 100 Score</p>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-lowest border border-outline-variant/30 space-y-0.5">
                <span className="text-[10px] font-bold text-outline uppercase flex items-center gap-1">
                  <Timer className="w-3 h-3 text-primary" /> Estimated Time
                </span>
                <p className="font-bold text-primary">{task.estimatedTime || 'N/A'}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-lowest border border-outline-variant/30 space-y-0.5">
                <span className="text-[10px] font-bold text-outline uppercase flex items-center gap-1">
                  <Paperclip className="w-3 h-3 text-primary" /> Resources
                </span>
                <p className="font-bold text-on-surface">{task.materials?.length || 0} attached items</p>
              </div>
            </div>
          </div>

          {/* Main Workspace Split Screen Layout: Left Column (Notion Notes, Multi-Tab Edge PDF Reader & Resources) / Right Column (EduSpare AI Tutor) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-6">
              {/* MS Edge-Style Multi-Tab PDF & Document Reader */}
              {openTabs.length > 0 && (
                <div className="bg-surface-container-low rounded-3xl border border-primary/40 shadow-xl overflow-hidden animate-in fade-in space-y-0">
                  {/* MS Edge Style Tab Bar */}
                  <div className="bg-surface-container-high/80 px-3 pt-2.5 flex items-center gap-1.5 overflow-x-auto border-b border-outline-variant/50 select-none">
                    {openTabs.map((tab) => {
                      const isActive = tab.id === activeTabId;
                      return (
                        <div
                          key={tab.id}
                          onClick={() => setActiveTabId(tab.id)}
                          className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-t border-x ${
                            isActive
                              ? 'bg-surface-lowest text-primary border-outline-variant/60 shadow-sm'
                              : 'bg-surface-container-low/60 text-outline hover:text-on-surface hover:bg-surface-lowest/50 border-transparent'
                          }`}
                        >
                          <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-outline'}`} />
                          <span className="max-w-[140px] truncate">{tab.title}</span>
                          <button
                            onClick={(e) => handleCloseTab(tab.id, e)}
                            className="p-0.5 rounded-full text-outline hover:text-rose-600 hover:bg-rose-500/10 transition-colors shrink-0"
                            title="Close tab"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Current Active PDF Reader Toolbar & Frame */}
                  {activeTab && (
                    <div className="bg-surface-lowest flex flex-col">
                      {/* PDF Reader Toolbar */}
                      <div className="px-4 py-2 bg-surface-container-low/50 border-b border-outline-variant/40 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-on-surface truncate">{activeTab.title}</span>
                          {activeTab.size && <span className="text-[10px] font-mono text-outline">({activeTab.size})</span>}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={activeTab.url}
                            target="_blank"
                            rel="noreferrer"
                            download={activeTab.title}
                            className="px-2.5 py-1 text-xs text-primary font-bold bg-primary/10 hover:bg-primary hover:text-white rounded-xl flex items-center gap-1 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </a>
                          <a
                            href={activeTab.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-outline hover:text-primary hover:bg-surface-container-high rounded-xl transition-colors"
                            title="Open in new window"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      {/* PDF Document Viewer Frame */}
                      <div className="bg-slate-900 flex items-center justify-center min-h-[500px]">
                        {activeTab.type === 'image' || activeTab.url.startsWith('data:image/') ? (
                          <img
                            src={activeTab.url}
                            alt={activeTab.title}
                            className="max-w-full max-h-[650px] object-contain rounded-none p-2"
                          />
                        ) : (
                          <iframe
                            src={activeTab.url}
                            className="w-full h-[650px] border-none bg-slate-900"
                            title={activeTab.title}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notion Keep Notes */}
              <NotionKeepNotes
                initialNotes={task.notes}
                onSaveNotes={handleUpdateNotes}
                onAddResource={(newMat) => {
                  handleUpdateMaterials([...(task.materials || []), newMat]);
                  handleOpenMaterialTab(newMat);
                }}
              />

              {/* Study Materials & Attachments List */}
              <TaskMaterialsList
                materials={task.materials || []}
                onUpdateMaterials={handleUpdateMaterials}
                onReadMaterial={(item) => handleOpenMaterialTab(item)}
              />
            </div>

            {/* Right Column (lg:col-span-5): Floating Sticky AI Tutor Panel */}
            <div className="lg:col-span-5 sticky top-4 self-start">
              <AITutorPanel
                taskTitle={task.title}
                category={task.category}
                notes={task.notes || undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
