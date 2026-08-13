# Production deployment

The application is configured as one Vercel project at `https://tag-em.vercel.app`.
The Vite frontend is static, while `/api/*` is rewritten to the Express function.

## Required Vercel environment variables

Set these for Production in Project Settings:

```text
NODE_ENV=production
FRONTEND_URL=https://tag-em.vercel.app
BACKEND_URL=https://tag-em.vercel.app
COOKIE_SAME_SITE=lax
JWT_SECRET=<at least 32 random bytes>
JWT_EXPIRES_IN=1h
JWT_COOKIE_MAX_AGE_MS=3600000
DATABASE_URL=<managed PostgreSQL connection string>
DB_SSL_REJECT_UNAUTHORIZED=true
DB_POOL_MAX=10
GOOGLE_CLIENT_ID=<Google OAuth client id>
GOOGLE_CLIENT_SECRET=<Google OAuth client secret>
BLOB_READ_WRITE_TOKEN=<added by the connected private Blob store>
```

Leave `VITE_API_URL` unset because the frontend and API use the same origin.

## Private file storage

In the Vercel project dashboard, open Storage, create a Blob store with **Private**
access, and connect it to this project. Vercel adds `BLOB_READ_WRITE_TOKEN`.
Production uploads fail closed when this token is absent; they are never written to
the function's temporary filesystem. Local development continues using
`backend/uploads/`. Individual files are limited to 4 MB to remain below Vercel's
4.5 MB Function request limit.

## Database

Apply migrations against the production database before sending traffic:

```bash
cd backend
DATABASE_URL='<production URL>' NODE_ENV=production npm run migrate:up
```

Run this deliberately: the security migration adds the token version used for
session revocation. Promote a trusted account directly in PostgreSQL after signup.

The identity hardening migration binds Google accounts to Google's stable subject
identifier and adds one-like-per-user records. Existing password accounts are not
automatically linked to Google accounts with the same email; account linking must
be implemented as an explicit authenticated flow if it is needed later.

The exclusive-auth-provider constraint is initially added as `NOT VALID` so legacy
Google accounts can bind their Google subject on their next login. It still rejects
all new or updated rows that have both authentication methods or neither method.
After all legacy Google accounts have signed in, inspect remaining rows and validate:

```sql
SELECT id, email FROM users
WHERE password IS NULL AND google_subject IS NULL;

ALTER TABLE users VALIDATE CONSTRAINT users_exactly_one_auth_provider;
```

## Google OAuth

Configure these values in Google Cloud Console:

```text
Authorized JavaScript origin: https://tag-em.vercel.app
Authorized redirect URI: https://tag-em.vercel.app/api/auth/google/callback
```

## Rate limiting

The application limiter protects a warm process. For distributed enforcement,
create a Vercel WAF rate-limit rule for `/api/auth/login` and `/api/auth/signup`.
A starting policy is 10 requests per 15 minutes per IP. Keep the application
limiter enabled as defense in depth.

## Deployment checks

After deployment, verify:

```text
GET /api/health -> 200 {"status":"ok"}
GET /api/ready  -> 200 {"status":"ready"}
```

Then test signup, password login, Google login, logout, cross-account access
denial, profile image upload, private resume access, and expired-session handling.
