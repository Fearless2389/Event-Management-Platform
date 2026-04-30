# Setup guide

This walks through installing every dependency, generating credentials, and getting the four servers (MongoDB, Backend, Frontend, Tomcat) up. Allow ~45-60 minutes the first time.

## 0. Install system dependencies

Open **PowerShell as Administrator** and run:

```powershell
choco install -y mongodb maven tomcat
```

Note: `choco install tomcat` installs **Tomcat 9** (not 10). This project's JSP module is configured for Tomcat 9 (`javax.servlet` namespace) accordingly. If you ever switch to Tomcat 10, change the `javax.servlet*` dependencies in `jsp/pom.xml` to their `jakarta.servlet*` equivalents and update `jsp/src/main/webapp/WEB-INF/web.xml` to the Jakarta EE 6 schema.

| Tool | Version | Where it lands |
|---|---|---|
| Node 20+ | https://nodejs.org | already installed |
| MongoDB Community 7-8 | from choco | runs as Windows service `MongoDB`; bin at `C:\Program Files\MongoDB\Server\<v>\bin` |
| JDK 11 | already installed | `C:\Users\ruthv\.jdk\jdk-11.0.28` |
| Maven 3.9.x | from choco | `C:\ProgramData\chocolatey\lib\maven\apache-maven-3.9.15\bin` |
| Tomcat 9.0.x | from choco | `C:\ProgramData\chocolatey\lib\tomcat\tools\apache-tomcat-9.0.117` (binaries) and `C:\ProgramData\Tomcat9` (admin-owned default `CATALINA_BASE`) |

## 1. Razorpay test keys

1. Sign up at https://razorpay.com (free, requires phone OTP).
2. Skip the KYC steps — test mode works without KYC.
3. In the dashboard, switch the toggle (top-left) to **Test Mode**.
4. Go to **Settings → API Keys → Generate Test Key**.
5. Copy `Key Id` (starts with `rzp_test_`) and `Key Secret`.

## 2. Create `backend/.env`

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and paste your Razorpay test keys:

```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Leave `ETHEREAL_USER` and `ETHEREAL_PASS` blank on first boot — the backend will auto-create a fresh Ethereal inbox and print the credentials in the console. Copy them back into `.env` if you want a stable inbox across restarts.

## 3. Verify MongoDB is running

The choco install registers MongoDB as a Windows service. Check from any shell:

```powershell
sc.exe query MongoDB
```

If `STATE: RUNNING`, you're set. If `STOPPED`:

```powershell
Start-Service MongoDB
```

## 4. Start the backend

```bash
cd backend
npm install        # only first time
npm run dev        # nodemon
```

Should print:
```
MongoDB connected: eventmgmt
Generated Ethereal test account: <user>@ethereal.email
Backend listening on http://localhost:3001
```

Sanity check: `curl http://localhost:3001/api/health` → `{"ok":true}`.

## 5. Start the frontend

In a new terminal:

```bash
cd frontend
npm install        # only first time
npm run dev        # Vite on :5173
```

Visit http://localhost:5173.

## 6. Build and deploy the JSP webapp

The chocolatey Tomcat package places its writable `CATALINA_BASE` at `C:\ProgramData\Tomcat9`, which only Administrators can write to. To avoid needing admin every time, this project uses a **project-local `CATALINA_BASE`** at `tomcat-base/` inside the repo. The folder was seeded once by copying `conf/` from the system install and creating empty `logs/`, `temp/`, `webapps/`, `work/`.

If you cloned this repo fresh and `tomcat-base/` is missing, recreate it:

```bash
mkdir -p tomcat-base
cp -r "/c/ProgramData/Tomcat9/conf" tomcat-base/
mkdir -p tomcat-base/{logs,temp,webapps,work}
```

Build and deploy:

```bash
cd jsp
JAVA_HOME="C:/Users/ruthv/.jdk/jdk-11.0.28" \
  "/c/ProgramData/chocolatey/lib/maven/apache-maven-3.9.15/bin/mvn.cmd" clean package

cp target/event-mgmt.war ../tomcat-base/webapps/
```

Start Tomcat in a new terminal (foreground — Ctrl+C to stop):

```bash
JAVA_HOME="C:/Users/ruthv/.jdk/jdk-11.0.28" \
CATALINA_HOME="C:/ProgramData/chocolatey/lib/tomcat/tools/apache-tomcat-9.0.117" \
CATALINA_BASE="$(pwd)/tomcat-base" \
  "$CATALINA_HOME/bin/catalina.bat" run
```

Or use the helper script `tomcat-base/start-tomcat.bat` (double-click in Explorer).

Sanity check: `curl http://localhost:8080/event-mgmt/ticket.jsp` → HTTP 400 with `Missing ticket id.` That's correct — it means the page is alive and responding to requests.

## 7. Run the demo

See [DEMO_SCRIPT.md](DEMO_SCRIPT.md).

---

## Troubleshooting

**Backend exits with "Razorpay keys missing":** check `.env` is in `backend/` (not the project root) and has both `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` set.

**Frontend shows "Failed to fetch" on every page:** backend isn't running on port 3001. Vite proxies `/api/*` to `http://localhost:3001` automatically.

**JSP page returns 404:** Tomcat hasn't unpacked the war yet, or you copied the war to the wrong place. The deployed path is `tomcat-base/webapps/event-mgmt.war` and the URL is `http://localhost:8080/event-mgmt/ticket.jsp` (path matches the war filename).

**JSP page returns 500 with `ClassNotFoundException com.eventmgmt.TicketDAO`:** the war wasn't built with the Java sources. Run `mvn clean package` again from `jsp/` and check `target/event-mgmt.war` is non-empty.

**Tomcat startup fails with "address already in use":** another process is on :8080. Find it with `netstat -ano | findstr :8080` then `taskkill /PID <pid> /F`. Or change Tomcat's port in `tomcat-base/conf/server.xml`.

**MongoDB connection refused (Java side):** the JSP module reads its own connection from `WEB-INF/web.xml` (`mongoUri` context-param). Default is `mongodb://localhost:27017`. If you change Mongo's port, edit web.xml and rebuild the war.

**Webcam scanner says "no camera":** browsers block camera access on non-HTTPS unless the host is `localhost`. Make sure you visit via `http://localhost:5173`, not `http://127.0.0.1:5173` or your LAN IP.
