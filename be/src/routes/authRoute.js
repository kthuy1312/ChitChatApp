import express from 'express';
import { signUp, signIn, signOut, refreshToken, changePassword } from '../controllers/authController.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/signout', signOut);
router.post('/refresh', refreshToken);
router.patch('/changePassword', protectedRoute, changePassword);

export default router;