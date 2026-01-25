import { Server } from 'socket.io'
import http from 'http'
import express from 'express'
import { socketAuthMiddleWare } from '../middlewares/socketMiddleware.js';
import { getUserConversationForSocketIO } from '../controllers/conversationController.js';


const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true
    }
})

io.use(socketAuthMiddleWare)

const onlineUsers = new Map(); //{userId:socketId}

io.on('connection', async (socket) => {
    const user = socket.user;

    console.log(`${user.displayName} online với ${socket.id}`);

    onlineUsers.set(user._id, socket.id); //them user online vo

    io.emit("online-users", Array.from(onlineUsers.keys())); // convert sang array

    //lấy cuộc hội thoại của user 
    const conversationIds = await getUserConversationForSocketIO(user.id)
    conversationIds.forEach((id) => {
        socket.join(id) //mỗi user sẽ join đúng room hội thoại của họ
    });

    //logic mới để khi user tạo conversation mới ở fe thì server sẽ join vào room
    socket.on("join-conversation", (conversationId) => {
        socket.join(conversationId);
    })

    //tạo phòng theo user id (nhóm)
    socket.join(user._id.toString())

    //pin conversation
    socket.on("pin-conversation", (updatedConversation) => {
        socket.to(user._id.toString()).emit("pin-conversation", updatedConversation)
    })

    socket.on("disconnect", () => {

        //user offline
        onlineUsers.delete(user._id);
        io.emit("online-users", Array.from(onlineUsers.keys())); // convert sang array

        console.log(`socket disconnected: ${socket.id}`);

    })
});

export { io, app, server };