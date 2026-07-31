import { Router } from 'express';
import { extract, saveBill } from '../controllers/billingController.js';
import { verifyJWT } from '../middlewares/auth.js';

const router = Router();

router.post('/extract', verifyJWT, extract);
router.post('/save', verifyJWT, saveBill);

export default router;
