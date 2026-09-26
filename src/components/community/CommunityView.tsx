'use client';

import dynamic from 'next/dynamic';
import React, { useState, useMemo } from 'react';
import { useEduSpare } from '@/context/EduSpareContext';
import { BlogPostCard } from '../blog/BlogPostCard';
const CreateBlogModal = dynamic(() => import('../blog/CreateBlogModal').then((m) => m.CreateBlogModal), { ssr: false });
import { CommunityHeader } from './CommunityHeader';
import { CommunitySelectorPills, CommunityFilterTab } from './CommunitySelectorPills';
import { CommunityCoverCard } from './CommunityCoverCard';
import { CommunityPostBoxCard } from './CommunityPostBoxCard';
import { AdminApprovalQueueCard } from './AdminApprovalQueueCard';
import { CommunityMembersCard } from './CommunityMembersCard';
const CreateCommunityModal = dynamic(() => import('./CreateCommunityModal').then((m) => m.CreateCommunityModal), { ssr: false });
const EditCommunityCoverModal = dynamic(() => import('./EditCommunityCoverModal').then((m) => m.EditCommunityCoverModal), { ssr: false });
import { Shield, Clock, Sparkles, Users } from 'lucide-react';
import { CommunityItem } from '@/types/eduspare';

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

  // Active filter tab: All, Joined, or Admin
  const [filterTab, setFilterTab] = useState<CommunityFilterTab>('all');

  // Track the user's selected community ID independently per tab so switching tabs never carries over an un-joined selection
  const [selectedByTab, setSelectedByTab] = useState<Record<CommunityFilterTab, string | null>>({
    all: null,
    joined: null,
    admin: null,
  });

  const isUserMember = (comm?: CommunityItem | null) => {
    if (!currentUser || !comm) return false;
    return Boolean(
      comm.memberIds?.includes(currentUser.id) ||
      (currentUser.username && comm.memberIds?.includes(currentUser.username))
    );
  };

  const isUserAdmin = (comm?: CommunityItem | null) => {
    if (!currentUser || !comm) return false;
    return Boolean(
      comm.createdById === currentUser.id ||
      comm.adminIds?.includes(currentUser.id) ||
      (currentUser.username &&
        (comm.createdById === currentUser.username || comm.adminIds?.includes(currentUser.username)))
    );
  };

  const joinedCommunities = useMemo(() => communities.filter(isUserMember), [communities, currentUser]);
  const adminCommunities = useMemo(() => communities.filter(isUserAdmin), [communities, currentUser]);

  const displayedCommunities = useMemo(() => {
    if (filterTab === 'joined') return joinedCommunities;
    if (filterTab === 'admin') return adminCommunities;
    return communities;
  }, [filterTab, joinedCommunities, adminCommunities, communities]);

  // Determine active community strictly within the current tab's communities
  const activeCommunity = useMemo(() => {
    const tabSelectedId = selectedByTab[filterTab];
    if (tabSelectedId) {
      const match = displayedCommunities.find((c) => c.id === tabSelectedId);
      if (match) return match;
    }
    return displayedCommunities[0] || null;
  }, [filterTab, selectedByTab, displayedCommunities]);

  const handleSelectCommunity = (id: string) => {
    setSelectedByTab((prev) => ({ ...prev, [filterTab]: id }));
    setSelectedCommunityId(id);
  };

  const handleTabChange = (newTab: CommunityFilterTab) => {
    setFilterTab(newTab);
    const targetList =
      newTab === 'joined' ? joinedCommunities : newTab === 'admin' ? adminCommunities : communities;
    if (targetList.length > 0) {
      const existing = selectedByTab[newTab];
      const match = targetList.find((c) => c.id === existing);
      const chosenId = match ? match.id : targetList[0].id;
      setSelectedByTab((prev) => ({ ...prev, [newTab]: chosenId }));
      setSelectedCommunityId(chosenId);
    }
  };

  // User Membership & Role checks
  const isMember = isUserMember(activeCommunity);
  const isAdmin = isUserAdmin(activeCommunity);

  const isPending = Boolean(
    currentUser &&
    activeCommunity &&
    (activeCommunity.pendingRequestIds?.includes(currentUser.id) ||
      (currentUser.username && activeCommunity.pendingRequestIds?.includes(currentUser.username)))
  );

  const isInvited = Boolean(
    currentUser &&
    activeCommunity &&
    (activeCommunity.invitedUserIds?.includes(currentUser.id) ||
      (currentUser.username && activeCommunity.invitedUserIds?.includes(currentUser.username)))
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

      {/* 2. Horizontal Community Selector Tabs & Pills */}
      <CommunitySelectorPills
        filterTab={filterTab}
        onTabChange={handleTabChange}
        communities={displayedCommunities}
        activeCommunityId={activeCommunity?.id}
        currentUser={currentUser}
        onSelectCommunity={handleSelectCommunity}
        allCount={communities.length}
        joinedCount={joinedCommunities.length}
        adminCount={adminCommunities.length}
      />

      {/* Empty State when tab has no communities */}
      {displayedCommunities.length === 0 ? (
        <div className="bg-surface-lowest p-8 sm:p-10 rounded-3xl border border-outline-variant/60 text-center space-y-3.5 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-on-surface">
              {filterTab === 'joined'
                ? "You haven't joined any communities yet"
                : "You are not an admin of any communities yet"}
            </h3>
            <p className="text-xs text-outline max-w-md mx-auto">
              {filterTab === 'joined'
                ? 'Explore All Groups to find research hubs, study groups, and academic communities to join.'
                : 'Create your own member-gated community to lead discussions, share notes, and collaborate.'}
            </p>
          </div>
          <div>
            {filterTab === 'joined' ? (
              <button
                type="button"
                onClick={() => handleTabChange('all')}
                className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-md hover:bg-primary-container transition-all cursor-pointer"
              >
                Explore All Groups ({communities.length})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-md hover:bg-primary-container transition-all cursor-pointer"
              >
                + Create Community
              </button>
            )}
          </div>
        </div>
      ) : activeCommunity ? (
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
                  type="button"
                  onClick={() =>
                    activeCommunity.isPrivate
                      ? requestToJoinCommunity(activeCommunity.id)
                      : toggleJoinCommunity(activeCommunity.id, 'join')
                  }
                  className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-md hover:bg-primary-container transition-all cursor-pointer"
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
                      type="button"
                      onClick={() => setIsPostModalOpen(true)}
                      className="mt-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-primary-container cursor-pointer"
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
      ) : null}

      {/* 4. Modals */}
      {isCreateOpen && (
        <CreateCommunityModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateSubmit}
        />
      )}

      {isEditCoverOpen && activeCommunity && (
        <EditCommunityCoverModal
          isOpen={isEditCoverOpen}
          community={activeCommunity}
          onClose={() => setIsEditCoverOpen(false)}
          onSubmit={handleEditCoverSubmit}
        />
      )}

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
