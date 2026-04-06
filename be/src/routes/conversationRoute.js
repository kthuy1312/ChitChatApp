import express from 'express'
import { archiveConversation, createConversation, getConversations, getConversationsByUserId, getMessages, leaveGroup, markAsSeen, pinConversation, restrictConversation, clearConversation, updateTheme, setNickname, searchMessages, addGroupMember } from '../controllers/conversationController.js'
import { checkFriendship } from '../middlewares/friendMiddleware.js'

const router = express.Router()

router.post('/', checkFriendship, createConversation)
router.get('/', getConversations)
router.get('/user', getConversationsByUserId)
router.get('/:conversationId/messages', getMessages)

//update bán phần (patch)
router.patch('/:conversationId/seen', markAsSeen)

router.patch('/:conversationId/pin', pinConversation)
router.patch('/:conversationId/archive', archiveConversation)
router.patch('/:conversationId/restrict', restrictConversation)
router.patch('/:conversationId/leaveGroup', leaveGroup)
router.patch('/:conversationId/theme', updateTheme)

router.patch('/:conversationId/clearConversation', clearConversation)

router.patch('/:conversationId/nickname', setNickname)

//tìm kiếm tn
router.get("/:conversationId/messages/search", searchMessages);

router.patch("/:conversationId/members", addGroupMember);
export default router;