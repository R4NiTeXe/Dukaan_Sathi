import cloudinary from '../config/cloudinary.config.js';

const isConfigured = () => {
  const { cloud_name } = cloudinary.config();
  return Boolean(cloud_name) && !cloud_name.startsWith('your_');
};

export const uploadQRCode = (file) => {
  return uploadImage(file, { folder: 'qr-codes' });
};

export const uploadAvatar = (file) => {
  return uploadImage(file, { folder: 'avatars' });
};

const uploadImage = (file, { folder }) => {
  return new Promise((resolve, reject) => {
    if (!isConfigured()) {
      reject(new Error('Cloudinary is not configured. Add CLOUDINARY_* variables to Backend/.env'));
      return;
    }
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: folder === 'avatars' ? [{ width: 512, height: 512, crop: 'fill' }] : undefined,
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

// Extracts the public id (e.g. "qr-codes/abc123" or "avatars/xyz789") from a
// Cloudinary secure_url — works for any folder.
const extractPublicId = (imageUrl) => {
  const path = imageUrl.split('/image/upload/')[1];
  if (!path) return null;
  const withoutVersion = path.replace(/^v\d+\//, '');
  const publicId = withoutVersion.replace(/\.[a-z0-9]+(?:\?.*)?$/i, '');
  return publicId || null;
};

export const deleteImage = (imageUrl) => {
  return new Promise((resolve) => {
    if (!isConfigured() || !imageUrl) {
      resolve(false);
      return;
    }
    const publicId = extractPublicId(imageUrl);
    if (!publicId) {
      resolve(false);
      return;
    }
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
