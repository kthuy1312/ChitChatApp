import express from 'express'
import { forwardDirectMessage, forwardGroupMessage, sendDirectMessage, sendGroupMessage, togglePinMessage, toggleReaction, unsendMessage } from '../controllers/messageController.js'
import { checkFriendship, checkGroupMembership } from '../middlewares/friendMiddleware.js'

const router = express.Router()

router.post('/direct', checkFriendship, sendDirectMessage)
router.post('/group', checkGroupMembership, sendGroupMessage)


//chuyển tiếp tn
router.post('/forward-direct', checkFriendship, forwardDirectMessage)
router.post('/forward-group', forwardGroupMessage)

//thu hồi tin nhắn
router.patch('/:messageId/unsend', unsendMessage)

//ghim tn
router.patch('/:messageId/pin-message', togglePinMessage)

//reation
router.patch('/:messageId/reation', toggleReaction)

export default router