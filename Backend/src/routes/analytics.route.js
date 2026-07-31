import { Router } from 'express'
import {
  monthly,
  weekly,
  topProducts,
  customerReport,
} from '../controllers/analytics.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(verifyJWT)

router.get('/monthly', monthly)
router.get('/weekly', weekly)
router.get('/top-products', topProducts)
router.get('/customer-report', customerReport)

export default router
