
# Personal Cloud (Monorepo)

This monorepo contains frontend and backend for the Personal Cloud project.

## Structure
- `backend/` — Node.js + Express backend (uploads stored locally)
- `frontend/` — React + Vite + Tailwind frontend

## Deploying
You can keep a single GitHub repo and deploy backend and frontend separately by selecting the appropriate subdirectory when creating Render and Vercel projects.

### 1) Backend → Render
- Create a new Web Service on Render and connect the GitHub repo.
- In the Render settings choose **Root Directory**: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Set environment variables on Render:
  - `PORT` (e.g. `5000`)
  - `MONGO_URI` (your MongoDB Atlas connection string)
  - `JWT_SECRET` (a long random string)
  - `UPLOAD_DIR=uploads` (optional)
- Deploy. Render will give you the backend URL (e.g. `https://your-backend.onrender.com`)

### 2) Frontend → Vercel
- Create a new Project on Vercel and connect the same GitHub repo.
- In the Vercel import settings set **Framework Preset** to `Vite` and **Root Directory** to `frontend`.
- Add environment variable:
  - `VITE_API_URL` = `https://your-backend.onrender.com` (the URL Render gave you)
- Deploy. Vercel will host the frontend and it will call your backend URL.

## Local testing
- Backend: `cd backend && npm install && npm run dev`
- Frontend: `cd frontend && npm install && npm run dev`

Note: uploads are stored on the Render instance local disk. For production resilience, consider S3 later.
