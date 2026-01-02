import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protectedRoute = async (req, res, next) => {
    try {
        //lay acces token tu header
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Không tìm thấy access token' });
        }

        //xac nhan token hop le
        const decode = jwt.verify(token, process.env.SECRET);

        //tim user
        const user = await User.findById(decode.userId).select('-hashedPassword');
        if (!user) {
            return res.status(401).json({ message: 'Người dùng không tồn tại' });
        }
        //tra user ve tronq req
        req.user = user;
        next();

    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}
