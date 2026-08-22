'use client';

import React, { useState, useEffect } from 'react';
import { useEduSpare } from '@/context/EduSpareContext';
import { User, BlogPost, SavedVaultItem, isUserActive } from '@/types/eduspare';
import { BlogPostCard } from '../blog/BlogPostCard';
import { CreateBlogModal } from '../blog/CreateBlogModal';
import { ActivityHeatmap } from '../dashboard/ActivityHeatmap';
import {
  User as UserIcon,
  MessageSquare,
  BookOpen,
  Bookmark,
  Award,
  Flame,
  GraduationCap,
  Calendar,
  ExternalLink,
  Edit2,
  FileText,
  Trash2,
  Plus,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Cake,
  Heart,
  Sparkles,
  Users,
  Globe,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    allUsers,
    selectedUsername,
    savedItems,
    tasks,
    communities,
    setActiveTab,
    setActiveChatUser,
    updateUserProfile,
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
          setEditAvatar(data.user.avatar || '/assets/default_avatar.png');
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
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditCoverImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header Banner */}
      <div className="bg-surface-lowest rounded-3xl border border-outline-variant/60 shadow-sm overflow-hidden">
        {/* Cover Backdrop */}
        <div className="h-32 sm:h-44 relative bg-gradient-to-r from-primary via-primary-container to-purple-600 overflow-hidden">
          <img
            src={user.coverImage || '/assets/default_cover.png'}
            alt="Cover Backdrop"
            className="w-full h-full object-cover"
          />
        </div>

        {/* User Info Row */}
        <div className="p-4 sm:p-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 -mt-10 sm:-mt-12">
            <img
              src={user.avatar || '/assets/default_avatar.png'}
              alt={user.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-white shadow-xl bg-surface-lowest shrink-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-on-surface">{user.name}</h1>
                <span className="text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                  @{user.username}
                </span>
                {isUserActive(user.lastActiveAt) ? (
                  <span className="px-2.5 py-0.5 text-[11px] font-extrabold bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active Now
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-surface-container-high text-outline rounded-full border border-outline-variant/40 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" /> Offline
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-outline flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-primary" />
                {user.university || 'Educational Scholar'}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {!isOwnProfile ? (
              <button
                onClick={handleStartChat}
                className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-2xl shadow-md hover:bg-primary-container transition-all flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Message User
              </button>
            ) : (
              <button
                onClick={() => setIsEditingBio(!isEditingBio)}
                className="px-4 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-2xl hover:bg-surface-variant transition-colors flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Bio & Photos Edit Form if open */}
        {isEditingBio && (
          <form onSubmit={handleSaveProfile} className="p-4 sm:p-6 border-t border-outline-variant/40 bg-surface-container-low space-y-4">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Edit Academic Biodata & Profile Pictures
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-lowest border border-outline-variant/60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">University / Institution</label>
                <input
                  type="text"
                  value={editUniversity}
                  onChange={(e) => setEditUniversity(e.target.value)}
                  placeholder="University / Major"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-lowest border border-outline-variant/60"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-outline uppercase">Profile Picture (Avatar)</label>
                <div className="flex items-center gap-2">
                  <label className="px-2.5 py-1 text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl cursor-pointer transition-colors">
                    Upload New Avatar
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditAvatar('/assets/default_avatar.png')}
                    className="px-2.5 py-1 text-xs font-bold bg-surface-variant hover:bg-primary/10 rounded-xl text-on-surface-variant"
                  >
                    Reset Default Avatar
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <img
                  src={editAvatar || '/assets/default_avatar.png'}
                  alt="Avatar Preview"
                  className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-primary/20"
                />
                <input
                  type="text"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="/assets/default_avatar.png or image URL / uploaded data"
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/60"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-outline uppercase">Cover Photo Background</label>
                <div className="flex items-center gap-2">
                  <label className="px-2.5 py-1 text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl cursor-pointer transition-colors">
                    Upload New Cover
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverFileChange}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditCoverImage('/assets/default_cover.png')}
                    className="px-2.5 py-1.5 text-xs font-bold bg-surface-variant hover:bg-primary/10 rounded-xl text-on-surface-variant"
                  >
                    Reset Default Cover
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="w-16 h-8 rounded-lg overflow-hidden bg-surface-container-low shrink-0 border border-outline-variant/40">
                  <img
                    src={editCoverImage || '/assets/default_cover.png'}
                    alt="Cover Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <input
                  type="text"
                  value={editCoverImage}
                  onChange={(e) => setEditCoverImage(e.target.value)}
                  placeholder="/assets/default_cover.png or image URL / uploaded data"
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-outline uppercase mb-1">Bio / Academic Summary</label>
              <textarea
                rows={2}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Share your research interests and academic goals..."
                className="w-full p-3 text-xs rounded-xl bg-surface-lowest border border-outline-variant/60"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Academic Status</label>
                <input
                  type="text"
                  value={editAcademicStatus}
                  onChange={(e) => setEditAcademicStatus(e.target.value)}
                  placeholder="e.g. Honours 3rd Year, Masters 1st Year"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-lowest border border-outline-variant/60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Birthday</label>
                <input
                  type="text"
                  value={editBirthday}
                  onChange={(e) => setEditBirthday(e.target.value)}
                  placeholder="e.g. 15 August 2002"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-lowest border border-outline-variant/60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Gender</label>
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-lowest border border-outline-variant/60 text-on-surface"
                >
                  <option value="">Not Specified</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Relationship Status</label>
                <input
                  type="text"
                  value={editRelationshipStatus}
                  onChange={(e) => setEditRelationshipStatus(e.target.value)}
                  placeholder="e.g. Single, Married, Scholar"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-lowest border border-outline-variant/60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Contact Number"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-lowest border border-outline-variant/60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Address / Location</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Location / City"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-lowest border border-outline-variant/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-outline uppercase mb-1">Interests / Focus Tags</label>
              <input
                type="text"
                value={editInterests}
                onChange={(e) => setEditInterests(e.target.value)}
                placeholder="Comma separated e.g. Algorithms, Data Science, AI, Web Development"
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-lowest border border-outline-variant/60"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingBio(false)}
                className="px-4 py-2 text-xs font-semibold text-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-primary rounded-xl shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Navigation Sub-Tabs */}
        <div className="flex border-t border-outline-variant/40 px-3 sm:px-6 font-bold text-xs text-outline overflow-x-auto select-none">
          <button
            onClick={() => setActiveSubTab('biodata')}
            className={`py-3 px-3 sm:px-4 border-b-2 whitespace-nowrap shrink-0 transition-colors ${activeSubTab === 'biodata'
              ? 'border-primary text-primary'
              : 'border-transparent hover:text-on-surface'
              }`}
          >
            Academic Biodata
          </button>

          <button
            onClick={() => setActiveSubTab('blogs')}
            className={`py-3 px-3 sm:px-4 border-b-2 whitespace-nowrap shrink-0 transition-colors ${activeSubTab === 'blogs'
              ? 'border-primary text-primary'
              : 'border-transparent hover:text-on-surface'
              }`}
          >
            Published Blogs ({blogs.length})
          </button>

          {isOwnProfile && (
            <button
              onClick={() => setActiveSubTab('saved')}
              className={`py-3 px-3 sm:px-4 border-b-2 whitespace-nowrap shrink-0 transition-colors ${activeSubTab === 'saved'
                ? 'border-primary text-primary'
                : 'border-transparent hover:text-on-surface'
                }`}
            >
              Saved Vault ({savedItems.length})
            </button>
          )}

          <button
            onClick={() => setActiveSubTab('activity')}
            className={`py-3 px-3 sm:px-4 border-b-2 whitespace-nowrap shrink-0 transition-colors ${activeSubTab === 'activity'
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
        <div className="space-y-6">
          <div className="bg-surface-lowest p-6 rounded-3xl border border-outline-variant/60 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-on-surface">Biography & Background</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
              {user.bio || 'No bio specified.'}
            </p>

            {/* Replace Rank Honor and Scholar Points with Completed Tasks & Posted Blogs */}
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
      )}

      {activeSubTab === 'blogs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 p-4 rounded-3xl bg-surface-lowest border border-outline-variant/60 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-on-surface">Published Articles</h3>
              <p className="text-xs text-outline">
                Articles and research notes authored by @{user.username}
              </p>
            </div>
            {isOwnProfile && (
              <button
                onClick={() => setIsCreateBlogOpen(true)}
                className="px-4 py-2 bg-primary hover:bg-primary-container text-white font-bold text-xs rounded-2xl shadow-sm flex items-center gap-1.5 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                Publish Article
              </button>
            )}
          </div>

          {blogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-outline bg-surface-lowest rounded-3xl border border-outline-variant/60 space-y-3">
              <p className="font-semibold text-sm text-on-surface">No blogs authored yet by @{user.username}.</p>
              {isOwnProfile && (
                <button
                  onClick={() => setIsCreateBlogOpen(true)}
                  className="px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 hover:bg-primary-container transition-all"
                >
                  <Plus className="w-4 h-4" /> Publish First Article
                </button>
              )}
            </div>
          ) : (
            blogs.map((b) => <BlogPostCard key={b.id} post={b} />)
          )}
        </div>
      )}

      {activeSubTab === 'saved' && isOwnProfile && (
        <div className="bg-surface-lowest p-6 rounded-3xl border border-outline-variant/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-on-surface">Personal Saved Vault</h3>
          </div>
          <p className="text-xs text-outline">
            Saved blogs, research PDFs, document attachments, and study notes
          </p>

          {savedItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-outline bg-surface-container-low rounded-2xl">
              Your saved vault is empty. Click "Save" on blogs or PDFs to bookmark items here.
            </div>
          ) : (
            <div className="space-y-2.5">
              {savedItems.map((item) => {
                const isBlogItem = item.itemType === 'blog' || Boolean(item.itemId) || Boolean(item.url && !item.url.startsWith('http'));
                const blogTargetId = item.itemId || item.url?.replace('/blog?post=', '');

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isBlogItem && blogTargetId) {
                        setSelectedBlogId(blogTargetId);
                        setActiveTab('blog');
                      }
                    }}
                    className="p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-between gap-3 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold uppercase text-xs shadow-xs">
                        {item.itemType}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-outline">
                          Saved on {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isBlogItem && blogTargetId) {
                            setSelectedBlogId(blogTargetId);
                            setActiveTab('blog');
                            return;
                          }
                          if (item.url && item.url.startsWith('http')) {
                            window.open(item.url, '_blank');
                          }
                        }}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-container rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                      >
                        <BookOpen className="w-3.5 h-3.5" /> Reopen Article
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSavedItem(item.id);
                        }}
                        title="Remove from Saved Vault"
                        className="p-2 text-outline hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'activity' && (
        <ActivityHeatmap username={user.username} />
      )}

      {/* Create Blog Modal */}
      <CreateBlogModal isOpen={isCreateBlogOpen} onClose={() => setIsCreateBlogOpen(false)} />
    </div>
  );
};
