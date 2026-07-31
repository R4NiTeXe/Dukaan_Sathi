import { Router } from 'express'
import {
  register,
  login,
  getProfile,
  updateProfile,
  refresh,
  logout,
} from '../controllers/auth.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { uploadImage } from '../middlewares/upload.middleware.js'

const router = Router()

const uploadQRMiddleware = (req, res, next) => {
  uploadImage(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message })
    }
    next()
  })
}

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.get('/profile', verifyJWT, getProfile)
router.put('/profile', verifyJWT, uploadQRMiddleware, updateProfile)

export default router
