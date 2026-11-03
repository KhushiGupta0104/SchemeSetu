# Deployment Guide — Vercel + Render + MongoDB Atlas

> Deployment was **not performed** while building the project because no service accounts were available.
> The configuration in this repository is ready. Follow these steps and then verify the live app with the checklist at the end.

## Recommended topology

```
Browser ──► https://<app>.vercel.app  (static SPA)
              └─ /api/* rewrite ──► https://<api>.onrender.com/api/*  (Express)
                                         └─► MongoDB Atlas
```

Because Vercel proxies `/api`, the browser talks to **one site**, so authentication cookies are first-party. This works in
Safari and other browsers that block third-party cookies, and lets you keep `COOKIE_SAMESITE=lax`.

## 1. MongoDB Atlas

1. Create a free M0 cluster.
2. Under **Database Access**, create a user with a strong generated password and only the *readWrite* role on `schemesetu`.
3. Under **Network Access**, allow Render's outbound IPs (or `0.0.0.0/0` for a student demo, and understand the risk).
4. Copy the SRV connection string into `MONGODB_URI`, for example
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`. Set `MONGODB_DB_NAME=schemesetu`.
5. Seed from your machine. Put the Atlas URI in `server/.env` temporarily, run the following, then remove the URI:
   ```bash
   npm run seed            # real records (21 verified, 8 needs review)
   npm run seed:demo       # optional demo schemes and demo student (needs DEMO_USER_PASSWORD)
   npm run create-admin    # needs ADMIN_EMAIL and ADMIN_PASSWORD
   ```

## 2. Render (API)

Use **New → Blueprint** with the repository's `render.yaml`, or create a Web Service manually:

| Setting | Value |
|---|---|
| Root directory | repository root |
| Build command | `npm ci --include=dev && npm run build -w server` |
| Start command | `npm run start -w server` |
| Health check path | `/health` |
| Node version | 20 or newer |

Environment variables:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas SRV string |
| `MONGODB_DB_NAME` | `schemesetu` |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | two different random strings of 48+ characters (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `CLIENT_URL` | `https://<app>.vercel.app`, exact and with no trailing slash. Comma-separate multiple origins. |
| `COOKIE_SAMESITE` | `lax` (with the Vercel rewrite) |
| `TRUST_PROXY` | `2` (Vercel plus Render). Use `1` if browsers call Render directly. |
| `GEMINI_API_KEY` | optional |
| `LOG_LEVEL` | `info` |

In production the server refuses to start if the JWT secrets are missing or shorter than 32 characters. Logs are JSON
(Pino) and exclude cookies, tokens and request bodies.

## 3. Vercel (frontend)

1. Import the repository and set **Root Directory** to `client`.
2. Framework preset: Vite. Build command `npm run build`. Output directory `dist`.
3. Edit `client/vercel.json` and replace `https://YOUR-RENDER-SERVICE.onrender.com` with your Render URL. Rewrites
   cannot read environment variables, so this must be committed.
4. Environment variable: `VITE_API_BASE_URL=/api/v1`.
5. `vercel.json` also provides SPA fallback routing and security headers.

### Alternative: call Render directly (cross-site)

Set `VITE_API_BASE_URL=https://<api>.onrender.com/api/v1`, remove the `/api` rewrite, and on Render set
`COOKIE_SAMESITE=none` (Secure is then forced) and `TRUST_PROXY=1`. Browsers that block third-party cookies
will not keep sessions with this setup, which is why the rewrite approach is recommended.

## 4. Post-deployment verification checklist

- [ ] `GET https://<api>.onrender.com/health` returns `{"status":"ok","database":"connected"}`
- [ ] Explorer loads schemes on the Vercel URL
- [ ] Register, log out and log in work, and cookies are set for the Vercel domain
- [ ] Profile save, bookmark, track and checklist persist after reloading
- [ ] An admin can create and publish a scheme, and a normal user gets 403 from `/api/v1/admin/stats`
- [ ] The AI explainer returns `source: "ai"` if a key is configured, otherwise the fallback

## Security notes

- Never commit `.env` files (they are covered by `.gitignore`). Rotate secrets if they leak.
- Restrict Atlas network access and the database user's privileges.
- Rate limits are in memory and per instance. Use a shared store if you run several instances.
- The Render free tier sleeps when idle, so the first request after a pause can take about 30–60 seconds.
