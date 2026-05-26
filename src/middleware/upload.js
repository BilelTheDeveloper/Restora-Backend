import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only images and PDFs are allowed'));
  },
});

export const uploadToCloudinary = (buffer, folder = 'restora/general', extra = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [
          { width: 1200, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
        ...extra,
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      },
    );
    stream.end(buffer);
  });
