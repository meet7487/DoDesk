from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        # user_id → list of active WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections.setdefault(user_id, []).append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        connections = self.active_connections.get(user_id, [])
        if websocket in connections:
            connections.remove(websocket)

    async def notify_user(self, user_id: int, message: dict):
        # Send notification to all active sessions of a user
        for ws in self.active_connections.get(user_id, []):
            try:
                await ws.send_text(json.dumps(message))
            except:
                pass  # disconnected mid-send

# Singleton — import this everywhere you need to push notifications
manager = ConnectionManager()