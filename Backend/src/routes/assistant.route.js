import { Router } from 'express'
import { ask } from '../controllers/assistant.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(verifyJWT)

router.post('/ask', ask)

export default router
