# NFX Storages Console

Vite + React 19 console for NFX-Storages (Go S3 + admin). Login is **nfx-ui → NFX-Identity HTTP**, then `POST /session/credentials` for AK/SK.

## Run

```bash
npm install
npm run dev
```

Optional `.env`:

```
VITE_PORT=5173
VITE_IDENTITY_API_URL=http://127.0.0.1:10166
VITE_SERVER_HOST=http://127.0.0.1:10130
VITE_API_BASE_URL=http://127.0.0.1:10130/nfxstorages/admin/v3
VITE_S3_ENDPOINT=http://127.0.0.1:10130
```

## Scripts

- `npm run dev` — Vite
- `npm run build` — typecheck + production bundle
- `npm run typecheck` — `tsc -b`
