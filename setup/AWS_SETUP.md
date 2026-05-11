# 🔐 AWS IoT Core Setup Guide — Complete Beginner Guide

> **This file is gitignored.** It is stored only locally on your machine.
>
> This guide walks you through setting up AWS IoT Core from scratch —
> creating an account, setting up the IoT Thing, generating certificates,
> and connecting everything to your ESP32 firmware and backend.

---

## What is AWS IoT Core?

AWS IoT Core is a cloud service that acts as the message hub between your ESP32 and the backend server.

```
ESP32 → [Wi-Fi] → AWS IoT Core → [MQTT] → FastAPI Backend → Dashboard
```

The ESP32 connects using **MQTT over TLS** (encrypted, authenticated with certificates).
Your backend subscribes to the same MQTT topics to receive the data.

---

## PART 1: Create an AWS Account

### Step 1.1 — Sign Up

1. Go to: **https://aws.amazon.com**
2. Click **"Create an AWS Account"** (top right)
3. Enter your email address and account name (e.g., "PredMaint FYP")
4. Choose a password
5. Select **"Personal"** account type
6. Fill in your name, phone, address
7. Enter credit/debit card details
   > ⚠️ AWS will charge ₹2 for verification, which is refunded immediately.
   > The free tier is actually free for 12 months — IoT Core gives 250,000 messages free per month.
8. Select the **Basic Support Plan** (free)
9. Complete verification

### Step 1.2 — Sign In to AWS Console

1. Go to: **https://console.aws.amazon.com**
2. Sign in as **Root user** (use the email you registered with)

### Step 1.3 — Set Your Region

At the **very top right** of the AWS Console page, you'll see a region dropdown.
Click it and select: **"Asia Pacific (Mumbai)"** → this selects `ap-south-1`

> Why Mumbai? It's the closest AWS region to India, giving the ESP32 lower latency.

---

## PART 2: Create an IAM User (Recommended Best Practice)

> Instead of using the root account for everything, create a user with limited permissions.

### Step 2.1 — Go to IAM

1. In the search bar at the top, type **"IAM"** → click "IAM"
2. In the left sidebar, click **"Users"**
3. Click **"Create user"**

### Step 2.2 — Create the User

1. **User name:** `predmaint-user`
2. Check **"Provide user access to the AWS Management Console"** → Optional, skip for now
3. Click **Next**
4. Under "Set permissions": select **"Attach policies directly"**
5. Search for `AWSIoTFullAccess` → check the box
6. Click **Next** → **Create user**

### Step 2.3 — Create Access Keys (for AWS CLI)

1. Click on the user you just created (`predmaint-user`)
2. Click the **"Security credentials"** tab
3. Scroll down to "Access keys" → click **"Create access key"**
4. Select **"Command Line Interface (CLI)"** → check the confirmation box → Next
5. Description: `predmaint-cli-key`
6. Click **"Create access key"**
7. **DOWNLOAD THE CSV** — this is the only time you can see the secret key!
   - Or copy both "Access key ID" and "Secret access key" somewhere safe

---

## PART 3: Install and Configure AWS CLI

### Step 3.1 — Install AWS CLI

**Windows:**
1. Go to: https://aws.amazon.com/cli/
2. Click "Windows" → download the MSI installer
3. Run the installer → click Next → Next → Install

**Mac:**
```bash
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
```

**Ubuntu/Linux:**
```bash
sudo apt install -y awscli
```

Verify:
```cmd
aws --version
# Should show: aws-cli/2.x.x ...
```

### Step 3.2 — Configure AWS CLI

```cmd
aws configure
```

You'll be prompted for 4 things:
```
AWS Access Key ID [None]:     PASTE_YOUR_ACCESS_KEY_ID_HERE
AWS Secret Access Key [None]: PASTE_YOUR_SECRET_ACCESS_KEY_HERE
Default region name [None]:   ap-south-1
Default output format [None]: json
```

Test it works:
```cmd
aws sts get-caller-identity
```

You should see your account ID and user ARN. If you see an error, check your credentials.

---

## PART 4: Create the IoT Thing

### Step 4.1 — Create the Thing

Open Command Prompt/Terminal and run:

```cmd
aws iot create-thing --thing-name "ESP32-PredMaint"
```

