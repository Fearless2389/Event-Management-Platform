# CLAUDE.md — Event Management Platform

This file is loaded automatically by Claude Code when working in this directory. It captures every decision made during planning so subsequent sessions don't need to re-derive context.

## Project context

- **What:** College assignment "Project 4: Event Management System" (intermediate). MongoDB, Express, React, Node.js, JSP. Organizers create events with tiered tickets; attendees buy tickets and get a QR code by email; on event day organizers scan QR codes to validate entry. JSP renders the printable ticket and check-in confirmation pages.
- **Trajectory:** Build the assignment version first (rubric-compliant). Once done, evolve into a real-use product. Architect cleanly so that evolution is not blocked, but do **NOT** ship real-product features yet (no real auth, no GDPR, no multi-tenancy, no real Stripe, no tests, no CI).
- **Time budget:** Weekend crunch — ~16h hard, accepted overflow to ~18-19h with Razorpay test-mode addition.
- **User skill level:** 1-2 out of 5 across the entire stack. Help model is **"Claude writes, user runs/debugs"** — fastest path to a working demo. Prefer to give complete, copy-paste-ready code over partial snippets.
- **Grading:** No published rubric. Instructor wants every spec feature visibly working + decent UI + readable code. Live demo on the user's laptop.

The full design spec is at `C:\Users\ruthv\.claude\plans\project-4-event-management-federated-narwhal.md`.

## Stack (locked)

