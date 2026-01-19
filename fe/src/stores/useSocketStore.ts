
import { create } from "zustand";
import { connect, io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";


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
    },

    disconnectSocket: () => {
        const socket = get().socket;
        if (socket) {
            socket.disconnect();
            set({ socket: null });
        }
    },

}))
