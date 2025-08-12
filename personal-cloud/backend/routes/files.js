const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const File = require('../models/File');
const auth = require('../middleware/auth');

const router = express.Router();

const MAX_UPLOAD = parseInt(process.env.MAX_UPLOAD_SIZE_BYTES || '52428800', 10); // 50 MB default

// storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(__dirname, '..', 'uploads', req.user.id.toString());
    fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_\s]/g, '').slice(0,200);
    const unique = Date.now() + '-' + Math.round(Math.random()*1e9);
    cb(null, unique + '-' + safe);
  }
});

const upload = multer({ storage, limits: { fileSize: MAX_UPLOAD } });

// helper: compute sha256
function sha256FileSync(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

function inferTagsFromFilename(name) {
  const ext = path.extname(name).replace('.', '');
  const tokens = name.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const tags = [];
  if (ext) tags.push(ext.toLowerCase());
  tags.push(...tokens.slice(0,3).map(t=>t.toLowerCase()));
  return [...new Set(tags)];
}

// upload endpoint
router.post('/upload', auth, upload.array('files', 20), async (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
  const saved = [];
  for (const f of req.files) {
    const sha = sha256FileSync(f.path);
    const dup = await File.findOne({ user: req.user.id, sha256: sha });
    const tags = inferTagsFromFilename(f.originalname);

    const fileDoc = new File({
      user: req.user.id,
      originalName: f.originalname,
      storedName: f.filename,
      path: path.relative(path.join(__dirname, '..'), f.path).replace(/\\/g, '/'),
      size: f.size,
      mimeType: f.mimetype,
      sha256: sha,
      tags,
      duplicateOf: dup ? dup._id : null
    });
    await fileDoc.save();
    saved.push({ id: fileDoc._id, duplicateOf: fileDoc.duplicateOf, originalName: fileDoc.originalName });
  }
  res.json({ saved });
});

// list files for user
router.get('/', auth, async (req, res) => {
  const files = await File.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
  // attach a public URL for each file
  const withUrl = files.map(f => ({
    ...f,
    url: `${req.protocol}://${req.get('host')}/${f.path.replace(/\\\\/g, '/')}`
  }));
  res.json({ files: withUrl });
});

// delete file
router.delete('/:id', auth, async (req, res) => {
  const file = await File.findOne({ _id: req.params.id, user: req.user.id });
  if (!file) return res.status(404).json({ error: 'Not found' });
  const fullPath = path.join(__dirname, '..', file.path);
  try { fs.unlinkSync(fullPath); } catch (e) { /* ignore */ }
  await file.deleteOne();
  res.json({ ok: true });
});

module.exports = router;