| Layer | Choice |
|---|---|
| Frontend | Vite + React 19 + React Router 7 + Tailwind v3 + daisyUI v4 (downgraded from v4/v5 due to Vite 8 + rolldown resolution bug — known issue) |
| Backend | Node 20 LTS + Express 4 + Mongoose 8 |
| Database | Local MongoDB Community 7 (`mongodb://localhost:27017/eventmgmt`) |
| Email | Nodemailer + Ethereal (dev SMTP, browser preview — NOT real Gmail) |
| QR generation | `qrcode` npm package, server-side PNG generation |
| QR scanning | `html5-qrcode`, browser webcam |
| Payments | **Razorpay Payment Gateway test mode** (NOT Razorpay X — that's banking/payouts, wrong product). Razorpay Node SDK + Checkout JS + HMAC signature verification |
| JSP server | Tomcat 9.0.117 (javax namespace, installed by `choco install tomcat`) on port 8080. NOTE: choco's `tomcat` package is v9, not v10. Pom.xml uses `javax.servlet`/`javax.servlet.jsp` deps accordingly. |
| Java | JDK 11 or 25 (we have both); Maven `pom.xml` sets `<release>11</release>` for Tomcat 9 compatibility |
| Build tool (JSP) | Maven |
| MongoDB Java driver | `mongodb-driver-sync` (org.mongodb) |

## Repo layout

```
Event Management Platform/
├── frontend/      # Vite + React (port 5173)
├── backend/       # Node + Express (port 3001)
├── jsp/           # Tomcat webapp, Maven project (deployed to port 8080)
├── docs/          # SETUP.md, DEMO_SCRIPT.md, screenshots/
├── CLAUDE.md      # this file
└── README.md
```

## Run commands (every dev session)

In four terminals:

```bash
# 1. MongoDB
mongod --dbpath C:/data/db   # or whatever path was set during install

# 2. Backend
cd backend && npm run dev     # nodemon on :3001

# 3. Frontend
cd frontend && npm run dev    # Vite on :5173

# 4. Tomcat (only when JSP changes)
cd jsp && mvn package
cp target/event-mgmt.war "$CATALINA_HOME/webapps/"
"$CATALINA_HOME/bin/startup.bat"   # Tomcat on :8080
```

## Data model (MongoDB collections)

**`events`**: `_id, organizerEmail, title, description, venue, dateTime, capacity, ticketTiers[{name, price, capacity, sold}], imageUrl, createdAt`

**`tickets`**: `_id, eventId, attendeeName, attendeeEmail, tierName, price, razorpayOrderId, razorpayPaymentId, qrPayload, checkedIn, checkedInAt, createdAt`

`qrPayload` is the ticket's `_id` as a string. No signing/encryption — MVP only.

## Auth model — intentionally MVP

- Login is email + name + role (`organizer` | `attendee`). No password.
- User stored in `localStorage`.
- Backend trusts `X-User-Email` header for organizer-scoped routes (e.g., `GET /api/events/mine`).
- README and a one-line code comment must call this out as MVP-only, not production.

## Razorpay flow (Payment Gateway, NOT X)

1. `POST /api/payments/order` → backend creates order via Razorpay Node SDK (`amount = price * 100` paise, `currency = "INR"`).
2. Frontend opens Checkout JS modal with `orderId` + `keyId` (test keys, prefixed `rzp_test_`).
3. User pays with test card `4111 1111 1111 1111` (any future expiry, any CVV).
4. Razorpay calls success handler with `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`.
5. `POST /api/payments/verify` → backend computes `HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)`, compares to received signature.
6. On match: insert ticket, generate QR, email via Ethereal, increment `tier.sold`, return `{ ticketId, ethArealPreviewUrl, jspTicketUrl }`.

## JSP integration

- Tomcat serves `http://localhost:8080/event-mgmt/ticket.jsp?id=<ticketId>` and `…/checkin.jsp?id=<ticketId>`.
- JSP has its own MongoDB connection via `mongodb-driver-sync`. **Do not** route through Node — JSP talks to Mongo directly. This is the point of the two-language architecture in the spec.
- React links to JSP pages with `target="_blank"`. No iframe, no CORS.
- JSP uses JSTL for rendering. Servlet preprocessing (`TicketServlet.java`) only added if needed.

## Build phase order (do not deviate without reason)

0. Setup: install Maven, MongoDB, Tomcat (Chocolatey); scaffold folders; create Razorpay+Ethereal accounts; populate `.env`.
1. Backend skeleton: schemas, event CRUD endpoints.
2. Frontend basics: routing, login, event list, event detail, create-event form.
3. Razorpay payment + ticket creation.
4. QR + email via Ethereal.
5. JSP pages (Tomcat + Maven + DAO).
6. Organizer dashboard + webcam scanner + check-in JSP.
7. Polish + README + demo script.

**Cut-line:** if running over budget, drop the webcam scanner in favor of a paste-code form. Saves ~1h. Cosmetic loss only.

## Hard rules

- **No real authentication.** No JWT, no sessions, no password hashing, no OAuth. localStorage + email header only.
- **No real email provider.** Ethereal only. Do not configure Gmail, Outlook, SendGrid, etc.
- **No tests.** No Jest, no Vitest, no JUnit, no Postman collections committed. Manual smoke test via the demo script only.
- **No production hardening.** No rate limiting, no helmet, no CSRF tokens, no CSP, no logging frameworks. Just `console.log` and Express defaults.
- **No deployment config.** No Dockerfile, no CI, no cloud configs. Localhost only.
- **No Razorpay X.** Payment Gateway only. If anyone reads "Razorpay X" in code or docs, that's a mistake.
- **Do not generate code comments that explain WHAT.** Only WHY, and only when non-obvious. README handles the rest.

## Spec features → implementation locations

| # | Feature | Frontend | Backend |
|---|---|---|---|
| 1 | Organizer creates event | `pages/CreateEvent.jsx` | `POST /api/events` |
| 2 | Public browse events | `pages/EventList.jsx` | `GET /api/events` |
| 3 | Event detail | `pages/EventDetail.jsx` | `GET /api/events/:id` |
| 4 | Razorpay purchase | `pages/Purchase.jsx` | `POST /api/payments/order`, `/api/payments/verify` |
| 5 | QR + email | (server) | `services/qr.js`, `services/email.js` |
| 6 | Printable ticket | (link) | JSP `ticket.jsp` |
| 7 | Organizer dashboard | `pages/OrganizerDashboard.jsx` | `GET /api/events/mine`, `GET /api/events/:id/tickets` |
| 8 | QR scanner | `pages/Scan.jsx` | `POST /api/tickets/checkin` |
| 9 | Check-in confirmation | (redirect) | JSP `checkin.jsp` |

## Demo script (final smoke test)

Documented in `docs/DEMO_SCRIPT.md`. 14 steps from "start servers" through "scan twice, second scan rejected." Use this verbatim for final verification before submission.

## Environment variables (`backend/.env`)

```
MONGO_URI=mongodb://localhost:27017/eventmgmt
PORT=3001
FRONTEND_URL=http://localhost:5173
JSP_BASE_URL=http://localhost:8080/event-mgmt
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
ETHEREAL_USER=auto-generated-by-nodemailer
ETHEREAL_PASS=auto-generated-by-nodemailer
```

## Tooling status (as of 2026-04-30)

- Node 24.14, npm 11.9 — installed
- Git 2.50 — installed
- JDK 25 at `C:/Users/ruthv/.jdks/openjdk-25` — installed (PATH still points to Java 8; we set `JAVA_HOME` per-shell)
- Chocolatey 2.5.1, winget 1.28 — installed
- Maven, MongoDB, Tomcat 10 — **need install** (use `choco install maven mongodb-shell tomcat -y` from admin PowerShell, OR download zips manually)
