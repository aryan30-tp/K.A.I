Render Deployment — automated via GitHub Actions
===============================================

This project includes a GitHub Actions workflow and a local helper script to set environment variables and trigger deploys on Render.

What was added
- `.github/workflows/render-deploy.yml` — on push to `main`, uploads env vars and triggers deploys for backend and frontend (requires repository secrets).
- `scripts/render-deploy.sh` — local helper script to do the same using your `RENDER_API_KEY` and service IDs.

Required secrets (add to your GitHub repository Secrets)
- `RENDER_API_KEY` — Render API key (create in Render dashboard).
- `RENDER_BACKEND_SERVICE_ID` — Render service ID for the backend.
- `RENDER_FRONTEND_SERVICE_ID` — Render service ID for the frontend.
- `GOOGLE_API_KEY` — Your Google API key (the workflow will post this as a secure env var to the backend).
- `CORS_ORIGIN` — (optional) the allowed origin for CORS, e.g. `https://your-frontend.onrender.com`.
- `VITE_API_URL` — (optional) the backend URL to set in the frontend environment variables.

How to get service IDs
1. In the Render dashboard, open the service page. The service ID appears in the URL and service settings or in the API responses. Copy the ID for the backend and frontend services.

How to use

Local deploy helper (manual):
```
RENDER_API_KEY=xxx \
RENDER_BACKEND_SERVICE_ID=svc-xxxxxxxxxxxx \
RENDER_FRONTEND_SERVICE_ID=svc-yyyyyyyyyyyy \
GOOGLE_API_KEY=your-google-key \
CORS_ORIGIN=https://your-frontend.onrender.com \
VITE_API_URL=https://your-backend.onrender.com \
./scripts/render-deploy.sh
```

GitHub Actions: push to `main` after adding the required repository secrets and the workflow will run automatically.

Notes and caveats
- This automation requires that you create the Render services first (or import the repo into Render). The workflow expects the service IDs.
- The Render API calls in the workflow use the `env-vars` and `deploys` endpoints — they will POST new env vars (Render deduplicates by key). If you need other settings updated, tweak the workflow accordingly.
- For security, never commit secrets into the repo. Use GitHub Secrets and Render dashboard secrets.

Vercel Deployment (Frontend)
===========================

This repo includes a `vercel.json` at the root that builds the Vite frontend from `client/` and serves `client/dist`.

Checklist
- Ensure `VITE_API_URL` is set in the Vercel project environment variables and matches your Render backend URL.
- Redeploy the Vercel project after changing `VITE_API_URL` (Vite reads env vars at build time).

If you prefer custom settings in the Vercel UI
- Root Directory: `client`
- Framework Preset: Vite
- Build Command: `npm install && npm run build`
- Output Directory: `dist`
