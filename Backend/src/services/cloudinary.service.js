import cloudinary from '../config/cloudinary.config.js';

const isConfigured = () => {
  const { cloud_name } = cloudinary.config();
  return Boolean(cloud_name) && !cloud_name.startsWith('your_');
};

export const uploadQRCode = (file) => {
  return new Promise((resolve, reject) => {
    if (!isConfigured()) {
      reject(
        new Error('Cloudinary is not configured. Add CLOUDINARY_* variables to Backend/.env')
      );
      return;
    }
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'qr-codes',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
          return;
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(file.buffer);
  });
};
