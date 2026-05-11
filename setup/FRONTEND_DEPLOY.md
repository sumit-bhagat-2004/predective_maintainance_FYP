# 🌐 Frontend Deployment Guide — Next.js Dashboard

> **This file is gitignored.** Stored only locally.
>
> Complete guide to running the Next.js dashboard — locally for development,
> or on the same EC2 instance as the backend.

---

## 📋 What You'll End Up With

```
Your Laptop / EC2
    │
    ├── Next.js dev server  (port 3000, development)
    │     OR
    └── Next.js production  (port 3000, served by PM2)
               │
               └── nginx routes :80 → :3000
```

---

## PART 1: Local Development (Your Laptop)

### Step 1.1 — Install Node.js

Check if you have Node.js installed:
```cmd
node --version    # Should show v18.x.x or v20.x.x
npm --version     # Should show 9.x.x or 10.x.x
```

If not installed:
1. Go to: https://nodejs.org
2. Download **"LTS"** version (the one marked "Recommended For Most Users")
3. Run the installer — click Next → Next → Install
4. After install, close and reopen Command Prompt
5. Run `node --version` to confirm

### Step 1.2 — Install Dependencies

```cmd
cd d:\Projects\predective_maintainance_FYP\frontend
npm install
```

This downloads all packages listed in `package.json` into a `node_modules/` folder.
It takes 1-3 minutes. You'll see a progress bar.

### Step 1.3 — Create Your Environment File

```cmd
copy .env.local.example .env.local
```

Open `.env.local` in VS Code (or Notepad) and fill in:

```
# If the backend is running on your laptop:
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# If the backend is running on EC2:
NEXT_PUBLIC_API_URL=http://YOUR_EC2_IP:8000
NEXT_PUBLIC_WS_URL=ws://YOUR_EC2_IP:8000
```

> ⚠️ Replace `YOUR_EC2_IP` with your actual EC2 public IP (e.g., `13.235.47.211`)

### Step 1.4 — Start the Development Server

```cmd
npm run dev
```

You'll see:
```
   ▲ Next.js 14.2.15
   - Local:        http://localhost:3000
   - Network:      http://192.168.x.x:3000

 ✓ Ready in 2.1s
```

Open your browser: **http://localhost:3000**

You should see the dashboard! If the backend isn't running yet, the connection status will show "Disconnected" — that's normal.

> To stop: press **Ctrl+C** in the terminal

---

## PART 2: Deploy Frontend on EC2 (Same Server as Backend)

> Do this AFTER setting up the backend (see BACKEND_DEPLOY.md).
> SSH into your EC2 instance first.

### Step 2.1 — Install Node.js on EC2

```bash
# On your EC2 instance (SSH terminal)

# Download and run the NodeSource setup script for Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify
node --version     # Should show v20.x.x
npm --version      # Should show 10.x.x
```

### Step 2.2 — Navigate to Frontend Directory

```bash
cd /home/ubuntu/predective_maintainance_FYP/frontend
```

> The repo was already cloned when you set up the backend.
> If not: `cd /home/ubuntu && git clone https://github.com/YOUR_USERNAME/predective_maintainance_FYP.git`

### Step 2.3 — Install Dependencies

```bash
npm install
```

This downloads all packages. Takes 2-5 minutes on a t2.micro.

### Step 2.4 — Create the Environment File

```bash
# Copy the template
cp .env.local.example .env.local

# Edit it
nano .env.local
```

Fill in:
```
NEXT_PUBLIC_API_URL=http://YOUR_EC2_PUBLIC_IP
NEXT_PUBLIC_WS_URL=ws://YOUR_EC2_PUBLIC_IP
```

> Use the **public IP** of your EC2 instance.
> If nginx is running on port 80 (which it should be), do NOT add `:8000` to the URL.
> Nginx will forward requests from port 80 to the backend on port 8000.

Save: **Ctrl+X → Y → Enter**

### Step 2.5 — Build the Production Bundle

```bash
npm run build
```

This compiles the Next.js app for production. Takes 2-5 minutes.
You'll see something like:
```
Route (app)                  Size     First Load JS
┌ ○ /                        4.58 kB        112 kB
├ ○ /history                 3.12 kB        111 kB
└ ○ /motor                   2.89 kB        111 kB
✓ Compiled successfully
```

### Step 2.6 — Install PM2 (Process Manager)

PM2 keeps the Next.js server running even after you close SSH, and restarts it on reboot.

```bash
sudo npm install -g pm2
```

