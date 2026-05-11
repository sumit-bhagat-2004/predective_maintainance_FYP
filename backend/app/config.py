"""config.py — Application settings loaded from .env"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # AWS IoT
    aws_iot_endpoint: str
    aws_iot_port: int = 8883
    aws_thing_name: str = "ESP32-PredMaint"
    aws_topic_prefix: str = "predictive-maintenance/esp32"

    # Certificate paths
    aws_root_ca_path: str
    aws_device_cert_path: str
    aws_device_key_path: str

    # Database
    database_url: str = "sqlite:///./data/sensor_data.db"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
