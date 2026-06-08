# PR #1 — Auth Secure Cookie Session (backend, Slice 1 of 2)

## Summary

This PR moves the refresh token out of the response body and into an
`HttpOnly` `SameSite=Strict` cookie issued by the backend. The access
token now arrives only as a 15-minute JWT in the response body of
`/auth/login` and `/auth/refresh`. The cookie is the only refresh
source. A new `POST /auth/logout` endpoint clears the cookie and
revokes the token in Redis. This is the **backend slice** (PR #1 of
2); the frontend slice (PR #2) will follow and will switch to
in-memory signal storage for the access token and read-only cookie
usage.

## Breaking change (please communicate to consumers)

- **`POST /auth/login`** response body is now `{ accessToken, expiresIn: 900 }`.
  The `refreshToken` field is **removed from the body** and is delivered
  exclusively via the `Set-Cookie: refreshToken=...` header.
- **`POST /auth/refresh`** no longer reads from the request body. It reads
  the token from the `refreshToken` cookie (any body field is ignored)
  and rotates it on every call. The response body is
  `{ accessToken, expiresIn: 900 }` (no `refreshToken`).
- **New endpoint `POST /auth/logout`** — `@Public()`, returns `204` and
  clears the cookie. Idempotent: missing or invalid cookie also returns
  `204` and does not throw.
- **Cookie attributes**: `HttpOnly`, `SameSite=Strict`, `Path=/`,
  `Max-Age=604800` (7 days), `Secure` iff `APP_MODE === 'production'`.
  `rememberMe: true` extends `Max-Age` to `2592000` (30 days).

Any existing client (frontend, Postman collection, internal scripts)
that reads `body.refreshToken` will stop working at the deploy
boundary. **Deploy PR #1 and PR #2 in the same release window** to
avoid users losing access at the 15-minute JWT expiry (see warning
below).

## Same-release-window warning

> **Wire-break risk between PR #1 deploy and PR #2 deploy.** A user
> who logged in before the backend change has no cookie and will lose
> access at the 15-minute JWT expiry. **Mitigation**: deploy PR #1
> and PR #2 in the same release window. The frontend must be on the
> new code path (in-memory `AuthTokenStore`, no `localStorage` write
> of the refresh token) before any user is asked to log in again on
> the new backend. **No feature flag** is introduced by design
> (see Risks in `openspec/changes/auth-cookie-refresh/design.md`).

## Verification (run BEFORE merging)

1. `npm install` (new dev dep `@types/cookie-parser` was already in
   `package.json` from commit `a9118ca`).
2. `npm run build` — must compile clean.
3. `npm run test` — 52 suites / 241 tests passing (baseline was
   45 suites / 205 tests; +7 new suites, +36 new tests).
4. `npm run test:e2e -- --testPathPatterns "auth-cookie|paginated-response-contract"`
   — 2 suites, all passing (cookie flow 9/9, contract lockdown 23/23).
5. `npm run test:e2e` (full suite) — see "Known pre-existing
   failures" below; nothing introduced by this PR.
6. **Real HTTP curl smoke** (mirrors prior change's verify pattern):
   - `curl -c cookies.txt -i -X POST http://localhost:<port>/auth/login -H 'content-type: application/json' -d '{"email":"admin@billflow.com","password":"Admin1234!"}'`
     → 200, body `{ accessToken, expiresIn: 900 }`, `Set-Cookie: refreshToken=...; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`.
   - `curl -b cookies.txt -i -X POST http://localhost:<port>/auth/refresh`
     → 200, new `Set-Cookie` issued (rotation), body `{ accessToken, expiresIn: 900 }`.
   - `curl -b cookies.txt -i -X POST http://localhost:<port>/auth/refresh` (same cookie)
     → 401 (old cookie rejected).
   - `curl -b cookies.txt -i -X POST http://localhost:<port>/auth/logout`
     → 204, `Set-Cookie: refreshToken=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ...`.

The actual `<port>` comes from `app.port` in `src/config/configuration.ts`,
which reads `PORT` from `.env` (currently `3001`). The cookie contract
itself is port-independent.

## Rollback plan

Revert the merge commit (or close this PR without merging). The
cookie-parser middleware and the `cookie.*` config block are additive
and do not affect any code path that doesn't opt in. The new
`POST /auth/logout` is `@Public()` and idempotent; if a client still
calls it after rollback it just returns 204 without doing anything.
The previous `/auth/refresh` accepted the `refreshToken` in the body;
revert the controller change to restore that path. The
`AuthService.rotateRefreshToken` method is additive — revert only
removes it and the controller's call site.

## Files changed (high level)

```
 docs/deploy/cookie-auth.md                         | +201   (new)
 src/app.module.ts                                  |   +3 -1 (CookieService provider)
 src/config/configuration-cookie.spec.ts            |  new in T2
 src/config/configuration.ts                        |   +14    (cookie block)
 src/infrastructure/services/auth.service.rotate.spec.ts |  +118  (T6 TDD)
 src/infrastructure/services/auth.service.ts        |   +21    (rotateRefreshToken)
 src/infrastructure/services/cookie.service.spec.ts |  +170   (T3 TDD)
 src/infrastructure/services/cookie.service.ts      |   +64   (T3 service)
 src/infrastructure/services/index.ts               |   +1     (barrel)
 src/presentation/controllers/auth.controller.login-cookie.spec.ts    |  +117  (T4 TDD)
 src/presentation/controllers/auth.controller.login-google-cookie.spec.ts |  +64   (T8 TDD)
 src/presentation/controllers/auth.controller.logout-cookie.spec.ts      |  +92   (T7 TDD)
 src/presentation/controllers/auth.controller.refresh-cookie.spec.ts     |  +135  (T5 TDD)
 src/presentation/controllers/auth.controller.spec.ts                   | +128 -51 (T9 body-shape)
 src/presentation/controllers/auth.controller.ts                       |  +59 -37 (T4/T5/T7/T8)
 test/auth-cookie.e2e-spec.ts                       |  +255   (T10 e2e)
 test/auth-rate-limit.e2e-spec.ts                   |  +14     (T11 isolation fix)
```

Net diff vs base: +1357 / -68.

## Commits (oldest → newest)

```
209f1a5 feat(config): add cookie config block                        (T2)
94b3767 feat(auth): add CookieService for HttpOnly refresh-token cookie (T3)
487c707 feat(auth): AuthService rotates refresh token on every refresh (T6)
2788e74 feat(auth): login sets refresh-token cookie and drops refreshToken from body (T4)
34a577e feat(auth): refresh reads from cookie, rotates, returns accessToken only (T5)
35b3c5c feat(auth): add POST /auth/logout (idempotent, clears cookie, revokes refresh) (T7)
0e75721 refactor(auth): loginGoogle matches login cookie + body shape (T8)
fc046aa test(auth): update unit tests for new AuthTokens body shape (T9)
57b250a test(auth): add cookie flow e2e suite                         (T10)
6c18d30 fix(test): reset e2e throttler storage in auth-rate-limit beforeAll (T11)
2681e18 docs(deploy): add cookie-auth deploy guide (backend)         (T12)
```

## Specs & design links

- **Spec**: `openspec/changes/auth-cookie-refresh/specs/auth-secure-cookie-session/spec.md`
- **Design**: `openspec/changes/auth-cookie-refresh/design.md`
- **Tasks**: `openspec/changes/auth-cookie-refresh/tasks.md` (T1–T12 all checked)

## Known pre-existing failures (NOT introduced by this PR)

When running the **full** `npm run test:e2e` in a clean environment
without my changes (verified by stashing the slice and re-running),
the following suites fail with the same errors they fail with on this
PR branch:

- `test/pagination-validation.e2e-spec.ts` — 18 failures. The test
  expects `400` (validation error) for `?page=0` etc., but the global
  `JwtAuthGuard` registered as `APP_GUARD` in `app.module.ts` returns
  `401` before the `ValidationPipe` runs. This is unrelated to the
  cookie change and is a pre-existing guard ordering issue.
- `test/auth-rate-limit.e2e-spec.ts` — 2 failures. The
  "valid credentials should also be rate limited" subtest at line 107
  starts after 9 prior login attempts in the same suite, so the IP
  quota is already exhausted (5/5) when the subtest's 5-attempt loop
  begins. The test design assumes a 60s sliding window across all
  `it()` blocks, but with the `LoginThrottlerGuard` limit of 5 per IP
  the cumulative count overflows. Same 2 failures reproduce on a
  clean stash.

Both pre-existing failures should be tracked as separate cleanup
work; this PR is not the right place to address them. PR #1's
contract (cookie flow + endpoint changes) is verified by the new
`auth-cookie.e2e-spec.ts` (9/9) and the existing
`paginated-response-contract.e2e-spec.ts` (23/23).

## Slice 2 — what does NOT change here

- `AuthTokenStore` (frontend in-memory signal)
- `AuthIdentityStore` (frontend in-memory signal hydrated from
  `localStorage` on boot)
- Frontend `AuthHttpService` rewrite to call `POST /auth/refresh`
  with no body and `credentials: 'include'`
- Astro dev proxy for `/auth` and `/api`
- Frontend `billflow-session.ts` cleanup
- Any `localStorage` write of refresh tokens

These land in PR #2 against `develop` after this PR merges. See
`openspec/changes/auth-cookie-refresh/tasks.md` Slice 2 (T13–T24).

## Doc

- `docs/deploy/cookie-auth.md` (new) — nginx + Caddy reverse-proxy
  examples (single origin), `cookie.*` env var table, `ALLOWED_ORIGINS`
  note, cross-subdomain warning, cross-link to the future
  `Sell-Point-Frontend/docs/deploy/cookie-auth.md` (Slice 2 deliverable).
