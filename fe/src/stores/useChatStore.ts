import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import type { Message } from "@/types/chat";
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
                    const { fetchMessages, conversations, fetchConversations } = get();

                    //đánh dấu tin nhắn của mình
                    message.isOwn = message.senderId === user?._id

                    const converId = message.conversationId

                    //Nếu conversation chưa tồn tại (do đã clear hoặc chuyển tiếp cho người mới)
                    let exists = conversations.some(c => c._id === converId)

                    if (!exists) {
                        //fetch lại conversations để có conversation mới
                        await fetchConversations()
                        exists = get().conversations.some(c => c._id === converId)
                        if (!exists) {
                            return
                        }
                    }

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
                                    ? { ...c, lastMessage: message, lastMessageAt: message.createdAt, }
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

                set((state) => {
                    let found = false;
                    const updatedConversations = state.conversations.map((c) => {
                        if (c._id !== payload._id) return c

                        found = true;
                        let updated = { ...c }

                        //update pin
                        if ("isPinned" in payload) {
                            updated.participants = c.participants.map((p) =>
                                p._id === currentUserId
                                    ? { ...p, isPinned: payload.isPinned }
                                    : p
                            )
                        }

                        //update archive
                        if ("isArchived" in payload) {
                            updated.participants = c.participants.map((p) =>
                                p._id === currentUserId
                                    ? { ...p, isArchived: payload.isArchived }
                                    : p
                            )
                        }

                        //update restrict
                        if ("isRestricted" in payload) {
                            updated.participants = c.participants.map((p) =>
                                p._id === currentUserId
                                    ? { ...p, isRestricted: payload.isRestricted }
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

                        //update theme
                        if (payload.theme) {
                            updated.theme = payload.theme
                        }

                        //update lastMessageAt
                        if (payload.lastMessageAt) {
                            updated.lastMessageAt = payload.lastMessageAt
                        }

                        // remove member
                        if (payload.removeMemberId) {
                            updated.participants = c.participants.filter(
                                (p) => p._id !== payload.removeMemberId
                            );
                        }

                        if (payload.participants) {
                            updated.participants = payload.participants;
                        }

                        return updated
                    })

                    if (!found) {
                        updatedConversations.push(payload);
                    }

                    return {
                        conversations: sortConversations(updatedConversations)
                    }
                })
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
            },

            toggleRestrict: async (conversationId: string) => {
                const { conversation } =
                    await chatService.toggleRestrictConversation(conversationId)

                set((state) => ({
                    conversations: sortConversations(
                        state.conversations.map((c) => {
                            if (c._id !== conversation._id) return c

                            return {
                                ...c,
                                participants: c.participants.map((p) => {
                                    const updated = conversation.participants.find(
                                        (up: any) =>
                                            up.userID?._id === p._id
                                    )

                                    return updated
                                        ? {
                                            ...p,
                                            isRestricted: updated.isRestricted,
                                            isArchived: updated.isArchived,
                                            isPinned: updated.isPinned,
                                        }
                                        : p
                                }),
                            }
                        })
                    ),
                }))
            },

            leaveGroup: async (conversationId: string) => {
                try {
                    await chatService.leaveGroup(conversationId)

                    const { activeConversationId } = get()

                    // rời socket room
                    useSocketStore
                        .getState()
                        .socket?.emit("leave-conversation", conversationId)

                    set((state) => ({
                        conversations: state.conversations.filter(
                            (c) => c._id !== conversationId
                        ),
                        messages: Object.fromEntries(
                            Object.entries(state.messages).filter(
                                ([key]) => key !== conversationId
                            )
                        ),
                        activeConversationId:
                            activeConversationId === conversationId
                                ? null
                                : activeConversationId
                    }))

                } catch (error) {
                    console.error("Lỗi leaveGroup:", error)
                }
            },

            clearConversation: async (conversationId: string) => {
                try {
                    await chatService.clearConversation(conversationId)

                    const { activeConversationId } = get()

                    set((state) => ({
                        conversations: state.conversations.filter(
                            (c) => c._id !== conversationId
                        ),
                        messages: Object.fromEntries(
                            Object.entries(state.messages).filter(
                                ([key]) => key !== conversationId
                            )
                        ),
                        activeConversationId:
                            activeConversationId === conversationId
                                ? null
                                : activeConversationId
                    }))

                } catch (error) {
                    console.error("Lỗi clearConversation:", error)
                }
            },

            //chuyển tiếp
            forwardDirectMessage: async (recipientId: string, originalMessageId: string) => {
                try {
                    await chatService.forwardDirectMessage(recipientId, originalMessageId)
                    await get().fetchConversations()
                } catch (error) {
                    console.error("Lỗi forwardDirectMessage:", error)
                }
            },

            forwardGroupMessage: async (conversationId: string, originalMessageId: string) => {
                try {
                    await chatService.forwardGroupMessage(conversationId, originalMessageId)
                    await get().fetchConversations()
                } catch (error) {
                    console.error("Lỗi forwardGroupMessage:", error)
                }
            },

            //unsend
            markMessageUnsent: (conversationId: string, messageId: string) => {
                set((state) => {
                    const convo = state.messages[conversationId];
                    if (!convo) return state;

                    // update message list
                    const updatedItems = convo.items.map(m =>
                        m._id === messageId
                            ? { ...m, isUnsent: true, content: null }
                            : m
                    );

                    // update conversations (sidebar)
                    const conversations = state.conversations.map(c => {
                        if (c._id !== conversationId) return c;

                        let lastMessage = c.lastMessage;

                        // nếu là lastMessage thì fake content
                        if (c.lastMessage?._id === messageId) {
                            lastMessage = {
                                ...c.lastMessage,
                                content: "Tin nhắn đã thu hồi"
                            };
                        }

                        return { ...c, lastMessage };
                    });

                    return {
                        messages: {
                            ...state.messages,
                            [conversationId]: { ...convo, items: updatedItems },
                        },
                        conversations
                    };
                });
            },
            unsendMessage: async (messageId: string, conversationId: string) => {
                try {
                    await chatService.unsendMessage(messageId);

                    get().markMessageUnsent(conversationId, messageId);

                    useSocketStore.getState().socket?.emit("message-unsent", {
                        messageId,
                        conversationId
                    });

                } catch (error) {
                    console.error("Lỗi khi unsendMessage:", error);
                }
            },

            //pin / unpin message
            addPinnedMessage: (conversationId: string, pinnedMessage: any) => {
                set((state) => ({
                    conversations: state.conversations.map(c => {
                        if (c._id !== conversationId) return c

                        const exists = c.pinnedMessages?.some(
                            (p: any) => p.messageId === pinnedMessage.messageId
                        )

                        if (exists) return c

                        return {
                            ...c,
                            pinnedMessages: [pinnedMessage, ...(c.pinnedMessages || [])]
                        }
                    })
                }))
            },

            removePinnedMessage: (conversationId: string, messageId: string) => {
                set((state) => ({
                    conversations: state.conversations.map(c => {
                        if (c._id !== conversationId) return c

                        return {
                            ...c,
                            pinnedMessages: (c.pinnedMessages || []).filter(
                                (p: any) => p.messageId !== messageId
                            )
                        }
                    })
                }))
            },

            togglePinMessage: async (messageId: string) => {
                try {
                    await chatService.togglePinMessage(messageId)
                } catch (error) {
                    console.error("Lỗi togglePinMessage:", error)
                }
            },

            updateTheme: async (conversationId: string, theme: string) => {
                try {
                    set((state) => ({
                        conversations: state.conversations.map(c =>
                            c._id === conversationId
                                ? { ...c, theme }
                                : c
                        )
                    }));

                    const updatedConversation = await chatService.updateConversationTheme(conversationId, theme);

                    set((state) => ({
                        conversations: state.conversations.map(c =>
                            c._id === conversationId
                                ? { ...c, theme: updatedConversation.theme }
                                : c
                        )
                    }));

                } catch (error) {
                    console.error("Lỗi updateTheme:", error);
                    throw error;
                }
            },

            setNickname: async (conversationId, nickname, targetId) => {
                const { user } = useAuthStore.getState();
                if (!user) return;

                set((state) => ({
                    conversations: state.conversations.map((c) => {
                        if (c._id !== conversationId) return c;

                        const updatedParticipants = c.participants.map((p) => {
                            if (p._id === targetId) {
                                return { ...p, nickname: nickname || null };
                            }
                            return p;
                        });

                        return {
                            ...c,
                            participants: updatedParticipants
                        };
                    })
                }));

                try {
                    await chatService.setNickname(conversationId, nickname, targetId);
                } catch (err) {
                    console.error("Lỗi khi set nickname:", err);
                }
            }
        }),
        {
            name: "chat-storage",
            partialize: (state) => ({ conversations: state.conversations }),
        }
    )
);