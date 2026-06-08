# Cookie Auth — Backend Deploy Guide

This guide covers deploying the backend so that the **`refreshToken` HttpOnly
cookie** is set and rotated correctly in production. The cookie contract is
documented in
[`../auth-secure-cookie-session/spec.md`](../auth-secure-cookie-session/spec.md).

> **TL;DR** — terminate both SPA and API behind a **single origin** (nginx,
> Caddy, Vercel rewrite, or Cloudflare Worker). The backend's
> `app.use(cookieParser())` (already wired in `src/main.ts`) populates
> `req.cookies` so the `/auth/refresh` endpoint can read the refresh token
> out of the request cookie. The frontend must be served from the same
> origin so the browser sends the cookie on cross-endpoint calls.

---

## Why single-origin matters

The `refreshToken` cookie is issued with:

| Attribute  | Value                                       |
|------------|---------------------------------------------|
| `Path`     | `/`                                         |
| `SameSite` | `Strict`                                    |
| `HttpOnly` | yes                                         |
| `Secure`   | yes iff `APP_MODE === 'production'`         |
| `Domain`   | not set (defaults to the issuing origin)    |

If SPA and API live on **different subdomains** (`app.example.com` vs
`api.example.com`), the browser will NOT send the cookie on the API
request because the cookie's host is the SPA origin and the API request
targets a different host. The user will be forced to re-login on every
refresh.

**Deploy requirement**: serve SPA and API from the **same origin** behind
a reverse proxy. See examples below.

---

## `cookie.*` env vars

