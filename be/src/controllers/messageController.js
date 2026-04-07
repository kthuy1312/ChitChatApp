import { emitNewMessage, updateConversationAfterCreateMessage } from "../../utils/messageHelper.js";
import Conversation from "../models/Conversation.js"
import Message from "../models/Message.js";
import User from "../models/User.js";
import { io } from "../socket/index.js";
import { uploadImageFromBuffer } from '../middlewares/uploadMiddleware.js';


export const sendDirectMessage = async (req, res) => {
    try {
        const { conversationId, content, recipientId } = req.body
        const senderId = req.user._id
        const user = req.user

        let conversation;

        //nếu kh có content
        if (!content) {
            return res.status(404).json({ message: "Thiếu nội dung tin nhắn" })
        }

        //có conversationId thì lấy nó ra , kh có thì tạo mới
        if (conversationId) {
            conversation = await Conversation.findById(conversationId)
        }

        if (!conversation) {
            conversation = await Conversation.create({
                type: "direct",
                participants: [
                    { userID: senderId, joinedAt: new Date() },
                    { userID: recipientId, joinedAt: new Date() }
                ],
                lastMessageAt: new Date(),
                unreadCounts: new Map()
            })
        }

        //tạo message mới
        const message = await Message.create({
            conversationId: conversation._id,
            senderId,
            content,
            sender: {
                _id: user._id,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl
            },
        })

        // khi gửi message mới thì bỏ id ng nhận khỏi hiddenFor nếu có - để hiển thị lại conver đó
        // (vì delete conversation sẽ thêm ng đó dô hiddenFor)
        await Conversation.findByIdAndUpdate(conversation._id, {
            $pull: { hiddenFor: recipientId }
        })

        //mỗi lần có tn mới thì phải cần update lại 
        updateConversationAfterCreateMessage(conversation, message, senderId)
        await conversation.save();

        //socket
        await emitNewMessage(io, conversation, message)

        return res.status(201).json({ message });

    } catch (err) {
        console.error("Lỗi xảy ra khi gửi tin nhắn trực tiếp", err)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }

}

