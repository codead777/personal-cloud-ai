const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const File = require('../models/File');
const auth = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const router = express.Router();

const MAX_UPLOAD = parseInt(process.env.MAX_UPLOAD_SIZE_BYTES || '52428800', 10); // 50 MB default

// Configure Cloudinary (via CLOUDINARY_URL in .env)
cloudinary.config({ secure: true });

// Memory storage → stream to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: MAX_UPLOAD } });

function inferTagsFromFilename(name) {
  const tokens = (name || '').split(/[^a-zA-Z0-9]+/).filter(Boolean);
  return [...new Set(tokens.slice(0, 3).map(t => t.toLowerCase()))];
}

// Stream upload helper
const streamUpload = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'personal-cloud', resource_type: 'auto' },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

// --------------------------- Upload ---------------------------
router.post('/upload', auth, upload.array('files', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ error: 'No files uploaded' });

    const saved = [];
    for (const f of req.files) {
      const sha = crypto.createHash('sha256').update(f.buffer).digest('hex');
      const dup = await File.findOne({ user: req.user.id, sha256: sha });
      const tags = inferTagsFromFilename(f.originalname);

      if (dup) {
        const fileDoc = new File({
          user: req.user.id,
          originalName: f.originalname,
          storedName: dup.storedName,
          fileUrl: dup.fileUrl,
          size: f.size,
          mimeType: f.mimetype,
          sha256: sha,
          tags,
          duplicateOf: dup._id,
        });
        await fileDoc.save();
        saved.push({
          id: fileDoc._id,
          duplicateOf: fileDoc.duplicateOf,
          originalName: fileDoc.originalName,
          url: fileDoc.fileUrl,
        });
        continue;
      }

      const result = await streamUpload(f.buffer);

      const fileDoc = new File({
        user: req.user.id,
        originalName: f.originalname,
        storedName: result.public_id,
        fileUrl: result.secure_url,
        size: f.size,
        mimeType: f.mimetype,
        sha256: sha,
        tags,
        duplicateOf: null,
      });
      await fileDoc.save();
      saved.push({
        id: fileDoc._id,
        duplicateOf: null,
        originalName: fileDoc.originalName,
        url: fileDoc.fileUrl,
      });
    }
    res.json({ saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --------------------------- List ---------------------------
router.get('/', auth, async (req, res) => {
  try {
    const files = await File.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    const withUrl = files.map((f) => ({ ...f, url: f.fileUrl }));
    res.json({ files: withUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------- View ---------------------------
router.get('/view/:id', async (req, res) => {
  try {
    let token = null;

    // Accept both Authorization header & ?token=
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Missing token' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const file = await File.findOne({ _id: req.params.id, user: decoded.id });
    if (!file) return res.status(404).json({ error: 'File not found' });

    // Redirect user to Cloudinary secure URL
    return res.redirect(file.fileUrl);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// --------------------------- Delete ---------------------------
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, user: req.user.id });
    if (!file) return res.status(404).json({ error: 'Not found' });

    try {
      await cloudinary.uploader.destroy(file.storedName);
    } catch (e) {
      /* ignore if already gone */
    }

    await file.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
