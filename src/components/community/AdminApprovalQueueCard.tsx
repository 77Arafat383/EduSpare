'use client';

import React from 'react';
import { BlogPost, User } from '@/types/eduspare';
import { ShieldCheck, UserCheck, UserX, Check, X, FileText } from 'lucide-react';

interface AdminApprovalQueueCardProps {
  pendingRequestIds: string[];
  pendingBlogs: BlogPost[];
  allUsers: User[];
  onApproveUser: (applicantId: string) => void;
  onRejectUser: (applicantId: string) => void;
  onApproveBlog: (blogId: string) => void;
  onRejectBlog: (blogId: string) => void;
}

export const AdminApprovalQueueCard: React.FC<AdminApprovalQueueCardProps> = ({
  pendingRequestIds,
  pendingBlogs,
  allUsers,
  onApproveUser,
  onRejectUser,
  onApproveBlog,
  onRejectBlog,
}) => {
  const hasPendingItems = pendingRequestIds.length > 0 || pendingBlogs.length > 0;
  if (!hasPendingItems) return null;

  return (
    <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/30 space-y-4 shadow-sm">
      <div className="flex items-center gap-2 text-amber-700">
        <ShieldCheck className="w-5 h-5 text-amber-600" />
        <h4 className="text-sm font-bold text-on-surface">
          Admin Governance & Approval Queue ({pendingRequestIds.length + pendingBlogs.length})
        </h4>
      </div>

      {/* 1. Pending Join Requests Section */}
      {pendingRequestIds.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-outline uppercase tracking-wider">
            Pending Membership Requests ({pendingRequestIds.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {pendingRequestIds.map((applicantId) => {
              const applicant = allUsers.find((u) => u.id === applicantId);
              return (
                <div
                  key={applicantId}
                  className="p-3 rounded-2xl bg-surface-lowest border border-outline-variant/40 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={applicant?.avatar || '/assets/default_avatar.png'}
                      alt="Applicant"
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-on-surface truncate block">
                        {applicant?.name || 'User'}
                      </span>
                      <span className="text-[10px] text-outline">@{applicant?.username}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onApproveUser(applicantId)}
                      className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-xs"
                      title="Approve Member"
                    >
                      <UserCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRejectUser(applicantId)}
                      className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-xs"
                      title="Reject Request"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Pending Blog Posts Approval Section */}
      {pendingBlogs.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-amber-500/20">
          <p className="text-xs font-bold text-outline uppercase tracking-wider">
            Pending Article Submissions ({pendingBlogs.length})
          </p>
          <div className="space-y-2">
            {pendingBlogs.map((blog) => (
              <div
                key={blog.id}
                className="p-3.5 rounded-2xl bg-surface-lowest border border-outline-variant/40 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-on-surface truncate">{blog.title}</h5>
                    <p className="text-[10px] text-outline">
                      Authored by @{blog.author?.username} on {new Date(blog.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onApproveBlog(blog.id)}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve Post
                  </button>
                  <button
                    onClick={() => onRejectBlog(blog.id)}
                    className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
