
import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";
import { useChatStore } from "./useChatStore";


const baseURL = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create<SocketState>((set, get) => ({
    socket: null,

    onlineUsers: [],
    offlineRecords: {},

    typingUsers: {}, // { conversationId: [userId, ...] }

    connectSocket: () => {
        const accessToken = useAuthStore.getState().accessToken
        const existingSocket = get().socket;

        if (existingSocket) return; //tránh tạo nhiều socket
        const socket: Socket = io(baseURL, {
            auth: { token: accessToken },
            transports: ["websocket"]
        })
        set({ socket })

        socket.on("connect", () => {
            console.log("đã kết nối với socket")
        });

        // connect xong thì lắng nghe sự kiện online user từ be
        socket.on("online-users", (userIds) => {
            set({ onlineUsers: userIds })
        })

        //lắng nghe user offline để lấy ra đuoc tgian off
        socket.on("user-offline-status", ({ userId, offlineAt }) => {
            set((state) => ({
                offlineRecords: { ...state.offlineRecords, [userId]: offlineAt }
            }));
        });

        //lắng nghe sự kiện new message
        socket.on("new-message", ({ message, conversation, unreadCounts }) => {
            // check nếu conversation đã tồn tại trong store
            const conversationExists = useChatStore.getState().conversations.some(c => c._id === conversation._id)

            if (!conversationExists) {
                //conversation mới (chuyển tiếp cho người chưa có conversation)
                //thêm conversation vào danh sách luôn
                const fullConversation = {
                    ...conversation,
                    unreadCounts
                }
                useChatStore.getState().addConver(fullConversation)
                //join room cho conversation mới
                socket.emit('join-conversation', conversation._id)
            }

            useChatStore.getState().addMessage(message);
            const lastMessage = {
                _id: conversation.lastMessage._id,
                content: conversation.lastMessage.content,
                createdAt: conversation.lastMessage.createdAt,
                senderId: {
                    _id: conversation.lastMessage.senderId,
                    displayName: "",
                    avatarUrl: null
                }
            };

            const updatedConversation = {
                ...conversation,
                lastMessage,
                unreadCounts
            }

            //nếu tn đang bật thì đánh dấu là đã đọc
            if (useChatStore.getState().activeConversationId === message.conversationId) {
                //đánh dấu đã đọc
                useChatStore.getState().markAsSeen();
            }

            useChatStore.getState().updateConversation(updatedConversation);
        })

        //lắng nghe sự kiện read-message khi user đọc tn
        socket.on("read-message", ({
            conversation,
            lastMessage,
        }) => {
            //những thông tin cần cập nhật của conversation
            const updated = {
                _id: conversation._id,
                lastMessage,
                lastMessageAt: conversation.lastMessageAt,
                unreadCounts: conversation.unreadCounts,
                seenBy: conversation.seenBy
            };
            useChatStore.getState().updateConversation(updated);
        })

        //lắng nghe sự kiện khi user tạo nhóm mới
        socket.on("new-group", (conversation) => {
            //cập nhật ds cuộc trò chuyện
            useChatStore.getState().addConver(conversation)
            socket.emit('join-conversation', conversation._id)
        })

        // lắng nghe khi có member rời nhóm
        socket.on("member-left", ({ conversationId, userId }) => {

            //nếu chính mình bị remove khỏi group (bị kick)
            if (userId === useAuthStore.getState().user?._id) {
                useChatStore.getState().leaveGroup(conversationId);
                return;
            }

            // nếu người khác rời group thì update participants
            useChatStore.getState().updateConversation({
                _id: conversationId,
                removeMemberId: userId
            });
        })

        socket.on("update-theme", ({ conversationId, theme }) => {
            const chatStore = useChatStore.getState();

            chatStore.updateConversation({
                _id: conversationId,
                theme
            });
        });

        socket.on("message-unsent", ({ messageId, conversationId }) => {
            useChatStore.getState().markMessageUnsent(conversationId, messageId);
        });

        socket.on("message-pin-toggled", ({ conversationId, messageId, action, pinnedMessage }) => {
            const store = useChatStore.getState()

            if (action === "pinned") {
                store.addPinnedMessage(conversationId, pinnedMessage)
            } else {
                store.removePinnedMessage(conversationId, messageId)
            }
        })

        //phát sự kiện khi user nhập tin nhắn
        socket.on("user-typing", ({ conversationId, userId }) => {
            get().setTyping(conversationId, userId);
        });

        socket.on("user-stop-typing", ({ conversationId, userId }) => {
            get().removeTyping(conversationId, userId);
        });

        socket.on("nickname-updated", ({ conversationId, targetId, setterId, nickname }) => {
            const chatStore = useChatStore.getState();

            chatStore.updateConversation({
                _id: conversationId,
                participants: (chatStore.conversations.find(c => c._id === conversationId)?.participants || []).map((p) => {
                    if (p._id.toString() === targetId.toString()) {
                        return { ...p, nickname: nickname || null };
                    }
                    return p;
                })
            });
        });
    },

    //ng dùng nhập tn
    setTyping: (conversationId: string, userId: string) => {
        set((state) => {
            const users = state.typingUsers[conversationId] || [];
            if (!users.includes(userId)) {
                return {
                    typingUsers: {
                        ...state.typingUsers,
                        [conversationId]: [...users, userId]
                    }
                };
            }
            return state;
        });
    },

    //ng kh nhập tn nua
    removeTyping: (conversationId: string, userId: string) => {
        set((state) => ({
            typingUsers: {
                ...state.typingUsers,
                [conversationId]: (state.typingUsers[conversationId] || []).filter(u => u !== userId)
            }
        }));
    },

    disconnectSocket: () => {
        const socket = get().socket;
        if (socket) {
            socket.disconnect();
            set({ socket: null });
        }
    },

}))
