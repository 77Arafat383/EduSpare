'use client';

import React from 'react';
import { User, BlogPost, TaskItem, CommunityItem } from '@/types/eduspare';
import {
  CheckCircle2,
  BookOpen,
  Flame,
  Calendar,
  GraduationCap,
  Cake,
  User as UserIcon,
  Heart,
  Phone,
  Mail,
  MapPin,
  Users,
  Sparkles,
} from 'lucide-react';

interface ProfileBiodataTabProps {
  user: User;
  blogs: BlogPost[];
  tasks: TaskItem[];
  communities: CommunityItem[];
}

export const ProfileBiodataTab: React.FC<ProfileBiodataTabProps> = ({
  user,
  blogs,
  tasks,
  communities,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-surface-lowest p-6 rounded-3xl border border-outline-variant/60 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-on-surface">Biography & Background</h3>
        <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
          {user.bio || 'No bio specified.'}
        </p>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30">
            <div className="text-[10px] text-outline font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>Tasks Completed</span>
            </div>
            <div className="text-sm font-extrabold text-primary mt-1">
              {tasks.filter((t) => t.status === 'Completed').length} Tasks
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30">
            <div className="text-[10px] text-outline font-semibold flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-purple-600" />
              <span>Posted Blogs</span>
            </div>
            <div className="text-sm font-extrabold text-purple-600 mt-1">
              {blogs.length} Articles
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30">
            <div className="text-[10px] text-outline font-semibold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Active Streak</span>
            </div>
            <div className="text-sm font-extrabold text-amber-600 mt-1">
              {user.activeStreak} Days
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30">
            <div className="text-[10px] text-outline font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Member Since</span>
            </div>
            <div className="text-sm font-extrabold text-on-surface mt-1">
              {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Personal & Academic Details Section */}
      <div className="bg-surface-lowest p-6 rounded-3xl border border-outline-variant/60 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          <span>Personal & Academic Details</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-outline uppercase">Academic Status</div>
              <div className="text-xs font-bold text-on-surface">
                {user.academicStatus || 'Not specified'}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <Cake className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-outline uppercase">Birthday</div>
              <div className="text-xs font-bold text-on-surface">
                {user.birthday || 'Not specified'}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-outline uppercase">Gender</div>
              <div className="text-xs font-bold text-on-surface">
                {user.gender || 'Not specified'}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-outline uppercase">Relational Status</div>
              <div className="text-xs font-bold text-on-surface">
                {user.relationshipStatus || 'Not specified'}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-outline uppercase">Phone Number</div>
              <div className="text-xs font-bold text-on-surface">
                {user.phone || 'Not specified'}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-outline uppercase">Email Address</div>
              <div className="text-xs font-bold text-on-surface truncate">
                {user.email}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-3 sm:col-span-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-outline uppercase">Present Address</div>
              <div className="text-xs font-bold text-on-surface">
                {user.address || 'Not specified'}
              </div>
            </div>
          </div>
        </div>

        {/* Connected Communities */}
        <div className="pt-2 space-y-2">
          <div className="text-xs font-bold text-outline uppercase flex items-center gap-1.5">
            <Users className="w-4 h-4 text-primary" />
            <span>Connected Communities ({communities.filter((c) => c.memberIds.includes(user.id)).length})</span>
          </div>
          {communities.filter((c) => c.memberIds.includes(user.id)).length === 0 ? (
            <p className="text-xs text-outline italic">No community memberships yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {communities
                .filter((c) => c.memberIds.includes(user.id))
                .map((comm) => (
                  <span
                    key={comm.id}
                    className="px-3 py-1 bg-surface-container-high border border-outline-variant/50 text-on-surface text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {comm.name}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Interests & Research Areas */}
        <div className="pt-2 space-y-2">
          <div className="text-xs font-bold text-outline uppercase flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Academic & Personal Interests</span>
          </div>
          {!user.interests ? (
            <p className="text-xs text-outline italic">No interests specified yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {user.interests.split(',').map((interest, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 text-xs font-bold rounded-xl"
                >
                  #{interest.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
