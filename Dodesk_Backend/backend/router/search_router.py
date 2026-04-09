# backend/router/search_router.py
# Feature 7 – Advanced Search & Filtering  |  Feature 8 – Calendar View

from fastapi import APIRouter, Depends, Query
from backend.dependencies import get_current_user
from backend.db import projects_collection, teams_collection
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/api/search", tags=["Search"])


@router.get("/tasks")
async def search_tasks(
    q:        str  = Query(default="",   description="Text search in name/description"),
    status:   str  = Query(default="",   description="Filter by status"),
    priority: str  = Query(default="",   description="Filter by priority"),
    assignee: str  = Query(default="",   description="Filter by assignee name"),
    from_date:str  = Query(default="",   description="Deadline from (YYYY-MM-DD)"),
    to_date:  str  = Query(default="",   description="Deadline to (YYYY-MM-DD)"),
    current_user: dict = Depends(get_current_user),
):
    """
    Feature 7: Search tasks across all projects with optional filters.
    Feature 8: Provide deadline-based data for the Calendar View.
    """
    user_id = current_user["id"]

    # ── Get user's projects ─────────────────────────────────
    user_teams_cursor = teams_collection.find({"memberIds": user_id})
    user_teams = await user_teams_cursor.to_list(length=None)
    assigned_ids = []
    for t in user_teams:
        try:
            assigned_ids.append(ObjectId(t["projectId"]))
        except Exception:
            pass

    query  = {"$or": [{"created_by": user_id}, {"_id": {"$in": assigned_ids}}]}
    cursor = projects_collection.find(query)
    projects = await cursor.to_list(length=None)

    # ── Flatten + filter tasks ──────────────────────────────
    results = []
    q_lower  = q.lower()

    for p in projects:
        for t in p.get("tasks", []):
            # Text search
            if q_lower and q_lower not in (t.get("name", "") + t.get("description", "")).lower():
                continue
            # Status filter
            if status and t.get("status", "").lower() != status.lower():
                continue
            # Priority filter
            if priority and t.get("priority", "").lower() != priority.lower():
                continue
            # Assignee filter
            if assignee and assignee.lower() not in t.get("assignee", "").lower():
                continue
            # Date range filter
            dl = t.get("deadline")
            if from_date and dl and dl < from_date:
                continue
            if to_date and dl and dl > to_date:
                continue

            results.append({
                **t,
                "project_id":   str(p["_id"]),
                "project_name": p.get("name", ""),
            })

    return {"tasks": results, "count": len(results)}


@router.get("/calendar")
async def get_calendar_tasks(
    current_user: dict = Depends(get_current_user),
):
    """
    Feature 8 – Calendar View: returns all non-completed tasks that have deadlines.
    Frontend maps these to FullCalendar events.
    """
    user_id = current_user["id"]

    user_teams_cursor = teams_collection.find({"memberIds": user_id})
    user_teams = await user_teams_cursor.to_list(length=None)
    assigned_ids = []
    for t in user_teams:
        try:
            assigned_ids.append(ObjectId(t["projectId"]))
        except Exception:
            pass

    query  = {"$or": [{"created_by": user_id}, {"_id": {"$in": assigned_ids}}]}
    cursor = projects_collection.find(query)
    projects = await cursor.to_list(length=None)

    events = []
    for p in projects:
        for t in p.get("tasks", []):
            if not t.get("deadline"):
                continue
            status = t.get("status", "").lower().strip()
            color = (
                "#22c55e" if status == "completed"  else
                "#ef4444" if _is_overdue(t)         else
                "#f59e0b" if status == "started"    else
                "#4f8ef7"
            )
            events.append({
                "id":           t.get("_id", ""),
                "title":        t.get("name", "Untitled"),
                "start":        t["deadline"],
                "end":          t["deadline"],
                "color":        color,
                "extendedProps": {
                    "project_id":   str(p["_id"]),
                    "project_name": p.get("name", ""),
                    "status":       t.get("status", ""),
                    "priority":     t.get("priority", ""),
                    "assignee":     t.get("assignee", ""),
                    "description":  t.get("description", ""),
                },
            })
    return events


def _is_overdue(task: dict) -> bool:
    dl = task.get("deadline")
    if not dl:
        return False
    try:
        return datetime.strptime(str(dl).split("T")[0], "%Y-%m-%d").date() < datetime.utcnow().date()
    except Exception:
        return False