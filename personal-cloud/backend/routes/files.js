const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const File = require('../models/File');
const auth = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const router = express.Router();

// Configure Cloudinary using CLOUDINARY_URL env var
cloudinary.config({ secure: true });

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload a file to Cloudinary
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Calculate SHA256 hash
    const sha256 = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    // Stream upload to Cloudinary
    const streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'personal-cloud' },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
      });
    };

    const result = await streamUpload(req.file.buffer);

    // Save file record in MongoDB
    const newFile = new File({
      user: req.user.id,
      originalName: req.file.originalname,
      storedName: result.public_id,
      fileUrl: result.secure_url,
      size: req.file.size,
      mimeType: req.file.mimetype,
      sha256
    });

    await newFile.save();
    res.json({ message: 'File uploaded successfully', file: newFile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// List files for user
router.get('/', auth, async (req, res) => {
  try {
    const files = await File.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete file from Cloudinary and DB
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, user: req.user.id });
    if (!file) return res.status(404).json({ error: 'File not found' });

    await cloudinary.uploader.destroy(file.storedName);
    await File.deleteOne({ _id: req.params.id });

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
