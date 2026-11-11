# CLAUDE.md — Event Management Platform

This file is loaded automatically by Claude Code when working in this directory. It captures every decision made during planning so subsequent sessions don't need to re-derive context.

## Project context

- **What:** Production-style event management web app. MongoDB + Express + React. Organizers create events with tiered tickets; attendees sign up, search/filter, buy 1–10 tickets per checkout via Razorpay (test mode), and get QR codes by email; on event day organizers scan QR codes to validate entry.
- **Status:** Started as a college assignment ("Project 4: Event Management System"). Now being shipped as a real, publicly-deployable product on Vercel + Render + Atlas, with real JWT auth and real email delivery (Resend). The original JSP/Tomcat layer has been migrated to React routes.
- **Time budget for the deploy round:** ~5h of code + ~30 min of dashboard signups (Atlas, Render, Resend).
- **User skill level:** 1-2 out of 5 across the stack. Help model is **"Claude writes, user runs/debugs"** — favor complete, copy-paste-ready code over partial snippets.

The full design spec for the deploy round is at `C:\Users\ruthv\.claude\plans\project-4-event-management-federated-narwhal.md`.

## Stack (locked)

| Layer | Choice |
|---|---|
| Frontend | Vite + React 19 + React Router 7 + Tailwind v3 + daisyUI v4 |
| Backend | Node 20 LTS + Express 4 + Mongoose 8 |
| Auth | bcryptjs password hashing + jsonwebtoken (JWT in localStorage) |
| Database | MongoDB (local for dev, MongoDB Atlas free M0 for prod) |
| Email | [Resend](https://resend.com) (3000 emails/month free, no card) |
| QR generation | `qrcode` npm package, server-side PNG; `qrcode.react` for client-side render on the printable page |
| QR scanning | `html5-qrcode`, browser webcam |
| Payments | Razorpay Payment Gateway test mode + Checkout JS + HMAC signature verification |
| Hosting | Frontend → Vercel; Backend → Render free web service; DB → MongoDB Atlas |

## Repo layout

```
Event Management Platform/
├── frontend/      # Vite + React (port 5173)
├── backend/       # Node + Express (port 3001)
├── docs/          # SETUP.md, DEMO_SCRIPT.md, screenshots/
├── CLAUDE.md      # this file
├── README.md
└── vercel.json    # Vercel deploy config
```

## Run commands (every dev session)

In three terminals:

```bash
# 1. MongoDB (skip if using Atlas)
mongod --dbpath C:/data/db

# 2. Backend
cd backend && npm run dev     # nodemon on :3001

# 3. Frontend
cd frontend && npm run dev    # Vite on :5173
```

## Data model (MongoDB collections)

**`users`**: `_id, email (unique, lowercase), passwordHash, name, role: 'attendee'|'organizer', createdAt, updatedAt`

**`events`**: `_id, organizerEmail, title, description, venue, dateTime, ticketTiers[{name, price, capacity, sold}], imageUrl, category, createdAt`

**`tickets`**: `_id, eventId, attendeeName, attendeeEmail, tierName, price, razorpayOrderId, razorpayPaymentId, ticketIndex, qrPayload, checkedIn, checkedInAt, createdAt`

`qrPayload` is the ticket's `_id` as a string. No signing/encryption — the trust boundary is the organizer's role check on `/api/tickets/checkin`.

Unique compound index on `{razorpayPaymentId, ticketIndex}` — guards against replay attacks creating duplicate ticket sets for one paid order.

## Auth model

- **Signup:** `POST /api/auth/signup` with `{ email, name, password, role }`. Server hashes password with bcryptjs (cost 10), creates the User document, returns `{ token, user }`. JWT TTL = 7 days.
- **Login:** `POST /api/auth/login` with `{ email, password }`. Server compares hash, returns `{ token, user }`.
- **Frontend storage:** `{ token, user }` in `localStorage` under `em_session`. `lib/auth.js` exposes `getToken`, `getUser`, `setSession`, `logout`.
- **API requests:** `lib/api.js` sends `Authorization: Bearer <token>` on every request. On 401 it `logout()`s automatically.
- **Backend middleware:** `optionalUser` runs globally (sets `req.user` if a valid token is present). `requireUser` and `requireRole('organizer')` gate protected routes.
- **Migration note:** existing events keep their `organizerEmail` string field. Login lookup maps email → User document. Organizers from the old MVP must sign up before they can re-access their events.

## Razorpay flow (Payment Gateway, NOT X)

1. `POST /api/payments/order` → backend creates order via Razorpay Node SDK. Body: `{ eventId, tierName, attendeeName, attendeeEmail, quantity }`. Validates `1 ≤ quantity ≤ 10` and `tier.sold + quantity ≤ tier.capacity`. Order amount = `tier.price * quantity * 100` paise.
2. Frontend opens Checkout JS modal with `orderId` + `keyId`.
3. User pays. Easiest test method: UPI `success@razorpay`. Card alternative: `4111 1111 1111 1111`.
4. Razorpay calls success handler with `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`.
5. `POST /api/payments/verify` → backend computes `HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)`, compares to received signature.
6. On match: `Ticket.insertMany` of N docs, increments `tier.sold` by N, generates QR PNGs, sends one email containing all N QR codes via Resend, returns `{ ticketIds, firstTicketUrl, emailPreviewUrl }`.

## Printable ticket / check-in pages (React, was JSP)

Both are React routes outside the main Layout (no header, no auth required) so they look like printable artifacts:

- `/ticket/:id` — printable ticket. Public `GET /api/tickets/:id` returns `{ ticket, event }`. Renders QR client-side via `qrcode.react`. `@media print` CSS makes Print look clean.
- `/checkin/:id?already=1` — check-in confirmation. Same data fetch. The `?already=1` query param switches between "Checked in" and "Already checked in" variants.

The original `jsp/` directory and `tomcat-base/` directory have been deleted. Old JSP DAO + Java MongoDB driver are gone.

## Build phase order (last completed round)

The deploy round bundled five things and shipped them in this order:

1. **Phase A — JWT + password auth** (~2h). Backend: User model, services/auth.js, middleware/auth.js, routes/auth.js. Frontend: lib/auth.js (token), lib/api.js (Authorization header), Login + Signup pages.
2. **Phase B — JSP → React migration** (~1h). New public `GET /api/tickets/:id`. New Ticket.jsx and Checkin.jsx pages. Deleted `jsp/` and `tomcat-base/`.
3. **Phase C — Multiple tickets per purchase** (~30 min). `quantity` accepted on order/verify; `Ticket.insertMany`; multi-QR email; quantity selector in EventDetail and Purchase; ticket-list array on Success.
4. **Phase D — Resend email** (~30 min). Replaced nodemailer + Ethereal with Resend SDK. New env vars: `RESEND_API_KEY`, `EMAIL_FROM`. Dropped `ETHEREAL_USER`/`ETHEREAL_PASS`.
5. **Phase E — Search + filters** (~30 min). EventList: search bar (title + venue), date range, min/max price, all in URL search params via `useSearchParams`.

User-action phases (deployment) — not yet done:
- **Phase F:** MongoDB Atlas signup + free M0 cluster.
- **Phase G:** Render web service for the backend.
- **Phase H:** Vercel for the frontend.
- **Phase I:** Razorpay key rotation (current test keys are in public GitHub history — burned).

## Backlog (in priority order)

Not in scope for the deploy round, but planned next:

1. Image upload (replace URL paste with Cloudflare R2 / Vercel Blob).
2. Event editing & deletion (PATCH/DELETE /api/events/:id with ownership check).
3. Refunds / cancellations via Razorpay refund API.
4. Add-to-Calendar links (.ics or Google Calendar URL) on Success / Ticket page.
5. Dashboard analytics (recharts).
6. Rate limiting (express-rate-limit on auth + payments).
7. Helmet + security headers.
8. Sentry error tracking (frontend + backend).
9. Tests — Vitest unit + Playwright E2E.
10. GitHub Actions CI.
11. Email reminders (cron on Render, 24h before event).
12. Discount / promo codes.
13. Wishlist / save for later.
14. Social sharing (Twitter / WhatsApp / Copy link).
15. Reviews & ratings (post-event form).
16. Recurring events (parent/child events).
17. i18n (English/Hindi via i18next).
18. Mobile app (React Native / Expo, share auth + API client).

## Spec features → implementation locations

| # | Feature | Frontend | Backend |
|---|---|---|---|
| 1 | Organizer creates event | `pages/CreateEvent.jsx` | `POST /api/events` |
| 2 | Public browse + search | `pages/EventList.jsx` (filters in URL params) | `GET /api/events` |
| 3 | Event detail + qty selector | `pages/EventDetail.jsx` | `GET /api/events/:id` |
| 4 | Razorpay purchase (1–10 tickets) | `pages/Purchase.jsx` | `POST /api/payments/order`, `/api/payments/verify` |
| 5 | QR + email | (server) | `services/qr.js`, `services/email.js` (Resend) |
| 6 | Printable ticket | `pages/Ticket.jsx` | `GET /api/tickets/:id` |
| 7 | Organizer dashboard | `pages/OrganizerDashboard.jsx` | `GET /api/events/mine`, `GET /api/events/:id/tickets` |
| 8 | QR scanner | `pages/Scan.jsx` | `POST /api/tickets/checkin` |
| 9 | Check-in confirmation | `pages/Checkin.jsx` | (redirect target from /checkin) |
| 10 | Auth | `pages/Login.jsx`, `pages/Signup.jsx` | `POST /api/auth/{signup,login}`, `GET /api/auth/me` |

## Demo script (final smoke test)

Documented in `docs/DEMO_SCRIPT.md`. 14 steps from "start servers" through "scan twice, second scan rejected." Use this verbatim for final verification.

## Environment variables (`backend/.env`)

```
MONGO_URI=mongodb://localhost:27017/eventmgmt    # Atlas SRV in prod
PORT=3001
FRONTEND_URL=http://localhost:5173               # Vercel URL in prod
JWT_SECRET=<64-char random hex>
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx               # blank → emails skipped
EMAIL_FROM=EventHub <onboarding@resend.dev>      # or your verified domain
```

`VITE_API_URL` (frontend, set on Vercel) points at the public backend URL on Render.

## Hard rules (current — overrides earlier MVP-only rules)

- **Real auth is in place.** Don't roll back to email-only.
- **No httpOnly cookies (yet).** JWT in localStorage; switch to cookies + CSRF as a follow-up.
- **No tests yet.** Backlog item.
- **Use Resend, not Ethereal/Gmail/SendGrid.**
- **No Razorpay X.** Payment Gateway only.
- **No Tomcat / JSP / Maven / Java.** That layer was migrated to React.
- **Free-tier deploy targets: Render + Vercel + Atlas + Resend.** No Docker, no Kubernetes, no paid plans.
- **Render free tier sleeps after 15 min idle** — first request post-sleep takes ~30s. Don't redesign around this; it's expected.
- **Don't generate code comments that explain WHAT.** Only WHY, and only when non-obvious.

## Known issues / risks

- **JWT in localStorage** is XSS-vulnerable. Acceptable for MVP-style hosting; switch to cookies + CSRF later.
- **Resend sandbox** (`onboarding@resend.dev`) only delivers to your own verified email. Verify a domain in Resend or have demo viewers log in with the verified email.
- **Razorpay test keys** in `.env.example` git history are public — rotate before any real demo.
- **Render cold start** ~30s on first request after a 15-min idle window. Frontend should show a spinner gracefully.

## Tooling status (as of 2026-05-02)

- Node 24.14, npm 11.9 — installed.
- Git 2.50 — installed.
- MongoDB Community 7+ — needed locally only if not using Atlas (`choco install mongodb`).
- All Java/Maven/Tomcat tooling no longer required.
