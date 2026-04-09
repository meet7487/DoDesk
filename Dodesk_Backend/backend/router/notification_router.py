# backend/router/notification_router.py
# Feature 1 – Real-Time Notification System (WebSocket + REST)

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Body
from backend.dependencies import get_current_user
from backend.db import notifications_collection
from datetime import datetime
from bson import ObjectId
import json

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

# ── WebSocket Connection Manager ──────────────────────────────
class NotificationManager:
    def __init__(self):
        # user_id -> list of active WebSocket connections
        self.connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.connections:
            self.connections[user_id] = []
        self.connections[user_id].append(websocket)
        print(f"[WS] User {user_id} connected. Total: {len(self.connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.connections:
            self.connections[user_id].remove(websocket)
            if not self.connections[user_id]:
                del self.connections[user_id]
        print(f"[WS] User {user_id} disconnected.")

    async def send_to_user(self, user_id: str, message: dict):
        """Send a notification to all open connections of a user."""
        if user_id in self.connections:
            dead = []
            for ws in self.connections[user_id]:
                try:
                    await ws.send_text(json.dumps(message))
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.connections[user_id].remove(ws)

    async def broadcast(self, message: dict):
        """Send to every connected user (e.g. system announcements)."""
        for user_id in list(self.connections.keys()):
            await self.send_to_user(user_id, message)


manager = NotificationManager()


# ── Helper: save + push notification ─────────────────────────
async def push_notification(user_id: str, title: str, message: str, notif_type: str = "info"):
    """
    Call this from any controller to trigger a real-time notification.
    It saves to DB and pushes via WebSocket.
    """
    doc = {
        "user_id":   user_id,
        "title":     title,
        "message":   message,
        "type":      notif_type,   # info | success | warning | error
        "read":      False,
        "created_at": datetime.utcnow().isoformat(),
    }
    result = await notifications_collection.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    await manager.send_to_user(user_id, doc)
    return doc


# ── WebSocket endpoint ────────────────────────────────────────
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep the connection alive; client can send pings
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


# ── REST: Get all notifications for current user ──────────────
@router.get("/")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    cursor  = notifications_collection.find(
        {"user_id": user_id},
        sort=[("created_at", -1)],
    ).limit(50)
    results = []
    async for n in cursor:
        n["_id"] = str(n["_id"])
        results.append(n)
    return results


# ── REST: Mark one notification as read ──────────────────────
@router.put("/{notif_id}/read")
async def mark_read(notif_id: str, current_user: dict = Depends(get_current_user)):
    await notifications_collection.update_one(
        {"_id": ObjectId(notif_id)},
        {"$set": {"read": True}},
    )
    return {"message": "Marked as read"}


# ── REST: Mark ALL as read ────────────────────────────────────
@router.put("/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    await notifications_collection.update_many(
        {"user_id": current_user["id"]},
        {"$set": {"read": True}},
    )
    return {"message": "All marked as read"}


# ── REST: Delete a notification ───────────────────────────────
@router.delete("/{notif_id}")
async def delete_notification(notif_id: str, current_user: dict = Depends(get_current_user)):
    await notifications_collection.delete_one({"_id": ObjectId(notif_id)})
    return {"message": "Deleted"}