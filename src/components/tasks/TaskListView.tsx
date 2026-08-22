'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useEduSpare } from '@/context/EduSpareContext';
import { formatTimeRemaining } from '@/lib/priorityAlgorithm';
import { TaskWorkspaceModal } from './TaskWorkspaceModal';
import { CreateTaskModal } from './CreateTaskModal';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Clock,
  Flame,
  ArrowRight,
  Trash2,
  MoreVertical,
  Edit3,
  ChevronDown,
  X,
} from 'lucide-react';
import { TaskItem } from '@/types/eduspare';

export const TaskListView: React.FC = () => {
  const { tasks, selectedTaskId, setSelectedTaskId, deleteTask } = useEduSpare();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);
  const [menuOpenTaskId, setMenuOpenTaskId] = useState<string | null>(null);

  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Extract categories strictly from user's active tasks (NO DEMO CATEGORIES)
  const allUserCategories = useMemo(() => {
    const cats = tasks
      .map((t) => t.category)
      .filter((c): c is string => Boolean(c && c.trim()));
    return Array.from(new Set(cats));
  }, [tasks]);

  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Filter & rank user categories according to similarity with categorySearchQuery
  const filteredCategorySuggestions = useMemo(() => {
    if (!categorySearchQuery.trim()) return allUserCategories;
    const q = categorySearchQuery.toLowerCase().trim();

    return allUserCategories
      .map((cat) => {
        const text = cat.toLowerCase();
        let score = 0;
        if (text === q) score = 100;
        else if (text.startsWith(q)) score = 80;
        else if (text.includes(q)) score = 50;
        return { cat, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.cat);
  }, [allUserCategories, categorySearchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeSelectedTask = tasks.find((t) => t.id === selectedTaskId);

  const filteredTasks = tasks.filter((t) => {
    if (filterCategory !== 'All' && t.category !== filterCategory) return false;
    if (filterStatus !== 'All' && t.status !== filterStatus) return false;
    if (
      searchTerm &&
      !t.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-lowest p-6 rounded-3xl border border-outline-variant/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <h2 className="text-[1.2rem] sm:text-2xl font-black text-on-surface">Task Workspaces</h2>
          </div>

        </div>

        <button
          onClick={() => {
            setTaskToEdit(null);
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-container text-white font-bold text-sm rounded-2xl shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          Create New Task
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-lowest p-4 rounded-2xl border border-outline-variant/60 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter tasks by title or content..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-on-surface"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-outline shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>

          {/* Searchable Dynamic Category Filter Combobox (Similarity Matching & No Demo Categories) */}
          <div className="relative w-full sm:w-auto" ref={categoryDropdownRef}>
            <div className="flex items-center bg-surface-container-low border border-outline-variant/50 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary text-xs w-full sm:w-auto">
              <input
                type="text"
                value={categorySearchQuery}
                onFocus={() => setIsCategoryDropdownOpen(true)}
                onChange={(e) => {
                  setCategorySearchQuery(e.target.value);
                  setIsCategoryDropdownOpen(true);
                }}
                placeholder={filterCategory === 'All' ? 'Search category...' : filterCategory}
                className="w-full sm:w-40 bg-transparent text-on-surface font-semibold focus:outline-none placeholder:text-outline text-xs"
              />
              {filterCategory !== 'All' ? (
                <button
                  onClick={() => {
                    setFilterCategory('All');
                    setCategorySearchQuery('');
                  }}
                  className="ml-1 text-outline hover:text-on-surface"
                  title="Clear Category Filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-outline pointer-events-none ml-1" />
              )}
            </div>

            {isCategoryDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-full sm:w-56 bg-white dark:bg-slate-900 border border-outline-variant/60 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 max-h-48 overflow-y-auto">
                <button
                  onClick={() => {
                    setFilterCategory('All');
                    setCategorySearchQuery('');
                    setIsCategoryDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center justify-between ${filterCategory === 'All'
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface hover:bg-surface-container-high'
                    }`}
                >
                  <span>All Categories</span>
                  {filterCategory === 'All' && <CheckSquare className="w-3.5 h-3.5 text-primary" />}
                </button>

                {filteredCategorySuggestions.length === 0 ? (
                  <div className="px-3 py-2 text-[11px] text-outline italic">No matching category</div>
                ) : (
                  filteredCategorySuggestions.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setFilterCategory(cat);
                        setCategorySearchQuery(cat);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center justify-between ${filterCategory === cat
                        ? 'bg-primary/10 text-primary'
                        : 'text-on-surface hover:bg-surface-container-high'
                        }`}
                    >
                      <span className="truncate">{cat}</span>
                      {filterCategory === cat && <CheckSquare className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 text-xs bg-surface-container-low border border-outline-variant/50 rounded-xl text-on-surface font-semibold"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Task Cards Grid / List */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 text-center bg-surface-lowest rounded-3xl border border-outline-variant/60 text-outline space-y-2">
          <p className="text-base font-bold">No tasks match your current filters.</p>
          <p className="text-xs">Click "Create New Task" to add a new study workspace.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task, idx) => {
            const timeInfo = formatTimeRemaining(task.dueAt);
            return (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="group p-5 rounded-3xl bg-surface-lowest hover:bg-surface-container-low shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3 relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white px-2.5 py-0.5 rounded-full bg-primary">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-outline uppercase tracking-wider">
                        {task.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${task.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : task.status === 'In Progress'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-surface-variant text-on-surface-variant'
                          }`}
                      >
                        {task.status}
                      </span>

                      {/* Top Right 3-Dot Options Button */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenTaskId(menuOpenTaskId === task.id ? null : task.id);
                          }}
                          className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
                          title="Task options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Top Right 3-Dot Dropdown Menu */}
                        {menuOpenTaskId === task.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-7 z-50 w-36 bg-white dark:bg-slate-900 border border-outline-variant/60 rounded-2xl shadow-2xl p-1.5 space-y-1 opacity-100 animate-in fade-in zoom-in-95 duration-100"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setMenuOpenTaskId(null);
                                setTaskToEdit(task);
                                setIsCreateOpen(true);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-low rounded-xl transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-primary" />
                              <span>Edit Task</span>
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                setMenuOpenTaskId(null);
                                if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
                                  await deleteTask(task.id);
                                }
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Delete Task</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                    {task.title}
                  </h3>

                  <p className="text-xs text-outline line-clamp-2 mt-1 leading-relaxed font-medium">
                    {task.description || 'Dedicated Notion workspace page with notes, resources, and AI Tutor.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-outline-variant/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold ${timeInfo.urgent
                        ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        : 'bg-primary/10 text-primary'
                        }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeInfo.text}</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold bg-amber-500/10 text-amber-700">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>{task.importance}/100</span>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary group-hover:bg-primary group-hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0">
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Workspace Modal */}
      {activeSelectedTask && (
        <TaskWorkspaceModal
          task={activeSelectedTask}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {/* Create / Edit Task Modal */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        taskToEdit={taskToEdit}
        onClose={() => {
          setIsCreateOpen(false);
          setTaskToEdit(null);
        }}
      />
    </div>
  );
};
