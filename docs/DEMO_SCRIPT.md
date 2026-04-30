# Demo script — full end-to-end walkthrough

Use this verbatim for the final smoke test before submission, and as a script during the live demo.

**Pre-flight:** all four servers running (MongoDB, Tomcat on 8080, backend on 3001, frontend on 5173). See [SETUP.md](SETUP.md).

---

## 1. Visit the site

Open http://localhost:5173. You should see "No events yet."

## 2. Sign in as an organizer

- Click **Login** (top-right).
- Email: `alice@org.com`
- Name: `Alice`
- Role: **Organizer**
- Click **Continue**. You land on `/dashboard`.

## 3. Create an event

- Click **+ New event**.
- Fill in:
  - Title: `Tech Conf 2026`
  - Description: `A one-day tech conference featuring talks on AI, web, and systems.`
  - Venue: `Bangalore International Centre`
  - Date & time: pick a future date
  - Total capacity: `100`
  - Image URL (optional): `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800`
- Tiers:
  - `Standard` — ₹500 — capacity 80
  - Click **+ Add tier**: `VIP` — ₹1500 — capacity 20
- Click **Create event**.
- You land on the event detail page. Verify both tiers show "X left."

## 4. Switch to attendee account

- Click **Logout** (top-right).
- Click **Login**.
- Email: `bob@attend.com` / Name: `Bob` / Role: **Attendee**.
- Click **Continue**. You land on the homepage with Tech Conf 2026 visible.

## 5. Buy a VIP ticket

- Click the Tech Conf 2026 card.
- Next to **VIP** click **Buy**.
- Confirm-purchase page shows. Click **Pay ₹1500 via Razorpay**.
- Razorpay test modal opens.
- Card number: `4111 1111 1111 1111`
- Expiry: any future date (`12/30`)
- CVV: `123`
- Name: `Bob`
- Click **Pay**.
- Razorpay simulates a 3-D Secure step — click **Success** on the simulator page.
- You land on `/success?ticketId=...&jspUrl=...&emailUrl=...`.

## 6. Inspect the email

- Click **View confirmation email (Ethereal preview)**.
- A new tab opens to ethereal.email showing the HTML email with embedded QR code.
- Confirm: event title, your name (Bob), tier (VIP), price (₹1500), QR image, and "Open printable ticket" button.

## 7. Open the printable ticket (JSP)

- Back on the success page, click **Open printable ticket (JSP)**.
- A new tab opens to `http://localhost:8080/event-mgmt/ticket.jsp?id=<ticketId>`.
- Verify: event title, date, venue, attendee name, tier, ticket ID, QR code, **VALID** badge, **Print** button.
- Click **Print** to verify print preview is clean.

## 8. Switch back to organizer

- Logout.
- Login as `alice@org.com` / `Alice` / **Organizer**.

## 9. View dashboard

- You should already be on `/dashboard`.
- Tech Conf 2026 row shows **1 / 100** in the Sold column.

## 10. Open the scanner

- Click **Scan tickets** on the Tech Conf row.
- Allow camera access when prompted.
- The webcam preview appears.

## 11. Scan the QR

- Open the JSP printable ticket from step 7 on your phone (or any other device), or hold its tab on screen up to the webcam.
- The scanner detects and reads the QR.
- A new tab opens to `http://localhost:8080/event-mgmt/checkin.jsp?id=<ticketId>` showing **✅ Checked in — Bob** with event details.

## 12. Try scanning the same ticket again

- Hold the same QR back up to the webcam.
- A new tab opens to `checkin.jsp?id=...&already=1` showing **⚠️ Already checked in** with the original check-in time.
- This proves duplicate check-ins are rejected.

## 13. Backstage check (optional, for the demo Q&A)

- Open MongoDB Compass or `mongosh`.
- `use eventmgmt`
- `db.events.find()` shows the Tech Conf 2026 event with `ticketTiers[1].sold = 1`.
- `db.tickets.find()` shows Bob's ticket with `checkedIn: true` and `checkedInAt: <timestamp>`.

## 14. Server logs

- Backend terminal logged the order creation, signature verification, and email send.
- Tomcat `catalina.out` (or the `startup.bat` window) logged the JSP page hits.

---

## What this demonstrates (for viva voce)

- **MongoDB:** stores events and tickets; both Node and Java connect to the same database.
- **Express:** RESTful endpoints for CRUD, payments, and check-in; middleware for the X-User-Email pattern.
- **React:** SPA with routing, role-based redirects, fetch-based API client, webcam QR scanning via `html5-qrcode`.
- **Node.js:** server-side QR PNG generation (`qrcode`), HMAC signature verification, Nodemailer email pipeline.
- **Razorpay test mode:** order creation via Node SDK, Checkout JS frontend integration, signature verification on the server. No real money moves.
- **JSP:** two server-rendered pages, each with its own MongoDB connection via the official Java driver. JSP scriptlets handle data lookup and rendering.
- **Tomcat:** servlet container for the JSP layer, packaged as a war via Maven, deployed to `webapps/`.
