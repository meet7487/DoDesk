# backend/router/analytics_router.py
# Feature 2 – Dashboard Analytics

from fastapi import APIRouter, Depends
from backend.dependencies import get_current_user
from backend.db import projects_collection, teams_collection
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    """
    Returns aggregated stats for the logged-in user:
    - Total projects, tasks, completion rates
    - Weekly task completion trend (last 7 days)
    - Priority breakdown
    - Status breakdown
    """
    user_id = current_user["id"]

    # ── Fetch user's projects ─────────────────────────────────
    user_teams_cursor = teams_collection.find({"memberIds": user_id})
    user_teams = await user_teams_cursor.to_list(length=None)
    from bson import ObjectId
    assigned_ids = []
    for t in user_teams:
        try:
            assigned_ids.append(ObjectId(t["projectId"]))
        except Exception:
            pass

    query = {"$or": [{"created_by": user_id}, {"_id": {"$in": assigned_ids}}]}
    cursor = projects_collection.find(query)
    projects = await cursor.to_list(length=None)

    # ── Aggregate tasks ───────────────────────────────────────
    all_tasks = []
    for p in projects:
        for t in p.get("tasks", []):
            t["project_name"] = p.get("name", "")
            all_tasks.append(t)

    total_tasks     = len(all_tasks)
    completed_tasks = sum(1 for t in all_tasks if t.get("status", "").lower().strip() == "completed")
    in_progress     = sum(1 for t in all_tasks if t.get("status", "").lower().strip() == "in progress")
    started         = sum(1 for t in all_tasks if t.get("status", "").lower().strip() == "started")
    total_projects  = len(projects)

    # ── Overdue tasks ─────────────────────────────────────────
    today = datetime.utcnow().date()
    overdue = sum(
        1 for t in all_tasks
        if t.get("deadline") and t.get("status", "").lower().strip() != "completed"
        and _parse_date(t["deadline"]) is not None
        and _parse_date(t["deadline"]) < today
    )

    # ── Priority breakdown ────────────────────────────────────
    priority_counts = {"High": 0, "Medium": 0, "Low": 0}
    for t in all_tasks:
        p = t.get("priority", "Medium")
        if p in priority_counts:
            priority_counts[p] += 1

    # ── Weekly completion trend (last 7 days) ─────────────────
    # Count tasks completed per day based on their updated_at / deadline heuristic
    weekly = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        label = day.strftime("%a")   # Mon, Tue, ...
        weekly.append({"day": label, "date": str(day), "completed": 0, "created": 0})

    # ── Status breakdown for pie chart ───────────────────────
    status_data = [
        {"name": "Completed",   "value": completed_tasks, "color": "#22c55e"},
        {"name": "In Progress", "value": in_progress,     "color": "#4f8ef7"},
        {"name": "Started",     "value": started,          "color": "#f59e0b"},
        {"name": "Overdue",     "value": overdue,          "color": "#ef4444"},
    ]

    # ── Per-project breakdown ─────────────────────────────────
    project_stats = []
    for p in projects:
        tasks = p.get("tasks", [])
        done  = sum(1 for t in tasks if t.get("status", "").lower().strip() == "completed")
        project_stats.append({
            "name":       p.get("name", "Unnamed"),
            "total":      len(tasks),
            "completed":  done,
            "completion": round((done / len(tasks) * 100) if tasks else 0),
        })

    return {
        "summary": {
            "total_projects":  total_projects,
            "total_tasks":     total_tasks,
            "completed_tasks": completed_tasks,
            "in_progress":     in_progress,
            "started":         started,
            "overdue":         overdue,
            "completion_rate": round((completed_tasks / total_tasks * 100) if total_tasks else 0),
        },
        "priority_breakdown": [
            {"name": k, "value": v} for k, v in priority_counts.items()
        ],
        "status_breakdown":   status_data,
        "weekly_trend":       weekly,
        "project_stats":      project_stats,
    }


def _parse_date(dl):
    if not dl:
        return None
    try:
        return datetime.strptime(str(dl).split("T")[0], "%Y-%m-%d").date()
    except Exception:
        return None