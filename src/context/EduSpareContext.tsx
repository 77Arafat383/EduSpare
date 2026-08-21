'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  User,
  TaskItem,
  BlogPost,
  MessageItem,
  CommunityItem,
  SavedVaultItem,
  NotificationItem,
  ActiveTab,
} from '@/types/eduspare';

interface EduSpareContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: User | null;
  allUsers: User[];
  setCurrentUser: (user: User) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  selectedBlogId: string | null;
  setSelectedBlogId: (id: string | null) => void;
  selectedUsername: string | null;
  setSelectedUsername: (username: string | null) => void;
  selectedCommunityId: string | null;
  setSelectedCommunityId: (id: string | null) => void;
  
  // Data State
  tasks: TaskItem[];
  blogs: BlogPost[];
  communities: CommunityItem[];
  savedItems: SavedVaultItem[];
  messages: MessageItem[];
  recentConversations: Record<string, { lastMessageAt: string; lastMessageSnippet: string; isMeSender: boolean; unseenCount: number }>;
  activeChatUser: User | null;
  setActiveChatUser: (user: User | null) => void;
  isChatBlocked: boolean;
  
  // Actions
  fetchConversations: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  createTask: (data: Partial<TaskItem>) => Promise<TaskItem | null>;
  updateTask: (id: string, data: Partial<TaskItem>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  fetchBlogs: () => Promise<void>;
  createBlog: (data: Partial<BlogPost>) => Promise<void>;
  updateBlog: (id: string, data: Partial<BlogPost>) => Promise<void>;
  deleteBlog: (id: string) => Promise<void>;
  toggleLikeBlog: (blogId: string) => Promise<void>;
  incrementShareCount: (blogId: string, count?: number) => Promise<void>;
  addComment: (blogId: string, content: string, parentId?: string) => Promise<void>;
  toggleLikeComment: (blogId: string, commentId: string) => Promise<void>;
  updateComment: (blogId: string, commentId: string, content: string) => Promise<void>;
  deleteComment: (blogId: string, commentId: string) => Promise<void>;
  toggleSaveBlogOrItem: (item: { title: string; itemType: string; url?: string; itemId?: string }) => Promise<void>;
  deleteSavedItem: (id: string) => Promise<void>;
  
  fetchMessages: (targetUserId: string) => Promise<void>;
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  editMessage: (messageId: string, content: string, targetUserId: string) => Promise<void>;
  deleteMessage: (messageId: string, targetUserId: string) => Promise<void>;
  toggleBlockUser: (targetUserId: string) => Promise<void>;
  
  fetchCommunities: () => Promise<void>;
  createCommunity: (data: any) => Promise<void>;
  toggleJoinCommunity: (communityId: string, action: 'join' | 'leave') => Promise<void>;
  requestToJoinCommunity: (communityId: string) => Promise<void>;
  cancelRequestToJoinCommunity: (communityId: string) => Promise<void>;
  handleMembershipRequest: (communityId: string, applicantId: string, decision: 'approve' | 'reject') => Promise<void>;
  updateCommunityDetails: (communityId: string, data: any) => Promise<void>;
  approveCommunityBlog: (blogId: string) => Promise<void>;
  removeCommunityMember: (communityId: string, memberId: string) => Promise<void>;
  inviteUserToCommunity: (communityId: string, targetUserId: string) => Promise<void>;
  deleteCommunity: (communityId: string) => Promise<void>;
  
  notifications: NotificationItem[];
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  
  updateUserProfile: (data: Partial<User>) => Promise<User | null>;
  loginOrRegister: (action: 'login' | 'register', data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const EduSpareContext = createContext<EduSpareContextType | undefined>(undefined);

export const EduSpareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [communities, setCommunities] = useState<CommunityItem[]>([]);
  const [savedItems, setSavedItems] = useState<SavedVaultItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [recentConversations, setRecentConversations] = useState<
    Record<string, { lastMessageAt: string; lastMessageSnippet: string; isMeSender: boolean; unseenCount: number }>
  >({});
  const [isChatBlocked, setIsChatBlocked] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const handleSetCurrentUser = (user: User | null) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('eduspare_active_user_id', user.id);
      } else {
        localStorage.removeItem('eduspare_active_user_id');
      }
    }
  };

  // Initialize auth & users
  useEffect(() => {
    async function initAuth() {
      try {
        const res = await fetch('/api/auth');
        const data = await res.json();
        if (data.allUsers) {
          setAllUsers(data.allUsers || []);
          const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('eduspare_active_user_id') : null;
          if (savedUserId) {
            const foundUser = data.allUsers.find((u: User) => u.id === savedUserId);
            if (foundUser) {
              setCurrentUser(foundUser);
            } else {
              handleSetCurrentUser(null);
            }
          } else {
            handleSetCurrentUser(null);
          }
        }
      } catch (err) {
        console.error('Failed to init auth:', err);
        handleSetCurrentUser(null);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  // Fetch Tasks when currentUser changes
  const fetchTasks = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/tasks?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  // Fetch Blogs
  const fetchBlogs = async () => {
    try {
      const url = currentUser ? `/api/blogs?userId=${currentUser.id}` : '/api/blogs';
      const res = await fetch(url);
      const data = await res.json();
      if (data.blogs) {
        setBlogs(data.blogs);
      }
    } catch (err) {
      console.error('Failed to fetch blogs:', err);
    }
  };

  // Fetch Communities
  const fetchCommunities = async () => {
    try {
      const res = await fetch('/api/communities');
      const data = await res.json();
      if (data.communities) {
        setCommunities(data.communities);
      }
    } catch (err) {
      console.error('Failed to fetch communities:', err);
    }
  };

  // Fetch Saved Items
  const fetchSavedItems = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/saved?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.savedItems) {
        setSavedItems(data.savedItems);
      }
    } catch (err) {
      console.error('Failed to fetch saved items:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/auth?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.allUsers) {
        setAllUsers(data.allUsers);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchTasks();
      fetchBlogs();
      fetchCommunities();
      fetchSavedItems();

      // Initial heartbeat
      fetch('/api/auth/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      }).catch(() => {});

      // Poll heartbeat every 20s and users presence list every 10s
      const heartbeatInterval = setInterval(() => {
        fetch('/api/auth/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id }),
        }).catch(() => {});
      }, 20000);

      const usersInterval = setInterval(() => {
        fetchUsers();
      }, 10000);

      // Poll tasks every 5 seconds for real-time database updates on task completions & heatmap
      const taskInterval = setInterval(() => {
        fetchTasks();
      }, 5000);

      return () => {
        clearInterval(heartbeatInterval);
        clearInterval(usersInterval);
        clearInterval(taskInterval);
      };
    }
  }, [currentUser]);

  // Task Actions
  const createTask = async (taskData: Partial<TaskItem>): Promise<TaskItem | null> => {
    if (!currentUser) return null;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskData, userId: currentUser.id }),
      });
      const data = await res.json();
      if (data.task) {
        await fetchTasks();
        return data.task;
      }
      return null;
    } catch (err) {
      console.error('Task creation error:', err);
      return null;
    }
  };

  const updateTask = async (id: string, updateData: Partial<TaskItem>) => {
    // Optimistic real-time update so heatmap and task widgets update instantly
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...updateData,
              updatedAt: updateData.status === 'Completed' ? new Date().toISOString() : t.updatedAt,
            }
          : t
      )
    );

    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      await fetchTasks();
    } catch (err) {
      console.error('Task update error:', err);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      await fetchTasks();
    } catch (err) {
      console.error('Task deletion error:', err);
    }
  };

  // Blog Actions
  const createBlog = async (blogData: Partial<BlogPost>) => {
    if (!currentUser) return;
    try {
      await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...blogData, authorId: currentUser.id }),
      });
      await Promise.all([fetchBlogs(), fetchTasks()]);
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              activeStreak: prev.activeStreak + 1,
              totalPoints: prev.totalPoints + 50,
            }
          : prev
      );
    } catch (err) {
      console.error('Create blog error:', err);
    }
  };

  const updateBlog = async (id: string, data: Partial<BlogPost>) => {
    try {
      await fetch(`/api/blogs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await fetchBlogs();
    } catch (err) {
      console.error('Update blog error:', err);
    }
  };

  const deleteBlog = async (id: string) => {
    try {
      await fetch(`/api/blogs/${id}`, { method: 'DELETE' });
      await fetchBlogs();
    } catch (err) {
      console.error('Delete blog error:', err);
    }
  };

  const toggleLikeBlog = async (blogId: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/blogs/${blogId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, type: 'like' }),
      });
      await fetchBlogs();
    } catch (err) {
      console.error('Reaction error:', err);
    }
  };

  const incrementShareCount = async (blogId: string, count: number = 1) => {
    try {
      await fetch(`/api/blogs/${blogId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });
      await fetchBlogs();
    } catch (err) {
      console.error('Increment share count error:', err);
    }
  };

  const addComment = async (blogId: string, content: string, parentId?: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/blogs/${blogId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorId: currentUser.id, content, parentId }),
      });
      await fetchBlogs();
    } catch (err) {
      console.error('Add comment error:', err);
    }
  };

  const toggleLikeComment = async (blogId: string, commentId: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, type: 'like' }),
      });
      await fetchBlogs();
    } catch (err) {
      console.error('Comment reaction error:', err);
    }
  };

  const updateComment = async (blogId: string, commentId: string, content: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/blogs/${blogId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorId: currentUser.id, content }),
      });
      await fetchBlogs();
    } catch (err) {
      console.error('Update comment error:', err);
    }
  };

  const deleteComment = async (blogId: string, commentId: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/blogs/${blogId}/comments/${commentId}?userId=${currentUser.id}`, {
        method: 'DELETE',
      });
      await fetchBlogs();
    } catch (err) {
      console.error('Delete comment error:', err);
    }
  };

  const toggleSaveBlogOrItem = async (item: { title: string; itemType: string; url?: string; itemId?: string }) => {
    if (!currentUser) return;
    try {
      await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          ...item,
        }),
      });
      await fetchSavedItems();
      await fetchBlogs();
    } catch (err) {
      console.error('Save item error:', err);
    }
  };

  const deleteSavedItem = async (id: string) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== id));
    try {
      await fetch(`/api/saved?id=${id}`, { method: 'DELETE' });
      await fetchSavedItems();
    } catch (err) {
      console.error('Delete saved item error:', err);
    }
  };

  const seenTimestampsRef = useRef<Record<string, number>>({});

  // Chat Actions
  const fetchConversations = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/chat?userId=${currentUser.id}&t=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.recentConversations) {
        const updatedConvs = { ...data.recentConversations };
        Object.keys(updatedConvs).forEach((contactId) => {
          const openedTime = seenTimestampsRef.current[contactId];
          if (openedTime) {
            const msgTime = new Date(updatedConvs[contactId].lastMessageAt).getTime();
            if (msgTime <= openedTime + 5000) {
              updatedConvs[contactId].unseenCount = 0;
            }
          }
        });
        setRecentConversations(updatedConvs);
      }
    } catch (err) {
      console.error('Fetch conversations error:', err);
    }
  };

  const fetchMessages = async (targetUserId: string) => {
    if (!currentUser) return;
    seenTimestampsRef.current[targetUserId] = Date.now();
    try {
      const res = await fetch(`/api/chat?userId=${currentUser.id}&targetUserId=${targetUserId}&t=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        setIsChatBlocked(data.isBlocked);
        setRecentConversations((prev) => ({
          ...prev,
          [targetUserId]: prev[targetUserId]
            ? { ...prev[targetUserId], unseenCount: 0 }
            : prev[targetUserId],
        }));
        await fetchConversations();
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  };

  const sendMessage = async (receiverId: string, content: string) => {
    if (!currentUser) return;
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId,
          content,
        }),
      });
      await fetchMessages(receiverId);
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const editMessage = async (messageId: string, content: string, targetUserId: string) => {
    if (!currentUser) return;
    try {
      await fetch('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, userId: currentUser.id, content }),
      });
      await fetchMessages(targetUserId);
    } catch (err) {
      console.error('Edit message error:', err);
    }
  };

  const deleteMessage = async (messageId: string, targetUserId: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/chat?messageId=${messageId}&userId=${currentUser.id}`, {
        method: 'DELETE',
      });
      await fetchMessages(targetUserId);
    } catch (err) {
      console.error('Delete message error:', err);
    }
  };

  const toggleBlockUser = async (targetUserId: string) => {
    if (!currentUser) return;
    try {
      if (isChatBlocked) {
        await fetch(`/api/chat/block?blockerId=${currentUser.id}&blockedId=${targetUserId}`, {
          method: 'DELETE',
        });
      } else {
        await fetch('/api/chat/block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blockerId: currentUser.id,
            blockedId: targetUserId,
          }),
        });
      }
      await fetchMessages(targetUserId);
    } catch (err) {
      console.error('Block user error:', err);
    }
  };

  // Communities Actions
  const createCommunity = async (commData: any) => {
    if (!currentUser) return;
    try {
      await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          createdById: currentUser.id,
          ...commData,
        }),
      });
      await fetchCommunities();
    } catch (err) {
      console.error('Create community error:', err);
    }
  };

  const toggleJoinCommunity = async (communityId: string, action: 'join' | 'leave') => {
    if (!currentUser) return;
    try {
      await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          communityId,
          userId: currentUser.id,
        }),
      });
      await fetchCommunities();
    } catch (err) {
      console.error('Join/Leave community error:', err);
    }
  };

  const requestToJoinCommunity = async (communityId: string) => {
    if (!currentUser) return;
    try {
      await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request-join',
          communityId,
          userId: currentUser.id,
        }),
      });
      await fetchCommunities();
    } catch (err) {
      console.error('Request join community error:', err);
    }
  };

  const cancelRequestToJoinCommunity = async (communityId: string) => {
    if (!currentUser) return;
    try {
      await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel-request',
          communityId,
          userId: currentUser.id,
        }),
      });
      await fetchCommunities();
    } catch (err) {
      console.error('Cancel join request error:', err);
    }
  };

  const handleMembershipRequest = async (
    communityId: string,
    applicantId: string,
    decision: 'approve' | 'reject'
  ) => {
    if (!currentUser) return;
    try {
      await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'handle-request',
          communityId,
          applicantId,
          decision,
          userId: currentUser.id,
        }),
      });
      await fetchCommunities();
    } catch (err) {
      console.error('Handle membership request error:', err);
    }
  };

  const updateCommunityDetails = async (communityId: string, data: any) => {
    if (!currentUser) return;
    try {
      await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-cover',
          communityId,
          userId: currentUser.id,
          ...data,
        }),
      });
      await fetchCommunities();
    } catch (err) {
      console.error('Update community details error:', err);
    }
  };

  const approveCommunityBlog = async (blogId: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/blogs/${blogId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true }),
      });
      await fetchBlogs();
    } catch (err) {
      console.error('Approve community blog error:', err);
    }
  };

  const removeCommunityMember = async (communityId: string, memberId: string) => {
    if (!currentUser) return;
    try {
      await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove-member',
          communityId,
          memberId,
          userId: currentUser.id,
        }),
      });
      await fetchCommunities();
    } catch (err) {
      console.error('Remove community member error:', err);
    }
  };

  const inviteUserToCommunity = async (communityId: string, targetUserId: string) => {
    if (!currentUser) return;
    try {
      await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invite-user',
          communityId,
          applicantId: targetUserId,
          userId: currentUser.id,
        }),
      });
      await fetchCommunities();
    } catch (err) {
      console.error('Invite user to community error:', err);
    }
  };

  const deleteCommunity = async (communityId: string) => {
    if (!currentUser) return;
    try {
      await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          communityId,
          userId: currentUser.id,
        }),
      });
      await fetchCommunities();
      setSelectedCommunityId(null);
    } catch (err) {
      console.error('Delete community error:', err);
    }
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    if (!currentUser) return;
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Mark notification error:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!currentUser) return;
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, markAllAsRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Mark all notifications error:', err);
    }
  };

  // Poll notifications periodically when currentUser is active
  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(() => {
        fetchNotifications();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const updateUserProfile = async (updateData: Partial<User>): Promise<User | null> => {
    if (!currentUser) return null;
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, ...updateData }),
      });
      const data = await res.json();
      if (data.user) {
        handleSetCurrentUser(data.user);
        return data.user;
      }
      return null;
    } catch (err) {
      console.error('Update profile error:', err);
      return null;
    }
  };

  const loginOrRegister = async (action: 'login' | 'register', data: any) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });
      const resData = await res.json();
      if (res.ok && resData.user) {
        handleSetCurrentUser(resData.user);
        return { success: true };
      }
      return { success: false, error: resData.error || 'Authentication failed' };
    } catch (err) {
      return { success: false, error: 'Network error during auth' };
    }
  };

  const logout = () => {
    handleSetCurrentUser(null);
    setActiveTab('dashboard');
    setSelectedTaskId(null);
    setSelectedUsername(null);
    setSelectedCommunityId(null);
    setActiveChatUser(null);
  };

  return (
    <EduSpareContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentUser,
        allUsers,
        setCurrentUser: handleSetCurrentUser,
        selectedTaskId,
        setSelectedTaskId,
        selectedBlogId,
        setSelectedBlogId,
        selectedUsername,
        setSelectedUsername,
        selectedCommunityId,
        setSelectedCommunityId,
        tasks,
        blogs,
        communities,
        savedItems,
        messages,
        recentConversations,
        activeChatUser,
        setActiveChatUser,
        isChatBlocked,
        fetchConversations,
        fetchTasks,
        createTask,
        updateTask,
        deleteTask,
        fetchBlogs,
        createBlog,
        updateBlog,
        deleteBlog,
        toggleLikeBlog,
        incrementShareCount,
        addComment,
        toggleLikeComment,
        updateComment,
        deleteComment,
        toggleSaveBlogOrItem,
        deleteSavedItem,
        fetchMessages,
        sendMessage,
        editMessage,
        deleteMessage,
        toggleBlockUser,
        fetchCommunities,
        createCommunity,
        toggleJoinCommunity,
        requestToJoinCommunity,
        cancelRequestToJoinCommunity,
        handleMembershipRequest,
        updateCommunityDetails,
        approveCommunityBlog,
        removeCommunityMember,
        inviteUserToCommunity,
        deleteCommunity,
        notifications,
        fetchNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        updateUserProfile,
        loginOrRegister,
        logout,
        loading,
      }}
    >
      {children}
    </EduSpareContext.Provider>
  );
};

export const useEduSpare = () => {
  const context = useContext(EduSpareContext);
  if (!context) {
    throw new Error('useEduSpare must be used within an EduSpareProvider');
  }
  return context;
};
