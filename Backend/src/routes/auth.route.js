import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  refresh,
  logout,
} from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { uploadImages } from '../middlewares/upload.middleware.js';
import { loginThrottle } from '../middlewares/loginThrottle.middleware.js';

const router = Router();

const uploadImageMiddleware = (req, res, next) => {
  uploadImages(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

router.post('/register', register);
router.post('/login', loginThrottle, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/profile', verifyJWT, getProfile);
router.put('/profile', verifyJWT, uploadImageMiddleware, updateProfile);

export default router;
