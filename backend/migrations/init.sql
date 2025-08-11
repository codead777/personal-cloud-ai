-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector; -- pgvector (Postgres must have pgvector extension available in your host)

-- users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- files
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  s3_key text NOT NULL,
  filename text,
  size bigint,
  mime text,
  tags text[],
  embedding vector(384),
  last_accessed timestamptz,
  created_at timestamptz DEFAULT now()
);

-- index on embedding for pgvector (if supported)
CREATE INDEX IF NOT EXISTS files_embedding_idx ON files USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
