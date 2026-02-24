import { uploadImageFromBuffer } from '../middlewares/uploadMiddleware.js';
import User from '../models/User.js'

const authMe = (req, res) => {
    try {
        const user = req.user;
        res.status(200).json({ user });
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
}

const getAllUser = async (req, res) => {
    try {
        const users = await User.find()
        res.status(200).json({ users });
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
}

//tìm user có tồn tại hay kh
const searchUserByUsername = async (req, res) => {
    try {
        const { username } = req.query;
        if (!username || username.trim() === "") {
            return res.status(400).json({ message: "thiếu username" })
        }

        const user = await User.findOne({
            username
        }).select("_id displayName username avatarUrl")

        res.status(200).json({ user });

    } catch (error) {
        console.error("Lỗi xảy ra khi searchUserByUsername", error)
        res.status(500).json({ message: 'Server Error' });
    }
}

const uploadAvatar = async (req, res) => {
    try {
        const file = req.file;
        const userId = req.user._id;

        if (!file) {
            return res.status(400).json({ message: "không có file để upload" })
        }

        //result sẽ chứa link ảnh mới và id của ảnh trên cloudinary
        const result = await uploadImageFromBuffer(file.buffer)//dlieu ảnh đã lưu sẵn trong bộ nhớ

        const updatedUser = await User.findByIdAndUpdate(userId, {
            avatarId: result.public_id,
            avatarUrl: result.secure_url
        }, {
            new: true
        }).select("avatarUrl")

        if (!updatedUser.avatarUrl) {
            return res.status(400).json({ message: "avatar trả về null" })
        }

        return res.status(200).json({ avatarUrl: updatedUser.avatarUrl })

    } catch (error) {
        console.error("Lỗi xảy ra khi uploadAvatar lên cloudinary", error)
        res.status(500).json({ message: 'Server Error' });
    }

}

const blockUser = async (req, res) => {
    const { userId } = req.params //ng bị block
    const myId = req.user._id

    //ktra userId
    if (!userId) {
        return res.status(404).json("Thiếu userId")
    }

    if (userId.toString() === myId.toString()) {
        return res.status(400).json("Không thể tự block chính mình")
    }

    const currentUser = await User.findById(myId)

    //coi ng đó có bị block chưa
    const isBlocked = currentUser.blockedUsers.some(
        id => id.toString() === userId.toString()
    )
    //nếu bị block thì sẽ unblock
    if (isBlocked) {
        //pull là xóa khỏi mảng, push là thêm vào mảng(có thể trùng)
        await User.findByIdAndUpdate(myId, {
            $pull: { blockedUsers: userId }
        })

        return res.status(200).json({
            message: "Đã bỏ chặn người dùng thành công",
            blocked: false
        })
    } else {
        //nếu chưa block thì block
        await User.findByIdAndUpdate(myId, {
            $addToSet: { blockedUsers: userId }
        })

        //xóa friend
        await Friend.deleteMany({
            $or: [
                { userA: myId, userB: userId },
                { userA: userId, userB: myId }
            ]
        })
        return res.status(200).json({
            message: "Đã chặn người dùng thành công",
            blocked: true
        })

    }

}

export { authMe, getAllUser, searchUserByUsername, uploadAvatar, blockUser }