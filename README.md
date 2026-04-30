# Event Management Platform

A platform for creating, promoting, and managing events with ticket sales and QR-code-based check-in. Organisers create events with tiered tickets and capacity limits; attendees browse, purchase via Razorpay (test mode), and receive a QR code by email; on the event day organisers scan QR codes to validate entry. JSP renders printable tickets and check-in confirmation pages.

## Stack

- **Frontend:** React 18 (Vite) + Tailwind + daisyUI
- **Backend:** Node 20 + Express + Mongoose
- **Database:** MongoDB (local)
- **JSP layer:** Tomcat 10 + JSP/JSTL + MongoDB Java driver
- **Email:** Nodemailer + Ethereal (dev SMTP, browser preview)
- **Payments:** Razorpay Payment Gateway (test mode)
- **QR:** `qrcode` (server-side generation), `html5-qrcode` (browser-side webcam scan)

## Prerequisites

| Tool | Version | Where |
|---|---|---|
| Node.js | 20+ | https://nodejs.org |
| MongoDB Community | 7+ | `choco install mongodb` |
| JDK | 17+ (we use 25) | https://adoptium.net |
| Maven | 3.9+ | `choco install maven` |
| Tomcat | 10.1+ | `choco install tomcat` |

## Quick start

See `docs/SETUP.md` for the full setup walkthrough including `.env` configuration, Razorpay test account creation, and Ethereal credential generation.

```bash
# Terminal 1 — MongoDB
mongod --dbpath C:/data/db

# Terminal 2 — Backend
cd backend && npm install && npm run dev   # http://localhost:3001

# Terminal 3 — Frontend
cd frontend && npm install && npm run dev   # http://localhost:5173

# Terminal 4 — Tomcat (only when JSP changes)
cd jsp && mvn package
# copy target/event-mgmt.war to %CATALINA_HOME%\webapps\
%CATALINA_HOME%\bin\startup.bat                # http://localhost:8080
```

## Demo flow

See `docs/DEMO_SCRIPT.md` for the full 14-step end-to-end walkthrough.

## Notes

- This is a college project. Authentication is email-only (no password) and stored in `localStorage` — **not production-ready**.
- Razorpay is in test mode only. Use card `4111 1111 1111 1111` with any future expiry and any CVV.
- Email is sent via Ethereal (a fake SMTP for development) — emails are previewed in a browser, not delivered to a real inbox.
