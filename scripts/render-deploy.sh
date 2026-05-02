#!/usr/bin/env bash
set -euo pipefail

# Usage: RENDER_API_KEY=... RENDER_BACKEND_SERVICE_ID=... RENDER_FRONTEND_SERVICE_ID=... ./scripts/render-deploy.sh

if [ -z "${RENDER_API_KEY:-}" ] || [ -z "${RENDER_BACKEND_SERVICE_ID:-}" ] || [ -z "${RENDER_FRONTEND_SERVICE_ID:-}" ]; then
  echo "Missing required environment variables. Provide RENDER_API_KEY, RENDER_BACKEND_SERVICE_ID and RENDER_FRONTEND_SERVICE_ID."
  exit 1
fi

echo "Posting GOOGLE_API_KEY (if set) to backend env-vars..."
if [ -n "${GOOGLE_API_KEY:-}" ]; then
  curl -fsS -X POST "https://api.render.com/v1/services/$RENDER_BACKEND_SERVICE_ID/env-vars" \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"key":"GOOGLE_API_KEY","value":"'"$GOOGLE_API_KEY"'" ,"secure":true}' || true
fi

if [ -n "${CORS_ORIGIN:-}" ]; then
  echo "Posting CORS_ORIGIN to backend env-vars..."
  curl -fsS -X POST "https://api.render.com/v1/services/$RENDER_BACKEND_SERVICE_ID/env-vars" \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"key":"CORS_ORIGIN","value":"'"$CORS_ORIGIN"'" ,"secure":false}' || true
fi

if [ -n "${VITE_API_URL:-}" ]; then
  echo "Posting VITE_API_URL to frontend env-vars..."
  curl -fsS -X POST "https://api.render.com/v1/services/$RENDER_FRONTEND_SERVICE_ID/env-vars" \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"key":"VITE_API_URL","value":"'"$VITE_API_URL"'" ,"secure":false}' || true
fi

echo "Triggering backend deploy..."
curl -fsS -X POST "https://api.render.com/v1/services/$RENDER_BACKEND_SERVICE_ID/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}' || true

echo "Triggering frontend deploy..."
curl -fsS -X POST "https://api.render.com/v1/services/$RENDER_FRONTEND_SERVICE_ID/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}' || true

echo "Done. Check Render dashboard for build logs."
