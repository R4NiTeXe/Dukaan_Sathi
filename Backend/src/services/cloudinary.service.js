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

export const deleteImage = (imageUrl) => {
  return new Promise((resolve) => {
    if (!isConfigured() || !imageUrl) {
      resolve(false);
      return;
    }
    const match = imageUrl.match(/\/([^/]+)\.[a-z0-9]+(?:\?.*)?$/i);
    if (!match) {
      resolve(false);
      return;
    }
    const publicId = `qr-codes/${match[1]}`;
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error || result?.result !== 'ok') {
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
};

export const pingCloudinary = async () => {
  try {
    if (!isConfigured()) return false;
    const result = await Promise.race([
      cloudinary.api.ping(),
      new Promise((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);
    return result?.status === 'ok';
  } catch {
    return false;
  }
};
