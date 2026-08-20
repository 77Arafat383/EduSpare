'use client';

import React from 'react';
import { useEduSpare } from '@/context/EduSpareContext';
import { User, Award, BookOpen, CheckSquare, ChevronRight, ExternalLink } from 'lucide-react';

export const ProfileSummaryCard: React.FC = () => {
  const { currentUser, tasks, blogs, setActiveTab, setSelectedUsername } = useEduSpare();

  if (!currentUser) return null;

  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const userBlogsCount = blogs.filter((b) => b.authorId === currentUser.id).length;

  const handleProfileClick = () => {
    setSelectedUsername(currentUser.username);
    setActiveTab('profile');
  };

  return (
    <div
      onClick={handleProfileClick}
      className="group bg-gradient-to-br from-surface-lowest via-surface-container-low to-surface-variant p-6 rounded-3xl border border-outline-variant/60 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-primary/20 group-hover:scale-105 transition-transform"
            />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
              ✓
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-on-surface group-hover:text-primary transition-colors">
                {currentUser.name}
              </h2>
              <ExternalLink className="w-4 h-4 text-outline opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs text-outline font-medium">@{currentUser.username}</p>
            <p className="text-xs font-semibold text-primary mt-1">{currentUser.university}</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
          <Award className="w-4 h-4" />
          <span>{currentUser.rank}</span>
        </div>
      </div>

      <p className="text-xs text-on-surface-variant mt-4 line-clamp-2 leading-relaxed font-medium">
        {currentUser.bio}
      </p>

      {/* Quick Stat Pills */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-outline-variant/40">
        <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-lowest border border-outline-variant/30">
          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <div className="text-[10px] text-outline font-semibold">Completed</div>
            <div className="text-sm font-extrabold text-on-surface">{completedCount} Tasks</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-lowest border border-outline-variant/30">
          <BookOpen className="w-4 h-4 text-purple-600 shrink-0" />
          <div>
            <div className="text-[10px] text-outline font-semibold">Authored</div>
            <div className="text-sm font-extrabold text-on-surface">{userBlogsCount} Blogs</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-lowest border border-outline-variant/30">
          <Award className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <div className="text-[10px] text-outline font-semibold">Points</div>
            <div className="text-sm font-extrabold text-on-surface">{currentUser.totalPoints} PTS</div>
          </div>
        </div>
      </div>
    </div>
  );
};
