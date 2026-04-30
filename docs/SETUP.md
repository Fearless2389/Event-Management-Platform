# Setup guide

This walks through installing every dependency, generating credentials, and getting the four servers (MongoDB, Backend, Frontend, Tomcat) up. Allow ~45-60 minutes the first time.

## 0. Install system dependencies

Open **PowerShell as Administrator** and run:

```powershell
choco install -y mongodb maven tomcat
```

Or install manually:

| Tool | Where | Notes |
|---|---|---|
| Node 20+ | https://nodejs.org | Already installed |
| MongoDB 7 | https://www.mongodb.com/try/download/community | Pick "Windows MSI", install as a Windows service |
| JDK 17+ | https://adoptium.net | We already have JDK 25 at `C:\Users\ruthv\.jdks\openjdk-25` |
| Maven 3.9+ | https://maven.apache.org/download.cgi | Add `bin` to PATH |
| Tomcat 10.1.x | https://tomcat.apache.org/download-10.cgi | Pick "32-bit/64-bit Windows Service Installer" or unzip the `.zip` to `C:\tomcat10` |

After installing, verify each:

```bash
node --version
npm --version
java -version
mvn --version
mongod --version
```

## 1. Set environment variables

Add to your **user** environment variables (or set per-shell):

```powershell
setx JAVA_HOME "C:\Users\ruthv\.jdks\openjdk-25"
setx CATALINA_HOME "C:\tomcat10"
```

Restart any open shells after `setx`.

## 2. Razorpay test keys

1. Sign up at https://razorpay.com (free, requires phone OTP).
2. Skip the KYC steps — test mode works without KYC.
3. In the dashboard, switch the toggle (top-left) to **Test Mode**.
4. Go to **Settings → API Keys → Generate Test Key**.
5. Copy `Key Id` (starts with `rzp_test_`) and `Key Secret`.

## 3. Create `.env`

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and paste your Razorpay test keys:

```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Leave `ETHEREAL_USER` and `ETHEREAL_PASS` blank — the backend will auto-create a fresh Ethereal inbox on first boot and print the credentials. Copy them back into `.env` if you want a stable inbox across restarts.

## 4. Start MongoDB

If installed as a Windows service, it should already be running. To check:

```powershell
Get-Service MongoDB
```

If it says `Stopped`, start it:

```powershell
Start-Service MongoDB
```

To run manually instead:

```powershell
mkdir C:\data\db
mongod --dbpath C:\data\db
```

## 5. Start the backend

```bash
cd backend
npm install        # only first time
npm run dev
```

Should print:
```
MongoDB connected: eventmgmt
Generated Ethereal test account: <user>@ethereal.email
Backend listening on http://localhost:3001
```

Test it: `curl http://localhost:3001/api/health` → `{"ok":true}`.

## 6. Start the frontend

In a new terminal:

```bash
cd frontend
npm install        # only first time
npm run dev
```

Visit http://localhost:5173.

## 7. Build and deploy the JSP webapp

In a new terminal:

```bash
cd jsp
mvn clean package
```

Look for `target/event-mgmt.war`.

Copy the war to Tomcat's `webapps/` folder:

```powershell
copy target\event-mgmt.war "C:\tomcat10\webapps\"
```

Start Tomcat:

```powershell
C:\tomcat10\bin\startup.bat
```

Tomcat unpacks the war on first hit. Visit http://localhost:8080/event-mgmt/ticket.jsp — you should see "Missing ticket id." (that's correct; it means the page is alive).

To redeploy after JSP changes: stop Tomcat (`shutdown.bat`), delete `webapps\event-mgmt\` and `webapps\event-mgmt.war`, copy the new war, start Tomcat again.

## 8. Run the demo

See [DEMO_SCRIPT.md](DEMO_SCRIPT.md).

---

## Troubleshooting

**Backend exits with "Razorpay keys missing":** check `.env` is in `backend/` (not the project root).

**Frontend shows "Failed to fetch" on every page:** backend isn't running on port 3001, or CORS is blocking. Vite proxies `/api/*` to `http://localhost:3001` automatically.

**JSP page returns 404:** Tomcat hasn't unpacked the war yet, or the context path is wrong. The path is `/event-mgmt/ticket.jsp` (matches the war filename).

**JSP page returns 500 with "ClassNotFoundException com.eventmgmt.TicketDAO":** the war wasn't built with the Java sources. Run `mvn clean package` again and check `target/event-mgmt.war` includes `WEB-INF/classes/com/eventmgmt/TicketDAO.class`.

**MongoDB connection refused (Java side):** the JSP module reads its own connection from `WEB-INF/web.xml` (`mongoUri` context-param). Default is `mongodb://localhost:27017`. Change it there if your Mongo is elsewhere, then rebuild the war.

**Webcam scanner says "no camera":** browsers block camera access on non-HTTPS unless the host is `localhost`. Make sure you visit via `http://localhost:5173`, not `http://127.0.0.1:5173` or your LAN IP.
