import { Server } from 'socket.io'
import http from 'http'
import express from 'express'
import { socketAuthMiddleWare } from '../middlewares/socketMiddleware.js';
import { getUserConversationForSocketIO } from '../controllers/conversationController.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';


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

//những online user kh bị hạn chế để truyền
const getVisibleOnlineUsers = async (userId) => {
    const onlineUserIds = Array.from(onlineUsers.keys())

    //tìm tất cả conver của user với type direct 
    const conversations = await Conversation.find({
        type: "direct",
        "participants.userID": userId
    })

    const restrictedUserIds = []

    conversations.forEach(conver => {

        //chiều mình hạn chế ngt
        const me = conver.participants.find(p => p.userID.toString() === userId)

        if (me?.isRestricted) {
            const other = conver.participants.find(p => p.userID.toString() !== userId)
            if (other) {
                restrictedUserIds.push(other.userID.toString())
            }
        }

        //check chiều ngược lại (neu ngt hạn chế mình)
        const other = conver.participants.find(p => p.userID.toString() !== userId)
        if (other?.isRestricted) {
            restrictedUserIds.push(other.userID.toString())
        }
    })

    return onlineUserIds.filter(id => !restrictedUserIds.includes(id))
}

io.on('connection', async (socket) => {
    const user = socket.user;

    console.log(`${user.displayName} online với ${socket.id}`);

    onlineUsers.set(user._id.toString(), socket.id)

    //lấy online user (kh lấy ng đã hạn chế)
    for (const [userId, socketId] of onlineUsers.entries()) {
        const visibleUsers = await getVisibleOnlineUsers(userId)
        io.to(socketId).emit("online-users", visibleUsers)
    }

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

    //rời nhóm 
    socket.on("leave-conversation", (conversationId) => {
        socket.leave(conversationId)
    })

    //khi ng dùng nhập tn
    socket.on("user-typing", ({ conversationId, userId }) => {
        socket.to(conversationId).emit("user-typing", { conversationId, userId });
    });

    socket.on("user-stop-typing", ({ conversationId, userId }) => {
        socket.to(conversationId).emit("user-stop-typing", { conversationId, userId });
    });

    socket.on("disconnect", async () => {

        const userId = user._id.toString();
        const currentTime = new Date();

        //user offline
        onlineUsers.delete(userId);

        //lưu tgian off vô db
        try {
            await User.findByIdAndUpdate(userId, { offlineAt: currentTime })
        } catch (error) {

        }

        //Thông báo cho những người khác
        io.emit("user-offline-status", {
            userId,
            offlineAt: currentTime
        });

        //Cập nhật lại list online chung
        io.emit("online-users", Array.from(onlineUsers.keys())); // convert sang array

        console.log(`socket disconnected: ${socket.id}`);

    })
});

export { io, app, server, onlineUsers, getVisibleOnlineUsers };