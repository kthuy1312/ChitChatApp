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
export { authMe, getAllUser }