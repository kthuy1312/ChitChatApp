import express from 'express'
import { forwardDirectMessage, sendDirectMessage, sendGroupMessage, unsendMessage } from '../controllers/messageController.js'
import { checkFriendship, checkGroupMembership } from '../middlewares/friendMiddleware.js'

const router = express.Router()

router.post('/direct', checkFriendship, sendDirectMessage)
router.post('/group', checkGroupMembership, sendGroupMessage)


//chuyển tiếp tn
router.post('/forward-direct', checkFriendship, forwardDirectMessage)
//thu hồi tin nhắn
router.patch('/:messageId/unsend', unsendMessage)

export default router
