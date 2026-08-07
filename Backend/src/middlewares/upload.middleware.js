import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (PNG, JPEG, WEBP, GIF) are allowed'));
  }
};

export const uploadImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
}).fields([
  { name: 'upiQrCode', maxCount: 1 },
  { name: 'avatar', maxCount: 1 },
]);
