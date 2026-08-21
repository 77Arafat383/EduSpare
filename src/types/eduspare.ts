export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
  coverImage?: string | null;
  bio?: string | null;
  university?: string | null;
  birthday?: string | null;
  gender?: string | null;
  academicStatus?: string | null;
  relationshipStatus?: string | null;
  phone?: string | null;
  address?: string | null;
  interests?: string | null;
  activeStreak: number;
  totalPoints: number;
  rank: string;
  lastActiveAt?: string | null;
  createdAt: string;
}

export function isUserActive(lastActiveAt?: string | null): boolean {
  if (!lastActiveAt) return false;
  const activeDate = new Date(lastActiveAt);
  const now = new Date();
  const diffSeconds = (now.getTime() - activeDate.getTime()) / 1000;
  return diffSeconds >= 0 && diffSeconds <= 120; // Considered active if heartbeat within last 2 minutes
}

export interface MaterialItem {
  id: string;
  title: string;
  type: 'link' | 'pdf' | 'document' | 'video' | 'code';
  url: string;
  notes?: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  category: string;
  dueAt: string;
  importance: number; // 0 to 100
  status: 'Pending' | 'In Progress' | 'Completed';
  notes?: string | null;
  materials: MaterialItem[];
  createdAt: string;
  updatedAt?: string;
  user?: User;
}

export interface BlogAttachment {
  id: string;
  name: string;
  type: 'pdf' | 'document' | 'image';
  url: string;
  size?: string;
}

export interface CommentItem {
  id: string;
  blogId: string;
  authorId: string;
  author: User;
  content: string;
  createdAt: string;
}

export interface ReactionItem {
  id: string;
  blogId: string;
  userId: string;
  type: string;
}

export interface BlogPost {
  id: string;
  authorId: string;
  author: User;
  title: string;
  content: string;
  coverImage?: string | null;
  attachments: BlogAttachment[];
  tags: string[];
  communityId?: string | null;
  createdAt: string;
  comments: CommentItem[];
  reactions: ReactionItem[];
  likesCount?: number;
  isLikedByMe?: boolean;
  isSavedByMe?: boolean;
}

export interface SavedVaultItem {
  id: string;
  userId: string;
  itemType: 'blog' | 'pdf' | 'document' | 'image';
  itemId?: string;
  title: string;
  url?: string;
  meta?: string;
  createdAt: string;
}

export interface MessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  sender?: User;
  receiver?: User;
  content: string;
  isSeen?: boolean;
  createdAt: string;
}

export interface CommunityItem {
  id: string;
  name: string;
  description: string;
  image: string;
  tags: string[];
  isPrivate: boolean;
  memberIds: string[];
  createdById: string;
  createdAt: string;
}

export type ActiveTab = 
  | 'dashboard'
  | 'tasks'
  | 'task-detail'
  | 'blog'
  | 'chat'
  | 'profile'
  | 'communities'
  | 'search';
