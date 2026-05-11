"""database.py — SQLite database engine and session management"""
import os
from sqlmodel import SQLModel, Session, create_engine
from app.config import settings

# Create data directory if needed
os.makedirs("data", exist_ok=True)

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},  # Required for SQLite
    echo=False,
)


def create_db_and_tables():
    """Create all tables on startup."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """FastAPI dependency: yields a DB session."""
    with Session(engine) as session:
        yield session
