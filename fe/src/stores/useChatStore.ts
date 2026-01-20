import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            conversations: [],
            messages: {},
            activeConversationId: null,
            converloading: false,
            messageLoading: false,

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

            updateConversation: async (conversation) => {
                set((state) => ({
                    conversations: state.conversations.map((c) => c._id === conversation._id ? { ...c, ...conversation } : c)
                }));
            }


        }),
        {
            name: "chat-storage",
            partialize: (state) => ({
                conversations: state.conversations,
            }),
        }
    )
)