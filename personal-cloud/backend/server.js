require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('express-async-errors');
const path = require('path');

const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');

const app = express();

// ✅ Updated CORS to allow only your Vercel frontend
app.use(cors({
  origin: "https://personal-cloud-ai.vercel.app", // change to your Vercel frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
const MONGODB = process.env.MONGO_URI || process.env.MONGODB || 'mongodb://127.0.0.1:27017/personal-cloud';

mongoose.connect(MONGODB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error', err);
    process.exit(1);
  });