### Step 2.7 — Start the Frontend with PM2

```bash
# Navigate to frontend directory
cd /home/ubuntu/predective_maintainance_FYP/frontend

# Start Next.js
pm2 start npm --name "predmaint-frontend" -- start

# Save PM2 process list (survives reboot)
pm2 save

# Set PM2 to auto-start on reboot
pm2 startup
# This prints a command — COPY and RUN that command, for example:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### Step 2.8 — Verify PM2 is Running

```bash
pm2 status
```

You should see:
```
┌─────┬──────────────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name                 │ namespace   │ version │ mode    │ status   │
├─────┼──────────────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ predmaint-frontend   │ default     │ N/A     │ fork    │ online   │
└─────┴──────────────────────┴─────────────┴─────────┴─────────┴──────────┘
```

### Step 2.9 — Update Nginx to Serve Frontend on Port 80

Currently, nginx forwards port 80 → backend port 8000.
We need to change this so:
- `http://EC2_IP/` → Frontend (Next.js, port 3000)
- `http://EC2_IP/api/` → Backend (FastAPI, port 8000)
- `http://EC2_IP/ws/` → Backend WebSocket (FastAPI, port 8000)

Edit the nginx config:
```bash
sudo nano /etc/nginx/sites-available/predmaint
```

Replace the entire content with:
```nginx
server {
    listen 80;
    server_name _;

    # Frontend (Next.js on port 3000)
    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # Backend REST API
    location /api/ {
        proxy_pass         http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_read_timeout 60s;
    }

    # Swagger / health / root
    location ~ ^/(docs|redoc|health|openapi.json)$ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # WebSocket (backend)
    location /ws/ {
        proxy_pass         http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade    $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host       $host;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Save (Ctrl+X → Y → Enter), then apply:
```bash
sudo nginx -t          # test — must say "syntax is ok"
sudo systemctl reload nginx
```

### Step 2.10 — Update Frontend .env.local for Split Routing

Since nginx now routes `/api/` to the backend, update `.env.local`:
```bash
nano /home/ubuntu/predective_maintainance_FYP/frontend/.env.local
```

Change to:
```
NEXT_PUBLIC_API_URL=http://YOUR_EC2_PUBLIC_IP
NEXT_PUBLIC_WS_URL=ws://YOUR_EC2_PUBLIC_IP
```

Rebuild and restart:
```bash
cd /home/ubuntu/predective_maintainance_FYP/frontend
npm run build
pm2 restart predmaint-frontend
```

### Step 2.11 — Test Everything

Open in browser:
- `http://YOUR_EC2_IP/` → Dashboard (Next.js)
- `http://YOUR_EC2_IP/history` → History page
- `http://YOUR_EC2_IP/motor` → Motor control
- `http://YOUR_EC2_IP/health` → Backend health check (JSON)
- `http://YOUR_EC2_IP/docs` → Swagger API docs

---

## PART 3: Useful PM2 Commands

```bash
# See running processes
pm2 status

# See live logs (press Ctrl+C to stop)
pm2 logs predmaint-frontend --lines 50

# Restart after code changes
pm2 restart predmaint-frontend

# Stop
pm2 stop predmaint-frontend

# Delete from PM2
pm2 delete predmaint-frontend
```

---

## PART 4: Updating Frontend After Code Changes

When you push new frontend code to GitHub:

```bash
# SSH into EC2
ssh -i predmaint-key.pem ubuntu@YOUR_EC2_IP

# Pull latest code
cd /home/ubuntu/predective_maintainance_FYP
git pull origin main

# Go to frontend
cd frontend

# Install any new packages (if package.json changed)
npm install

# Rebuild
npm run build

# Restart PM2
pm2 restart predmaint-frontend
```

---

## 💡 Troubleshooting

| Problem | What to check |
|---------|---------------|
| Page shows "Could not connect" | Make sure backend is running: `sudo systemctl status predmaint-backend` |
| Dashboard shows "Disconnected" | Check WebSocket URL in .env.local — must be `ws://` not `http://` |
| `npm run build` fails | Check for TypeScript errors. Run `npm run lint` to see them |
| Port 3000 not reachable | Check EC2 Security Group has port 3000 open (or use nginx on port 80) |
| PM2 shows "errored" | Run `pm2 logs predmaint-frontend` to see the error message |
| After reboot, frontend not running | Run `pm2 startup` and execute the command it prints, then `pm2 save` |
| Charts not loading | Make sure `NEXT_PUBLIC_API_URL` is correct and backend is reachable |
