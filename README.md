# Personal Cloud AI

Self-hosted file storage with search by meaning. Upload files and the AI service reads them
(filenames, plus the text inside PDFs and text files), so you can find them with everyday words:
searching "bill" finds `invoice_2024.pdf`.

**Stack:** React + Vite (served by nginx) · Express · FastAPI + sentence-transformers ·
Postgres + pgvector · RustFS (S3-compatible file storage)

```
Browser ─► nginx (3000) ─► Express backend ─► Postgres + pgvector  (accounts, file info, search vectors)
                               │  └────────► RustFS               (the files themselves)
                               └───────────► AI service          (reads files, creates embeddings)
```

## Requirements
- Docker Desktop (running), with at least 4 GB of memory allocated to it
- About 8 GB of free disk space for the first build

## Quick start

1. **Create your settings file** (in the folder containing `docker-compose.yml`):
   ```bash
   cp .env.example .env          # Windows PowerShell: copy .env.example .env
   ```
2. **Edit `.env`** and replace every `change-me...` value. Use letters and numbers only.
   Generate random values with `openssl rand -hex 32`.

   | Setting | What it is |
   |---|---|
   | `DB_PASSWORD` | Database password (random) |
   | `JWT_SECRET` | Signs login sessions (random, 16+ characters) |
   | `INTERNAL_TOKEN` | Lets the AI service talk to the backend (random) |
   | `S3_ACCESS_KEY` | Storage username (any name, 3+ characters, e.g. `cloudadmin`) |
   | `S3_SECRET_KEY` | Storage password (random, 8+ characters) |

   Leave the other settings as they are. Choose these values **before** the first start: the database
   and storage remember their first passwords.
3. **Start everything:**
   ```bash
   docker compose up --build -d
   docker compose logs -f          # optional: watch it start (Ctrl+C stops watching only)
   ```
   The first build takes 5 to 15 minutes (it downloads PyTorch and the search model).
   It is ready when you see `Backend listening on 5000` and `Application startup complete`.
4. **Open the app:** http://localhost:3000, click **Create account**, and upload a file.
   The badge changes from *Reading file* to *Searchable* after a few seconds.

Storage console: http://localhost:9001/rustfs/console/ (log in with `S3_ACCESS_KEY` / `S3_SECRET_KEY`).

## Daily use

```bash
docker compose up -d              # start in the background (no rebuild needed)
docker compose ps                 # see what is running
docker compose logs -f backend    # watch one service (backend, frontend, ai_service, db, rustfs)
docker compose stop               # pause
docker compose down               # stop and remove containers (your data is kept)
```

- Closing the terminal does not stop the app if you started it with `-d`.
- Docker Desktop must stay running, and the computer awake, for the app to be reachable.
  Closing the Docker window is fine; quitting Docker Desktop stops the app.
- Turn on "Start Docker Desktop when you sign in" in Docker settings so it comes back after a reboot.

## After you change code

You only rebuild the part you changed. Starting and stopping never needs a rebuild.

| You changed | Run |
|---|---|
| Frontend (`frontend/src/...`) | `docker compose up --build -d frontend`, then hard refresh (Cmd/Ctrl + Shift + R) |
| Backend (`backend/...`) | `docker compose up --build -d backend` |
| AI service (`ai_service/...`) | `docker compose up --build -d ai_service` |
| `.env` or `docker-compose.yml` | `docker compose up -d` |

**Live UI editing (optional):** add `ports: ["127.0.0.1:5000:5000"]` to the `backend` service, run
`docker compose up -d backend && docker compose stop frontend`, then `cd frontend && npm install && npm run dev`
and open http://localhost:3000. Changes show instantly. When done, `docker compose up --build -d frontend`.

Where to edit the UI: `frontend/src/styles.css` (look and animations), `components/Auth.jsx` (login page),
`components/Files.jsx` (file list, upload, search), `App.jsx` (layout and notifications).

## Where your data lives

| What | Where |
|---|---|
| The files | RustFS bucket `cloud-ai-files`, Docker volume `personal-cloud-ai_rustfs-data` |
| Accounts, file info, search vectors | Postgres, Docker volume `personal-cloud-ai_db-data` |

