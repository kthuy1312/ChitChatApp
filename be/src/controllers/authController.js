import bcrypt from 'bcrypt';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'
import Session from '../models/Session.js';

const ACCESS_TOKEN_TTL = '3h'
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000 //14 ngay

const signUp = async (req, res) => {
    try {
        const { username, password, email, firstName, lastName } = req.body

        //thieu thong tin
        if (!username || !password || !email || !firstName || !lastName) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ thông tin đăng ký"
            })
        }
        //ktra usernam ton tai chua 
        const isExist = await User.findOne({ username })
        if (isExist) {
            return res.status(409).json({
                message: "Username đã tồn tại. Vui lòng chọn username khác"
            })
        }

        //mã hóa pwd
        const hashedPassword = await bcrypt.hash(password, 10)

        //signup
        await User.create({
            username, hashedPassword, email,
            displayName: `${firstName} ${lastName}`
        })
        return res.status(201).json({
            message: "Đăng ký thành công"
        })

    }
    catch (error) {
        console.error('Lỗi khi signup', error);
        return res.status(500).json("Lỗi hệ thống")
    }
}

const signIn = async (req, res) => {
    try {
        const { username, password } = req.body

        //thieu thong tin
        if (!username || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ thông tin đăng nhập"
            })
        }

        //sai thong tin dang nhap
        const user = await User.findOne({ username })
        if (!user) {
            return res.status(401).json({ message: "Username hoặc password không chính xác" })
        }

        const comparePassword = await bcrypt.compare(password, user.hashedPassword)
        if (!comparePassword) {
            return res.status(401).json({ message: "Username hoặc password không chính xác" })
        }

        //đúng thì tạo access token
        const accessToken = jwt.sign({ userId: user._id }, process.env.SECRET, { expiresIn: ACCESS_TOKEN_TTL })

        //tạo refresh token
        const refreshToken = crypto.randomBytes(64).toString('hex');

        //tạo session mới để lưu refresh token
        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL)
        });

        //trả refresh token về trong cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true, //kh thể bị truy cập bởi js
            secure: true,
            sameSite: 'none',//cho phép be và fe chạy hai domain khác nhau
            maxAge: REFRESH_TOKEN_TTL
        })

        //trả access token về trong res
        return res.status(200).json({ message: `User ${user.displayName} đã đăng nhập`, accessToken })

    } catch (error) {
        console.error('Lỗi khi signup', error);
        return res.status(500).json("Lỗi hệ thống")
    }
}

const signOut = async (req, res) => {
    try {

        //lấy refreshToken từ cookie
        const refreshToken = req.cookies?.refreshToken;


        if (refreshToken) {
            await Session.deleteOne({ refreshToken });
            res.clearCookie('refreshToken');
            return res.status(200).json({ message: "Đăng xuất thành công" });
        }

    } catch (error) {
        console.error('Lỗi khi signout', error);
        return res.status(500).json("Lỗi hệ thống");
    }
}

//tạo access token mới 
const refreshToken = async (req, res) => {
    try {
        //lấy refresh token từ cookie
        const token = req.cookies?.refreshToken
        if (!token) {
            return res.status(401).json({ message: "Token không tồn tại" })
        }

        //ss với refresh token trong db
        const session = await Session.findOne({ refreshToken: token })
        if (!session) {
            return res.status(403).json("Token không hợp lệ hoặc đã hết hạn")
        }

        //coi hết hạn chưa
        if (session.expiresAt < new Date()) {
            return res.status(403).json("Token đã hết hạn")
        }

        //tạo access token mới
        const accessToken = jwt.sign({ userId: session.userId }, process.env.SECRET, { expiresIn: ACCESS_TOKEN_TTL })

        //trả access token mới
        return res.status(200).json({
            message: "Tạo access token mới thành công",
            accessToken
        })

    } catch (err) {
        console.error("Lỗi khi gọi refreshToken", err)
        return res.status(500).json({ message: "Lỗi hệ thống" })
    }
}


export {
    signUp, signIn, signOut, refreshToken
}