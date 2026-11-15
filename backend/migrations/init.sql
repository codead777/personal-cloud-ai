CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  s3_key text NOT NULL,
  filename text NOT NULL,
  size bigint,
  mime text,
  tags text[] NOT NULL DEFAULT '{}',
  embedding vector(384),
  ai_status text NOT NULL DEFAULT 'pending',
  last_accessed timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE files ADD COLUMN IF NOT EXISTS ai_status text NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS files_user_created_idx ON files (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS files_embedding_idx ON files USING hnsw (embedding vector_cosine_ops);
