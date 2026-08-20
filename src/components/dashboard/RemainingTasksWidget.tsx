'use client';

import React from 'react';
import { useEduSpare } from '@/context/EduSpareContext';
import { formatTimeRemaining } from '@/lib/priorityAlgorithm';
import { CheckSquare, Clock, Flame, ArrowRight, Plus } from 'lucide-react';

interface RemainingTasksWidgetProps {
  onOpenCreateModal: () => void;
}

export const RemainingTasksWidget: React.FC<RemainingTasksWidgetProps> = ({
  onOpenCreateModal,
}) => {
  const { tasks, setSelectedTaskId, setActiveTab, updateTask } = useEduSpare();

  const remainingTasks = tasks.filter((t) => t.status !== 'Completed');

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setActiveTab('tasks');
  };

  return (
    <div className="bg-surface-lowest p-6 rounded-3xl border border-outline-variant/60 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-on-surface">Remaining Tasks</h3>
          </div>
          <p className="text-xs text-outline font-medium">
            Prioritized by remaining time & importance rating
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary text-white rounded-xl shadow-sm hover:bg-primary-container transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {remainingTasks.length === 0 ? (
        <div className="p-8 text-center bg-surface-container-low rounded-2xl border border-outline-variant/30 text-outline text-sm">
          🎉 All tasks completed! Click "Add Task" to create a new study goal.
        </div>
      ) : (
        <div className="space-y-2.5">
          {remainingTasks.map((task, idx) => {
            const timeInfo = formatTimeRemaining(task.dueAt);
            return (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task.id)}
                className="group p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTask(task.id, { status: 'Completed' });
                    }}
                    className="mt-0.5 w-5 h-5 rounded-md border-2 border-outline hover:border-primary flex items-center justify-center transition-colors shrink-0"
                    title="Mark as completed"
                  >
                    <span className="w-2.5 h-2.5 rounded-sm bg-primary opacity-0 hover:opacity-100 transition-opacity" />
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">
                        #{idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                        {task.title}
                      </h4>
                    </div>

                    <p className="text-xs text-outline line-clamp-1 font-medium">
                      {task.description || 'Click to open dedicated Notion workspace page...'}
                    </p>
                  </div>
                </div>

                {/* Priority & Deadline Badges */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <div
                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold border ${
                      timeInfo.urgent
                        ? 'bg-rose-500/10 text-rose-600 border-rose-500/30 animate-pulse'
                        : 'bg-primary/10 text-primary border-primary/20'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timeInfo.text}</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold bg-amber-500/10 text-amber-700 border border-amber-500/30">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>{task.importance}/100</span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-outline group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
