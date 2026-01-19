import { Server } from 'socket.io'
import http from 'http'
import express from 'express'
import { socketAuthMiddleWare } from '../middlewares/socketMiddleware.js';


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

    socket.on("disconnect", () => {

        //user offline
        onlineUsers.delete(user._id);
        io.emit("online-users", Array.from(onlineUsers.keys())); // convert sang array

        console.log(`socket disconnected: ${socket.id}`);

    })
});

export { io, app, server };