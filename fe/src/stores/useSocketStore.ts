
import { create } from "zustand";
import { connect, io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";
import { useChatStore } from "./useChatStore";


const baseURL = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create<SocketState>((set, get) => ({
    socket: null,

    onlineUsers: [],

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

        //lắng nghe sự kiện new message
        socket.on("new-message", ({ message, conversation, unreadCounts }) => {
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

    },

    disconnectSocket: () => {
        const socket = get().socket;
        if (socket) {
            socket.disconnect();
            set({ socket: null });
        }
    },

}))
