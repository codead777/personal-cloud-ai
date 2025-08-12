import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pkg from "pg";
import authRoutes from "./routes/auth.js";

dotenv.config();

const { Pool } = pkg;

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

const app = express();

// CORS setup
app.use(cors({
  origin: "https://personal-cloud-ai.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.options("*", cors({
  origin: "https://personal-cloud-ai.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

// Auto-create users table if it doesn't exist
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `);
    console.log("✅ Users table is ready");
  } catch (err) {
    console.error("❌ Error creating users table:", err);
  }
}

// Routes
app.use("/auth", authRoutes(pool));

// Start server after DB check
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await initDB();
  console.log(`🚀 Server running on port ${PORT}`);
});
