import { updateConversationAfterCreateMessage } from "../../utils/messageHelper.js";
import Conversation from "../models/Conversation.js"
import Message from "../models/Message.js";


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

        //mỗi lần có tn mới thì phải cần update lại 
        updateConversationAfterCreateMessage(conversation, message, senderId)
        await conversation.save();

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

        return res.status(201).json({ message });

    } catch (error) {
        console.error("Lỗi xảy ra khi gửi tin nhắn nhóm", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }

}