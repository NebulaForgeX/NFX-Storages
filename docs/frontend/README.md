# Storages console

Vite + React 19 console under `console/`. It uses **nfx-ui** for Identity login (email / verification code / GitHub), then exchanges the access token for S3 credentials.

## Auth flow

1. `LoginPage` → Identity HTTP via `useAuthRepository()`.
2. `SelectProfilePage` → pick profile.
3. `App` → `POST {api.baseURL}/session/credentials` with Bearer token.
4. AWS SDK (S3) and admin `ApiClient` use the issued AK/SK (SigV4).

There is no local username/password form against Storages itself.

## Pages (admin/S3)

Buckets, Browser, Access Keys, Policies, Users, User Groups, Lifecycle, Replication, Events, Event Targets, Tiers, SSE/KMS, Import/Export, Performance, License.

API modules: `console/src/apis/repositories/*`.

## Dev

```bash
cd console
npm install
npm run dev
```

Env: `VITE_IDENTITY_API_URL`, `VITE_API_BASE_URL` (`.../nfxstorages/admin/v3`), `VITE_S3_ENDPOINT`.
