"""routes/sensors.py — REST API endpoints for sensor data"""
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func

from app.database import get_session
from app.models import (
    SensorReading, SensorReadingOut,
    VibrationBurst, MotorCommandIn,
)
import app.aws_iot as iot

router = APIRouter(prefix="/api", tags=["sensors"])


# ============================================================
# SENSORS
# ============================================================
@router.get("/sensors/latest", response_model=Optional[dict])
def get_latest():
    """Returns the most recent sensor snapshot (from in-memory cache)."""
    if iot.latest_snapshot is None:
        raise HTTPException(status_code=503, detail="No data received yet from ESP32")
    return iot.latest_snapshot


@router.get("/sensors/history", response_model=List[SensorReadingOut])
def get_history(
    hours:  float    = Query(default=1.0, ge=0.1, le=168.0,
                             description="How many hours of history to return"),
    limit:  int      = Query(default=500, ge=1, le=5000),
    offset: int      = Query(default=0,   ge=0),
    session: Session = Depends(get_session),
):
    """Returns sensor readings for the last N hours (max 7 days)."""
    since = datetime.utcnow() - timedelta(hours=hours)
    stmt = (
        select(SensorReading)
        .where(SensorReading.timestamp >= since)
        .order_by(SensorReading.timestamp.desc())
        .offset(offset)
        .limit(limit)
    )
    rows = session.exec(stmt).all()
    return rows


@router.get("/sensors/stats")
def get_stats(
    hours: float = Query(default=1.0, ge=0.1, le=168.0),
    session: Session = Depends(get_session),
):
    """Returns aggregate statistics for the selected window."""
    since = datetime.utcnow() - timedelta(hours=hours)
    stmt  = (
        select(
            func.count(SensorReading.id).label("count"),
            func.avg(SensorReading.temperature).label("avg_temp"),
            func.max(SensorReading.temperature).label("max_temp"),
            func.avg(SensorReading.accel_rms).label("avg_rms"),
            func.max(SensorReading.accel_rms).label("max_rms"),
            func.avg(SensorReading.current_ma).label("avg_current"),
            func.max(SensorReading.current_ma).label("max_current"),
            func.avg(SensorReading.voltage).label("avg_voltage"),
            func.avg(SensorReading.audio_rms).label("avg_audio_rms"),
        )
        .where(SensorReading.timestamp >= since)
    )
    result = session.exec(stmt).one()
    return {
        "window_hours": hours,
        "sample_count": result.count,
        "temperature": {
            "avg_c": round(result.avg_temp or 0, 2),
            "max_c": round(result.max_temp or 0, 2),
        },
        "vibration": {
            "avg_rms": round(result.avg_rms or 0, 4),
            "max_rms": round(result.max_rms or 0, 4),
        },
        "power": {
            "avg_current_ma": round(result.avg_current or 0, 2),
            "max_current_ma": round(result.max_current or 0, 2),
            "avg_voltage_v":  round(result.avg_voltage or 0, 3),
        },
        "audio": {
            "avg_rms": round(result.avg_audio_rms or 0, 2),
        },
    }


@router.get("/sensors/vibration")
def get_vibration_bursts(
    limit:   int      = Query(default=10, ge=1, le=100),
    session: Session  = Depends(get_session),
):
    """Returns the most recent raw vibration bursts (ADXL345 100-sample arrays)."""
    import json
    stmt = (
        select(VibrationBurst)
        .order_by(VibrationBurst.timestamp.desc())
        .limit(limit)
    )
    rows = session.exec(stmt).all()
    return [
        {
            "id":        r.id,
            "timestamp": r.timestamp.isoformat(),
            "epoch_ms":  r.epoch_ms,
            "samples":   json.loads(r.samples),
        }
        for r in rows
    ]


# ============================================================
# MOTOR CONTROL
# ============================================================
@router.get("/motor/state")
def get_motor_state():
    """Returns the current motor state from the latest snapshot."""
    snap = iot.latest_snapshot
    if snap is None:
        raise HTTPException(status_code=503, detail="No data from ESP32 yet")
    return snap.get("motor", {})


@router.post("/motor/control")
def control_motor(cmd: MotorCommandIn):
    """Send a motor speed/direction command to the ESP32 via AWS IoT MQTT."""
    if not iot.is_connected():
        raise HTTPException(status_code=503, detail="MQTT not connected to AWS IoT")
    try:
        iot.publish_motor_command(cmd.pwm, cmd.forward)
    except Exception as e:
        detail = str(e) or repr(e)
        raise HTTPException(status_code=500, detail=detail)
    return {
        "status":  "sent",
        "pwm":     cmd.pwm,
        "forward": cmd.forward,
        "duty_pct": int((cmd.pwm / 255.0) * 100),
    }
