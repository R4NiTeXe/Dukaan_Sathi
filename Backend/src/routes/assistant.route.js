import { Router } from 'express';
import { ask, checkHealth } from '../controllers/assistant.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/health', checkHealth);

router.use(verifyJWT);

router.post('/ask', ask);

export default router;
