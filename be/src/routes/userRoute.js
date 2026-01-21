import express from 'express'
import { authMe, getAllUser, searchUserByUsername } from '../controllers/userController.js';

const router = express.Router();
router.get('/me', authMe);
router.get('/all', getAllUser);
router.get('/search', searchUserByUsername);

export default router;