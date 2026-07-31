import { Router } from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/authController.js';
import { verifyJWT } from '../middlewares/auth.js';
import { uploadImage } from '../middlewares/upload.js';

const router = Router();

const uploadQRMiddleware = (req, res, next) => {
  uploadImage(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

router.post('/register', register);
router.post('/login', login);
router.get('/profile', verifyJWT, getProfile);
router.put('/profile', verifyJWT, uploadQRMiddleware, updateProfile);

export default router;
