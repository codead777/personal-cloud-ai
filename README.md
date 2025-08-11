# Personal Cloud AI — Repo

See the project scaffold. To run locally using Docker (recommended):

1. Copy `.env.example` to `.env` and edit values if needed.
2. Run: `docker compose up --build`
3. Visit: http://localhost:3000 (frontend)
4. MinIO: http://localhost:9000 (minioadmin / minioadmin)

The backend will use Postgres for metadata and MinIO for file storage. The AI microservice runs at port 8000.
