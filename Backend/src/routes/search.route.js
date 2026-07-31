import { Router } from 'express'
import { searchAll } from '../controllers/search.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(verifyJWT)

router.get('/', searchAll)

export default router