Expected output:
```json
{
    "thingName": "ESP32-PredMaint",
    "thingArn": "arn:aws:iot:ap-south-1:123456789:thing/ESP32-PredMaint",
    "thingId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

> **Save the `thingArn`** value — you might need it later.

---

## PART 5: Create Certificates

Certificates are like a passport for your ESP32 — AWS only lets it connect if it has the right certificate.

### Step 5.1 — Create a Folder for Your Certificates

**Windows:**
```cmd
mkdir C:\Users\%USERNAME%\predmaint-certs
cd C:\Users\%USERNAME%\predmaint-certs
```

**Mac/Linux:**
```bash
mkdir -p ~/predmaint-certs
cd ~/predmaint-certs
```

### Step 5.2 — Generate the Certificate

```cmd
aws iot create-keys-and-certificate ^
    --set-as-active ^
    --certificate-pem-outfile "device-certificate.pem.crt" ^
    --public-key-outfile "public.pem.key" ^
    --private-key-outfile "private.pem.key" ^
    > cert_info.json
```

> **Windows note:** Use `^` for line continuation. On Mac/Linux use `\` instead.

This creates 3 files in your current directory:
- `device-certificate.pem.crt` — the device certificate (goes into ESP32 firmware + backend)
- `private.pem.key` — the private key (keep SECRET, never share)
- `public.pem.key` — the public key (rarely needed)

And `cert_info.json` contains the certificate ARN. Check it:

**Windows:**
```cmd
type cert_info.json
```
**Mac/Linux:**
```bash
cat cert_info.json
```

Find the `"certificateArn"` value. It looks like:
`arn:aws:iot:ap-south-1:123456789:cert/abcdef1234567890abcdef`

**Copy it — you need it in the next step.**

### Step 5.3 — Download Amazon Root CA Certificate

```cmd
curl -o AmazonRootCA1.pem https://www.amazontrust.com/repository/AmazonRootCA1.pem
```

Now you should have 3 files:
```
predmaint-certs/
├── AmazonRootCA1.pem           ← Amazon's root certificate
├── device-certificate.pem.crt  ← Your device certificate
└── private.pem.key              ← Your private key (SECRET)
```

---

## PART 6: Create and Attach an IoT Policy

A policy tells AWS what the ESP32 is allowed to do (connect, publish, subscribe).

### Step 6.1 — Create the Policy File

Create a file called `policy.json` in any text editor (Notepad is fine):

**Windows:** Open Notepad → paste the content → Save As `C:\Users\YourName\predmaint-certs\policy.json`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "iot:Connect",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iot:Publish",
        "iot:Receive"
      ],
      "Resource": "arn:aws:iot:ap-south-1:*:topic/predictive-maintenance/esp32/*"
    },
    {
      "Effect": "Allow",
      "Action": "iot:Subscribe",
      "Resource": "arn:aws:iot:ap-south-1:*:topicfilter/predictive-maintenance/esp32/*"
    }
  ]
}
```

### Step 6.2 — Create the Policy in AWS

```cmd
aws iot create-policy ^
    --policy-name "PredMaintPolicy" ^
    --policy-document file://C:\Users\YourName\predmaint-certs\policy.json
```

Expected output:
```json
{
    "policyName": "PredMaintPolicy",
    "policyArn": "arn:aws:iot:ap-south-1:...:policy/PredMaintPolicy",
    ...
}
```

### Step 6.3 — Attach Policy to Your Certificate

Replace `YOUR_CERT_ARN` with the ARN you saved from Step 5.2:

```cmd
aws iot attach-policy ^
    --policy-name "PredMaintPolicy" ^
    --target "YOUR_CERT_ARN"
```

### Step 6.4 — Attach Certificate to Your Thing

```cmd
aws iot attach-thing-principal ^
    --thing-name "ESP32-PredMaint" ^
    --principal "YOUR_CERT_ARN"
```

No output means success.

---

## PART 7: Get Your IoT Endpoint URL

This is the URL your ESP32 and backend will connect to:

```cmd
aws iot describe-endpoint --endpoint-type iot:Data-ATS
```

Output:
```json
{
    "endpointAddress": "xxxxxxxxxxxx-ats.iot.ap-south-1.amazonaws.com"
}
```

**Save this URL** — it goes into:
1. `esp32_firmware/include/secrets.h` (for the ESP32)
2. `backend/.env` (for the FastAPI backend)

---

## PART 8: Configure ESP32 Firmware

### Step 8.1 — Create secrets.h

In VS Code/your editor, open the project and find:
```
esp32_firmware/include/secrets.h.example
```

**Copy** this file and rename the copy to `secrets.h` in the same folder.

> In Windows Explorer: right-click `secrets.h.example` → Copy → Paste → rename to `secrets.h`
> In VS Code: right-click the file in the Explorer sidebar → Copy → Paste → rename

### Step 8.2 — Fill in secrets.h

Open `secrets.h` and fill in:

