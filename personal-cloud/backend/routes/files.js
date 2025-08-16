const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const File = require('../models/File');
const auth = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const jwt = require("jsonwebtoken");

const router = express.Router();

const MAX_UPLOAD = parseInt(process.env.MAX_UPLOAD_SIZE_BYTES || '52428800', 10); // 50 MB default

// Configure Cloudinary via CLOUDINARY_URL, enable https
cloudinary.config({ secure: true });

// Use memory storage; we stream to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: MAX_UPLOAD } });

function inferTagsFromFilename(name) {
  const tokens = (name || '').split(/[^a-zA-Z0-9]+/).filter(Boolean);
  return [...new Set(tokens.slice(0, 3).map(t => t.toLowerCase()))];
}

// helper: stream upload to Cloudinary
const streamUpload = (buffer) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    { folder: 'personal-cloud', resource_type: 'auto' },
    (err, result) => {
      if (err) reject(err);
      else resolve(result);
    }
  );
  streamifier.createReadStream(buffer).pipe(stream);
});

// upload endpoint (multiple files), expects field name 'files'
router.post('/upload', auth, upload.array('files', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ error: 'No files uploaded' });

    const saved = [];
    for (const f of req.files) {
      const sha = crypto.createHash('sha256').update(f.buffer).digest('hex');
      const dup = await File.findOne({ user: req.user.id, sha256: sha });
      const tags = inferTagsFromFilename(f.originalname);

      // duplicate handling
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

      // Upload new file
      const result = await streamUpload(f.buffer);
      const viewUrl = result.secure_url.replace('/upload/', '/upload/fl_inline/');

      const fileDoc = new File({
        user: req.user.id,
        originalName: f.originalname,
        storedName: result.public_id,
        fileUrl: viewUrl,
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

// list files
router.get('/', auth, async (req, res) => {
  try {
    const files = await File.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    const withUrl = files.map(f => ({ ...f, url: f.fileUrl }));
    res.json({ files: withUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete file
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, user: req.user.id });
    if (!file) return res.status(404).json({ error: 'Not found' });

    try {
      await cloudinary.uploader.destroy(file.storedName);
    } catch (e) {
      /* ignore */
    }
    await file.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// view file (supports token via header or query param)
router.get('/view/:id', async (req, res) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) return res.status(401).json({ error: "Missing token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const file = await File.findOne({ _id: req.params.id, user: decoded.id });
    if (!file) return res.status(404).json({ error: "File not found" });

    return res.redirect(file.fileUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
