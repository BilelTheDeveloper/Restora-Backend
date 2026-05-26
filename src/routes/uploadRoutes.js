import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { upload, uploadToCloudinary } from '../middleware/upload.js';

const router = Router();

router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });
    const folder = req.query.folder || 'restora/general';
    const result = await uploadToCloudinary(req.file.buffer, folder);
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

export default router;
