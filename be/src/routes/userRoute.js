import express from 'express'
import { authMe, getAllUser, searchUserByUsername, uploadAvatar, blockUser } from '../controllers/userController.js';
import { upload } from '../middlewares/uploadMiddleware.js';


const router = express.Router();
router.get('/me', authMe);
router.get('/all', getAllUser);
router.get('/search', searchUserByUsername);
router.post('/uploadAvatar', upload.single("file"), uploadAvatar);


//chặn
router.patch('/:userId/block', blockUser)

export default router;