export interface Participant {
  _id: string;
  displayName: string;
  avatarUrl?: string | null;
  joinedAt: string;
  isPinned?: boolean;
  isArchived?: boolean;
  isRestricted?: boolean;
  offlineAt?: string | Date | null;
  nickname: string | null;
}

export interface SeenUser {
  _id: string;
  displayName?: string;
  avatarUrl?: string | null;
}

export interface Group {
  name: string;
  createdBy: string;
}

export interface LastMessage {
  _id: string;
  content: string;
  imgUrl: string;
  createdAt: string;
  senderId: {
    _id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  isImage: boolean;
}

export interface ClearedAt {
  userId: string;
  timestamp: string;
}

export interface PinnedMessage {
  messageId: string
  content: string | null
  imgUrl: string | null
  senderId: string
  createdAt: string
  isUnsent: boolean
  pinnedBy: string
  pinnedAt: string
}

export interface Conversation {
  _id: string;
  type: "direct" | "group";
  group: Group;
  participants: Participant[];
  lastMessageAt: string;
  seenBy: SeenUser[];
  lastMessage: LastMessage | null;
  unreadCounts: Record<string, number>; // key = userId, value = unread count

  hiddenFor?: string[];
  clearedAt?: ClearedAt[];
  pinnedMessages?: PinnedMessage[]

  createdAt: string;
  updatedAt: string;

  theme?: string;
}

export interface ConversationResponse {
  conversations: Conversation[];
}

export interface Reaction {
  userId: string;
  emoji: string;
  reactedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  imgUrl?: string | null;
  updatedAt?: string | null;
  createdAt: string;
  isOwn?: boolean;
  isForwarded?: boolean;
  isUnsent?: boolean;
  reactions?: Reaction[];
  sender?: {
    displayName: string;
    avatarUrl?: string | null;
  };
}