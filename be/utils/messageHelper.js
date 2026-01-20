
export const updateConversationAfterCreateMessage = (conversation, message, senderId) => {

    //cần reset seenBy và cập nhật lastMessage
    conversation.set({
        seenBy: [],
        lastMessageAt: message.createdAt,
        lastMessage: {
            _id: message._id,
            content: message.content,
            senderId,
            createdAt: message.createdAt,
        }
    })

    //xly unreadCounts của mỗi người (người gửi về = 0, ng nhận + thêm 1)
    conversation.participants.forEach((p) => {
        const memberId = p.userID.toString()
        const isSender = memberId === senderId.toString() //nếu id của ng đó trùng id người gửi thì ng đó là ng gửi
        const preCount = conversation.unreadCounts.get(memberId) || 0 //lấy count hiện tại của ng đó
        conversation.unreadCounts.set(memberId, isSender ? 0 : preCount + 1)
    })
}

export const emitNewMessage = (io, conversation, message) => {
    //socket.to(room1).emit(...)
    //bên file index đã join user đúng room của họ theo conversationId
    io.to(conversation._id.toString()).emit("new-message", {
        message,
        conversation: {
            _id: conversation._id,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt
        },
        unreadCounts: conversation.unreadCounts
    })
}