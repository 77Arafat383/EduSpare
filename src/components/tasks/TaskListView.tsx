'use client';

import React, { useState } from 'react';
import { useEduSpare } from '@/context/EduSpareContext';
import { formatTimeRemaining } from '@/lib/priorityAlgorithm';
import { TaskWorkspaceModal } from './TaskWorkspaceModal';
import { CreateTaskModal } from './CreateTaskModal';
import { CheckSquare, Plus, Search, Filter, Clock, Flame, ArrowRight, Trash2 } from 'lucide-react';

export const TaskListView: React.FC = () => {
  const { tasks, selectedTaskId, setSelectedTaskId, deleteTask, updateTask } = useEduSpare();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

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
            <CheckSquare className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-black text-on-surface">Task Workspaces</h2>
          </div>
          <p className="text-xs text-outline font-medium">
            Strict algorithm ranking: Less remaining time first, tie-broken by importance score (0-100)
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
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

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-outline">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 text-xs bg-surface-container-low border border-outline-variant/50 rounded-xl text-on-surface font-semibold"
          >
            <option value="All">All Categories</option>
            <option value="Backend Engineering">Backend Engineering</option>
            <option value="AI & Mathematics">AI & Mathematics</option>
            <option value="Physics & Quantum">Physics & Quantum</option>
            <option value="Database Systems">Database Systems</option>
            <option value="Frontend Engineering">Frontend Engineering</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-xs bg-surface-container-low border border-outline-variant/50 rounded-xl text-on-surface font-semibold"
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
                className="group p-5 rounded-3xl bg-surface-lowest hover:bg-surface-container-low border border-outline-variant/60 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3 relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white px-2.5 py-0.5 rounded-full bg-primary">
                        #{idx + 1} Rank
                      </span>
                      <span className="text-xs font-bold text-outline uppercase tracking-wider">
                        {task.category}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        task.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : task.status === 'In Progress'
                          ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-surface-variant text-on-surface-variant'
                      }`}
                    >
                      {task.status}
                    </span>
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
                      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold ${
                        timeInfo.urgent
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

                  <div className="flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                    <span>Open Workspace</span>
                    <ArrowRight className="w-4 h-4" />
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

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
};
