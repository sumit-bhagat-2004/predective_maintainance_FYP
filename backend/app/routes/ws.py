"""routes/ws.py — WebSocket endpoint for real-time sensor data push"""
import json
import asyncio
import logging
from typing import Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import app.aws_iot as iot

logger = logging.getLogger("websocket")
router = APIRouter(tags=["websocket"])

# ---- Active connections ----
_connections: Set[WebSocket] = set()


async def _broadcast(data: dict):
    """Broadcast a JSON message to all connected WebSocket clients."""
    if not _connections:
        return

    message = json.dumps(data, default=str)
    dead    = set()

    for ws in _connections:
        try:
            await ws.send_text(message)
        except Exception:
            dead.add(ws)

    _connections -= dead


def setup_ws_broadcast():
    """Register the broadcast coroutine with the MQTT layer."""
    iot.set_ws_broadcast_callback(_broadcast)


@router.websocket("/ws/live")
async def websocket_live(ws: WebSocket):
    """
    WebSocket endpoint — clients connect here to receive live sensor data.

    Protocol:
      Server → Client: JSON sensor snapshot (same shape as /api/sensors/latest)
      Client → Server: ping (optional keepalive, server echoes "pong")
    """
    await ws.accept()
    _connections.add(ws)
    logger.info(f"[WS] Client connected. Total: {len(_connections)}")

    # Send the latest snapshot immediately upon connection
    if iot.latest_snapshot:
        await ws.send_text(json.dumps(iot.latest_snapshot, default=str))

    try:
        while True:
            try:
                msg = await asyncio.wait_for(ws.receive_text(), timeout=30.0)
                if msg == "ping":
                    await ws.send_text("pong")
            except asyncio.TimeoutError:
                # Send keepalive pong every 30s even without client ping
                await ws.send_text(json.dumps({"type": "keepalive"}))
    except WebSocketDisconnect:
        pass
    finally:
        _connections.discard(ws)
        logger.info(f"[WS] Client disconnected. Total: {len(_connections)}")
