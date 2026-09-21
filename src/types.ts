export type MessageType = 'text' | 'image' | 'audio' | 'document';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface Reaction {
  emoji: string;
  users: string[]; // user IDs
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text?: string;
  type: MessageType;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: string;
  audioDuration?: number;
  timestamp: string;
  status: MessageStatus;
  starred?: boolean;
  reactions?: Record<string, string[]>; // emoji -> array of user names
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
}

export interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  avatar: string;
  participants: string[];
  unreadCount: number;
  pinned?: boolean;
  muted?: boolean;
  archived?: boolean;
  lastMessage?: Message;
  typingUsers?: string[];
  online?: boolean;
  lastSeen?: string;
  about?: string;
  phone?: string;
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  about: string;
  phone: string;
  online: boolean;
  lastSeen?: string;
}

export interface StatusItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  timestamp: string;
  mediaUrl: string;
  caption?: string;
  viewed?: boolean;
}

export interface CallSession {
  active: boolean;
  chatId: string;
  contactName: string;
  contactAvatar: string;
  type: 'voice' | 'video';
  status: 'calling' | 'ringing' | 'connected' | 'ended';
  startTime?: number;
  duration: number;
  isMuted: boolean;
  isVideoEnabled: boolean;
}

export type ThemeMode = 'dark' | 'light';
