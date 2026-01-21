import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { useSocketStore } from "./useSocketStore";

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            conversations: [],
            messages: {},
            activeConversationId: null,
            converloading: false,
            messageLoading: false,
            loading: false,


            setActiveConversation: (id) => set({ activeConversationId: id }),
            reset: () => {
                set({
                    conversations: [],
                    messages: {},
                    activeConversationId: null,
                    converloading: false,
                    messageLoading: false,
                })
            },
            fetchConversations: async () => {
                try {
                    set({ converloading: true })
                    const { conversations } = await chatService.fetchConversations()

                    set({ conversations, converloading: false })

                } catch (error) {
                    console.error("Lỗi xảy ra khi fetchConversations: ", error)
                    set({ converloading: false })
                }
            },
            fetchMessages: async (conversationId) => {
                const { activeConversationId, messages } = get();
                const { user } = useAuthStore.getState();

                const convoId = conversationId ?? activeConversationId;

                if (!convoId) return;

                const current = messages?.[convoId];
                const nextCursor =
                    current?.nextCursor === undefined ? "" : current?.nextCursor;

                if (nextCursor === null) return;

                set({ messageLoading: true });

                try {
                    const { messages: fetched, cursor } = await chatService.fetchMessages(
                        convoId,
                        nextCursor
                    );

                    const processed = fetched.map((m) => ({
                        ...m,
                        isOwn: m.senderId === user?._id,
                    }));

                    set((state) => {
                        const prev = state.messages[convoId]?.items ?? [];
                        const merged = prev.length > 0 ? [...processed, ...prev] : processed;

                        return {
                            messages: {
                                ...state.messages,
                                [convoId]: {
                                    items: merged,
                                    hasMore: !!cursor,
                                    nextCursor: cursor ?? null,
                                },
                            },
                        };
                    });
                } catch (error) {
                    console.error("Lỗi xảy ra khi fetchMessages:", error);
                } finally {
                    set({ messageLoading: false })
                }
            },

            sendDirectMessage: async (recipientId, content, imgUrl) => {
                try {
                    const { activeConversationId } = get()
                    await chatService.sendDirectMessage(recipientId, content, imgUrl, activeConversationId || undefined)

                    set((state) => ({
                        conversations: state.conversations.map((c) => c._id === activeConversationId ? { ...c, seenBy: [] } : c)
                    }))

                } catch (error) {
                    console.error("Lỗi xảy ra khi sendDirectMessage:", error);
                }
            },

            sendGroupMessage: async (conversationId, content, imgUrl) => {
                try {
                    await chatService.sendGroupMessage(conversationId, content, imgUrl)

                    set((state) => ({
                        conversations: state.conversations.map((c) => c._id === get().activeConversationId ? { ...c, seenBy: [] } : c)
                    }))
                } catch (error) {
                    console.error("Lỗi xảy ra khi sendGroupMessage:", error);

                }
            },

            //chịu dữ liệu thêm tn mới vào store mỗi khi nhận dlieu từ socket
            addMessage: async (message) => {
                try {
                    const { user } = useAuthStore.getState();
                    const { fetchMessages } = get();

                    //đánh dấu tin nhắn của mình
                    message.isOwn = message.senderId === user?._id

                    const converId = message.conversationId

                    //lấy danh sách tin nhắn hiện tại (nếu có)
                    //nếu trước đó đã từng mở conver này rồi thì bây g item sẽ chứa tn cũ
                    //nếu chưa mở thì []
                    let prevItems = get().messages[converId]?.items ?? []

                    if (prevItems.length === 0) {
                        //nếu chưa có tn nào thì phải fetch tn cũ trước
                        await fetchMessages(message.conversationId);
                        prevItems = get().messages[converId]?.items ?? []
                    }

                    set((state) => {

                        //tránh thêm trùng message
                        if (prevItems.some((m) => m._id === message._id)) {
                            return state
                        }

                        //thêm message mới
                        return {
                            messages: {
                                ...state.messages,
                                [converId]: {
                                    items: [...prevItems, message],
                                    hasMore: state.messages[converId].hasMore,
                                    nextCursor: state.messages[converId].nextCursor ?? undefined
                                }
                            }
                        }
                    })
                } catch (error) {
                    console.error("Lỗi xảy ra khi addMessage:", error);
                }
            },

            updateConversation: (conversation) => {
                const conv = conversation as any;

                set((state) => ({
                    conversations: state.conversations.map((c) =>
                        c._id === conv._id ? { ...c, ...conv } : c
                    ),
                }));
            },


            markAsSeen: async () => {
                try {

                    const { conversations, activeConversationId } = get();
                    const { user } = useAuthStore.getState();

                    if (!activeConversationId || !user) {
                        return;
                    }

                    const conver = conversations.find((c) => c._id === activeConversationId)
                    if (!conver) {
                        return;
                    }

                    //nếu kh có tn nào có unReadCount > 0 thì kh cần seen gì cả
                    if ((conver.unreadCounts?.[user._id] ?? 0) === 0) {
                        return;
                    }

                    //seen
                    await chatService.markAsSeen(activeConversationId);

                    //update state
                    set((state) => ({
                        conversations: state.conversations.map((c) => (
                            c._id === activeConversationId && c.lastMessage ? {
                                ...c,
                                unreadCounts: {
                                    ...c.unreadCounts,
                                    [user._id]: 0
                                }
                            }
                                : c
                        ))
                    }))

                } catch (error) {
                    console.error("Lỗi xảy ra khi markAsSeen:", error);
                }
            },

            addConver: (conver) => {
                set((state) => {
                    const exists = state.conversations.some(
                        (c) => c._id.toString() === conver._id.toString()
                    );

                    return {
                        conversations: exists
                            ? state.conversations
                            : [conver, ...state.conversations],
                        activeConversationId: conver._id,
                    };
                });
            },


            createConversation: async (type, name, memberIds) => {
                try {
                    set({ loading: true });
                    const conversation = await chatService.createConversation(
                        type,
                        name,
                        memberIds
                    );

                    get().addConver(conversation);


                    useSocketStore
                        .getState()
                        .socket?.emit("join-conversation", conversation._id);

                    //FETCH MESSAGE NGAY (dành cho conver nào đã có hội thoại r)
                    await get().fetchMessages(conversation._id);

                } catch (error) {
                    console.error("Lỗi xảy ra khi gọi createConversation trong store", error);
                } finally {
                    set({ loading: false });
                }
            },
        }),
        {
            name: "chat-storage",
            partialize: (state) => ({ conversations: state.conversations }),
        }
    )
);