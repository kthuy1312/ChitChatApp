import express from 'express'
import { forwardDirectMessage, sendDirectMessage, sendGroupMessage } from '../controllers/messageController.js'
import { checkFriendship, checkGroupMembership } from '../middlewares/friendMiddleware.js'

const router = express.Router()

router.post('/direct', checkFriendship, sendDirectMessage)
router.post('/group', checkGroupMembership, sendGroupMessage)


//chuyển tiếp tn
router.post('/forward-direct', checkFriendship, forwardDirectMessage)

export default router
