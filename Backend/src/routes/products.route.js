import { Router } from 'express';
import {
  createProduct,
  listProducts,
  searchProducts,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.post('/', createProduct);
router.get('/', listProducts);
router.get('/search', searchProducts);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;