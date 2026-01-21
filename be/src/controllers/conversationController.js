
import Conversation from "../models/Conversation.js"
import Message from "../models/Message.js"
import { io } from "../socket/index.js";


export const createConversation = async (req, res) => {
    try {
        const { type, name, memberIds } = req.body
        const userId = req.user._id
        if (!type ||
            (type === 'group' && !name) ||
            !memberIds ||
            !Array.isArray(memberIds) ||
            memberIds.length === 0
        ) {
            return res.status(400).json({ message: "Tên nhóm và danh sách thành viên là bắt buộc" })
        }

        let conversation;

        if (type === 'direct') {
            const participantId = memberIds[0] //id của ng còn lại

            conversation = await Conversation.findOne({
                type: "direct",
                "participants.userID": {
                    $all: [userId, participantId] //kiếm trong mảng 1 hội thoại phải có hai user này (coi giữa 2 ng có cuộc hội thoại chưa)
                }
            })

            //nếu chưa có cuộc hội thoại
            if (!conversation) {
                conversation = new Conversation({
                    type: 'direct',
                    participants: [
                        { userID: userId },
                        { userID: participantId }
                    ],
                    lastMessageAt: new Date()
                })
                await conversation.save()
            }
        }

        if (type === 'group') {
            conversation = new Conversation({
                type: 'group',
                participants: [
                    { userID: userId },
                    ...memberIds.map((id) => ({ userID: id }))
                ],
                group: {
                    name,
                    createdBy: userId
                },
                lastMessageAt: new Date()
            })
            await conversation.save()
        }

        //nếu vẫn chưa có conversation thì do type truyên kh hợp lệ
        if (!conversation) {
            return res.status(400).json({ message: "Conversation type không hợp lệ" })
        }

        //có rồi thì populate
        await conversation.populate([
            { path: 'participants.userID', select: 'displayName avatarUrl' },
            { path: 'seenBy', select: 'displayName avatarUrl' },
            { path: 'lastMessage.senderId', select: 'displayName avatarUrl' },

        ])

        const participants = (conversation.participants || []).map((p) => ({
            _id: p.userID?._id,
            displayName: p.userID?.displayName,
            avatarUrl: p.userID?.avatarUrl ?? null,
            joinAt: p.joinedAt
        }))

        const formatted = { ...conversation.toObject(), participants }

        //khi user tạo nhóm thì real time cho các user khác vào duoc liền luôn
        if (type === "group") {
            memberIds.forEach((userId) => {
                io.to(userId).emit('new-group', formatted)
            })
        }

        return res.status(201).json({ conversation: formatted })


    } catch (error) {
        console.error("Lỗi khi tạo conversation", error)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }
}


export const getConversations = async (req, res) => {
    try {
        const userId = req.user?._id

        const conversation = await Conversation.find({ "participants.userID": userId })

            .sort({ lastMessageAt: -1, updatedAt: -1 })
            .populate({
                path: "participants.userID",
                select: "displayName avatarUrl"
            })
            .populate({
                path: "lastMessage.senderId",
                select: "displayName avatarUrl"
            })
            .populate({
                path: "seenBy",
                select: "displayName avatarUrl"
            })

        //format mỗi conversation lại
        const formatted = conversation.map((conver) => {
            const participants = (conver.participants || []).map((p) => ({
                _id: p.userID?._id,
                displayName: p.userID?.displayName,
                avatarUrl: p.userID?.avatarUrl ?? null,
                joinAt: p.joinedAt
            }))

            return {
                ...conver.toObject(), //chuyển moogose doc thành js thuần bỏ những data kh cần thiết
                unreadCounts: conver.unreadCounts || {},
                participants
            }
        })

        return res.status(200).json({
            conversations: formatted
        })

    } catch (error) {
        console.error("Lỗi khi lấy conversation", error)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }
}


export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params
        const { limit = 50, cursor } = req.query //cursor: mốc thời gian để load tin cũ hơn

        const query = { conversationId }

        //nếu có cursor nghĩa là đang load thêm tn cũ
        if (cursor) {
            //cần query tn cũ hơn
            query.createdAt = { $lt: new Date(cursor) }
        }

        let messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit((+limit) + 1)

        let nextCursor = null

        //nếu vẫn còn trang tiếp theo 
        if (messages.length > (+limit)) {
            const nextMessage = messages[messages.length - 1] //lấy tn cuối cùng
            nextCursor = nextMessage.createdAt.toISOString(); //g cursor tiếp theo sẽ lấy từ tn cuối cùng đó trở đi về sau
            messages.pop() //bỏ tin cuối cùng ra 
        }

        messages = messages.reverse()

        return res.status(200).json({
            messages,
            nextCursor
        })

    } catch (error) {
        console.error("Lỗi khi lấy messages", error)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }
}

export const getUserConversationForSocketIO = async (userId) => {
    try {
        const conversations = await Conversation.find(
            { "participants.userID": userId },
            {
                _id: 1 //chỉ lấy đúng trường _id
            }
        )

        return conversations.map((c) => c._id.toString());

    } catch (error) {
        console.error("Lỗi khi fetch conversations", error)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }
}


export const markAsSeen = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id.toString();

        const conversation = await Conversation.findById(conversationId).lean();

        if (!conversation) {
            return res.status(404).json({ message: "không tìm thấy conversation" })
        }

        const last = conversation.lastMessage

        if (!last) {
            return res.status(200).json({ message: "không có tin nhắn để mark as seen" })
        }

        //tn cuối do sender gửi thì kh cần đánh dấu đã đọc
        if (last.senderId.toString() === userId) {
            return res.status(200).json({ message: "tin nhắn được gửi bởi sender nên kh cần mark as seen" })
        }

        //update
        const updated = await Conversation.findByIdAndUpdate(
            conversationId,
            {
                $addToSet: { seenBy: userId }, //thêm user vào mảng seebBy
                $set: { [`unreadCounts.${userId}`]: 0 } //gán gtri cho 1 field
            }, {
            new: true //trả về doccument sau khi update
        }
        )

        io.to(conversationId).emit("read-message", {
            conversation: updated,
            lastMessage: {
                _id: updated?.lastMessage._id,
                content: updated?.lastMessage.content,
                senderId: {
                    _id: updated?.lastMessage.senderId
                }
            }
        })

        return res.status(200).json({
            message: "mark as seen thành công",
            seenBy: updated?.seenBy || [],
            myUnreadCount: updated?.unreadCounts[userId] || 0
        })

    } catch (error) {
        console.error("Lỗi khi markAsSeen", error)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }
}