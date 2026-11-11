# Demo script — full end-to-end walkthrough

Use this verbatim for the final smoke test before submission, and as a script during the live demo.

**Pre-flight:** three things running — MongoDB, backend on 3001, frontend on 5173. See [SETUP.md](SETUP.md).

---

## 1. Visit the site

Open http://localhost:5173. You should see "No events yet." Click **Sign in** (top-right).

## 2. Sign up as an organizer (Alice)

- Click **Create an account** under the sign-in form.
- Name: `Alice`
- Email: `alice@org.com`
- Password: `password123`
- Confirm password: `password123`
- Role: **Organizer**
- Click **Create account**. You land on `/dashboard`.

## 3. Create an event

- Click **+ New event**.
- Fill in:
  - Title: `Tech Conf 2026`
  - Description: `A one-day tech conference featuring talks on AI, web, and systems.`
  - Venue: `Bangalore International Centre`
  - Date & time: pick a future date
  - Image URL (optional): `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800`
  - Category: `Tech`
- Tiers:
  - `Standard` — ₹500 — capacity 80
  - Click **+ Add tier**: `VIP` — ₹1500 — capacity 20
- Click **Create event**.
- You land on the event detail page. Verify both tiers show "X available."

## 4. Sign up as an attendee (Bob)

- Click **Logout** (top-right).
- Click **Sign in** → **Create an account**.
- Name: `Bob`, Email: `bob@attend.com`, Password: `password123`, Role: **Attendee**.
- Click **Create account**. You land on the homepage with Tech Conf 2026 visible.

## 5. Search and filter

- Type `tech` in the search bar — Tech Conf 2026 stays visible.
- Click the **Tech** category chip — still visible.
- Open **Filters**, set Min price to `1000` — the event disappears (cheapest tier is ₹500).
- Click **Clear all** to reset filters.

## 6. Buy 3 VIP tickets

- Click the Tech Conf 2026 card.
- Next to **VIP**, press the **+** button until the quantity reads `3`. The total `₹1500 × 3 = ₹4500` should display.
- Click **Buy 3 × VIP**.
- Confirm-purchase page shows total ₹4500. Click **Pay ₹4500 via Razorpay**.
- Razorpay test modal opens.
- Easiest test method: pick **UPI**, enter `success@razorpay`, **Verify and Pay**.
  - Or use a test card: `4111 1111 1111 1111`, any future expiry, any CVV.
- After success, you land on `/success?id=...&id=...&id=...` showing 3 separate "Open ticket" buttons.

## 7. Inspect the email

- If `RESEND_API_KEY` is set in `.env`, the inbox you registered with at Resend will have an email titled "Your 3 tickets for Tech Conf 2026" with three QR codes.
- If `RESEND_API_KEY` is blank, skip this step (the email is gracefully skipped).

## 8. Open the printable ticket

- On the success page, click **Open ticket 1**.
- A new tab opens to `http://localhost:5173/ticket/<id>`.
- Verify: event title, date, venue, attendee name, tier, ticket ID, QR code, **VALID** badge, **Print ticket** button.
- Click **Print ticket** to verify print preview is clean.

## 9. Sign back in as Alice

- Logout. Sign in: `alice@org.com` / `password123`.

## 10. View dashboard

- You should land on `/dashboard`.
- Tech Conf 2026 shows **3 / 100** in the Sold column (Standard 0 / 80 + VIP 3 / 20).

## 11. Open the scanner

- Click **Scan tickets** on the Tech Conf row.
- Allow camera access when prompted.
- The webcam preview appears.

## 12. Scan the QR

- Open one of the printable tickets from step 8 on your phone, or hold its tab on screen up to the webcam.
- The scanner detects and reads the QR.
- A new tab opens to `http://localhost:5173/checkin/<id>` showing **✅ Checked in — Bob**.

## 13. Try scanning the same ticket again

- Within ~10s, scan again — still success (idempotent grace window).
- Wait > 10s and scan again — opens `/checkin/<id>?already=1` showing **⚠️ Already checked in** with the original check-in time.

## 14. Backstage check (optional, for Q&A)

- Open MongoDB Compass or `mongosh`.
- `use eventmgmt`
- `db.users.find()` shows hashed passwords for Alice and Bob.
- `db.events.find()` shows Tech Conf 2026 with `ticketTiers[1].sold = 3`.
- `db.tickets.find()` shows three rows; one has `checkedIn: true`.

---

## What this demonstrates

- **MongoDB:** events, tickets, users.
- **Express:** REST endpoints + JWT-bearer middleware for protected routes.
- **React Router:** browse / detail / purchase / success / printable ticket / check-in pages.
- **Auth:** bcryptjs password hashes, JWT in `localStorage`, role-based redirects.
- **Razorpay test mode:** order creation, Checkout JS, HMAC signature verification — no real money moves.
- **Multi-ticket purchase:** one Razorpay order → N tickets in one `Ticket.insertMany`.
- **Email:** Resend SDK sends real email with N inlined QR codes.
- **QR:** server generates the PNGs, browser renders client-side via `qrcode.react` on the printable page, scanned with `html5-qrcode`.