export const sendGroupMessage = async (req, res) => {
    try {
        const senderId = req.user._id
        const { conversationId, content } = req.body
        const conversation = req.conversation
        const user = req.user

        if (!content) {
            return res.status(404).json("Thiếu nội dung tin nhắn");
        }

        const message = await Message.create({
            conversationId,
            senderId,
            sender: {
                _id: user._id,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl
            },
            content
        })

        //mỗi lần có tn mới thì phải cần update lại 
        updateConversationAfterCreateMessage(conversation, message, senderId)
        await conversation.save();

        //socket
        await emitNewMessage(io, conversation, message)

        return res.status(201).json({ message });

    } catch (error) {
        console.error("Lỗi xảy ra khi gửi tin nhắn nhóm", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }

}

export const forwardDirectMessage = async (req, res) => {
    try {
        const { originalMessageId, recipientId } = req.body;
        const senderId = req.user._id;

        if (!originalMessageId || !recipientId) {
            return res.status(400).json({ message: "Thiếu dữ liệu chuyển tiếp" });
        }

        if (recipientId.toString() === senderId.toString()) {
            return res.status(400).json({ message: "Không thể gửi cho chính mình" });
        }

        //tìm tn gốc
        const originalMsg = await Message.findById(originalMessageId);
        if (!originalMsg) {
            return res.status(404).json({ message: "Không tìm thấy tin nhắn gốc" });
        }

        //tìm hoặc tạo conversation
        let conversation = await Conversation.findOne({
            type: "direct",
            "participants.userID": { $all: [senderId, recipientId] }
        });


        //thực sự chưa có thì tạo mới
        if (!conversation) {
            conversation = await Conversation.create({
                type: "direct",
                participants: [
                    { userID: senderId, joinedAt: new Date() },
                    { userID: recipientId, joinedAt: new Date() }
                ],
                lastMessageAt: new Date(),
                unreadCounts: new Map()
            });
        }

        //tạo tn chuyển tiếp
        const newMessage = await Message.create({
            conversationId: conversation._id,
            senderId: senderId,
            content: originalMsg.content,
            imgUrl: originalMsg.imgUrl || null,
            isForwarded: true,
            originalMessageId: originalMsg._id
        });

        //bỏ ẩn nếu ng dùng đã từng xóa hội thoại
        await Conversation.findByIdAndUpdate(conversation._id, {
            $pull: { hiddenFor: recipientId }
        });

        //cập nhật lại conver
        updateConversationAfterCreateMessage(conversation, newMessage, senderId);
        await conversation.save();

        await emitNewMessage(io, conversation, newMessage);

        return res.status(201).json({
            message: "Chuyển tiếp thành công",
            data: newMessage
        });

    } catch (err) {
        console.error("Lỗi khi chuyển tiếp tin nhắn", err);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const forwardGroupMessage = async (req, res) => {
    try {
        const { originalMessageId, conversationId } = req.body;
        const senderId = req.user._id;

        if (!originalMessageId || !conversationId) {
            return res.status(400).json({ message: "Thiếu dữ liệu chuyển tiếp" });
        }

        //tìm tn gốc
        const originalMsg = await Message.findById(originalMessageId);
        if (!originalMsg) {
            return res.status(404).json({ message: "Không tìm thấy tin nhắn gốc" });
        }

        //tim conversation
        const conversation = await Conversation.findById(conversationId)
        if (!conversation || conversation.type !== "group") {
            return res.status(404).json({ message: "Không tìm thấy nhóm" });
        }

        //ktra có trong nhóm kh
        const isMember = conversation.participants.some(
            (p) => p.userID.toString() === senderId.toString()
        )

        if (!isMember) {
            return res.status(403).json({ message: "Bạn không thuộc nhóm này" });
        }

        //tạo tn chuyển tiếp
        const newMessage = await Message.create({
            conversationId: conversation._id,
            senderId: senderId,
            content: originalMsg.content,
            imgUrl: originalMsg.imgUrl || null,
            isForwarded: true,
            originalMessageId: originalMsg._id
        });

        //bỏ ẩn nếu ng dùng đã từng xóa hội thoại
        await Conversation.updateOne(
            { _id: conversation._id },
            {
                $pull: {
                    hiddenFor: { $in: conversation.participants.map(p => p.userID) }
                }
            }
        );

        //cập nhật lại conver
        updateConversationAfterCreateMessage(conversation, newMessage, senderId);
        await conversation.save();

        await emitNewMessage(io, conversation, newMessage);

        return res.status(201).json({
            message: "Chuyển tiếp vào nhóm thành công",
            data: newMessage
        });

    } catch (err) {
        console.error("Lỗi khi chuyển tiếp tin nhắn vào nhóm", err);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const unsendMessage = async (req, res) => {
    try {
        const messageId = req.params.messageId
        const userId = req.user._id

        const message = await Message.findById(messageId)

        if (!message) {
            return res.status(404).json({ message: "Không tìm thấy message" })
        }

        //chỉ cho ng gửi unsend
        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Chỉ người gửi mới có quyền thu hồi tin nhắn" })
        }

        const conversation = await Conversation.findById(message.conversationId)
        if (!conversation) {
            return res.status(404).json({ message: "Không tìm thấy conversation" })
        }

        if (!conversation.pinnedMessages) {
            conversation.pinnedMessages = []
        }

        //check trước khi xóa pin
        const wasPinned = conversation.pinnedMessages.some(
            p => p.messageId.toString() === messageId.toString()
        )

        //nếu tn gỡ là lastMessage thì cho nó là null luôn
        if (conversation?.lastMessage?._id === messageId.toString()) {
            await Conversation.updateOne(
                { _id: message.conversationId },
                {
                    $set: {
                        "lastMessage.content": null
                    }
                }
            );
        }

        //cập nhật lại (kh query db lần 2)
        message.isUnsent = true;
        message.content = null;

        //thu hồi tn đã ghim thì bỏ ghim
        conversation.pinnedMessages = conversation.pinnedMessages.filter(
            p => p.messageId.toString() !== messageId.toString()
        )

        await message.save();
        await conversation.save();

        //socket unsend
        io.to(message.conversationId.toString()).emit("message-unsent", {
            messageId: message._id,
            conversationId: message.conversationId
        })

        // socket unpin (nếu có)
        if (wasPinned) {
            io.to(message.conversationId.toString()).emit("message-pin-toggled", {
                messageId: message._id,
                conversationId: message.conversationId,
                action: "unpinned"
            })
        }

        return res.status(200).json({
            message: "Thu hồi tin nhắn thành công"
        })

    } catch (err) {
        console.error("Lỗi khi thu hồi tin nhắn", err);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const togglePinMessage = async (req, res) => {
    try {

        const messageId = req.params.messageId
        const userId = req.user._id

        const message = await Message.findById(messageId)

        if (!message) {
            return res.status(404).json({ message: "Không tìm thấy message" })
        }

        const conversation = await Conversation.findById(message.conversationId)

        if (!conversation) {
            return res.status(404).json({ message: "Không tìm thấy conversation" })
        }

        const isMember = conversation.participants.some(
            p => p.userID.toString() === userId.toString()
        )

        if (!isMember) {
            return res.status(403).json({ message: "Bạn không có quyền ghim tin nhắn cho cuộc trò chuyện này" })
        }

        //không cho pin tn đã thu hồi
        if (message.isUnsent) {
            return res.status(400).json({ message: "Không ghim tin nhắn đã thu hồi" })
        }

        //xem đã pin chưa
        const isPinned = conversation.pinnedMessages.some(
            p => p.messageId.toString() === messageId.toString()
        )

        //nếu đã pin thì unpin
        if (isPinned) {
            conversation.pinnedMessages = conversation.pinnedMessages.filter(
                p => p.messageId.toString() !== messageId.toString() //cái giữ lại
            )
        }
        else {
            const newPinned = {
                messageId: message._id,
                content: message.isUnsent ? "Tin nhắn đã thu hồi" : message.content,
                imgUrl: message.imgUrl || null,
                senderId: message.senderId,
                createdAt: message.createdAt,
                isUnsent: message.isUnsent,
                pinnedBy: userId,
                pinnedAt: new Date()
            }

            //đẩy vào mảng
            conversation.pinnedMessages.push(newPinned)
        }

        await conversation.save()

        //socket pin
        io.to(message.conversationId.toString()).emit("message-pin-toggled", {
            messageId: message._id,
            conversationId: message.conversationId,
            action: isPinned ? "unpinned" : "pinned",
            pinnedMessage: {
                messageId: message._id,
                content: message.isUnsent ? "Tin nhắn đã thu hồi" : message.content,
                imgUrl: message.imgUrl,
                senderId: message.senderId,
                createdAt: message.createdAt,
                isUnsent: message.isUnsent,
                pinnedBy: userId,
                pinnedAt: new Date()
            },
        })

        return res.status(200).json({
            message: isPinned ? "Bỏ ghim tin nhắn thành công" : "Ghim tin nhắn thành công",
        })

    } catch (error) {
        console.error("Lỗi khi pinMessages ", error)
        res.status(500).json({ message: "Server error" })
    }
}

export const toggleReaction = async (req, res) => {
    try {

        const messageId = req.params.messageId
        const userId = req.user._id
        const { emoji } = req.body
        const allowedEmojis = ["👍", "❤️", "😂", "😢", "😡"];

        if (!emoji) {
            return res.status(404).json({ message: "Thiếu emoji" })
        }

        if (!allowedEmojis.includes(emoji)) {
            return res.status(400).json({ message: "Emoji không hợp lệ" });
        }

        const message = await Message.findById(messageId)
        if (!message) {
            return res.status(404).json({ message: "Không tìm thấy message" })
        }
        if (message.isUnsent) {
            return res.status(400).json({ message: "Không thể react tin đã thu hồi" })
        }

        //check đã react tn đó chưa 
        const existingReactionIndex = message.reactions.findIndex(
            r => r.userId.toString() === userId.toString()
        )

        let action = "added"

        //nếu có rồi thì update
        if (existingReactionIndex !== -1) {
            const existingReaction = message.reactions[existingReactionIndex]

            //cùng emoji thì remove
            if (existingReaction.emoji === emoji) {
                message.reactions.splice(existingReactionIndex, 1)
                action = "removed"
            } else {
                //emoji mới thì update
                message.reactions[existingReactionIndex].emoji = emoji
                action = "updated"
            }

        } else {
            //chưa có thì thêm
            message.reactions.push({
                userId,
                emoji
            })
        }

        await message.save()

        //socket
        io.to(message.conversationId.toString()).emit("message-reaction", {
            conversationId: message.conversationId,
            messageId,
            userId,
            emoji,
            action
        })

        return res.status(200).json({
            message: "Reaction updated",
            allowedEmojis,
            data: message.reactions
        })

    } catch (error) {
        console.error("Lỗi khi toggleReaction ", error)
        res.status(500).json({ message: "Server error" })
    }
}

export const uploadChatImage = async (req, res) => {
    try {
        const file = req.file;
        const user = req.user;
        const userId = user._id;
        const { conversationId } = req.body;

        if (!file) {
            return res.status(400).json({ message: "Không có file" });
        }

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
        }

        const isMember = conversation.participants.some(
            p => p.userID.toString() === userId.toString()
        );

        if (!isMember) {
            return res.status(403).json({ message: "Bạn không thuộc cuộc trò chuyện này" });
        }

        // upload cloudinary
        const result = await uploadImageFromBuffer(file.buffer, {
            folder: "chit_chat/messages",
        });

        // tạo message
        const message = await Message.create({
            conversationId,
            senderId: userId,
            sender: {
                _id: user._id,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl
            },
            content: "",
            imgUrl: result.secure_url,
        });

        //update conversation
        updateConversationAfterCreateMessage(conversation, message, userId);
        await conversation.save();

        //emit realtime
        await emitNewMessage(io, conversation, message);

        return res.status(200).json({
            message: "Upload ảnh thành công",
            data: message
        });

    } catch (err) {
        console.error("UPLOAD IMAGE ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};