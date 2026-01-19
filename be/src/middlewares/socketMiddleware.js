import jwt from 'jsonwebtoken';
import User from '../models/User.js'

export const socketAuthMiddleWare = async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error("Unauthorized - token không tồn tại"))
        }

        const decoded = jwt.verify(token, process.env.SECRET)
        if (!decoded) {
            return next(new Error("Unauthorized - token không hợp lệ hoặc đã hết hạn"))
        }

        const user = await User.findById(decoded.userId).select("-hashedPassword")
        if (!user) {
            return next(new Error("User không tồn tại"))
        }

        socket.user = user;
        next();

    } catch (error) {
        console.error("Lỗi khi verify JWT trong socketMiddleware", error)
        next(new Error("Unauthorized"))
    }
}