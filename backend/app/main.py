"""main.py — FastAPI application entrypoint"""
import logging
import threading
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import create_db_and_tables, engine
from app.routes.sensors import router as sensor_router
from app.routes.ws import router as ws_router, setup_ws_broadcast
import app.aws_iot as iot
from sqlmodel import Session, select, func
from app.models import SensorReading

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("main")


# ============================================================
# LIFESPAN (startup + shutdown)
# ============================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP ---
    logger.info("Starting up IoT Predictive Maintenance Backend…")

    # 1. Create DB tables
    create_db_and_tables()
    logger.info("Database ready ✓")

    # 2. Register WebSocket broadcast with MQTT layer
    setup_ws_broadcast()

    # 3. Connect to AWS IoT in a background thread
    #    (AWS SDK is synchronous, so we run it off the event loop)
    def mqtt_thread():
        try:
            iot.connect()
        except Exception as e:
            logger.error(f"[MQTT] Connection failed: {e}")

    t = threading.Thread(target=mqtt_thread, daemon=True, name="MQTT-Thread")
    t.start()

    yield

    # --- SHUTDOWN ---
    logger.info("Shutting down…")
    iot.disconnect()


# ============================================================
# APP
# ============================================================
app = FastAPI(
    title       = "IoT Predictive Maintenance API",
    description = "Backend for ESP32 sensor data from AWS IoT Core. "
                  "Provides REST endpoints and WebSocket live feed.",
    version     = "1.0.0",
    lifespan    = lifespan,
    docs_url    = "/docs",
    redoc_url   = "/redoc",
)

# CORS — allow the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins     = settings.cors_origins_list,
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# Routers
app.include_router(sensor_router)
app.include_router(ws_router)


# ============================================================
# HEALTH CHECK
# ============================================================
@app.get("/health", tags=["health"])
def health():
    with Session(engine) as session:
        count = session.exec(select(func.count(SensorReading.id))).one()
    return {
        "status":         "ok",
        "timestamp":      datetime.utcnow().isoformat(),
        "db_row_count":   count,
        "mqtt_connected": iot.is_connected(),
    }


@app.get("/", tags=["root"])
def root():
    return {
        "project": "IoT Predictive Maintenance",
        "docs":    "/docs",
        "health":  "/health",
        "ws":      "ws://<host>/ws/live",
    }
