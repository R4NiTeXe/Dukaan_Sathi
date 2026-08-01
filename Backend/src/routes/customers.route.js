import { Router } from 'express'
import {
  createCustomer,
  listCustomers,
} from '../controllers/customer.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(verifyJWT)

router.post('/', createCustomer)
router.get('/', listCustomers)

export default router
