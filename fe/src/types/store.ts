import type { Socket } from "socket.io-client";
import type { Conversation, Message } from "./chat";
import type { User } from "./user";

export interface AuthState {
    accessToken: string | null;
    user: User | null;
    loading: boolean;
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
    updateConversation: (conversation: Conversation) => Promise<void>;

}

export interface SocketState {
    socket: Socket | null;
    onlineUsers: string[];
    connectSocket: () => void;
    disconnectSocket: () => void;
}