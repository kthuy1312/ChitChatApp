
import Conversation from "../models/Conversation.js"


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

        return res.status(201).json({ conversation })


    } catch (error) {
        console.error("Lỗi khi tạo conversation", error)
        return res.status(500).json({ message: "Lỗi hệ thống" })

    }
}
export const getConversations = async (req, res) => {

}
export const getMessages = async (req, res) => {

}