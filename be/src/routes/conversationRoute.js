import express from 'express'
import { createConversation, getConversations, getConversationsByUserId, getMessages, markAsSeen, pinConversation } from '../controllers/conversationController.js'
import { checkFriendship } from '../middlewares/friendMiddleware.js'

const router = express.Router()

router.post('/', checkFriendship, createConversation)
router.get('/', getConversations)
router.get('/user', getConversationsByUserId)
router.get('/:conversationId/messages', getMessages)

//update bán phần (patch)
router.patch('/:conversationId/seen', markAsSeen)

router.patch('/:conversationId/pin', pinConversation)


export default router;