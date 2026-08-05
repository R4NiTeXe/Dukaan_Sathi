import { Router } from 'express';
import { listBills, getBillById } from '../controllers/bill.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/', listBills);
router.get('/:id', getBillById);

export default router;
