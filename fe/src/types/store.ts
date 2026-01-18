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
}