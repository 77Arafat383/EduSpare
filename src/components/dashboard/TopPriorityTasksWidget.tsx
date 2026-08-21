'use client';

import React from 'react';
import { useEduSpare } from '@/context/EduSpareContext';
import { formatTimeRemaining } from '@/lib/priorityAlgorithm';
import { Flame, Clock, ChevronRight } from 'lucide-react';

export const TopPriorityTasksWidget: React.FC = () => {
  const { tasks, setSelectedTaskId, setActiveTab } = useEduSpare();

  // Top 5 tasks by priority algorithm
  const topFive = tasks.filter((t) => t.status !== 'Completed').slice(0, 5);

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setActiveTab('tasks');
  };

  return (
    <div className="bg-surface-lowest p-6 rounded-3xl border border-outline-variant/60 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold text-on-surface">Top 5 Urgent Tasks</h3>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600">
          Ranked #1-#5
        </span>
      </div>

      {topFive.length === 0 ? (
        <div className="p-4 text-center text-xs text-outline bg-surface-container-low rounded-2xl">
          No active tasks in queue.
        </div>
      ) : (
        <div className="space-y-3">
          {topFive.map((task, index) => {
            const timeInfo = formatTimeRemaining(task.dueAt);
            return (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task.id)}
                className="group p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/40 transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      index === 0
                        ? 'bg-rose-500 text-white shadow-sm'
                        : index === 1
                        ? 'bg-amber-500 text-white'
                        : 'bg-surface-variant text-on-surface-variant'
                    }`}
                  >
                    #{index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-semibold text-outline">
                        {task.category}
                      </span>
                      <span className="text-[10px] text-amber-600 font-bold">
                        ★ {task.importance} Score
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-rose-600 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {timeInfo.text}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-outline group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