| Env var                  | Default       | Notes                                  |
|--------------------------|---------------|----------------------------------------|
| `COOKIE_NAME`            | `refreshToken`| The cookie name.                       |
| `COOKIE_PATH`            | `/`           | Default path.                          |
| `COOKIE_MAX_AGE`         | `604800`      | Default lifetime in **seconds** (7d).  |
| `COOKIE_REMEMBER_ME_MAX_AGE` | `2592000`  | Remember-me lifetime in **seconds** (30d). |
| `COOKIE_SAME_SITE`       | `strict`      | Must be `strict` (the spec's CSRF mitigation). |
| `COOKIE_DOMAIN`          | *(unset)*     | Set only if you intentionally want a cross-subdomain cookie — and even then, only if you have a CSRF strategy that survives the weaker `SameSite=Lax` requirement. **Off by default.** |
| `APP_MODE`               | `local`       | `production` enables the `Secure` cookie flag. |

> **Note on units**: the config block stores these values in **seconds**
> (matches the spec: 604800 = 7 days, 2592000 = 30 days). The
> `CookieService` then converts to **milliseconds** internally before
> calling Express `res.cookie({ maxAge })`, which expects ms.

---

## `ALLOWED_ORIGINS` for CORS

In dev, the frontend is at `http://localhost:4321` and the backend runs
on a different port (default `3000` from `PORT`, but the project
`.env` sets `PORT=3001`). Because the SPA and API share the SAME origin
in production, CORS barely applies. In dev:

- `ALLOWED_ORIGINS` (default: `http://localhost:4321`) is the CORS allowlist.
- The backend's CORS config in `src/config/cors.config.ts` is
  `credentials: true` so cookies may travel cross-origin in dev when the
  Astro dev server proxies `/auth` and `/api` to the backend (see
  `Sell-Point-Frontend/astro.config.mjs` proxy config).
- **In production, set `ALLOWED_ORIGINS` to the SPA origin** (which is
  also the API origin because the reverse proxy fronts both).

---

## nginx (single origin, recommended)

This example serves the SPA static assets from `/` and proxies
`/auth/*` and `/api/*` to the NestJS backend on port 3001 (the
`PORT` from `.env`). All requests hit `https://app.sellpoint.com/`,
so the cookie set on `/auth/login` is automatically sent on
`/auth/refresh`, `/api/*`, etc.

```nginx
upstream sellpoint_backend {
  server 127.0.0.1:3001;
  keepalive 16;
}

server {
  listen 443 ssl http2;
  server_name app.sellpoint.com;

  ssl_certificate     /etc/letsencrypt/live/app.sellpoint.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/app.sellpoint.com/privkey.pem;

  # SPA static assets — adjust the path to match your build output.
  root /var/www/sellpoint-frontend/dist;
  index index.html;

  # ---- API: /auth/* and /api/* → backend ----
  location /auth/ {
    proxy_pass         http://sellpoint_backend;
    proxy_http_version 1.1;
    proxy_set_header   Connection           "";
    proxy_set_header   Host                $host;
    proxy_set_header   X-Real-IP           $remote_addr;
    proxy_set_header   X-Forwarded-For     $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto   $scheme;

    # Required for Set-Cookie to be honored by the browser when proxied.
    proxy_pass_request_headers on;
    proxy_buffering off;
  }

  location /api/ {
    proxy_pass         http://sellpoint_backend;
    proxy_http_version 1.1;
    proxy_set_header   Connection           "";
    proxy_set_header   Host                $host;
    proxy_set_header   X-Real-IP           $remote_addr;
    proxy_set_header   X-Forwarded-For     $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto   $scheme;

    proxy_pass_request_headers on;
    proxy_buffering off;
  }

  # ---- SPA: everything else → static index.html ----
  location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "no-cache";
  }
}
```

**Gotcha**: do NOT add `proxy_set_header Host $proxy_host;` — keep
`Host $host;` so the backend's CORS check sees the public origin
(`https://app.sellpoint.com`), not the internal upstream host.

---

## Caddy

Caddyfile equivalent of the nginx example above. Caddy handles TLS
automatically via Let's Encrypt.

```caddy
app.sellpoint.com {
  encode zstd gzip

  @backend_paths {
    path /auth/* /api/*
  }

  # Reverse-proxy /auth/* and /api/* to the NestJS backend on port 3001.
  reverse_proxy @backend_paths 127.0.0.1:3001 {
    header_up Host {host}
    header_up X-Real-IP {remote_host}
    header_up X-Forwarded-For {remote_host}
    header_up X-Forwarded-Proto {scheme}
  }

  # SPA static assets — adjust the path to match your build output.
  root * /var/www/sellpoint-frontend/dist
  file_server
  try_files {path} /index.html
}
```

---

## Cross-subdomain warning (do NOT do this)

If you accidentally deploy SPA on `app.sellpoint.com` and API on
`api.sellpoint.com`, the `refreshToken` cookie will be set on
`app.sellpoint.com` and **will not be sent** to `api.sellpoint.com`
(browsers do not send cross-site cookies, and `SameSite=Strict` makes
this even more strict). Symptom: every call to `/auth/refresh` returns
401 and the user is bounced to the login screen every 15 minutes.

If you genuinely need cross-subdomain (for example, when the API is
reused by multiple SPAs), the trade-offs are:

1. Set `COOKIE_DOMAIN=.sellpoint.com` so the cookie is shared across
   subdomains.
2. Lower `SameSite` to `Lax` so the cookie survives top-level
   cross-domain GETs (but this is **not** the security posture the spec
   accepts — `Strict` is the documented CSRF mitigation).
3. Implement an alternative CSRF mitigation (token-based or origin
   header check).

**Preferred**: do not deploy cross-subdomain. Use a single origin.

---

## Related

- [`../auth-secure-cookie-session/spec.md`](../auth-secure-cookie-session/spec.md) — the Given/When/Then contract.
- Spec file `openspec/changes/auth-cookie-refresh/specs/auth-secure-cookie-session/spec.md` — change-local spec mirror.
- Frontend deploy doc (Slice 2, future): `../../Sell-Point-Frontend/docs/deploy/cookie-auth.md` — to be written.
