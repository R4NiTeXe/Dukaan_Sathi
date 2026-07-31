import { Router } from 'express'
import {
  listBills,
  getBillById,
  updateBill,
  deleteBill,
} from '../controllers/bill.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(verifyJWT)

router.get('/', listBills)
router.get('/:id', getBillById)
router.put('/:id', updateBill)
router.delete('/:id', deleteBill)

export default router
