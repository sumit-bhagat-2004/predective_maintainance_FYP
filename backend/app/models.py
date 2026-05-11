"""models.py — Pydantic + SQLModel data models"""
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
import time


# ============================================================
# DATABASE MODEL
# ============================================================
class SensorReading(SQLModel, table=True):
    """Persisted sensor reading — one row per second from the ESP32."""
    __tablename__ = "sensor_readings"

    id: Optional[int] = Field(default=None, primary_key=True)
    # Timestamp
    timestamp:     datetime = Field(default_factory=datetime.utcnow, index=True)
    epoch_ms:      int      = Field(default=0, index=True)   # Unix ms from ESP32 NTP

    # Vibration (ADXL345)
    accel_x:       float = Field(default=0.0)
    accel_y:       float = Field(default=0.0)
    accel_z:       float = Field(default=0.0)
    accel_rms:     float = Field(default=0.0)

    # Environment (DHT22)
    temperature:   Optional[float] = Field(default=None)    # °C
    humidity:      Optional[float] = Field(default=None)    # %RH

    # Atmosphere (BMP280)
    pressure:      Optional[float] = Field(default=None)    # hPa
    altitude:      Optional[float] = Field(default=None)    # m
    bmp_temp:      Optional[float] = Field(default=None)    # °C

    # Power (INA219)
    voltage:       Optional[float] = Field(default=None)    # V
    current_ma:    Optional[float] = Field(default=None)    # mA
    power_w:       Optional[float] = Field(default=None)    # W

    # Load (HX711)
    load_g:        Optional[float] = Field(default=None)    # grams

    # Audio (INMP441)
    audio_rms:     Optional[float] = Field(default=None)
    audio_peak:    Optional[float] = Field(default=None)

    # Motor (L298N via ESP32)
    motor_pwm:     int  = Field(default=0)
    motor_forward: bool = Field(default=True)
    motor_duty_pct:int  = Field(default=0)


# ============================================================
# VIBRATION BURST MODEL (stored in separate table)
# ============================================================
class VibrationBurst(SQLModel, table=True):
    """Raw 100-sample vibration burst from ADXL345."""
    __tablename__ = "vibration_bursts"

    id:        Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime      = Field(default_factory=datetime.utcnow, index=True)
    epoch_ms:  int           = Field(default=0)
    samples:   str           = Field(default="[]")  # JSON array of {x,y,z} samples


# ============================================================
# RESPONSE SCHEMAS (Pydantic only — no table=True)
# ============================================================
class SensorReadingOut(SQLModel):
    id:           int
    timestamp:    datetime
    epoch_ms:     int
    accel_x:      float
    accel_y:      float
    accel_z:      float
    accel_rms:    float
    temperature:  Optional[float]
    humidity:     Optional[float]
    pressure:     Optional[float]
    altitude:     Optional[float]
    bmp_temp:     Optional[float]
    voltage:      Optional[float]
    current_ma:   Optional[float]
    power_w:      Optional[float]
    load_g:       Optional[float]
    audio_rms:    Optional[float]
    audio_peak:   Optional[float]
    motor_pwm:    int
    motor_forward:bool
    motor_duty_pct:int


class MotorCommandIn(SQLModel):
    """Incoming motor command from the dashboard."""
    pwm:     int  = Field(ge=0, le=255)
    forward: bool = True


class HealthResponse(SQLModel):
    status:        str
    timestamp:     str
    db_row_count:  int
    mqtt_connected:bool
