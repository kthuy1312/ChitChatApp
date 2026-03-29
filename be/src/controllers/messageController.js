import { emitNewMessage, updateConversationAfterCreateMessage } from "../../utils/messageHelper.js";
import Conversation from "../models/Conversation.js"
import Message from "../models/Message.js";
import { io } from "../socket/index.js";


export const sendDirectMessage = async (req, res) => {
    try {
        const { conversationId, content, recipientId } = req.body
        const senderId = req.user._id

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
            content
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

        if (!content) {
            return res.status(404).json("Thiếu nội dung tin nhắn");
        }

        const message = await Message.create({
            conversationId, content, senderId
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