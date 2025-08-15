const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FileSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  originalName: { type: String },
  storedName: { type: String, required: true }, // Cloudinary public_id
  fileUrl: { type: String, required: true }, // Cloudinary secure_url
  size: { type: Number },
  mimeType: { type: String },
  sha256: { type: String, index: true },
  tags: [String],
  duplicateOf: { type: Schema.Types.ObjectId, ref: 'File', default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', FileSchema);
