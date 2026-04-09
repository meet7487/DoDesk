# backend/router/time_router.py
# Feature 5 – Time Tracking System

from fastapi import APIRouter, Body, Depends, HTTPException
from backend.dependencies import get_current_user
from backend.db import time_logs_collection
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/api/time", tags=["Time Tracking"])


# ── Start timer ───────────────────────────────────────────────
@router.post("/start/{project_id}/{task_id}")
async def start_timer(
    project_id:   str,
    task_id:      str,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]

    # Check if an active timer already exists for this task/user
    existing = await time_logs_collection.find_one({
        "user_id":   user_id,
        "task_id":   task_id,
        "end_time":  None,
    })
    if existing:
        raise HTTPException(status_code=400, detail="Timer already running for this task.")

    doc = {
        "user_id":    user_id,
        "project_id": project_id,
        "task_id":    task_id,
        "start_time": datetime.utcnow().isoformat(),
        "end_time":   None,
        "duration_seconds": 0,
    }
    result = await time_logs_collection.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


# ── Stop timer ────────────────────────────────────────────────
@router.put("/stop/{project_id}/{task_id}")
async def stop_timer(
    project_id:   str,
    task_id:      str,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]
    log = await time_logs_collection.find_one({
        "user_id":  user_id,
        "task_id":  task_id,
        "end_time": None,
    })
    if not log:
        raise HTTPException(status_code=404, detail="No active timer found.")

    start    = datetime.fromisoformat(log["start_time"])
    end      = datetime.utcnow()
    duration = int((end - start).total_seconds())

    await time_logs_collection.update_one(
        {"_id": log["_id"]},
        {"$set": {
            "end_time":         end.isoformat(),
            "duration_seconds": duration,
        }},
    )
    return {
        "message":          "Timer stopped.",
        "duration_seconds": duration,
        "duration_display": _fmt(duration),
    }


# ── Get time logs for a task ──────────────────────────────────
@router.get("/{project_id}/{task_id}")
async def get_time_logs(
    project_id:   str,
    task_id:      str,
    current_user: dict = Depends(get_current_user),
):
    cursor = time_logs_collection.find(
        {"task_id": task_id, "user_id": current_user["id"]},
        sort=[("start_time", -1)],
    )
    results = []
    total_seconds = 0
    async for log in cursor:
        log["_id"] = str(log["_id"])
        log["duration_display"] = _fmt(log.get("duration_seconds", 0))
        total_seconds += log.get("duration_seconds", 0)
        results.append(log)
    return {
        "logs":           results,
        "total_seconds":  total_seconds,
        "total_display":  _fmt(total_seconds),
    }


# ── Check active timer ────────────────────────────────────────
@router.get("/active/{task_id}")
async def get_active_timer(task_id: str, current_user: dict = Depends(get_current_user)):
    log = await time_logs_collection.find_one({
        "user_id":  current_user["id"],
        "task_id":  task_id,
        "end_time": None,
    })
    if not log:
        return {"active": False}
    log["_id"] = str(log["_id"])
    return {"active": True, "log": log}


def _fmt(seconds: int) -> str:
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    return f"{h:02d}:{m:02d}:{s:02d}"