import { Router } from 'express';
import { createProduct, listProducts } from '../controllers/product.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.post('/', createProduct);
router.get('/', listProducts);

export default router;
