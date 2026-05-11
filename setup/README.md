# 📚 Setup Documentation Index

> **This entire folder is gitignored.**
> All files here contain setup instructions with private credentials and account details.

---

## 🗺️ Where to Start

Follow this order — each guide depends on the previous one:

```
1. WIRING.md              ← Hardware assembly (do this first, no internet needed)
      │
      ▼
2. AWS_SETUP.md           ← Create AWS account, IoT Thing, certificates
      │
      ▼
3. BACKEND_DEPLOY.md      ← Create EC2 server, SSH in, deploy FastAPI backend
      │
      ▼
4. FRONTEND_DEPLOY.md     ← Install Node.js, deploy Next.js dashboard on EC2
```

---

## 📁 Files in This Folder

| File | Purpose |
|------|---------|
| `WIRING.md` | Step-by-step sensor wiring for ESP32. Includes I2C scanner code to test connections. |
| `AWS_SETUP.md` | AWS account creation, IoT Core setup, certificate generation, policy creation. |
| `BACKEND_DEPLOY.md` | EC2 instance creation (with screenshots instructions), SSH setup, FastAPI deployment. |
| `FRONTEND_DEPLOY.md` | Node.js installation, Next.js build, PM2 setup, nginx config on EC2. |
| `predmaint.nginx` | **Actual nginx config file** — copy this to the EC2 server as described in BACKEND_DEPLOY.md. |
| `predmaint-backend.service` | **Actual systemd service file** — copy to EC2 as described in BACKEND_DEPLOY.md. |

---

## ⚡ Quick Reference: Key Values to Note Down

As you follow the guides, fill in these values and keep them safe:

```
EC2 Instance:
  Public IP:          ___________________________________
  Key file path:      ___________________________________

AWS IoT Core:
  Endpoint URL:       ___________________________________
  Thing Name:         ESP32-PredMaint
  Certificate ARN:    ___________________________________

Certificate Files (local path):
  Root CA:            ___________________________________
  Device Cert:        ___________________________________
  Private Key:        ___________________________________

URLs When Running:
  Backend API:        http://<EC2_IP>/docs
  Dashboard:          http://<EC2_IP>/
  Health Check:       http://<EC2_IP>/health
  WebSocket test:     ws://<EC2_IP>/ws/live
```

---

## 💡 Tips for Team Members

- Only **one person** needs to create the AWS account and IoT Thing
- Share the certificate files (via secure channel, NOT over WhatsApp/email as text)
- Each team member working on frontend can use `NEXT_PUBLIC_API_URL=http://EC2_IP`
- The `secrets.h` file for ESP32 must be shared separately (again, securely)
