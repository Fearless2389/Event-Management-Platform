# Event Management Platform

A web app for creating, promoting, and managing events with ticket sales and QR-code-based check-in. Organisers create events with tiered tickets and capacity limits; attendees sign up, browse with search and filters, purchase 1–10 tickets per checkout via Razorpay (test mode), and receive QR codes by email. On the event day organisers scan QR codes to validate entry.

## Stack

- **Frontend:** React 19 (Vite) + Tailwind + daisyUI · React Router · `qrcode.react` for printable tickets · `html5-qrcode` for the webcam scanner
- **Backend:** Node 20 + Express + Mongoose · JWT + bcryptjs auth
- **Database:** MongoDB (local for dev, Atlas for prod)
- **Email:** [Resend](https://resend.com) — 3000 emails/month free, no card
- **Payments:** Razorpay Payment Gateway (test mode)

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20+ |
| MongoDB Community | 7+ (or a free Atlas cluster) |

## Local quick start

```bash
# Terminal 1 — MongoDB (skip if using Atlas)
mongod --dbpath C:/data/db

# Terminal 2 — Backend
cd backend
cp .env.example .env   # then edit .env (see SETUP.md for all keys)
npm install
npm run dev            # http://localhost:3001

# Terminal 3 — Frontend
cd frontend
npm install
npm run dev            # http://localhost:5173
```

See `docs/SETUP.md` for the full walkthrough (Razorpay account, Resend account, Atlas, deploying to Render + Vercel).

## Demo flow

See `docs/DEMO_SCRIPT.md` for the end-to-end smoke test.

## Notes

- Razorpay is in **test mode** only. Pay via UPI `success@razorpay`, or card `4111 1111 1111 1111` with any future expiry and any CVV.
- Resend's sandbox sender (`onboarding@resend.dev`) only delivers to the email you signed up with. To send to anyone, verify a domain in the Resend dashboard.
- Auth is JWT in `localStorage`. For a stronger production posture, switch to httpOnly cookies + CSRF later.

## Deploying

- **Backend** → Render (free web service, 15-min idle sleep)
- **Frontend** → Vercel (`vercel.json` already configured)
- **Database** → MongoDB Atlas (free M0 cluster)
- **Email** → Resend

The first request after Render's free tier goes to sleep takes ~30s — that's expected.
