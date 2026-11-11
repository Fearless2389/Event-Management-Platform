# Setup guide

This walks through getting the app running locally and (optionally) deploying it to free-tier cloud services. Allow ~30 minutes for the local install + ~30 minutes for deploy.

## 1. Prerequisites

| Tool | Version | Where |
|---|---|---|
| Node.js | 20+ | https://nodejs.org |
| MongoDB Community | 7+ | `choco install mongodb` (skip if using Atlas) |

That's it — no Java, no Maven, no Tomcat anymore. The whole stack is JS/TS.

## 2. Razorpay test keys

1. Sign up at https://razorpay.com (free, requires phone OTP).
2. Skip the KYC steps — test mode works without KYC.
3. In the dashboard, switch the toggle (top-left) to **Test Mode**.
4. Go to **Settings → API Keys → Generate Test Key**.
5. Copy `Key Id` (starts with `rzp_test_`) and `Key Secret`.

## 3. Resend account (for ticket emails)

1. Sign up at https://resend.com (free, no card; 3000 emails/month).
2. Go to **API Keys → Create API Key**. Copy the value (starts with `re_`).
3. **Sandbox sending limit:** the default sender `onboarding@resend.dev` only delivers to the email address you signed up with. To send tickets to other people, verify a domain in **Domains → Add Domain** and set `EMAIL_FROM` to `EventHub <noreply@yourdomain.com>`.

## 4. Create `backend/.env`

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in:

```
JWT_SECRET=<paste output of: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=EventHub <onboarding@resend.dev>
```

Leave `RESEND_API_KEY` blank to skip email sending in dev (the rest of the app still works).

## 5. Verify MongoDB is running

For local Mongo via choco:

```powershell
sc.exe query MongoDB
```

If `STATE: RUNNING`, you're set. If stopped: `Start-Service MongoDB`.

For MongoDB Atlas, replace `MONGO_URI` in `.env` with the connection string (see deployment section below).

## 6. Start the backend

```bash
cd backend
npm install
npm run dev   # nodemon
```

Expected output:
```
MongoDB connected: eventmgmt
Backend listening on http://localhost:3001
```

Sanity check: `curl http://localhost:3001/api/health` → `{"ok":true}`.

## 7. Start the frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev   # Vite on :5173
```

Visit http://localhost:5173 — sign up, create an event, buy tickets.

## 8. Run the demo

See [DEMO_SCRIPT.md](DEMO_SCRIPT.md).

---

## Deploying to the cloud (optional, ~30 min)

Three free-tier services do the whole stack: Atlas (DB), Render (backend), Vercel (frontend).

### Atlas (MongoDB)

1. Sign up at https://www.mongodb.com/cloud/atlas/register.
2. Create a free **M0** cluster (any region).
3. **Database Access** → add user `eventhub` with an auto-generated password — save it.
4. **Network Access** → Add IP → "Allow Access from Anywhere" (`0.0.0.0/0`). Required because Render's outbound IP changes.
5. **Cluster → Connect → Drivers**: copy the connection string and replace `<password>` with the saved password. Add `/eventmgmt` before the `?`:
   ```
   mongodb+srv://eventhub:<password>@cluster0.xxxx.mongodb.net/eventmgmt?retryWrites=true&w=majority
   ```

### Render (backend)

1. Sign up at https://render.com (GitHub auth, no card).
2. **New → Web Service** → connect your fork of this repo.
3. Settings:
   - Name: `eventhub-backend`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free
4. Environment variables (Render dashboard → Environment):
   - `MONGO_URI` — Atlas connection string
   - `JWT_SECRET` — `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` — from Razorpay
   - `RESEND_API_KEY` — from Resend
   - `EMAIL_FROM` — `EventHub <onboarding@resend.dev>` (or your verified domain)
   - `FRONTEND_URL` — set this **after** Vercel is up
5. Deploy. Render gives you a URL like `https://eventhub-backend.onrender.com`.

> **Free-tier sleep:** services sleep after 15 minutes of inactivity. The first request after sleep takes ~30s while the container cold-starts. That's expected — don't refresh in a panic.

### Vercel (frontend)

`vercel.json` is already in the repo. After Render is live:

1. https://vercel.com/new → import the repo.
2. Don't override anything (vercel.json sets the root, build, and output dir).
3. Environment variable: `VITE_API_URL=https://eventhub-backend.onrender.com`.
4. Deploy. You get a URL like `https://event-management-platform.vercel.app`.
5. Go back to Render → set `FRONTEND_URL` to that Vercel URL → Render redeploys.

---

## Troubleshooting

**Backend exits with "Razorpay keys missing":** check `.env` is in `backend/` (not the project root) and has both `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.

**Backend warns "RESEND_API_KEY not set":** ticket emails will be skipped, but the rest of the flow still works. Add the key from your Resend dashboard.

**Frontend shows "Failed to fetch" on every page:** backend isn't running on port 3001. Vite proxies `/api/*` to `http://localhost:3001` automatically.

**Webcam scanner says "no camera":** browsers block camera access on non-HTTPS unless the host is `localhost`. In dev visit `http://localhost:5173` (not `127.0.0.1` or LAN IP). In production, the Vercel URL is HTTPS so it just works.

**"Sign in required" on a public page (e.g. `/ticket/<id>`):** ensure your `Authorization` header isn't being sent on these public endpoints — they only need a public ticket fetch. The frontend already handles this via `lib/api.js`.

**Resend says "you can only send emails to your own address":** that's the sandbox limit on `onboarding@resend.dev`. Verify a domain in the Resend dashboard and update `EMAIL_FROM`.
