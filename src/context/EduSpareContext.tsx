'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  TaskItem,
  BlogPost,
  MessageItem,
  CommunityItem,
  SavedVaultItem,
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
  activeChatUser: User | null;
  setActiveChatUser: (user: User | null) => void;
  isChatBlocked: boolean;
  
  // Actions
  fetchTasks: () => Promise<void>;
  createTask: (data: Partial<TaskItem>) => Promise<TaskItem | null>;
  updateTask: (id: string, data: Partial<TaskItem>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  fetchBlogs: () => Promise<void>;
  createBlog: (data: Partial<BlogPost>) => Promise<void>;
  deleteBlog: (id: string) => Promise<void>;
  toggleLikeBlog: (blogId: string) => Promise<void>;
  addComment: (blogId: string, content: string) => Promise<void>;
  updateComment: (blogId: string, commentId: string, content: string) => Promise<void>;
  deleteComment: (blogId: string, commentId: string) => Promise<void>;
  toggleSaveBlogOrItem: (item: { title: string; itemType: string; url?: string; itemId?: string }) => Promise<void>;
  deleteSavedItem: (id: string) => Promise<void>;
  
  fetchMessages: (targetUserId: string) => Promise<void>;
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  toggleBlockUser: (targetUserId: string) => Promise<void>;
  
  fetchCommunities: () => Promise<void>;
  createCommunity: (data: any) => Promise<void>;
  toggleJoinCommunity: (communityId: string, action: 'join' | 'leave') => Promise<void>;
  
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
  const [isChatBlocked, setIsChatBlocked] = useState(false);
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

  useEffect(() => {
    if (currentUser) {
      fetchTasks();
      fetchBlogs();
      fetchCommunities();
      fetchSavedItems();

      // Poll tasks every 5 seconds for real-time database updates on task completions & heatmap
      const interval = setInterval(() => {
        fetchTasks();
      }, 5000);

      return () => clearInterval(interval);
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

  const addComment = async (blogId: string, content: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/blogs/${blogId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorId: currentUser.id, content }),
      });
      await fetchBlogs();
    } catch (err) {
      console.error('Add comment error:', err);
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

  // Chat Actions
  const fetchMessages = async (targetUserId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/chat?userId=${currentUser.id}&targetUserId=${targetUserId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        setIsChatBlocked(data.isBlocked);
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  };

  const sendMessage = async (receiverId: string, content: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId,
          content,
        }),
      });
      if (res.ok) {
        await fetchMessages(receiverId);
      }
    } catch (err) {
      console.error('Send message error:', err);
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
        activeChatUser,
        setActiveChatUser,
        isChatBlocked,
        fetchTasks,
        createTask,
        updateTask,
        deleteTask,
        fetchBlogs,
        createBlog,
        deleteBlog,
        toggleLikeBlog,
        addComment,
        updateComment,
        deleteComment,
        toggleSaveBlogOrItem,
        deleteSavedItem,
        fetchMessages,
        sendMessage,
        toggleBlockUser,
        fetchCommunities,
        createCommunity,
        toggleJoinCommunity,
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
