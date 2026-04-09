# backend/router/activity_router.py
# Feature 10 – Activity Log System

from fastapi import APIRouter, Depends, Query
from backend.dependencies import get_current_user
from backend.db import activity_logs_collection
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/api/activity", tags=["Activity Log"])


# ── Helper: log an action (call from any controller) ──────────
async def log_activity(
    user_id:     str,
    user_name:   str,
    action:      str,    # e.g. "created_task", "completed_task"
    entity_type: str,    # "task" | "project" | "team"
    entity_id:   str,
    description: str,    # human-readable summary
    project_id:  str = "",
):
    await activity_logs_collection.insert_one({
        "user_id":     user_id,
        "user_name":   user_name,
        "action":      action,
        "entity_type": entity_type,
        "entity_id":   entity_id,
        "description": description,
        "project_id":  project_id,
        "created_at":  datetime.utcnow().isoformat(),
    })


# ── Get activity logs ─────────────────────────────────────────
@router.get("/")
async def get_activity(
    project_id: str  = Query(default="", description="Filter by project"),
    limit:      int  = Query(default=50),
    current_user: dict = Depends(get_current_user),
):
    query = {}
    if project_id:
        query["project_id"] = project_id
    else:
        query["user_id"] = current_user["id"]

    cursor  = activity_logs_collection.find(query, sort=[("created_at", -1)]).limit(limit)
    results = []
    async for log in cursor:
        log["_id"] = str(log["_id"])
        results.append(log)
    return results