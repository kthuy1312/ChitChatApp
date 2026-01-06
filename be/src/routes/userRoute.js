import express from 'express'
import { authMe, getAllUser } from '../controllers/userController.js';

const router = express.Router();
router.get('/me', authMe);
router.get('/all', getAllUser);

export default router;