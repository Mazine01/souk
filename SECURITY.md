# Security notes

A shop has two things worth attacking: **the price you pay** and **other people's orders**. Both are closed off on the server.

| Risk | What Roster does | Where |
| --- | --- | --- |
| Stolen passwords | Passwords are hashed with **argon2id**, never stored or logged in plain text. | `auth.routes.ts` |
| Password guessing | Login is **rate-limited** to 10 attempts per 15 minutes per IP. | `auth.routes.ts` |
| Account discovery | Wrong password and unknown email return the **same message and take the same time**, because a dummy hash is checked when the email does not exist. | `auth.routes.ts` |
| Token theft via XSS | The session JWT lives in an **httpOnly** cookie that JavaScript cannot read. It is Secure in production and expires after 7 days. | `middleware/auth.ts` |
| CSRF | The cookie is **SameSite=Lax** locally. In production (cross-site) it is SameSite=None + Secure, combined with a strict **CORS allowlist** and JSON-only bodies. | `app.ts` |
| Forged tokens | Tokens are verified with a 32+ character secret, HS256 only. | `middleware/auth.ts`, `tests/` |
| Price tampering | The browser only ever sends product ids and quantities. Prices, shipping and totals are read from the database inside the checkout transaction; extra fields like `totalCents` are ignored (tested). | `orders.service.ts` |
| Overselling | Checkout locks the product rows (`FOR UPDATE`, in id order to avoid deadlocks) and re-checks stock before taking it. Two simultaneous buyers of the last item: one 201, one 409 (tested). | `orders.service.ts` |
| Reading other people's orders | Orders are looked up by id **and** owner; anything else is 404. | `orders.service.ts` |
| Privilege escalation | Sign-up never reads a role from the request (tested). Admin routes check the role loaded from the database on each request, so a demotion takes effect immediately. Every admin route returns 403 to customers (tested). | `middleware/auth.ts`, `admin.routes.ts` |
| Invalid order changes | Status changes follow a fixed transition table; customers can only cancel while an order is still Placed. | `shared/src/index.ts` |
| SQL injection | All queries go through Drizzle's parameterized builder. Search text has LIKE wildcards escaped. | `catalog.service.ts` |
| Bad input | Every body, query and URL parameter is validated by **Zod** before a handler runs. JSON bodies are capped at 100 kB. | `middleware/validate.ts` |
| Image links | Product images must be `https://` URLs or files under `/products/`, so `javascript:` or `data:` links are rejected. | `shared/src/index.ts` |
| Information leaks | Errors return a fixed shape with no stack traces. `x-powered-by` is disabled and **Helmet** sets security headers. | `errorHandler.ts`, `app.ts` |
| Secrets in git | Secrets come only from environment variables. `.env` is git-ignored and `.env.example` documents each one. | `lib/env.ts` |

The app also validates its own environment on startup (`lib/env.ts`): it refuses to boot with a missing database URL or a short JWT secret.

## Reporting

Found something? Open an issue or email the maintainer.
