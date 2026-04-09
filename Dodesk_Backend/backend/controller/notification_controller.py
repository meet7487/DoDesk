# backend/controller/notification_controller.py
from backend.db import db
from bson import ObjectId
from datetime import datetime
from typing import List
import asyncio

# ── Collection reference ──────────────────────────────────────────
notifications_collection = db.get_collection("notifications")

# ═══════════════════════════════════════════════════════════════════
#  WebSocket Connection Manager
#  Keeps a map of { user_id -> [WebSocket, ...] }
#  so we can push to every open tab for a user.
# ═══════════════════════════════════════════════════════════════════
class ConnectionManager:
    def __init__(self):
        # { user_id: [websocket, ...] }
        self.active: dict[str, list] = {}

    async def connect(self, websocket, user_id: str):
        await websocket.accept()
        self.active.setdefault(user_id, []).append(websocket)

    def disconnect(self, websocket, user_id: str):
        conns = self.active.get(user_id, [])
        if websocket in conns:
            conns.remove(websocket)
        if not conns:
            self.active.pop(user_id, None)

    async def send_to_user(self, user_id: str, data: dict):
        """Push a JSON payload to all connections belonging to user_id."""
        import json
        conns = self.active.get(user_id, [])
        dead  = []
        for ws in conns:
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, user_id)

    async def broadcast(self, data: dict):
        """Push to every connected user."""
        for uid in list(self.active.keys()):
            await self.send_to_user(uid, data)


# Singleton used across the whole app
manager = ConnectionManager()


# ═══════════════════════════════════════════════════════════════════
#  CRUD helpers
# ═══════════════════════════════════════════════════════════════════

def _serialize(n: dict) -> dict:
    n["id"]  = str(n.pop("_id"))
    return n


async def create_notification(
    user_id: str,
    title: str,
    message: str,
    notif_type: str,
    related_id: str  = None,
    related_type: str = None,
) -> dict:
    """
    Persist a notification and immediately push it via WebSocket
    to the recipient if they are online.
    """
    doc = {
        "user_id"      : user_id,
        "title"        : title,
        "message"      : message,
        "type"         : notif_type,
        "related_id"   : related_id,
        "related_type" : related_type,
        "is_read"      : False,
        "created_at"   : datetime.utcnow(),
    }
    result = await notifications_collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)

    # Push live to recipient
    await manager.send_to_user(user_id, {
        "event"   : "new_notification",
        "payload" : {**doc, "created_at": doc["created_at"].isoformat()},
    })
    return doc


async def get_user_notifications(user_id: str, limit: int = 50) -> List[dict]:
    """Return the most recent `limit` notifications for a user."""
    cursor = notifications_collection.find(
        {"user_id": user_id},
        sort=[("created_at", -1)],
        limit=limit,
    )
    results = []
    async for n in cursor:
        n = _serialize(n)
        if isinstance(n.get("created_at"), datetime):
            n["created_at"] = n["created_at"].isoformat()
        results.append(n)
    return results


async def mark_as_read(notification_id: str, user_id: str) -> dict:
    """Mark a single notification as read."""
    if not ObjectId.is_valid(notification_id):
        return {"success": False, "error": "Invalid notification ID"}

    await notifications_collection.update_one(
        {"_id": ObjectId(notification_id), "user_id": user_id},
        {"$set": {"is_read": True}},
    )
    return {"success": True, "message": "Marked as read"}


async def mark_all_read(user_id: str) -> dict:
    """Mark every notification for a user as read."""
    await notifications_collection.update_many(
        {"user_id": user_id, "is_read": False},
        {"$set": {"is_read": True}},
    )
    return {"success": True, "message": "All notifications marked as read"}


async def delete_notification(notification_id: str, user_id: str) -> dict:
    """Delete a single notification."""
    if not ObjectId.is_valid(notification_id):
        return {"success": False, "error": "Invalid notification ID"}

    await notifications_collection.delete_one(
        {"_id": ObjectId(notification_id), "user_id": user_id}
    )
    return {"success": True, "message": "Notification deleted"}


async def get_unread_count(user_id: str) -> int:
    return await notifications_collection.count_documents(
        {"user_id": user_id, "is_read": False}
    )