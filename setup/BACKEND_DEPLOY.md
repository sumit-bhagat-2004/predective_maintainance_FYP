# 🖥️ AWS EC2 + Backend Deployment — Complete Beginner Guide

> **This file is gitignored.** It is stored only locally on your machine.
>
> This guide walks you through **every single step** from zero — creating an AWS EC2 server,
> connecting to it, installing everything, and running the FastAPI backend.
> No prior Linux or cloud experience required.

---

## 📋 What You'll End Up With

```
Your Laptop                 AWS Cloud
    │                           │
    │  ←── SSH (port 22) ──→   │  EC2 Instance (Ubuntu)
    │                           │   ├── FastAPI backend  :8000
    │                           │   ├── nginx (port 80)
    │                           │   └── SQLite database
    │                           │
ESP32 ──WiFi──→ AWS IoT Core ──→ (ESP32 publishes, backend subscribes)
```

---

## PART 1: Create an AWS EC2 Instance

### Step 1.1 — Log in to AWS Console

1. Open your browser and go to: **https://aws.amazon.com**
2. Click **"Sign In to the Console"** (top right)
3. Sign in with your AWS account
   - If you don't have one: click **"Create a new AWS account"**
   - Use your email → choose **"Personal"** account type → enter payment card (won't be charged for free tier)

### Step 1.2 — Set Your Region

At the **top-right** of the AWS Console, you'll see a region selector (e.g., "N. Virginia").
- Click it → Select **"Asia Pacific (Mumbai) ap-south-1"**
- This is the closest region to India — lowest latency

### Step 1.3 — Go to EC2 Dashboard

1. Click the **search bar** at the top → type `EC2` → click **"EC2"**
2. You're now on the EC2 Dashboard
3. Click the orange **"Launch Instance"** button

### Step 1.4 — Configure the Instance

You'll see a "Launch an instance" form. Fill it in:

**Name:** `predmaint-server`

**Application and OS Images (AMI):**
- Click **"Ubuntu"** (the orange Ubuntu logo)
- Under the dropdown, select: **Ubuntu Server 22.04 LTS (HVM), SSD Volume Type**
- Architecture: **64-bit (x86)**

**Instance Type:**
- Select **t2.micro** ← This is FREE TIER eligible (shown with "Free tier eligible" badge)
- It gives you: 1 vCPU, 1 GB RAM — enough for our backend

**Key Pair (login):**
> A key pair is like a password, but in the form of a file. You need it to SSH into the server.

1. Click **"Create new key pair"**
2. Key pair name: `predmaint-key`
3. Key pair type: **RSA**
4. Private key file format:
   - If you're on **Windows**: select **.ppk** (for PuTTY) — actually, select **.pem** since Windows 10+ has SSH built-in
   - If you're on **Mac/Linux**: select **.pem**
   - **Recommendation: Always choose `.pem`** — works with modern Windows, Mac, and Linux
5. Click **"Create key pair"** — your browser will download `predmaint-key.pem`
6. **SAVE THIS FILE SOMEWHERE SAFE** — you cannot download it again
   - Suggested location: `C:\Users\YourName\predmaint-key.pem` (Windows)

**Network Settings:**
Click **"Edit"** on Network Settings. You'll see:

- VPC: leave as default
- Subnet: leave as default
- Auto-assign public IP: **Enable**
- Firewall (Security groups): **Create security group**
  - Security group name: `predmaint-sg`
  - Description: `Security group for predictive maintenance server`

Under "Inbound security group rules", you need to add rules.
By default, only SSH (port 22) is there. **Add these additional rules:**

| Type       | Protocol | Port  | Source    | Description               |
|------------|----------|-------|-----------|---------------------------|
| SSH        | TCP      | 22    | 0.0.0.0/0 | (already there)           |
| Custom TCP | TCP      | 8000  | 0.0.0.0/0 | FastAPI backend            |
| HTTP       | TCP      | 80    | 0.0.0.0/0 | Nginx reverse proxy        |
| HTTPS      | TCP      | 443   | 0.0.0.0/0 | SSL (if you add a domain)  |

To add a rule: click **"Add security group rule"** and fill in the Type, Port, Source.
For Source, type `0.0.0.0/0` to allow from anywhere.

**Configure Storage:**
- Size: **20 GiB** (increase from default 8 GiB — gives room for logs and SQLite data)
- Volume type: **gp3** (or gp2 — both are fine)
- Leave everything else as default

**Review and Launch:**
- Click **"Launch instance"** (orange button, bottom right)
- You'll see "Successfully initiated launch" — click **"View all instances"**

### Step 1.5 — Wait for Instance to Start

- You'll see your instance in the list with "Pending" state (yellow dot)
- Wait about 1-2 minutes until it shows **"Running"** (green dot)
- Note down the **"Public IPv4 address"** shown in the instance details
  - Example: `13.235.47.211` — you'll need this throughout this guide

---

## PART 2: Connect to the EC2 Instance via SSH

> SSH lets you type commands on the remote server from your laptop.

### Step 2.1 — On Windows (Windows 10/11)

Windows 10/11 has SSH built in. Open **Command Prompt** or **PowerShell** (press Win+R → type `cmd`).

First, fix the permissions on your key file:
```cmd
icacls C:\Users\YourName\predmaint-key.pem /inheritance:r /grant:r "%USERNAME%:R"
```

> If you get an error like "permissions are too open", run the above command first.

Now SSH in:
```cmd
ssh -i C:\Users\YourName\predmaint-key.pem ubuntu@YOUR_EC2_IP
```

Replace:
- `C:\Users\YourName\predmaint-key.pem` → actual path to your key file
- `YOUR_EC2_IP` → your EC2 public IP (e.g., `13.235.47.211`)

You'll see:
```
The authenticity of host '13.235.47.211' can't be established.
ECDSA key fingerprint is SHA256:xxxx...
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```
Type `yes` and press Enter.

You should now see:
```
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-1040-aws x86_64)
ubuntu@ip-172-31-xx-xx:~$
```
🎉 You are now connected to your EC2 server!

### Step 2.2 — On Mac/Linux

```bash
# Fix permissions (required for SSH key)
chmod 400 ~/predmaint-key.pem

# Connect
ssh -i ~/predmaint-key.pem ubuntu@YOUR_EC2_IP
```

### Step 2.3 — Staying Connected

If your SSH disconnects after inactivity, add this to keep it alive.
On your **local machine** (not the server), edit/create `~/.ssh/config`:
```
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

---

## PART 3: Set Up the Server (Run on EC2)

> All commands below are typed into the SSH terminal (the EC2 server).

### Step 3.1 — Update the System

```bash
sudo apt update && sudo apt upgrade -y
```

This takes 1-3 minutes. Wait for it to finish.

### Step 3.2 — Install Required Software

```bash
sudo apt install -y python3.11 python3.11-venv python3-pip nginx git curl htop
```

Verify Python:
```bash
python3.11 --version
# Should show: Python 3.11.x
```

### Step 3.3 — Upload Your AWS Certificates to the Server

> You need to do this from your **local machine** (Windows CMD/PowerShell), not the SSH terminal.

Open a **new** Command Prompt window (keep the SSH window open in another window).

```cmd
:: Create certs directory on EC2 first (run this in your SSH window)
mkdir -p /home/ubuntu/certs/predmaint

:: Then in your LOCAL CMD window, upload the cert files:
scp -i C:\Users\YourName\predmaint-key.pem ^
    C:\Users\YourName\certs\AmazonRootCA1.pem ^
    ubuntu@YOUR_EC2_IP:/home/ubuntu/certs/predmaint/

scp -i C:\Users\YourName\predmaint-key.pem ^
    C:\Users\YourName\certs\device-certificate.pem.crt ^
    ubuntu@YOUR_EC2_IP:/home/ubuntu/certs/predmaint/

scp -i C:\Users\YourName\predmaint-key.pem ^
    C:\Users\YourName\certs\private.pem.key ^
    ubuntu@YOUR_EC2_IP:/home/ubuntu/certs/predmaint/
```

On Mac/Linux:
```bash
scp -i ~/predmaint-key.pem ~/certs/AmazonRootCA1.pem ubuntu@YOUR_EC2_IP:/home/ubuntu/certs/predmaint/
scp -i ~/predmaint-key.pem ~/certs/device-certificate.pem.crt ubuntu@YOUR_EC2_IP:/home/ubuntu/certs/predmaint/
scp -i ~/predmaint-key.pem ~/certs/private.pem.key ubuntu@YOUR_EC2_IP:/home/ubuntu/certs/predmaint/
```

Verify (back in SSH window):
```bash
ls /home/ubuntu/certs/predmaint/
# Should show: AmazonRootCA1.pem  device-certificate.pem.crt  private.pem.key
```

### Step 3.4 — Clone the Repository

```bash
cd /home/ubuntu

# Clone your GitHub repo (change YOUR_USERNAME)
git clone https://github.com/YOUR_USERNAME/predective_maintainance_FYP.git

# Enter the backend directory
cd predective_maintainance_FYP/backend

# Verify files are there
ls
# Should show: app/  requirements.txt  Dockerfile  docker-compose.yml  .env.example
```

> If your repo is private, you'll need a GitHub Personal Access Token.
> Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
> Then use: `git clone https://YOUR_TOKEN@github.com/YOUR_USERNAME/predective_maintainance_FYP.git`

### Step 3.5 — Create Python Virtual Environment

```bash
# Make sure you're in the backend directory
cd /home/ubuntu/predective_maintainance_FYP/backend

# Create virtual environment
python3.11 -m venv .venv

# Activate it
source .venv/bin/activate

# Your prompt will change to show (.venv)
# (.venv) ubuntu@ip-xxx:~/predective_maintainance_FYP/backend$

# Install all Python packages
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn

# Verify FastAPI installed
python -c "import fastapi; print(fastapi.__version__)"
```

### Step 3.6 — Configure the .env File

```bash
# Copy the example file
cp .env.example .env

# Open it in the nano text editor
nano .env
```

You'll see the file contents. Edit each line:
- Use arrow keys to move around
- Backspace to delete
- Type your values

Fill in exactly like this (replace the example values):

```
AWS_IOT_ENDPOINT=xxxxxxxxxxxx-ats.iot.ap-south-1.amazonaws.com
AWS_IOT_PORT=8883
AWS_THING_NAME=ESP32-PredMaint
AWS_TOPIC_PREFIX=predictive-maintenance/esp32
AWS_ROOT_CA_PATH=/home/ubuntu/certs/predmaint/AmazonRootCA1.pem
AWS_DEVICE_CERT_PATH=/home/ubuntu/certs/predmaint/device-certificate.pem.crt
AWS_DEVICE_KEY_PATH=/home/ubuntu/certs/predmaint/private.pem.key
DATABASE_URL=sqlite:///./data/sensor_data.db
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=http://YOUR_EC2_IP:3000,http://YOUR_EC2_IP,http://localhost:3000
```

Save in nano:
- Press **Ctrl + X**
- Press **Y** (yes, save)
- Press **Enter** (keep the filename)

### Step 3.7 — Create Data Directory

```bash
mkdir -p /home/ubuntu/predective_maintainance_FYP/backend/data
```

### Step 3.8 — Test Run (Make Sure It Works)

```bash
# Make sure venv is active (you should see (.venv) in prompt)
# If not: source .venv/bin/activate

cd /home/ubuntu/predective_maintainance_FYP/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Open your browser and go to: `http://YOUR_EC2_IP:8000/health`

You should see:
```json
{"status": "ok", "timestamp": "...", "db_row_count": 0, "mqtt_connected": true}
```

> If `mqtt_connected` is false, check your .env cert paths and AWS endpoint.
> Also test: `http://YOUR_EC2_IP:8000/docs` — you should see the Swagger API docs.

Press **Ctrl+C** to stop the test server.

---

## PART 4: Set Up Auto-Start with Systemd

> Systemd makes the backend start automatically when the server reboots.

### Step 4.1 — Create Log Directory

```bash
sudo mkdir -p /var/log/predmaint
sudo chown ubuntu:ubuntu /var/log/predmaint
```

### Step 4.2 — Install the Service File

The service file is already in the `setup/` folder of your repo.
Upload it to the EC2 instance from your **local machine**:

```cmd
:: From your LOCAL machine:
scp -i C:\Users\YourName\predmaint-key.pem ^
    C:\path\to\predective_maintainance_FYP\setup\predmaint-backend.service ^
    ubuntu@YOUR_EC2_IP:/home/ubuntu/
```

On the **EC2 server** (SSH window):
```bash
sudo cp /home/ubuntu/predmaint-backend.service /etc/systemd/system/predmaint-backend.service

# Reload systemd so it sees the new service
sudo systemctl daemon-reload

# Enable it (auto-start on reboot)
sudo systemctl enable predmaint-backend

# Start it now
sudo systemctl start predmaint-backend

# Check status
sudo systemctl status predmaint-backend
```

You should see something like:
```
● predmaint-backend.service - Predictive Maintenance FastAPI Backend
     Loaded: loaded (/etc/systemd/system/predmaint-backend.service; enabled)
     Active: active (running) since ...
```

### Useful Commands

```bash
# Check if service is running
sudo systemctl status predmaint-backend

# See live logs
sudo journalctl -u predmaint-backend -f

# Restart after code changes
sudo systemctl restart predmaint-backend

# Stop the service
sudo systemctl stop predmaint-backend
```

---

## PART 5: Set Up Nginx (Port 80 Proxy)

> By default, the backend runs on port 8000. Nginx lets you access it on port 80 (standard HTTP).

### Step 5.1 — Install the Nginx Config

Upload the nginx config from your local machine:

```cmd
:: From LOCAL machine:
scp -i C:\Users\YourName\predmaint-key.pem ^
    C:\path\to\predective_maintainance_FYP\setup\predmaint.nginx ^
    ubuntu@YOUR_EC2_IP:/home/ubuntu/
```

On the **EC2 server**:
```bash
# Copy to nginx sites directory
sudo cp /home/ubuntu/predmaint.nginx /etc/nginx/sites-available/predmaint

# Enable the site (create a symlink)
sudo ln -s /etc/nginx/sites-available/predmaint /etc/nginx/sites-enabled/predmaint

# Remove the default nginx site (optional, avoids conflicts)
sudo rm -f /etc/nginx/sites-enabled/default

# Test the config — must show "syntax is ok"
sudo nginx -t

# Reload nginx to apply
sudo systemctl reload nginx
```

### Step 5.2 — Test Nginx

Open your browser:
- `http://YOUR_EC2_IP/health` → Should show health JSON
- `http://YOUR_EC2_IP/docs`   → Should show Swagger UI

---

## PART 6: Update Code on the Server

When you push changes to GitHub, update the server:

```bash
# SSH into your EC2
ssh -i predmaint-key.pem ubuntu@YOUR_EC2_IP

cd /home/ubuntu/predective_maintainance_FYP

# Pull latest changes
git pull origin main

# Activate venv and update dependencies (if requirements.txt changed)
cd backend
source .venv/bin/activate
pip install -r requirements.txt

# Restart the service
sudo systemctl restart predmaint-backend
sudo systemctl status predmaint-backend
```

---

## PART 7: Verify Everything

```bash
# 1. Service is running
sudo systemctl status predmaint-backend    # should say "active (running)"

# 2. Health endpoint
curl http://localhost:8000/health           # should return JSON

# 3. Nginx is running
sudo systemctl status nginx                 # should say "active (running)"

# 4. Open from browser on your laptop
# http://YOUR_EC2_IP/health
# http://YOUR_EC2_IP/docs
```

---

## 💡 Common Problems & Fixes

| Problem | Fix |
|---------|-----|
| `Permission denied (publickey)` on SSH | Check the path to your .pem file, and that permissions are set (icacls / chmod 400) |
| `Connection refused` on port 8000 | Check Security Group has port 8000 open. Check service is running. |
| `mqtt_connected: false` | Check cert file paths in .env match actual paths. Check AWS endpoint URL. |
| `No module named 'app'` | Make sure you're in the `backend/` directory before running uvicorn |
| Service won't start | Run `sudo journalctl -u predmaint-backend -n 50` to see error logs |
| Wrong Python version | Use `python3.11` explicitly in venv creation |
| Database error | Run `mkdir -p /home/ubuntu/predective_maintainance_FYP/backend/data` |
