'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
import { getRankFromPoints, POINT_REWARDS } from '@/lib/rankSystem';

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
  acceptCommunityInvite: (communityId: string) => Promise<void>;
  declineCommunityInvite: (communityId: string) => Promise<void>;
  deleteCommunity: (communityId: string) => Promise<void>;

  notifications: NotificationItem[];
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

  updateUserProfile: (data: Partial<User>) => Promise<User | null>;
  deleteUserProfile: () => Promise<boolean>;
  loginOrRegister: (action: 'login' | 'register', data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const EduSpareContext = createContext<EduSpareContextType | undefined>(undefined);

/** Cheap structural check so polling doesn't trigger re-renders when nothing changed. */
function isSameMessageList(a: MessageItem[], b: MessageItem[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x.id !== y.id || x.content !== y.content || x.isSeen !== y.isSeen) return false;
  }
  return true;
}

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
  const seenTimestampsRef = useRef<Record<string, number>>({});

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
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (data.allUsers) {
        setAllUsers(data.allUsers);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  /**
   * Single combined poll: presence list + heartbeat + tasks + notifications +
   * conversation list in ONE request (instead of 5 separate polling loops).
   * The endpoint is ETag'd, so unchanged data costs a body-less 304.
   */
  const syncInFlightRef = useRef(false);
  const applyConversations = useCallback(
    (convs: Record<string, { lastMessageAt: string; lastMessageSnippet: string; isMeSender: boolean; unseenCount: number }>) => {
      const updatedConvs = { ...convs };
      Object.keys(updatedConvs).forEach((contactId) => {
        const openedTime = seenTimestampsRef.current[contactId];
        if (openedTime) {
          const msgTime = new Date(updatedConvs[contactId].lastMessageAt).getTime();
          if (msgTime <= openedTime + 5000) {
            updatedConvs[contactId] = { ...updatedConvs[contactId], unseenCount: 0 };
          }
        }
      });
      setRecentConversations(updatedConvs);
    },
    []
  );

  const sync = useCallback(async () => {
    if (!currentUser || syncInFlightRef.current) return;
    syncInFlightRef.current = true;
    try {
      const res = await fetch(`/api/sync?userId=${currentUser.id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.allUsers) setAllUsers(data.allUsers);
      if (data.tasks) setTasks(data.tasks);
      if (data.notifications) setNotifications(data.notifications);
      if (data.recentConversations) applyConversations(data.recentConversations);
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      syncInFlightRef.current = false;
    }
  }, [currentUser, applyConversations]);

  useEffect(() => {
    if (!currentUser) return;

    // Initial load (one-off data that is refreshed after mutations, not polled)
    fetchBlogs();
    fetchCommunities();
    fetchSavedItems();
    sync();

    // Poll only while the tab is visible; back off to a slow poll when hidden.
    const ACTIVE_INTERVAL = 8000;
    const HIDDEN_INTERVAL = 60000;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      if (timer) clearTimeout(timer);
      const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
      timer = setTimeout(async () => {
        await sync();
        schedule();
      }, hidden ? HIDDEN_INTERVAL : ACTIVE_INTERVAL);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        sync();
      }
      schedule();
    };

    schedule();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [currentUser, sync]);

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
        // Insert immediately from the API response; no full refetch needed.
        setTasks((prev) => [data.task, ...prev.filter((t) => t.id !== data.task.id)]);
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
      const existingTask = tasks.find((t) => t.id === id);
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const data = await res.json().catch(() => null);
      if (data?.task) {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data.task } : t)));
      } else {
        fetchTasks();
      }

      if (updateData.status === 'Completed' && existingTask?.status !== 'Completed') {
        setCurrentUser((prev) => {
          if (!prev) return prev;
          const newPoints = prev.totalPoints + POINT_REWARDS.TASK_COMPLETED;
          return {
            ...prev,
            totalPoints: newPoints,
            rank: getRankFromPoints(newPoints),
          };
        });
      }
    } catch (err) {
      console.error('Task update error:', err);
    }
  };

  const deleteTask = async (id: string) => {
    const snapshot = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) setTasks(snapshot);
    } catch (err) {
      console.error('Task deletion error:', err);
      setTasks(snapshot);
    }
  };

  // Blog Actions
  const createBlog = async (blogData: Partial<BlogPost>) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...blogData, authorId: currentUser.id }),
      });
      const data = await res.json().catch(() => null);
      if (data?.blog) {
        setBlogs((prev) => [data.blog, ...prev]);
      } else {
        fetchBlogs();
      }
      setCurrentUser((prev) => {
        if (!prev) return prev;
        const newPoints = prev.totalPoints + POINT_REWARDS.BLOG_CREATED;
        return {
          ...prev,
          activeStreak: prev.activeStreak + 1,
          totalPoints: newPoints,
          rank: getRankFromPoints(newPoints),
        };
      });
    } catch (err) {
      console.error('Create blog error:', err);
    }
  };

  const updateBlog = async (id: string, data: Partial<BlogPost>) => {
    setBlogs((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
    try {
      const res = await fetch(`/api/blogs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) fetchBlogs();
    } catch (err) {
      console.error('Update blog error:', err);
      fetchBlogs();
    }
  };

  const deleteBlog = async (id: string) => {
    const snapshot = blogs;
    setBlogs((prev) => prev.filter((b) => b.id !== id));
    try {
      const res = await fetch(`/api/blogs/${id}`, { method: 'DELETE' });
      if (!res.ok) setBlogs(snapshot);
    } catch (err) {
      console.error('Delete blog error:', err);
      setBlogs(snapshot);
    }
  };

  const toggleLikeBlog = async (blogId: string) => {
    if (!currentUser) return;
    const me = currentUser.id;
    // Optimistic toggle so the heart responds instantly.
    setBlogs((prev) =>
      prev.map((b) => {
        if (b.id !== blogId) return b;
        const liked = !!b.isLikedByMe;
        const reactions = liked
          ? (b.reactions || []).filter((r) => r.userId !== me)
          : [...(b.reactions || []), { id: `tmp-${Date.now()}`, blogId, userId: me, type: 'like' }];
        return { ...b, isLikedByMe: !liked, reactions, likesCount: reactions.length };
      })
    );
    try {
      const res = await fetch(`/api/blogs/${blogId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: me, type: 'like' }),
      });
      if (!res.ok) fetchBlogs();
    } catch (err) {
      console.error('Reaction error:', err);
      fetchBlogs();
    }
  };

  const incrementShareCount = async (blogId: string, count: number = 1) => {
    setBlogs((prev) =>
      prev.map((b) => (b.id === blogId ? { ...b, sharesCount: (b.sharesCount || 0) + count } : b))
    );
    try {
      await fetch(`/api/blogs/${blogId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });
    } catch (err) {
      console.error('Increment share count error:', err);
    }
  };

  const addComment = async (blogId: string, content: string, parentId?: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/blogs/${blogId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorId: currentUser.id, content, parentId }),
      });
      const data = await res.json().catch(() => null);
      if (data?.comment) {
        const newComment = {
          ...data.comment,
          replies: [],
          reactions: [],
          likesCount: 0,
          isLikedByMe: false,
        };
        setBlogs((prev) =>
          prev.map((b) => {
            if (b.id !== blogId) return b;
            if (parentId) {
              return {
                ...b,
                comments: b.comments.map((c) =>
                  c.id === parentId ? { ...c, replies: [...(c.replies || []), newComment] } : c
                ),
              };
            }
            return { ...b, comments: [...b.comments, newComment] };
          })
        );
      } else {
        fetchBlogs();
      }
    } catch (err) {
      console.error('Add comment error:', err);
    }
  };

  const toggleLikeComment = async (blogId: string, commentId: string) => {
    if (!currentUser) return;
    const me = currentUser.id;
    const toggle = (c: any) => {
      if (c.id !== commentId) return c;
      const liked = !!c.isLikedByMe;
      const reactions = liked
        ? (c.reactions || []).filter((r: any) => r.userId !== me)
        : [...(c.reactions || []), { id: `tmp-${Date.now()}`, commentId, userId: me, type: 'like' }];
      return { ...c, isLikedByMe: !liked, reactions, likesCount: reactions.length };
    };
    setBlogs((prev) =>
      prev.map((b) =>
        b.id !== blogId
          ? b
          : {
              ...b,
              comments: b.comments.map((c) => ({
                ...toggle(c),
                replies: (c.replies || []).map(toggle),
              })),
            }
      )
    );
    try {
      const res = await fetch(`/api/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: me, type: 'like' }),
      });
      if (!res.ok) fetchBlogs();
    } catch (err) {
      console.error('Comment reaction error:', err);
      fetchBlogs();
    }
  };

  const updateComment = async (blogId: string, commentId: string, content: string) => {
    if (!currentUser) return;
    const patch = (c: any) => (c.id === commentId ? { ...c, content } : c);
    setBlogs((prev) =>
      prev.map((b) =>
        b.id !== blogId
          ? b
          : { ...b, comments: b.comments.map((c) => ({ ...patch(c), replies: (c.replies || []).map(patch) })) }
      )
    );
    try {
      const res = await fetch(`/api/blogs/${blogId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorId: currentUser.id, content }),
      });
      if (!res.ok) fetchBlogs();
    } catch (err) {
      console.error('Update comment error:', err);
      fetchBlogs();
    }
  };

  const deleteComment = async (blogId: string, commentId: string) => {
    if (!currentUser) return;
    setBlogs((prev) =>
      prev.map((b) =>
        b.id !== blogId
          ? b
          : {
              ...b,
              comments: b.comments
                .filter((c) => c.id !== commentId)
                .map((c) => ({ ...c, replies: (c.replies || []).filter((r) => r.id !== commentId) })),
            }
      )
    );
    try {
      const res = await fetch(`/api/blogs/${blogId}/comments/${commentId}?userId=${currentUser.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) fetchBlogs();
    } catch (err) {
      console.error('Delete comment error:', err);
      fetchBlogs();
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
      // Flip the bookmark flag locally; refresh the vault list in the background.
      if (item.itemId) {
        setBlogs((prev) =>
          prev.map((b) => (b.id === item.itemId ? { ...b, isSavedByMe: !b.isSavedByMe } : b))
        );
      }
      fetchSavedItems();
    } catch (err) {
      console.error('Save item error:', err);
    }
  };

  const deleteSavedItem = async (id: string) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== id));
    try {
      const res = await fetch(`/api/saved?id=${id}`, { method: 'DELETE' });
      if (!res.ok) fetchSavedItems();
    } catch (err) {
      console.error('Delete saved item error:', err);
    }
  };

  // Chat Actions
  const fetchConversations = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/chat?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.recentConversations) {
        applyConversations(data.recentConversations);
      }
    } catch (err) {
      console.error('Fetch conversations error:', err);
    }
  };

  const fetchMessages = async (targetUserId: string) => {
    if (!currentUser) return;
    seenTimestampsRef.current[targetUserId] = Date.now();
    try {
      const res = await fetch(`/api/chat?userId=${currentUser.id}&targetUserId=${targetUserId}`);
      const data = await res.json();
      if (data.messages) {
        // Skip the state update (and re-render) when the thread hasn't changed.
        setMessages((prev) => (isSameMessageList(prev, data.messages) ? prev : data.messages));
        setIsChatBlocked(data.isBlocked);
        setRecentConversations((prev) => {
          const existing = prev[targetUserId];
          if (!existing || existing.unseenCount === 0) return prev;
          return { ...prev, [targetUserId]: { ...existing, unseenCount: 0 } };
        });
        // Conversation list is refreshed by the combined /api/sync poll,
        // so no extra request is needed here.
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  };

  const sendMessage = async (receiverId: string, content: string) => {
    if (!currentUser) return;
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const optimistic: MessageItem = {
      id: tempId,
      senderId: currentUser.id,
      receiverId,
      sender: currentUser,
      content,
      isSeen: false,
      createdAt: now,
    };
    const isActiveThread = activeChatUser?.id === receiverId;
    // Show the message instantly in the open thread and bump the conversation list.
    if (isActiveThread) setMessages((prev) => [...prev, optimistic]);
    setRecentConversations((prev) => ({
      ...prev,
      [receiverId]: {
        lastMessageAt: now,
        lastMessageSnippet: content.length > 120 ? content.slice(0, 120) : content,
        isMeSender: true,
        unseenCount: 0,
      },
    }));
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
      const data = await res.json().catch(() => null);
      if (isActiveThread) {
        if (data?.message) {
          setMessages((prev) => prev.map((m) => (m.id === tempId ? data.message : m)));
        } else {
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
        }
      }
      if (!data?.message && data?.error) {
        console.error('Send message error:', data.error);
      }
    } catch (err) {
      console.error('Send message error:', err);
      if (isActiveThread) setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const editMessage = async (messageId: string, content: string, targetUserId: string) => {
    if (!currentUser) return;
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, content } : m)));
    try {
      const res = await fetch('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, userId: currentUser.id, content }),
      });
      if (!res.ok) fetchMessages(targetUserId);
    } catch (err) {
      console.error('Edit message error:', err);
      fetchMessages(targetUserId);
    }
  };

  const deleteMessage = async (messageId: string, targetUserId: string) => {
    if (!currentUser) return;
    const snapshot = messages;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    try {
      const res = await fetch(`/api/chat?messageId=${messageId}&userId=${currentUser.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) setMessages(snapshot);
    } catch (err) {
      console.error('Delete message error:', err);
      setMessages(snapshot);
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
  /** Apply a mutated community from the API response; fall back to a full refetch. */
  const applyCommunityResponse = async (res: Response) => {
    const data = await res.json().catch(() => null);
    if (res.ok && data?.community) {
      setCommunities((prev) => prev.map((c) => (c.id === data.community.id ? data.community : c)));
    } else {
      await fetchCommunities();
    }
  };

  const createCommunity = async (commData: any) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createdById: currentUser.id,
          ...commData,
        }),
      });
      const data = await res.json().catch(() => null);
      if (data?.community) {
        setCommunities((prev) => [data.community, ...prev]);
      } else {
        await fetchCommunities();
      }
    } catch (err) {
      console.error('Create community error:', err);
    }
  };

  const toggleJoinCommunity = async (communityId: string, action: 'join' | 'leave') => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/communities/${communityId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId: currentUser.id }),
      });
      await applyCommunityResponse(res);
    } catch (err) {
      console.error('Join/Leave community error:', err);
    }
  };

  const communityRequestAction = async (communityId: string, payload: Record<string, unknown>, label: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/communities/${communityId}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, ...payload }),
      });
      await applyCommunityResponse(res);
    } catch (err) {
      console.error(`${label} error:`, err);
    }
  };

  const requestToJoinCommunity = (communityId: string) =>
    communityRequestAction(communityId, { action: 'request-join' }, 'Request join community');

  const cancelRequestToJoinCommunity = (communityId: string) =>
    communityRequestAction(communityId, { action: 'cancel-request' }, 'Cancel request join community');

  const handleMembershipRequest = (communityId: string, applicantId: string, decision: 'approve' | 'reject') =>
    communityRequestAction(communityId, { action: 'handle-request', applicantId, decision }, 'Handle membership request');

  const updateCommunityDetails = async (communityId: string, data: any) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/communities/${communityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, ...data }),
      });
      await applyCommunityResponse(res);
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
      setBlogs((prev) => prev.map((b) => (b.id === blogId ? { ...b, isApproved: true } : b)));
    } catch (err) {
      console.error('Approve community blog error:', err);
    }
  };

  const removeCommunityMember = async (communityId: string, memberId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/communities/${communityId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove-member', memberId, userId: currentUser.id }),
      });
      await applyCommunityResponse(res);
    } catch (err) {
      console.error('Remove community member error:', err);
    }
  };

  const inviteUserToCommunity = (communityId: string, targetUserId: string) =>
    communityRequestAction(communityId, { action: 'invite-user', targetUserId }, 'Invite user to community');

  const acceptCommunityInvite = (communityId: string) =>
    communityRequestAction(communityId, { action: 'accept-invite' }, 'Accept community invite');

  const declineCommunityInvite = (communityId: string) =>
    communityRequestAction(communityId, { action: 'decline-invite' }, 'Decline community invite');

  const deleteCommunity = async (communityId: string) => {
    if (!currentUser) return;
    const snapshot = communities;
    setCommunities((prev) => prev.filter((c) => c.id !== communityId));
    setSelectedCommunityId(null);
    try {
      const res = await fetch(`/api/communities/${communityId}`, { method: 'DELETE' });
      if (!res.ok) setCommunities(snapshot);
    } catch (err) {
      console.error('Delete community error:', err);
      setCommunities(snapshot);
    }
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
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

  // Notifications are refreshed by the combined /api/sync poll above.

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

  const deleteUserProfile = async (): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/profile?userId=${currentUser.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        logout();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Delete profile error:', err);
      return false;
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
        acceptCommunityInvite,
        declineCommunityInvite,
        deleteCommunity,
        notifications,
        fetchNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        updateUserProfile,
        deleteUserProfile,
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
