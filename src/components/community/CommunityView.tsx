'use client';

import React, { useState } from 'react';
import { useEduSpare } from '@/context/EduSpareContext';
import { BlogPostCard } from '../blog/BlogPostCard';
import { CreateBlogModal } from '../blog/CreateBlogModal';
import { CommunityHeader } from './CommunityHeader';
import { CommunitySelectorPills } from './CommunitySelectorPills';
import { CommunityCoverCard } from './CommunityCoverCard';
import { CommunityPostBoxCard } from './CommunityPostBoxCard';
import { AdminApprovalQueueCard } from './AdminApprovalQueueCard';
import { CommunityMembersCard } from './CommunityMembersCard';
import { CreateCommunityModal } from './CreateCommunityModal';
import { EditCommunityCoverModal } from './EditCommunityCoverModal';
import { Shield, Clock, Sparkles, PenSquare } from 'lucide-react';

export const CommunityView: React.FC = () => {
  const {
    communities,
    blogs,
    currentUser,
    allUsers,
    createCommunity,
    toggleJoinCommunity,
    requestToJoinCommunity,
    cancelRequestToJoinCommunity,
    handleMembershipRequest,
    updateCommunityDetails,
    approveCommunityBlog,
    removeCommunityMember,
    inviteUserToCommunity,
    acceptCommunityInvite,
    declineCommunityInvite,
    deleteCommunity,
    deleteBlog,
    selectedCommunityId,
    setSelectedCommunityId,
  } = useEduSpare();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditCoverOpen, setIsEditCoverOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const activeCommunity =
    communities.find((c) => c.id === selectedCommunityId) || communities[0];

  // User Membership & Role checks
  const isMember = Boolean(
    currentUser && activeCommunity && activeCommunity.memberIds?.includes(currentUser.id)
  );

  const isAdmin = Boolean(
    currentUser &&
    activeCommunity &&
    (activeCommunity.createdById === currentUser.id ||
      activeCommunity.adminIds?.includes(currentUser.id))
  );

  const isPending = Boolean(
    currentUser && activeCommunity && activeCommunity.pendingRequestIds?.includes(currentUser.id)
  );

  const isInvited = Boolean(
    currentUser && activeCommunity && activeCommunity.invitedUserIds?.includes(currentUser.id)
  );

  // Community-exclusive blogs
  const communityBlogs = blogs.filter((b) => b.communityId === activeCommunity?.id);
  const approvedCommunityBlogs = communityBlogs.filter((b) => b.isApproved !== false);
  const pendingCommunityBlogs = communityBlogs.filter((b) => b.isApproved === false);

  const handleCreateSubmit = async (data: {
    name: string;
    description: string;
    image: string;
    avatarImage?: string;
    rules?: string;
    tags: string[];
    isPrivate: boolean;
  }) => {
    await createCommunity(data);
  };

  const handleEditCoverSubmit = async (data: {
    image: string;
    avatarImage?: string;
    name: string;
    description: string;
    rules?: string;
    isPrivate: boolean;
  }) => {
    if (!activeCommunity) return;
    await updateCommunityDetails(activeCommunity.id, data);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header Bar */}
      <CommunityHeader onOpenCreate={() => setIsCreateOpen(true)} />

      {/* 2. Horizontal Community Selector Pills */}
      <CommunitySelectorPills
        communities={communities}
        activeCommunityId={activeCommunity?.id}
        currentUser={currentUser}
        onSelectCommunity={(id) => setSelectedCommunityId(id)}
      />

      {/* 3. Selected Community Workspace */}
      {activeCommunity && (
        <div className="space-y-3">
          {/* Cover Page Header & Post Creation Box Group (Tight Spacing) */}
          <div className="space-y-2">
            <CommunityCoverCard
              community={activeCommunity}
              currentUser={currentUser}
              communityBlogsCount={approvedCommunityBlogs.length}
              isMember={isMember}
              isAdmin={isAdmin}
              isPending={isPending}
              isInvited={isInvited}
              allUsers={allUsers}
              onOpenEditCover={() => setIsEditCoverOpen(true)}
              onOpenCreatePost={() => setIsPostModalOpen(true)}
              onJoin={() => toggleJoinCommunity(activeCommunity.id, 'join')}
              onRequestJoin={() => requestToJoinCommunity(activeCommunity.id)}
              onLeave={() => toggleJoinCommunity(activeCommunity.id, 'leave')}
              onDeleteCommunity={() => deleteCommunity(activeCommunity.id)}
              onCancelRequest={() => cancelRequestToJoinCommunity(activeCommunity.id)}
              onAcceptInvite={() => acceptCommunityInvite(activeCommunity.id)}
              onDeclineInvite={() => declineCommunityInvite(activeCommunity.id)}
              onRemoveMember={(memberId) => removeCommunityMember(activeCommunity.id, memberId)}
              onInviteMember={(targetUserId) => inviteUserToCommunity(activeCommunity.id, targetUserId)}
            />

            {isMember && (
              <CommunityPostBoxCard
                community={activeCommunity}
                currentUser={currentUser}
                onOpenCreatePost={() => setIsPostModalOpen(true)}
              />
            )}
          </div>

          {/* Admin Approval Queue (Pending Membership Join Requests & Pending Blog Posts) */}
          {isAdmin && (
            <AdminApprovalQueueCard
              pendingRequestIds={activeCommunity.pendingRequestIds || []}
              pendingBlogs={pendingCommunityBlogs}
              allUsers={allUsers}
              onApproveUser={(applicantId) =>
                handleMembershipRequest(activeCommunity.id, applicantId, 'approve')
              }
              onRejectUser={(applicantId) =>
                handleMembershipRequest(activeCommunity.id, applicantId, 'reject')
              }
              onApproveBlog={(blogId) => approveCommunityBlog(blogId)}
              onRejectBlog={(blogId) => deleteBlog(blogId)}
            />
          )}

          {/* Member Access Control & Community Feed */}
          {!isMember ? (
            <div className="p-8 rounded-3xl bg-surface-container-low border border-outline-variant/60 text-center space-y-3 shadow-sm">
              <Shield className="w-10 h-10 text-primary mx-auto" />
              <h4 className="text-base font-bold text-on-surface">Member-Only Community Hub</h4>
              <p className="text-xs text-outline max-w-md mx-auto font-medium leading-relaxed">
                Only community members and admins can view exclusive research papers, write community blog posts, and interact with members in this hub.
              </p>
              {isPending ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-600 rounded-xl text-xs font-bold border border-amber-500/30">
                  <Clock className="w-4 h-4 animate-pulse" /> Your join request is currently under review by the Community Admin.
                </div>
              ) : (
                <button
                  onClick={() =>
                    activeCommunity.isPrivate
                      ? requestToJoinCommunity(activeCommunity.id)
                      : toggleJoinCommunity(activeCommunity.id, 'join')
                  }
                  className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-md hover:bg-primary-container transition-all"
                >
                  {activeCommunity.isPrivate ? 'Request Membership Approval' : 'Join Community Now'}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Community Blog Feed */}
              <div className="space-y-4">


                {approvedCommunityBlogs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-outline bg-surface-lowest rounded-3xl border border-outline-variant/60 shadow-sm space-y-2">
                    <Sparkles className="w-6 h-6 text-primary mx-auto opacity-80" />
                    <p className="font-bold text-on-surface">No approved community posts published yet.</p>
                    <p>Be the first member to post a research article or study guide to this community!</p>
                    <button
                      onClick={() => setIsPostModalOpen(true)}
                      className="mt-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-primary-container"
                    >
                      Post First Article
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {approvedCommunityBlogs.map((b) => (
                      <BlogPostCard key={b.id} post={b} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Modals */}
      <CreateCommunityModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <EditCommunityCoverModal
        isOpen={isEditCoverOpen}
        community={activeCommunity}
        onClose={() => setIsEditCoverOpen(false)}
        onSubmit={handleEditCoverSubmit}
      />

      {isPostModalOpen && activeCommunity && (
        <CreateBlogModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          defaultCommunityId={activeCommunity.id}
        />
      )}
    </div>
  );
};
