'use client';

import { compressImageToDataUrl, IMAGE_PRESETS } from '@/lib/imageCompression';

import dynamic from 'next/dynamic';

import React, { useState, useEffect } from 'react';
import { useEduSpare } from '@/context/EduSpareContext';
import { User, BlogPost, SavedVaultItem } from '@/types/eduspare';
const CreateBlogModal = dynamic(() => import('../blog/CreateBlogModal').then((m) => m.CreateBlogModal), { ssr: false });
import { ActivityHeatmap } from '../dashboard/ActivityHeatmap';

import { ProfileHeaderCard } from './ProfileHeaderCard';
import { EditProfileForm } from './EditProfileForm';
import { ProfileBiodataTab } from './ProfileBiodataTab';
import { ProfileBlogsTab } from './ProfileBlogsTab';
import { ProfileSavedVaultTab } from './ProfileSavedVaultTab';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    selectedUsername,
    savedItems,
    tasks,
    communities,
    setActiveTab,
    setActiveChatUser,
    updateUserProfile,
    deleteUserProfile,
    setSelectedBlogId,
    deleteSavedItem,
  } = useEduSpare();

  const [activeSubTab, setActiveSubTab] = useState<'biodata' | 'blogs' | 'saved' | 'activity'>('biodata');
  const [profileData, setProfileData] = useState<{ user: User; blogs: BlogPost[]; savedItems: SavedVaultItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isCreateBlogOpen, setIsCreateBlogOpen] = useState(false);

  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editUniversity, setEditUniversity] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editCoverImage, setEditCoverImage] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editAcademicStatus, setEditAcademicStatus] = useState('');
  const [editRelationshipStatus, setEditRelationshipStatus] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editInterests, setEditInterests] = useState('');

  const targetUsername = selectedUsername || currentUser?.username;
  const isOwnProfile = currentUser?.username === targetUsername;

  useEffect(() => {
    async function loadProfile() {
      if (!targetUsername) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/profile?username=${targetUsername}`);
        const data = await res.json();
        if (data.user) {
          setProfileData(data);
          setEditName(data.user.name);
          setEditBio(data.user.bio || '');
          setEditUniversity(data.user.university || '');
          setEditAvatar(data.user.avatar || '/assets/default_avatar.svg');
          setEditCoverImage(data.user.coverImage || '/assets/default_cover.png');
          setEditBirthday(data.user.birthday || '');
          setEditGender(data.user.gender || '');
          setEditAcademicStatus(data.user.academicStatus || '');
          setEditRelationshipStatus(data.user.relationshipStatus || '');
          setEditPhone(data.user.phone || '');
          setEditAddress(data.user.address || '');
          setEditInterests(data.user.interests || '');
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [targetUsername, currentUser]);

  if (loading || !profileData) {
    return (
      <div className="p-12 text-center text-xs text-outline font-semibold">
        Loading user profile...
      </div>
    );
  }

  const { user, blogs } = profileData;

  const handleStartChat = () => {
    setActiveChatUser(user);
    setActiveTab('chat');
  };

  const handleDeleteProfile = async () => {
    if (
      confirm(
        `Are you sure you want to permanently delete your EduSpare profile (${user.name})? This action CANNOT be undone.`
      )
    ) {
      const success = await deleteUserProfile();
      if (success) {
        alert('Your profile has been deleted successfully.');
      } else {
        alert('Failed to delete profile. Please try again.');
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser = await updateUserProfile({
      name: editName,
      bio: editBio,
      university: editUniversity,
      avatar: editAvatar,
      coverImage: editCoverImage,
      birthday: editBirthday,
      gender: editGender,
      academicStatus: editAcademicStatus,
      relationshipStatus: editRelationshipStatus,
      phone: editPhone,
      address: editAddress,
      interests: editInterests,
    });

    if (updatedUser) {
      setProfileData((prev) => (prev ? { ...prev, user: updatedUser } : null));
    } else {
      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              user: {
                ...prev.user,
                name: editName,
                bio: editBio,
                university: editUniversity,
                avatar: editAvatar,
                coverImage: editCoverImage,
                birthday: editBirthday,
                gender: editGender,
                academicStatus: editAcademicStatus,
                relationshipStatus: editRelationshipStatus,
                phone: editPhone,
                address: editAddress,
                interests: editInterests,
              },
            }
          : null
      );
    }

    setIsEditingBio(false);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageToDataUrl(file, IMAGE_PRESETS.avatar).then(setEditAvatar);
    }
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageToDataUrl(file, IMAGE_PRESETS.cover).then(setEditCoverImage);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header Banner */}
      <ProfileHeaderCard
        user={user}
        isOwnProfile={isOwnProfile}
        isEditingBio={isEditingBio}
        setIsEditingBio={setIsEditingBio}
        handleStartChat={handleStartChat}
        handleDeleteProfile={handleDeleteProfile}
      />

      {/* Bio & Photos Edit Form if open */}
      {isEditingBio && (
        <EditProfileForm
          editName={editName}
          setEditName={setEditName}
          editUniversity={editUniversity}
          setEditUniversity={setEditUniversity}
          editAvatar={editAvatar}
          setEditAvatar={setEditAvatar}
          editCoverImage={editCoverImage}
          setEditCoverImage={setEditCoverImage}
          editBio={editBio}
          setEditBio={setEditBio}
          editAcademicStatus={editAcademicStatus}
          setEditAcademicStatus={setEditAcademicStatus}
          editBirthday={editBirthday}
          setEditBirthday={setEditBirthday}
          editGender={editGender}
          setEditGender={setEditGender}
          editRelationshipStatus={editRelationshipStatus}
          setEditRelationshipStatus={setEditRelationshipStatus}
          editPhone={editPhone}
          setEditPhone={setEditPhone}
          editAddress={editAddress}
          setEditAddress={setEditAddress}
          editInterests={editInterests}
          setEditInterests={setEditInterests}
          handleSaveProfile={handleSaveProfile}
          handleAvatarFileChange={handleAvatarFileChange}
          handleCoverFileChange={handleCoverFileChange}
          setIsEditingBio={setIsEditingBio}
        />
      )}

      {/* Navigation Sub-Tabs Bar */}
      <div className="bg-surface-lowest rounded-3xl border border-outline-variant/60 shadow-sm overflow-hidden">
        <div className="flex border-b border-outline-variant/40 px-3 sm:px-6 font-bold text-xs text-outline overflow-x-auto select-none">
          <button
            onClick={() => setActiveSubTab('biodata')}
            className={`py-3 px-3 sm:px-4 border-b-2 whitespace-nowrap shrink-0 transition-colors ${
              activeSubTab === 'biodata'
                ? 'border-primary text-primary'
                : 'border-transparent hover:text-on-surface'
            }`}
          >
            Academic Biodata
          </button>

          <button
            onClick={() => setActiveSubTab('blogs')}
            className={`py-3 px-3 sm:px-4 border-b-2 whitespace-nowrap shrink-0 transition-colors ${
              activeSubTab === 'blogs'
                ? 'border-primary text-primary'
                : 'border-transparent hover:text-on-surface'
            }`}
          >
            Published Blogs ({blogs.length})
          </button>

          {isOwnProfile && (
            <button
              onClick={() => setActiveSubTab('saved')}
              className={`py-3 px-3 sm:px-4 border-b-2 whitespace-nowrap shrink-0 transition-colors ${
                activeSubTab === 'saved'
                  ? 'border-primary text-primary'
                  : 'border-transparent hover:text-on-surface'
              }`}
            >
              Saved Vault ({savedItems.length})
            </button>
          )}

          <button
            onClick={() => setActiveSubTab('activity')}
            className={`py-3 px-3 sm:px-4 border-b-2 whitespace-nowrap shrink-0 transition-colors ${
              activeSubTab === 'activity'
                ? 'border-primary text-primary'
                : 'border-transparent hover:text-on-surface'
            }`}
          >
            Activity Map
          </button>
        </div>
      </div>

      {/* Tab Content Views */}
      {activeSubTab === 'biodata' && (
        <ProfileBiodataTab
          user={user}
          blogs={blogs}
          tasks={tasks}
          communities={communities}
        />
      )}

      {activeSubTab === 'blogs' && (
        <ProfileBlogsTab
          user={user}
          blogs={blogs}
          isOwnProfile={isOwnProfile}
          setIsCreateBlogOpen={setIsCreateBlogOpen}
        />
      )}

      {activeSubTab === 'saved' && isOwnProfile && (
        <ProfileSavedVaultTab
          savedItems={savedItems}
          setSelectedBlogId={setSelectedBlogId}
          setActiveTab={setActiveTab}
          deleteSavedItem={deleteSavedItem}
        />
      )}

      {activeSubTab === 'activity' && (
        <ActivityHeatmap username={user.username} />
      )}

      {/* Create Blog Modal */}
      {isCreateBlogOpen && (
      <CreateBlogModal isOpen={isCreateBlogOpen} onClose={() => setIsCreateBlogOpen(false)} />
      )}
    </div>
  );
};
