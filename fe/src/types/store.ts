import type { Socket } from "socket.io-client";
import type { Conversation, Message } from "./chat";
import type { Friend, FriendRequest, User } from "./user";

export interface AuthState {
    accessToken: string | null;
    user: User | null;
    loading: boolean;
    setUser: (user: User) => void
    clearState: () => void;
    setAccessToken: (accessToken: string) => void;


    signUp: (username: string, password: string, email: string, firstname: string, lastname: string) => Promise<void>;
    signIn: (username: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;

    fetchMe: () => Promise<void>;

    refresh: () => Promise<void>;
}

export interface ThemeState {
    isDark: boolean;
    toggleTheme: () => void;
    setTheme: (dark: boolean) => void;
}

export interface ChatState {
    conversations: Conversation[];
    messages: Record<string, {
        items: Message[],
        hasMore: boolean, //cờ để biết có còn tn cũ chưa load hay kh
        nextCursor?: string | null //phân trang
    }>; //chia message theo tunng record
    activeConversationId: string | null;//cuộc hội thoại nào đang được user chọn
    converloading: boolean;
    messageLoading: boolean;
    loading: boolean,


    reset: () => void;
    setActiveConversation: (id: string | null) => void;
    fetchConversations: () => Promise<void>;
    fetchMessages: (conversationId?: string) => Promise<void>;

    sendDirectMessage: (
        recipientId: string,
        content: string,
        imgUrl?: string
    ) => Promise<void>;

    sendGroupMessage: (
        conversationId: string,
        content: string,
        imgUrl?: string
    ) => Promise<void>;

    //khi gửi tn mới cần thêm tn đó vào store
    addMessage: (message: Message) => Promise<void>;

    //số lượng tn chưa đọc, trạng thái đọc hay chưa và last message thay đổi (update conver)
    updateConversation: (conversation: unknown) => void;

    //seen
    markAsSeen: () => Promise<void>;

    //thêm conversation mới
    addConver: (conver: Conversation) => void;
    createConversation: (
        type: "group" | "direct",
        name: string,
        memberIds: string[]
    ) => Promise<void>;

    //pin
    togglePin: (conversationId: string) => Promise<void>;

    //archive
    toggleArchive: (conversationId: string) => Promise<void>;

    //retrict
    toggleRestrict: (conversationId: string) => Promise<void>;

    //leave group
    leaveGroup: (conversationId: string) => Promise<void>;

    //clear conversation
    clearConversation: (conversationId: string) => Promise<void>;

    //forward message
    forwardDirectMessage: (recipientId: string, originalMessageId: string) => Promise<void>;

    //unsed
    markMessageUnsent: (conversationId: string, messageId: string) => void;
    unsendMessage(messageId: string, conversationId: string): Promise<void>

    //pin message
    addPinnedMessage: (conversationId: string, pinnedMessage: any) => void;
    removePinnedMessage: (conversationId: string, messageId: string) => void;
    togglePinMessage(messageId: string): Promise<void>

}

export interface SocketState {
    socket: Socket | null;
    onlineUsers: string[];
    offlineRecords: Record<string, string | Date>;
    connectSocket: () => void;
    disconnectSocket: () => void;
}

export interface AddFriendResult {
    success: boolean;
    message: string;
}

export interface FriendState {
    friends: Friend[];
    loading: boolean;
    receivedList: FriendRequest[];
    sentList: FriendRequest[];

    searchByUsername: (username: string) => Promise<User | null>;
    addFriend: (to: string, message?: string) => Promise<AddFriendResult>;
    getAllFriendRequests: () => Promise<void>;
    acceptRequest: (requestId: string) => Promise<void>;
    declineRequest: (requestId: string) => Promise<void>;
    getFriends: () => Promise<void>;
}

export interface UserState {
    updateAvatarUrl: (formData: FormData) => Promise<void>;
    updateProfile: (
        username: string,
        displayName: string,
        phone?: string,
        bio?: string,
    ) => Promise<void>;
}
