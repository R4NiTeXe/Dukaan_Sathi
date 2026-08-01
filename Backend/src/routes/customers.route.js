import { Router } from 'express'
import {
  createCustomer,
  listCustomers,
  getCustomer,
  deleteCustomer,
} from '../controllers/customer.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(verifyJWT)

router.post('/', createCustomer)
router.get('/', listCustomers)
router.get('/:id', getCustomer)
router.delete('/:id', deleteCustomer)

export default router
