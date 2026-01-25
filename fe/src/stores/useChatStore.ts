import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { useSocketStore } from "./useSocketStore";


//hàm sort conversation theo pinned lên đầu
const sortConversations = (conversations: any[]) => {
    const currentUserId = useAuthStore.getState().user?._id
    if (!currentUserId) return conversations

    const getPinned = (c: any) =>
        c.participants.find((p: any) => p._id === currentUserId)?.isPinned ?? false

    return conversations.slice().sort((a, b) => {
        const pinnedA = getPinned(a)
        const pinnedB = getPinned(b)

        if (pinnedA && !pinnedB) return -1
        if (!pinnedA && pinnedB) return 1

        const timeA = new Date(a.lastMessageAt || 0).getTime()
        const timeB = new Date(b.lastMessageAt || 0).getTime()

        return timeB - timeA
    })
}


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

                    const currentUserId = useAuthStore.getState().user?._id

                    if (!currentUserId) {
                        set({ conversations: [], converloading: false })
                        return
                    }


                    set({
                        conversations: sortConversations(conversations),
                        converloading: false
                    })

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
                                    nextCursor: state.messages[converId].nextCursor ?? undefined,
                                },
                            },
                        };
                    });

                    set((state) => ({
                        conversations: sortConversations(
                            state.conversations.map((c) =>
                                c._id === converId
                                    ? { ...c, lastMessage: message }
                                    : c
                            )
                        ),
                    }));

                } catch (error) {
                    console.error("Lỗi xảy ra khi addMessage:", error);
                }
            },


            updateConversation: (payload: any) => {
                const currentUserId = useAuthStore.getState().user?._id
                if (!currentUserId) return

                set((state) => ({
                    conversations: sortConversations(
                        state.conversations.map((c) => {
                            if (c._id !== payload._id) return c

                            let updated = { ...c }

                            //update pin (socket pin-conversation)
                            if ("isPinned" in payload) {
                                updated.participants = c.participants.map((p) =>
                                    p._id === currentUserId
                                        ? { ...p, isPinned: payload.isPinned }
                                        : p
                                )
                            }

                            //update archive (socket archive-conversation)
                            if ("isArchived" in payload) {
                                updated.participants = c.participants.map((p) =>
                                    p._id === currentUserId
                                        ? { ...p, isArchived: payload.isArchived }
                                        : p
                                )
                            }

                            // update lastMessage
                            if (payload.lastMessage) {
                                updated.lastMessage = payload.lastMessage
                            }

                            //update unreadCounts
                            if (payload.unreadCounts) {
                                updated.unreadCounts = payload.unreadCounts
                            }

                            //update seenBy
                            if (payload.seenBy) {
                                updated.seenBy = payload.seenBy
                            }

                            //update lastMessageAt
                            if (payload.lastMessageAt) {
                                updated.lastMessageAt = payload.lastMessageAt
                            }

                            return updated
                        })
                    ),
                }))
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

            togglePin: async (conversationId: string) => {
                try {
                    const { conversationId: id, isPinned } = await chatService.togglePinConversation(conversationId)
                    const currentUserId = useAuthStore.getState().user?._id

                    set((state) => ({
                        conversations: sortConversations(
                            state.conversations.map((c) =>
                                c._id === id
                                    ? {
                                        ...c,
                                        participants: c.participants.map((p) =>
                                            p._id === currentUserId
                                                ? { ...p, isPinned }
                                                : p
                                        ),
                                    }
                                    : c
                            )
                        ),
                    }))
                } catch (error) {
                    console.error("Lỗi togglePin:", error)
                }
            },

            toggleArchive: async (conversationId: string) => {
                try {
                    const { conversationId: id, isArchived } = await chatService.toggleArchiveConversation(conversationId)
                    const currentUserId = useAuthStore.getState().user?._id

                    set((state) => ({
                        conversations: sortConversations(
                            state.conversations.map((c) =>
                                c._id === id
                                    ? {
                                        ...c,
                                        participants: c.participants.map((p) =>
                                            p._id === currentUserId
                                                ? { ...p, isArchived }
                                                : p
                                        ),
                                    }
                                    : c
                            )
                        ),
                    }))
                } catch (error) {
                    console.error("Lỗi toggleArchive:", error)
                }
            }


        }),
        {
            name: "chat-storage",
            partialize: (state) => ({ conversations: state.conversations }),
        }
    )
);