```cpp
#define WIFI_SSID     "YourActualWiFiNetworkName"
#define WIFI_PASSWORD "YourActualWiFiPassword"
#define AWS_IOT_ENDPOINT "xxxxxxxxxxxx-ats.iot.ap-south-1.amazonaws.com"
#define AWS_THING_NAME   "ESP32-PredMaint"
```

For the certificates, open each file in Notepad and paste the entire contents:

**For `AWS_ROOT_CA`:** open `AmazonRootCA1.pem` in Notepad → Select All (Ctrl+A) → Copy:
```cpp
static const char AWS_ROOT_CA[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF
... (rest of certificate)
-----END CERTIFICATE-----
)EOF";
```

**For `DEVICE_CERT`:** open `device-certificate.pem.crt` in Notepad → paste similarly.

**For `DEVICE_PRIVATE_KEY`:** open `private.pem.key` in Notepad → paste similarly.

---

## PART 9: Configure the Backend

### Step 9.1 — Create .env File

```cmd
cd d:\Projects\predective_maintainance_FYP\backend
copy .env.example .env
```

Open `.env` and fill in:

```
AWS_IOT_ENDPOINT=xxxxxxxxxxxx-ats.iot.ap-south-1.amazonaws.com
AWS_IOT_PORT=8883
AWS_THING_NAME=ESP32-PredMaint
AWS_TOPIC_PREFIX=predictive-maintenance/esp32
AWS_ROOT_CA_PATH=C:\Users\YourName\predmaint-certs\AmazonRootCA1.pem
AWS_DEVICE_CERT_PATH=C:\Users\YourName\predmaint-certs\device-certificate.pem.crt
AWS_DEVICE_KEY_PATH=C:\Users\YourName\predmaint-certs\private.pem.key
DATABASE_URL=sqlite:///./data/sensor_data.db
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=http://localhost:3000
```

> **Windows paths:** Use forward slashes `/` OR double backslashes `\\` in the cert paths.
> Example: `C:/Users/YourName/predmaint-certs/AmazonRootCA1.pem`

---

## PART 10: Test in AWS Console

### Step 10.1 — Use MQTT Test Client

1. Go to AWS Console → Search "IoT Core" → Click **"IoT Core"**
2. In left sidebar, click **"Test"** → **"MQTT test client"**
3. Under "Subscribe to a topic":
   - Topic filter: `predictive-maintenance/esp32/#`
   - Click **"Subscribe"**
4. Flash the ESP32 with the firmware (see esp32_firmware/ folder)
5. Within 30 seconds, you should see messages appearing:

```json
{
  "ts": 1715609612000,
  "vibration": {
    "x": 0.012,
    "y": -0.003,
    "z": 9.811,
    "rms": 9.811
  },
  "environment": {
    "temp_c": 29.5,
    "humidity_pct": 62.0,
    "pressure_hpa": 1013.1,
    "altitude_m": -0.5
  },
  "power": {
    "voltage_v": 11.98,
    "current_ma": 1245.0,
    "power_w": 14.93
  },
  "load_g": 0.0,
  "audio": {
    "rms": 820.0,
    "peak": 12456.0
  },
  "motor": {
    "pwm": 0,
    "forward": true,
    "duty_pct": 0
  }
}
```

---

## PART 11: Cost & Free Tier

| Service | Free Tier | Notes |
|---------|-----------|-------|
| IoT Core | 250,000 messages/month | 1 msg/sec × 3600s × 24h × 30 days = 2.6M/month → **exceeds free tier** |
| IoT Core | | To stay free: publish every 10 seconds → 259,200/month ✓ |
| EC2 t2.micro | 750 hours/month for 12 months | Running 24/7 = 744h/month — fits! |
| EBS Storage | 30 GB/month | Our 20 GB volume is free |
| Data Transfer | 15 GB outbound/month | Our traffic is minimal |

**Total estimated cost: ₹0/month for the first year** (if publishing at 0.1 Hz or less).

To reduce publish rate: in `esp32_firmware/include/config.h`:
```cpp
#define SENSOR_READ_INTERVAL_MS  10000   // 10 seconds instead of 1 second
```

---

## 💡 Common Problems

| Problem | Fix |
|---------|-----|
| `Connection refused` on MQTT | Check endpoint URL is correct and has no trailing spaces |
| `TLS handshake failed` | Certificate content has been corrupted — repaste from file |
| `Not authorized` on MQTT | Policy not attached to certificate — redo Step 6.3 and 6.4 |
| ESP32 keeps disconnecting | Check Wi-Fi signal strength; move ESP32 closer to router |
| `aws: command not found` | AWS CLI not installed or not in PATH |
| `invalid client token` | AWS_THING_NAME in secrets.h must match what you created |
