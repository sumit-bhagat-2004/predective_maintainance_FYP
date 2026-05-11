# 🔧 IoT Predictive Maintenance System — FYP 2026

**Team of 5 | 14 Weeks | Phase 1: IoT Foundation**

Solar-powered IoT system for industrial equipment predictive maintenance using ESP32, AWS IoT Core, and machine learning.

---

## 📁 Project Structure

```
├── esp32_firmware/     ESP32 Arduino/PlatformIO firmware (all sensors → AWS IoT)
├── backend/            FastAPI backend (AWS IoT subscriber + REST + WebSocket API)
├── frontend/           Next.js 14 dashboard (live data + history + motor control)
├── Guide/              Project guides and specifications (gitignored from commits)
└── setup/              Setup docs — GITIGNORED (wiring, AWS, deployment)
```

---

## 🚀 Quick Start

### 1. ESP32 Firmware

```bash
cd esp32_firmware
# Install PlatformIO: pip install platformio
# Copy and fill secrets
cp include/secrets.h.example include/secrets.h
# Edit secrets.h with WiFi + AWS IoT credentials
pio run --target upload
pio device monitor    # Serial output @ 115200 baud
```

### 2. Backend

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Fill in AWS IoT endpoint + cert paths
uvicorn app.main:app --reload
# Swagger UI: http://localhost:8000/docs
```

### 3. Frontend

```bash
cd frontend
npm install
# Create .env.local with NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL
npm run dev
# Dashboard: http://localhost:3000
```

---

## 🔌 Sensors & GPIO

| Sensor   | Purpose                    | Interface | GPIO          |
|----------|----------------------------|-----------|---------------|
| ADXL345  | Vibration X/Y/Z (100 Hz)  | I2C       | 21(SDA), 22(SCL) |
| BMP280   | Pressure, altitude          | I2C       | 21, 22        |
| DHT22    | Temperature, humidity       | 1-wire    | 27            |
| INA219   | Voltage, current, power     | I2C       | 21, 22        |
| HX711    | Load weight (optional)      | Custom    | 32, 33        |
| INMP441  | Audio / acoustic anomaly    | I2S       | 26, 25, 35    |
| L298N    | Motor driver (775 DC)       | PWM+GPIO  | 14, 16, 17    |

---

## 📡 MQTT Topics (AWS IoT Core)

| Topic | Data | Rate |
|-------|------|------|
| `predictive-maintenance/esp32/sensors`   | All sensor JSON | 1 Hz  |
| `predictive-maintenance/esp32/vibration` | ADXL345 100-sample burst | 1 Hz  |
| `predictive-maintenance/esp32/status`    | Heartbeat, heap, RSSI | 30s |
| `predictive-maintenance/esp32/cmd/motor` | Motor control command | On demand |

---

## 🗂️ Setup Docs (Gitignored)

The `setup/` folder contains sensitive documentation and is **not committed**:
- `setup/WIRING.md` — Complete hardware wiring guide
- `setup/AWS_SETUP.md` — AWS IoT Core step-by-step setup
- `setup/BACKEND_DEPLOY.md` — FastAPI VM/Docker deployment
- `setup/FRONTEND_DEPLOY.md` — Next.js Vercel/VM deployment

---

## 📅 Phase 1 Milestones (Weeks 1-5)

- [x] Hardware BOM and component selection
- [x] ESP32 firmware (all sensors + AWS IoT MQTT + TLS)
- [x] FastAPI backend (MQTT subscriber + REST + WebSocket)
- [x] Next.js dashboard (live + history + motor control)
- [ ] Hardware assembly and wiring
- [ ] AWS IoT Core account setup
- [ ] First live data test
- [ ] 6-hour baseline data collection
