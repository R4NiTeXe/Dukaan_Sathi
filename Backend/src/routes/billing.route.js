import { Router } from 'express';
import { extract, saveBill, recentProducts } from '../controllers/billing.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/extract', verifyJWT, extract);
router.post('/save', verifyJWT, saveBill);
router.get('/recent-products', verifyJWT, recentProducts);

export default router;