These are Docker volumes, not normal folders. Browse files in the storage console or download them from the app.

**Deleted by:** `docker compose down -v`, resetting or uninstalling Docker Desktop, and deleting a file in the app.
**Not deleted by:** `stop`, `down`, rebuilding, rebooting.

### Backup
```bash
docker compose exec -T db pg_dump -U postgres cloud_ai > db-backup.sql
docker run --rm -v personal-cloud-ai_rustfs-data:/data -v "$(pwd)":/backup alpine tar czf /backup/files-backup.tgz -C /data .
```
(PowerShell: use `${PWD}` instead of `$(pwd)`.) Keep both backups; they only work together.

## Using it from another device
In `.env`, set `S3_PUBLIC_ENDPOINT` to an address that device can reach (for example `http://192.168.1.20:9000`)
so download links work, and add the app address to `CORS_ORIGIN`. Then run `docker compose up -d`.
Note that the services bind to your own machine by default; only port 3000 is open to your network.

## Troubleshooting

| Problem | Fix |
|---|---|
| `variable is not set` / `copy .env.example to .env` | `.env` is missing or has a blank value |
| `Cannot connect to the Docker daemon` | Open Docker Desktop and wait for "Engine running" |
| `pull access denied for minio/minio` | Old compose file. MinIO removed its public images in Sept 2026; this project uses RustFS instead |
| Frontend restarting with `exec format error` | Wrong CPU image. Run `docker compose down`, then `docker image rm nginx:1.27-alpine personal-cloud-ai-frontend`, then `docker pull --platform linux/arm64 nginx:1.27-alpine` (Intel/AMD: `linux/amd64`), then `docker compose build --no-cache frontend && docker compose up -d` |
| `port is already allocated` | Another program uses 3000, 5432, 9000 or 9001. Stop it or change the port in `docker-compose.yml` |
| `ai_service` restarts or says `Killed` | Docker is out of memory. Raise it to 4 GB or more in Docker Desktop settings |
| Backend exits: "JWT_SECRET is missing" | `JWT_SECRET` in `.env` is blank or under 16 characters |
| "Smart search is warming up" | The AI service is still starting. Wait a minute |
| Search finds nothing | Check the file badge says *Searchable*. Scores under 0.20 are hidden (`MIN_SCORE` in `backend/src/routes/search.js`) |
| Downloads fail from another device | Set `S3_PUBLIC_ENDPOINT` (see above) |
| Page looks old after a UI change | Rebuild the frontend and hard refresh |
| Something else | `docker compose logs <service> --tail 50` and read the last red lines |

The repeating `GET /health 200 OK` lines from `ai_service` are normal health checks, and the Hugging Face
`404` / "unauthenticated requests" lines at startup are harmless.

## Security notes
- Never commit or share `.env` (it is in `.gitignore`). Save its values in a password manager.
- Do not change `DB_PASSWORD` or `S3_SECRET_KEY` after the first start unless you run `docker compose down -v`
  (which deletes all data).
- The backend, database and storage listen on `127.0.0.1` only; the internal AI callback needs `INTERNAL_TOKEN`.
- Uploads are limited by `MAX_UPLOAD_MB` (default 50), and logins are rate limited.

## Project layout
```
docker-compose.yml   .env.example
backend/       Express API, auth, files, search, S3 client, migrations/init.sql
ai_service/    FastAPI + sentence-transformers (embeddings, text extraction, tags)
frontend/      React + Vite UI, nginx.conf, Dockerfile
```

## Notes
- No lockfiles are included. Run `npm install` in `backend/` and `frontend/` once and commit the generated
  `package-lock.json` files for reproducible builds.
- AWS SDK for JavaScript warns that releases after January 2027 need Node 22. It is harmless today; when you
  want to upgrade, change `node:20-alpine` to `node:22-alpine` in `backend/Dockerfile`.
- Any S3-compatible store works in place of RustFS, since the backend speaks plain S3.
