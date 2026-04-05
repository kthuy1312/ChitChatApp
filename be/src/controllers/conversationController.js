
import Conversation from "../models/Conversation.js"
import Message from "../models/Message.js"
import { io, onlineUsers, getVisibleOnlineUsers } from "../socket/index.js";


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
            { path: 'participants.userID', select: 'displayName avatarUrl offlineAt' },
            { path: 'seenBy', select: 'displayName avatarUrl' },
            { path: 'lastMessage.senderId', select: 'displayName avatarUrl' },

        ])

        const participants = (conversation.participants || []).map((p) => ({
            _id: p.userID?._id,
            displayName: p.userID?.displayName,
            avatarUrl: p.userID?.avatarUrl ?? null,
            offlineAt: p.userID?.offlineAt || null,
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

        const conversation = await Conversation.find({
            "participants.userID": userId,
            hiddenFor: { $nin: [userId] } //kh ẩn cho user đó
        })

            .sort({ lastMessageAt: -1, updatedAt: -1 })
            .populate({
                path: "participants.userID",
                select: "displayName avatarUrl offlineAt bio phone email username"
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
                offlineAt: p.userID?.offlineAt || null,
                joinedAt: p.joinedAt,
                isPinned: p.isPinned ?? false,
                isArchived: p.isArchived ?? false,
                isRestricted: p.isRestricted ?? false,
                nickname: p.nickname || null,
                bio: p.userID?.bio || null,
                phone: p.userID?.phone || null,
                email: p.userID?.email || null,
                username: p.userID?.username || null,
            }))

            const {
                participants: _,
                isPinned,
                isArchived,
                isRestricted,
                ...safe
            } = conver.toObject()

            //lọc tn ghim đối với ng đã xóa conver
            const clearedRecord = conver.clearedAt.find(
                c => c.userId.toString() === userId.toString()
            );

            let filteredPinned = conver.pinnedMessages;

            //nếu user đã clear conver
            if (clearedRecord) {
                filteredPinned = conver.pinnedMessages.filter(p => {
                    return new Date(p.createdAt) > new Date(clearedRecord.timestamp);
                });
            }

            return {
                ...safe,
                unreadCounts: conver.unreadCounts || {},
                participants,
                pinnedMessages: filteredPinned
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

export const getConversationsByUserId = async (req, res) => {
    const userId = req.user?._id

    const conversations = await Conversation.find({
        "participants.userID": userId
    })

    return res.status(200).json({
        message: `Converstations của ${userId}:`,
        conversations
    })
}

export const getMessages = async (req, res) => {
    try {
        const userId = req.user._id
        const { conversationId } = req.params
        const { limit = 50, cursor } = req.query //cursor: mốc thời gian để load tin cũ hơn

        //lấy conversation để check clearedAt (trong delete conversation)
        const conversation = await Conversation.findById(conversationId)

        if (!conversation) {
            return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" })
        }

        const query = { conversationId }

        //nếu user đã clear data trước đó
        const clearData = conversation?.clearedAt.find(c => c.userId.toString() === userId.toString())

        if (clearData) {
            query.createdAt = { $gt: clearData.timestamp }
        }

        //nếu có cursor nghĩa là đang load thêm tn cũ
        if (cursor) {
            //cần query tn cũ hơn
            query.createdAt = {
                ...(query.createdAt || {}),
                $lt: new Date(cursor)
            }
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

export const updateTheme = async (req, res) => {
    try {
        const userId = req.user?._id
        const { conversationId } = req.params
        const { theme } = req.body

        if (!theme) {
            return res.status(400).json({ message: "Thiếu thông tin theme" })
        }

        const conversation = await Conversation.findById(conversationId)

        if (!conversation) {
            return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" })
        }

        const isParticipant = conversation.participants.some(p => p.userID?.toString() === userId?.toString())

        if (!isParticipant) {
            return res.status(403).json({ message: "Bạn không có quyền thay đổi theme cho cuộc trò chuyện này" })
        }

        conversation.theme = theme

        await conversation.save()

        //socket theme
        io.to(conversationId).emit("update-theme", {
            conversationId,
            theme,
            updatedBy: userId
        })

        return res.status(200).json({ conversation })
    } catch (error) {
        console.error("Lỗi khi cập nhật theme", error)
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

//hai ng có đang hạn chế nhau kh (dùng cho read-message)
export const isRestrictedBetween = async (conversationId) => {
    const conversation = await Conversation.findById(conversationId)
        .select("participants")

    if (!conversation) return false

    //nếu có ít nhất 1 participant đang restrict
    return conversation.participants.some(p => p.isRestricted === true)
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

        //coi có hạn chế kh (nếu có thì kh emit read-message)
        const restricted = await isRestrictedBetween(conversationId)

        if (!restricted) {
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
        }

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

export const pinConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id.toString();

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({ message: "không tìm thấy conversation" })
        }

        const participant = conversation.participants.find(
            p => p.userID.toString() === userId
        )

        if (!participant) {
            return res.status(403).json({ message: "Bạn không có quyền thao tác" })
        }

        const newPinnedState = !participant.isPinned

        await Conversation.updateOne(
            {
                _id: conversationId,
                "participants.userID": userId
            },
            {
                $set: {
                    "participants.$.isPinned": newPinnedState,
                }
            }
        )

        return res.status(200).json({
            message: newPinnedState ? "Đã ghim" : "Đã bỏ ghim",
            conversationId,
            isPinned: newPinnedState
        })

    } catch (error) {
        console.error("Lỗi khi pinConversation", error)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }

}

export const archiveConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id.toString();

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({ message: "không tìm thấy conversation" })
        }

        const participant = conversation.participants.find(
            p => p.userID.toString() === userId
        )

        if (!participant) {
            return res.status(403).json({ message: "Bạn không có quyền thao tác" })
        }

        const newArchiveState = !participant.isArchived

        await Conversation.updateOne(
            {
                _id: conversationId,
                "participants.userID": userId
            },
            {
                $set: {
                    "participants.$.isArchived": newArchiveState,
                    "participants.$.isPinned": false
                }
            }, {
            new: true
        }
        )

        return res.status(200).json({
            message: newArchiveState ? "Đã lưu trữ" : "Đã bỏ lưu trữ",
            conversationId,
            isArchived: newArchiveState
        })

    } catch (error) {
        console.error("Lỗi khi archiveConversation", error)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }

}

export const restrictConversation = async (req, res) => {
    try {
        const { conversationId } = req.params
        const userId = req.user._id.toString()

        const conversation = await Conversation.findById(conversationId)
        if (!conversation) {
            return res.status(404).json({ message: "Không tìm thấy conversation" })
        }

        if (conversation.type === "group") {
            return res.status(400).json({ message: "Không thể hạn chế nhóm chat" })
        }

        const me = conversation.participants.find(
            p => p.userID.toString() === userId
        )

        if (!me) {
            return res.status(403).json({ message: "Không có quyền" })
        }

        const newState = !me.isRestricted

        const updatedConversation = await Conversation.findOneAndUpdate(
            {
                _id: conversationId,
                "participants.userID": userId,
            },
            {
                $set: {
                    "participants.$.isRestricted": newState,
                    "participants.$.isArchived": false,
                    "participants.$.isPinned": false,
                },
            },
            { new: true }
        )
            .populate("participants.userID", "displayName avatarUrl username")

        // realtime update online list
        for (const [userId, socketId] of onlineUsers.entries()) {
            const visibleUsers = await getVisibleOnlineUsers(userId)
            io.to(socketId).emit("online-users", visibleUsers)
        }

        //bỏ hạn chế thì cập nhật lại read-message
        if (!newState) {
            const freshConversation = await Conversation.findById(conversationId)

            io.to(conversationId).emit("read-message", {
                conversation: freshConversation,
                lastMessage: {
                    _id: freshConversation?.lastMessage?._id,
                    content: freshConversation?.lastMessage?.content,
                    senderId: {
                        _id: freshConversation?.lastMessage?.senderId
                    }
                }
            })
        }

        return res.status(200).json({
            message: newState ? "Đã hạn chế" : "Đã bỏ hạn chế",
            conversationId,
            isRestricted: newState,
            conversation: updatedConversation,
        })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }
}

export const leaveGroup = async (req, res) => {
    try {
        const { conversationId } = req.params
        const userId = req.user._id

        const conversation = await Conversation.findById(conversationId)

        if (!conversation)
            return res.status(404).json({ message: "Conversation not found" })

        if (conversation.type !== "group")
            return res.status(400).json({ message: "Not a group conversation" })

        //coi thuộc group đó không
        const isMember = conversation.participants.some(
            p => p.userID.toString() === userId.toString()
        )

        if (!isMember) {
            return res.status(403).json({ message: "You are not in this group" })
        }

        //remove khỏi participants
        conversation.participants = conversation.participants.filter(
            p => p.userID.toString() !== userId.toString()
        )

        //remove khỏi seenBy
        conversation.seenBy = conversation.seenBy.filter(
            id => id.toString() !== userId.toString()
        )

        //remove khỏi unreadCounts
        conversation.unreadCounts.delete(userId.toString())

        //nếu group không còn ai thì có thể xoá luôn
        if (conversation.participants.length === 0) {
            await Conversation.findByIdAndDelete(conversationId)
            return res.json({ message: "Group deleted (no members left)" })
        }

        await conversation.save()

        //emit socket cho những member còn lại
        io.to(conversationId).emit("member-left", {
            conversationId,
            userId
        })

        res.json({ message: "Left group successfully" })

    } catch (err) {
        res.status(500).json({ message: "Server error" })
    }
}

export const clearConversation = async (req, res) => {
    try {

        const userId = req.user._id
        const { conversationId } = req.params

        const conversation = await Conversation.findById(conversationId)

        if (!conversation) {
            return res.status(404).json({ message: "Không tìm thấy conversation" })
        }

        const newClearedTimestamp = new Date()

        //coi đã clear trước đó chưa (tức là đã record clearAt chưa)
        const existing = conversation?.clearedAt.find(
            c => c.userId.toString() === userId.toString()
        )

        //nếu đã có record clear conversation trước đó thì cập nhật lại timestand thôi
        if (existing) {
            await Conversation.updateOne(
                { _id: conversationId, "clearedAt.userId": userId },
                {
                    $set: { "clearedAt.$.timestamp": newClearedTimestamp },
                    $addToSet: { hiddenFor: userId }
                }
            )

        }
        else {
            //tạo record clearAt mới 
            await Conversation.updateOne(
                { _id: conversationId },
                {
                    $push: {
                        clearedAt: {
                            userId,
                            timestamp: newClearedTimestamp
                        }
                    },
                    $addToSet: { hiddenFor: userId }
                }
            )
        }

        // Tìm message mới nhất sau thời điểm clear
        const lastMessageAfterClear = await Message.findOne({
            conversationId,
            createdAt: { $gt: newClearedTimestamp }
        }).sort({ createdAt: -1 }).populate('senderId', 'displayName avatarUrl')

        // Update lastMessage của conversation
        if (lastMessageAfterClear) {
            await Conversation.updateOne(
                { _id: conversationId },
                {
                    $set: {
                        lastMessage: {
                            _id: lastMessageAfterClear._id.toString(),
                            content: lastMessageAfterClear.content || null,
                            senderId: lastMessageAfterClear.senderId,
                            createdAt: lastMessageAfterClear.createdAt
                        },
                        lastMessageAt: lastMessageAfterClear.createdAt
                    }
                }
            )
        } else {
            // Nếu không có message nào, reset lastMessage
            await Conversation.updateOne(
                { _id: conversationId },
                {
                    $set: {
                        lastMessage: null,
                        lastMessageAt: null
                    }
                }
            )
        }

        return res.status(200).json({
            success: true,
            message: "Cập nhật clear conversation thành công"
        })


    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Server error" })
    }
}

export const setNickname = async (req, res) => {
    try {

        const setterId = req.user.id
        const conversationId = req.params.conversationId
        const { nickname, targetId } = req.body

        const conversation = await Conversation.findById(conversationId)
        if (!conversation) {
            return res.status(404).json({ message: "Không tìm thấy conversation" })
        }

        if (!targetId) {
            return res.status(404).json({ message: "Thiếu thông tin người được đặt biệt danh" })
        }

        if (nickname && nickname.length > 30) {
            return res.status(400).json({ message: "Biệt danh không được quá 30 ký tự" });
        }

        const updatedConversation = await Conversation.findOneAndUpdate(
            {
                _id: conversationId,
                "participants.userID": setterId
            },
            {
                $set: {
                    "participants.$[target].nickname": nickname || null
                }
            },
            {
                new: true,
                arrayFilters: [{ "target.userID": targetId }]
            }
        ).populate("participants.userID", "displayName avatar");

        if (!updatedConversation) {
            return res.status(404).json({
                message: "Không tìm thấy hội thoại hoặc thành viên không hợp lệ"
            });
        }

        const formattedConversation = {
            ...updatedConversation.toObject(),
            participants: updatedConversation.participants.map(p => ({
                _id: p.userID._id,
                displayName: p.userID.displayName,
                avatarUrl: p.userID.avatar,
                nickname: p.nickname,
                joinedAt: p.joinedAt,
                isPinned: p.isPinned,
                isArchived: p.isArchived,
                isRestricted: p.isRestricted,
                offlineAt: p.offlineAt
            }))
        };

        //socket 
        io.to(conversationId).emit("nickname-updated", {
            conversationId,
            targetId,
            setterId,
            nickname: nickname || null
        })

        return res.status(200).json({
            message: "Cập nhật biệt danh thành công",
            conversation: formattedConversation,
        })

    } catch (error) {
        console.error("Đã có lỗi khi setNickname:", error)
        res.status(500).json({ message: "Server error" })
    }
}

