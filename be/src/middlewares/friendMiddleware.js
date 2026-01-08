import Conversation from "../models/Conversation.js"
import Friend from "../models/Friend.js"


const pair = (a, b) => (a < b ? [a, b] : [b, a])

export const checkFriendship = async (req, res, next) => {
    try {
        const me = req.user._id.toString()
        const recipientId = req.body.recipientId ?? null

        const memberIds = req.body?.memberIds ?? []

        if (!recipientId && memberIds.length === 0) {
            return res.status(404).json({ message: "Thiếu thông tin recipientId hoac memberIds" })
        }
        if (recipientId) {
            const [userA, userB] = pair(me, recipientId)
            const isFriend = await Friend.findOne({ userA, userB })
            if (!isFriend) {
                return res.status(403).json({ message: "Bạn chưa kết bạn với người này" })
            }
            return next();
        }

        //todo cho group
        const friendCheck = memberIds.map(async (memberId) => {
            const [userA, userB] = pair(me, memberId)
            const isFriend = await Friend.findOne({ userA, userB })
            return isFriend ? null : memberId //bạn bè thì trả ra null kh thì memberID
        })

        const results = await Promise.all(friendCheck) //do map nhiều hàm bắt đồng bộ nên Promise.all
        const notFriends = results.filter(Boolean) //lọc bỏ ra ptu gtri = null (false)

        if (notFriends.length > 0) {
            return res.status(403).json({ message: "Bạn chỉ có thể thêm bạn bè vào nhóm", notFriends })
        }

        next();

    } catch (error) {
        console.error("Lỗi xảy ra khi checkFriendShip", error)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }
}

