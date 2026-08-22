'use client';

import React from 'react';

interface EditProfileFormProps {
  editName: string;
  setEditName: (v: string) => void;
  editUniversity: string;
  setEditUniversity: (v: string) => void;
  editAvatar: string;
  setEditAvatar: (v: string) => void;
  editCoverImage: string;
  setEditCoverImage: (v: string) => void;
  editBio: string;
  setEditBio: (v: string) => void;
  editAcademicStatus: string;
  setEditAcademicStatus: (v: string) => void;
  editBirthday: string;
  setEditBirthday: (v: string) => void;
  editGender: string;
  setEditGender: (v: string) => void;
  editRelationshipStatus: string;
  setEditRelationshipStatus: (v: string) => void;
  editPhone: string;
  setEditPhone: (v: string) => void;
  editAddress: string;
  setEditAddress: (v: string) => void;
  editInterests: string;
  setEditInterests: (v: string) => void;
  handleSaveProfile: (e: React.FormEvent) => void;
  handleAvatarFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCoverFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setIsEditingBio: (editing: boolean) => void;
}

export const EditProfileForm: React.FC<EditProfileFormProps> = ({
  editName,
  setEditName,
  editUniversity,
  setEditUniversity,
  editAvatar,
  setEditAvatar,
  editCoverImage,
  setEditCoverImage,
  editBio,
  setEditBio,
  editAcademicStatus,
  setEditAcademicStatus,
  editBirthday,
  setEditBirthday,
  editGender,
  setEditGender,
  editRelationshipStatus,
  setEditRelationshipStatus,
  editPhone,
  setEditPhone,
  editAddress,
  setEditAddress,
  editInterests,
  setEditInterests,
  handleSaveProfile,
  handleAvatarFileChange,
  handleCoverFileChange,
  setIsEditingBio,
}) => {
  return (
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

      {/* Profile Picture Upload */}
      <div className="space-y-2">
        <label className="block text-[11px] font-bold text-outline uppercase">Profile Picture</label>
        <div className="flex items-center gap-3">
          <img
            src={editAvatar || '/assets/default_avatar.png'}
            alt="Avatar Preview"
            className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-primary/20"
          />
          <label className="px-3.5 py-2 text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl cursor-pointer transition-all flex items-center gap-2 border border-primary/20">
            <span>Upload Profile Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Cover Photo Upload */}
      <div className="space-y-2">
        <label className="block text-[11px] font-bold text-outline uppercase">Cover Photo</label>
        <div className="flex items-center gap-3">
          <div className="w-20 h-10 rounded-xl overflow-hidden bg-surface-container-low shrink-0 border border-outline-variant/40">
            <img
              src={editCoverImage || '/assets/default_cover.png'}
              alt="Cover Preview"
              className="w-full h-full object-cover"
            />
          </div>
          <label className="px-3.5 py-2 text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl cursor-pointer transition-all flex items-center gap-2 border border-primary/20">
            <span>Upload Cover Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverFileChange}
              className="hidden"
            />
          </label>
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
          <select
            value={editRelationshipStatus}
            onChange={(e) => setEditRelationshipStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-surface-lowest border border-outline-variant/60 text-on-surface"
          >
            <option value="Single">Single</option>
            <option value="In a Relationship">In a Relationship</option>
            <option value="Engaged">Engaged</option>
            <option value="Married">Married</option>
          </select>
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
  );
};
