import Friend from '../models/Friend.js'
import FriendRequest from '../models/FriendRequest.js'
import User from '../models/User.js'
import { io } from "../socket/index.js";

export const sendFriendRequest = async (req, res) => {
    try {

        const { to, message } = req.body
        const from = req?.user?._id

        //kh duoc gửi lời mời cho chính mình
        if (from.toString() === to.toString()) {
            return res.status(400).json({
                message: "Bạn không thể gửi lời mời cho chính mình"
            })
        }

        //user kh tồn tại trong hệ thống
        const userExist = await User.exists({ _id: to })
        if (!userExist) {
            return res.status(400).json({
                message: "User không tồn tại trong hệ thống"
            })
        }

        //dùng let
        let userA = to.toString()
        let userB = from.toString()
        if (userA > userB) {
            [userA, userB] = [userB, userA]
        }

        //hai ng có là bạn bè chưa, đã gửi lời mời kết bạn chưa
        const [alreadyFriend, existingRequest] = await Promise.all([
            await Friend.findOne({ userA, userB }),
            await FriendRequest.findOne({
                $or: [
                    { from, to },
                    { from: to, to: from }
                ]
            })
        ])

        if (alreadyFriend) {
            return res.status(400).json({
                message: "Hai người đã là bạn bè"
            })
        }
        if (existingRequest) {
            return res.status(400).json({
                message: "Đã tồn tại lời mời kết bạn giữa hai người"
            })
        }

        //ok hết thì gửi lời mời 
        const request = await FriendRequest.create({ from, to, message })

        const fullRequest = await FriendRequest.findById(request._id)
            .populate("from", "_id displayName avatarUrl username")
            .populate("to", "_id displayName avatarUrl username")
            .lean();

        io.to(to.toString()).emit("friend-request-received", fullRequest);

        return res.status(201).json({
            message: "Gửi lời mời kết bạn thành công",
            request: fullRequest
        })


    } catch (err) {
        console.error('Lỗi khi gửi lời mời kết bạn', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}


export const acceptFriendRequest = async (req, res) => {
    try {

        const requestId = req.params.requestId
        const userId = req.user._id

        const request = await FriendRequest.findById(requestId);

        //lời mời có tồn tại không
        if (!request) {
            return res.status(404).json({ message: "Không tìm thấy lời mời kết bạn" });
        }

        //chỉ ng nhận lời mời mới được chấp nhận
        if (request.to.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "Bạn không có quyền chấp nhận lời mời kết bạn này"
            })
        }

        // tránh tạo trùng bạn bè
        const [userA, userB] = [
            request.from.toString(),
            request.to.toString()
        ].sort();

        const existed = await Friend.findOne({ userA, userB });

        if (!existed) {
            await Friend.create({ userA, userB });
        }

        await FriendRequest.deleteOne({ _id: requestId });

        const friendInf = await User.findById(request.from)
            .select("_id displayName avatarUrl username")
            .lean();

        if (!friendInf) {
            return res.status(404).json({
                message: "Không tìm thấy thông tin người gửi lời mời"
            });
        }

        const requestIdStr = request._id.toString();
        const userInf = await User.findById(userId)
            .select("_id displayName avatarUrl username")
            .lean();

        // emit cho người gửi
        io.to(request.from.toString()).emit("friend-request-accepted", {
            user: userInf,
            requestId: requestIdStr
        });

        // emit cho người accept
        io.to(userId.toString()).emit("friend-request-accepted", {
            user: friendInf,
            requestId: requestIdStr
        });

        return res.status(200).json({
            message: "Chấp nhận lời mời kết bạn thành công",
            newFriend: {
                _id: friendInf._id,
                displayName: friendInf.displayName,
                avatarUrl: friendInf.avatarUrl,
            }
        });

    } catch (err) {
        console.error("ACCEPT FRIEND ERROR:", err.message);
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
}


export const declineFriendRequest = async (req, res) => {
    try {
        const requestId = req.params.requestId
        const userId = req.user._id

        const request = await FriendRequest.findById(requestId);

        //lời mời có tồn tại không
        if (!request) {
            return res.status(404).json({ message: "Không tìm thấy lời mời kết bạn" });
        }

        //chỉ ng nhận lời mời mới được từ chối
        if (request.to.toString() !== userId.toString()) {
            return res.status(403).json({
                message: "Bạn không có quyền từ chối lời mời kết bạn này"
            })
        }

        //lưu lại from trước khi xoá
        const fromId = request.from.toString();

        await FriendRequest.findByIdAndDelete(requestId);

        //emit cho người gửi
        io.to(fromId).emit("friend-request-declined", {
            requestId
        });

        //emit cho người từ chối
        io.to(userId.toString()).emit("friend-request-declined", {
            requestId
        });

        return res.status(200).json({ message: "Từ chối lời mời kết bạn thành công" })

    } catch (err) {
        console.error('Lỗi khi từ chối lời mời kết bạn', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}


export const getAllFriends = async (req, res) => {
    try {
        const userId = req.user._id
        const friendList = await Friend.find({
            $or: [
                { userA: userId },
                { userB: userId }
            ]
        })
            .populate("userA", "_id displayName avatarUrl username")
            .populate("userB", "_id displayName avatarUrl username")
            .lean();

        if (!friendList.length) {
            return res.status(200).json({ friends: [] })
        }
        const friends = friendList.map((f) => f.userA._id.toString() === userId.toString() ? f.userB : f.userA)
        return res.status(200).json({
            message: "Lấy danh sách bạn bè thành công",
            friends
        })

    } catch (err) {
        console.error('Lỗi khi lấy danh sách bạn bè', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}


export const getFriendRequests = async (req, res) => {
    try {
        const userId = req.user._id

        const populateFields = "_id username displayName avatarUrl";

        const [sent, received] = await Promise.all([
            FriendRequest.find({ from: userId }).populate("to", populateFields),
            FriendRequest.find({ to: userId }).populate("from", populateFields)
        ])

        return res.status(200).json({
            message: "Lấy danh sách yêu cầu thành công",
            sent,
            received
        })

    } catch (err) {
        console.error('Lỗi khi lấy danh sách lời mời kết bạn', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}


