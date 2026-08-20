'use client';

import React, { useState, useMemo } from 'react';
import { useEduSpare } from '@/context/EduSpareContext';
import { CheckCircle2, Flame, Calendar } from 'lucide-react';

interface ActivityHeatmapProps {
  username?: string;
}

function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = () => {
  const { tasks, currentUser } = useEduSpare();
  const currentYearNum = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYearNum.toString());

  // Calculate available active years based on user history
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentYearNum);

    if (currentUser?.createdAt) {
      const joinYear = new Date(currentUser.createdAt).getFullYear();
      if (!isNaN(joinYear)) yearsSet.add(joinYear);
    }

    tasks.forEach((t) => {
      const dateSource = t.updatedAt || t.dueAt;
      if (dateSource) {
        const yr = new Date(dateSource).getFullYear();
        if (!isNaN(yr)) yearsSet.add(yr);
      }
    });

    yearsSet.add(currentYearNum - 1);
    yearsSet.add(currentYearNum - 2);

    const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);
    return sortedYears.map(String);
  }, [tasks, currentUser, currentYearNum]);

  // Filter tasks completed by current user strictly based on user performance
  const completedTasks = useMemo(() => {
    return tasks.filter((t) => t.status === 'Completed');
  }, [tasks]);

  // Map completion dates to task count per day YYYY-MM-DD (local timezone)
  const completionMap = useMemo(() => {
    const map: Record<string, number> = {};
    completedTasks.forEach((t) => {
      const dateSource = t.updatedAt || t.dueAt;
      if (dateSource) {
        const dateStr = toLocalDateString(new Date(dateSource));
        map[dateStr] = (map[dateStr] || 0) + 1;
      }
    });
    return map;
  }, [completedTasks]);

  // Generate 52 weeks activity grid aligned with Sunday as row 0
  const gridData = useMemo(() => {
    const weeks = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let startDate: Date;

    if (selectedYear === currentYearNum.toString()) {
      // Find the Sunday of the current week (0 = Sunday, 1 = Monday, ..., 4 = Thursday)
      const currentDayOfWeek = today.getDay();
      const sundayOfCurrentWeek = new Date(today);
      sundayOfCurrentWeek.setDate(today.getDate() - currentDayOfWeek);
      sundayOfCurrentWeek.setHours(0, 0, 0, 0);

      // Start 51 weeks before current week's Sunday (52 weeks total starting on Sunday)
      startDate = new Date(sundayOfCurrentWeek.getTime() - 51 * 7 * 24 * 60 * 60 * 1000);
    } else {
      // For a past year, start on the first Sunday of or before Jan 1 of that year
      const jan1 = new Date(`${selectedYear}-01-01T00:00:00`);
      const jan1DayOfWeek = jan1.getDay();
      startDate = new Date(jan1.getTime() - jan1DayOfWeek * 24 * 60 * 60 * 1000);
    }

    let totalCount = 0;
    let activeDaysCount = 0;
    let maxPeak = 0;
    let currentStreak = 0;
    let maxStreak = 0;

    for (let w = 0; w < 52; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const currentDate = new Date(startDate.getTime() + (w * 7 + d) * 24 * 60 * 60 * 1000);
        const isoKey = toLocalDateString(currentDate);
        const isFuture = currentDate > today;

        // Authentic count of tasks completed on this exact day
        const count = isFuture ? 0 : (completionMap[isoKey] || 0);

        if (!isFuture) {
          totalCount += count;
          if (count > 0) {
            activeDaysCount++;
            currentStreak++;
            if (currentStreak > maxStreak) maxStreak = currentStreak;
            if (count > maxPeak) maxPeak = count;
          } else {
            currentStreak = 0;
          }
        }

        days.push({
          dateKey: isoKey,
          date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          monthName: currentDate.toLocaleDateString('en-US', { month: 'short' }),
          dayOfWeekName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
          count,
          isFuture,
        });
      }
      weeks.push(days);
    }

    return { weeks, totalCount, activeDaysCount, maxPeak, maxStreak };
  }, [selectedYear, completionMap, currentYearNum]);

  // White for 0 tasks (empty days), with distinct background contrast
  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-white border border-outline-variant/40 hover:border-primary';
    if (count === 1) return 'bg-blue-300 hover:bg-blue-400';
    if (count === 2) return 'bg-blue-500 hover:bg-blue-600';
    if (count <= 4) return 'bg-blue-700 hover:bg-blue-800';
    return 'bg-blue-900 hover:bg-slate-900';
  };

  const dayLabels = [
    { name: 'Sun', show: true },
    { name: 'Mon', show: false },
    { name: 'Tue', show: true },
    { name: 'Wed', show: false },
    { name: 'Thu', show: true },
    { name: 'Fri', show: false },
    { name: 'Sat', show: true },
  ];

  return (
    <div className="bg-surface-lowest p-6 rounded-3xl border border-outline-variant/60 shadow-sm space-y-4">
      {/* Header & Year Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-on-surface">Activity Map</h3>
          </div>
          <p className="text-xs text-outline font-medium">
            Daily task performance history starting from Sunday up until today.
          </p>
        </div>

        {/* Dynamic Year Dropdown Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-outline">Year:</span>
          <div className="relative group">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/60 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer hover:bg-surface-container-high transition-all shadow-xs"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Heatmap Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30">
          <div className="text-xs text-outline font-semibold">Total Completed</div>
          <div className="text-xl font-black text-primary mt-0.5">{gridData.totalCount} Tasks</div>
        </div>
        <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30">
          <div className="text-xs text-outline font-semibold">Continuous Streak</div>
          <div className="text-xl font-black text-amber-600 mt-0.5 flex items-center gap-1">
            <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
            {gridData.maxStreak} Days
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30">
          <div className="text-xs text-outline font-semibold">Active Days</div>
          <div className="text-xl font-black text-emerald-600 mt-0.5 flex items-center gap-1">
            <Calendar className="w-4 h-4 text-emerald-600" />
            {gridData.activeDaysCount} Days
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30">
          <div className="text-xs text-outline font-semibold">Max Daily Peak</div>
          <div className="text-xl font-black text-purple-600 mt-0.5">
            {gridData.maxPeak} Tasks/Day
          </div>
        </div>
      </div>

      {/* 52-Week Sunday-Start Grid Area */}
      <div className="relative overflow-x-auto p-4 bg-surface-container-low/50 rounded-2xl border border-outline-variant/40">
        <div className="min-w-[720px]">
          {/* Months label bar - Exactly aligned 1-to-1 with week columns */}
          <div className="flex gap-1.5 items-center mb-2">
            {/* Day label spacer */}
            <div className="w-8 shrink-0" />

            {/* 52 Week Columns Month Header */}
            <div className="flex gap-1 flex-1 relative h-4 text-[10px] font-bold text-outline select-none">
              {gridData.weeks.map((week, wIdx) => {
                const monthName = week[0].monthName;
                const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'short' });
                const isFirstWeekOfMonth =
                  wIdx === 0
                    ? monthName !== currentMonthName
                    : gridData.weeks[wIdx - 1][0].monthName !== monthName;

                return (
                  <div key={wIdx} className="w-3.5 shrink-0 relative">
                    {isFirstWeekOfMonth && (
                      <span className="absolute left-0 top-0 whitespace-nowrap text-[10px] font-bold text-outline">
                        {monthName}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-1.5 items-start">
            {/* Days of week label - Starting from Sunday */}
            <div className="w-8 shrink-0 flex flex-col gap-1 text-[10px] font-bold text-outline select-none">
              {dayLabels.map((day, idx) => (
                <div
                  key={idx}
                  className={`h-3.5 flex items-center justify-end pr-1.5 ${day.show ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                  {day.name}
                </div>
              ))}
            </div>

            {/* Grid Cells - 52 Weeks (Row 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat) */}
            <div className="flex gap-1 flex-1">
              {gridData.weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {week.map((cell, cIdx) => (
                    <div
                      key={cIdx}
                      title={
                        cell.isFuture
                          ? undefined
                          : `${cell.count} task(s) completed on ${cell.dayOfWeekName}, ${cell.date}`
                      }
                      className={`w-3.5 h-3.5 rounded-sm transition-all ${cell.isFuture
                          ? 'opacity-0 pointer-events-none'
                          : `cursor-pointer shadow-xs ${getColorClass(cell.count)}`
                        }`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Color Scale Legend */}
      <div className="flex items-center justify-end gap-2 text-xs text-outline font-semibold">
        <span>No activity (White)</span>
        <div className="flex gap-1">
          <div className="w-3.5 h-3.5 rounded-sm bg-white border border-outline-variant/50" />
          <div className="w-3.5 h-3.5 rounded-sm bg-blue-300" />
          <div className="w-3.5 h-3.5 rounded-sm bg-blue-500" />
          <div className="w-3.5 h-3.5 rounded-sm bg-blue-700" />
          <div className="w-3.5 h-3.5 rounded-sm bg-blue-900" />
        </div>
        <span>High completion</span>
      </div>
    </div>
  );
};
