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

        //socket báo cho ng bị block
        io.to(userId.toString()).emit("blocked", {
            by: myId.toString()
        })

        return res.status(200).json({
            message: "Đã chặn người dùng thành công",
            blocked: true
        })

    }

}

const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id
        let { username, displayName, phone, bio } = req.body

        username = username?.trim();
        displayName = displayName?.trim();

        if (!username) {
            return res.status(400).json({
                message: "Tên người dùng không được để trống"
            });
        }

        if (!displayName) {
            return res.status(400).json({
                message: "Tên hiển thị không được để trống"
            });
        }
        if (phone) {
            //Regex cho số điện thoại Việt Nam (Bắt đầu bằng 0 theo sau là 9 chữ số)
            const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;

            if (!phoneRegex.test(phone)) {
                return res.status(400).json({
                    message: "Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 số (vd: 0912345678)"
                });
            }

            //check xem số điện thoại này đã có ai khác dùng chưa
            const isPhoneExist = await User.findOne({
                phone,
                _id: { $ne: userId }
            });

            if (isPhoneExist) {
                return res.status(400).json({
                    message: "Số điện thoại này đã được liên kết với tài khoản khác!"
                });
            }
        }

        const isUsernameExist = await User.findOne({
            username,
            _id: { $ne: userId } //tìm username có tồn tại không nhma bỏ qua mình
        });

        if (isUsernameExist) {
            return res.status(400).json({
                message: "Tên người dùng đã tồn tại. Vui lòng sử dụng tên khác!"
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { username, displayName, phone, bio },
            { new: true, runValidators: true }
        ).select("-hashedPassword"); //kh trả về password

        if (!updatedUser) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        return res.status(200).json({
            message: "Cập nhật profile user thành công",
            updatedUser
        })

    } catch (error) {
        console.error("Lỗi xảy ra khi updateProfile", error)
        res.status(500).json({ message: 'Server Error' });
    }

}

export { authMe, getAllUser, searchUserByUsername, uploadAvatar, blockUser, updateProfile }