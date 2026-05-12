"""aws_iot.py — AWS IoT Core MQTT subscriber
Subscribes to all ESP32 topics, stores data to DB, and broadcasts to WebSocket clients.
"""
import json
import asyncio
import logging
from datetime import datetime
from typing import Optional

from awscrt import mqtt
from awsiot import mqtt_connection_builder
from sqlmodel import Session

from app.config import settings
from app.database import engine
from app.models import SensorReading, VibrationBurst

logger = logging.getLogger("aws_iot")

# ---- Shared state ----
_mqtt_connection: Optional[object] = None
_mqtt_connected: bool = False

# Latest snapshot (in-memory, for /api/sensors/latest fast path)
latest_snapshot: Optional[dict] = None

# WebSocket broadcast callback (set by ws.py on startup)
_ws_broadcast_callback = None


def set_ws_broadcast_callback(fn):
    """Register a coroutine that broadcasts a message to all WebSocket clients."""
    global _ws_broadcast_callback
    _ws_broadcast_callback = fn


def is_connected() -> bool:
    return _mqtt_connected


# ============================================================
# MQTT MESSAGE HANDLER
# ============================================================
def _on_message_received(topic: str, payload: bytes, **kwargs):
    """Called by AWS IoT SDK on every incoming MQTT message."""
    global latest_snapshot

    try:
        data = json.loads(payload.decode("utf-8"))
    except json.JSONDecodeError:
        logger.warning(f"[MQTT] Non-JSON payload on {topic}")
        return

    topic_suffix = topic.split("/")[-1]  # sensors | vibration | audio | motor | status

    if topic_suffix == "sensors":
        _handle_sensors(data)
    elif topic_suffix == "vibration":
        _handle_vibration(data)
    elif topic_suffix == "status":
        logger.info(f"[MQTT] ESP32 heartbeat: uptime={data.get('uptime_s')}s "
                    f"heap={data.get('free_heap')} rssi={data.get('wifi_rssi')}dBm")


def _handle_sensors(data: dict):
    """Parse the full sensor payload and write to DB + WebSocket."""
    global latest_snapshot

    ts = datetime.utcnow()
    vib   = data.get("vibration", {})
    env   = data.get("environment", {})
    pwr   = data.get("power", {})
    aud   = data.get("audio", {})
    mot   = data.get("motor", {})

    row = SensorReading(
        timestamp     = ts,
        epoch_ms      = data.get("ts", 0),
        accel_x       = vib.get("x", 0.0),
        accel_y       = vib.get("y", 0.0),
        accel_z       = vib.get("z", 0.0),
        accel_rms     = vib.get("rms", 0.0),
        temperature   = env.get("temp_c"),
        humidity      = env.get("humidity_pct"),
        pressure      = env.get("pressure_hpa"),
        altitude      = env.get("altitude_m"),
        bmp_temp      = env.get("bmp_temp_c"),
        voltage       = pwr.get("voltage_v"),
        current_ma    = pwr.get("current_ma"),
        power_w       = pwr.get("power_w"),
        load_g        = data.get("load_g"),
        audio_rms     = aud.get("rms"),
        audio_peak    = aud.get("peak"),
        motor_pwm     = mot.get("pwm", 0),
        motor_forward = mot.get("forward", True),
        motor_duty_pct= mot.get("duty_pct", 0),
    )

    with Session(engine) as session:
        session.add(row)
        session.commit()
        session.refresh(row)

    latest_snapshot = {
        "id":           row.id,
        "timestamp":    ts.isoformat(),
        "epoch_ms":     row.epoch_ms,
        "vibration": {
            "x": row.accel_x, "y": row.accel_y,
            "z": row.accel_z, "rms": row.accel_rms
        },
        "environment": {
            "temp_c":       row.temperature,
            "humidity_pct": row.humidity,
            "pressure_hpa": row.pressure,
            "altitude_m":   row.altitude,
            "bmp_temp_c":   row.bmp_temp,
        },
        "power": {
            "voltage_v":  row.voltage,
            "current_ma": row.current_ma,
            "power_w":    row.power_w,
        },
        "load_g":  row.load_g,
        "audio": {
            "rms":  row.audio_rms,
            "peak": row.audio_peak,
        },
        "motor": {
            "pwm":      row.motor_pwm,
            "forward":  row.motor_forward,
            "duty_pct": row.motor_duty_pct,
        },
    }

    # Broadcast to WebSocket clients (fire-and-forget)
    if _ws_broadcast_callback:
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.ensure_future(_ws_broadcast_callback(latest_snapshot))
        except RuntimeError:
            pass  # No event loop in this thread — OK


def _handle_vibration(data: dict):
    """Store raw vibration burst."""
    samples = data.get("samples", [])
    if not samples:
        return

    burst = VibrationBurst(
        timestamp = datetime.utcnow(),
        epoch_ms  = data.get("ts", 0),
        samples   = json.dumps(samples),
    )
    with Session(engine) as session:
        session.add(burst)
        session.commit()


# ============================================================
# PUBLISH (motor commands → ESP32)
# ============================================================
def publish_motor_command(pwm: int, forward: bool):
    """Send motor control command to ESP32 via MQTT."""
    if not _mqtt_connection or not _mqtt_connected:
        raise RuntimeError("MQTT not connected")

    topic   = f"{settings.aws_topic_prefix}/cmd/motor"
    payload = json.dumps({"pwm": pwm, "forward": forward})

    future, _ = _mqtt_connection.publish(
        topic=topic,
        payload=payload,
        qos=mqtt.QoS.AT_LEAST_ONCE,
    )
    try:
        future.result(timeout=5)
    except Exception as e:
        msg = str(e) or repr(e)
        logger.error(f"[MQTT] Motor publish failed: {msg}")
        raise RuntimeError(msg)
    logger.info(f"[MQTT] Motor cmd sent: pwm={pwm} forward={forward}")


# ============================================================
# CONNECTION SETUP
# ============================================================
def connect():
    """Connect to AWS IoT Core and subscribe to all ESP32 topics."""
    global _mqtt_connection, _mqtt_connected

    logger.info(f"[MQTT] Connecting to {settings.aws_iot_endpoint}…")

    _mqtt_connection = mqtt_connection_builder.mtls_from_path(
        endpoint            = settings.aws_iot_endpoint,
        port                = settings.aws_iot_port,
        cert_filepath       = settings.aws_device_cert_path,
        pri_key_filepath    = settings.aws_device_key_path,
        ca_filepath         = settings.aws_root_ca_path,
        client_id           = f"{settings.aws_thing_name}-backend",
        clean_session       = False,
        keep_alive_secs     = 30,
    )

    connect_future = _mqtt_connection.connect()
    connect_future.result(timeout=15)
    _mqtt_connected = True
    logger.info("[MQTT] Connected to AWS IoT Core ✓")

    # Subscribe to all ESP32 topics
    subscribe_topic = f"{settings.aws_topic_prefix}/#"
    subscribe_future, _ = _mqtt_connection.subscribe(
        topic    = subscribe_topic,
        qos      = mqtt.QoS.AT_LEAST_ONCE,
        callback = _on_message_received,
    )
    subscribe_future.result(timeout=10)
    logger.info(f"[MQTT] Subscribed to {subscribe_topic} ✓")


def disconnect():
    """Gracefully disconnect from AWS IoT Core."""
    global _mqtt_connected
    if _mqtt_connection:
        disconnect_future = _mqtt_connection.disconnect()
        disconnect_future.result(timeout=5)
        _mqtt_connected = False
        logger.info("[MQTT] Disconnected from AWS IoT Core")
