from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.model.project_model import ProjectCreate
from model.user_model import User
from datetime import datetime, timedelta

def get_summary(db: Session, user_id: int):
    base = db.query(Task).filter(Task.assigned_to == user_id)
    return {
        "total": base.count(),
        "completed": base.filter(Task.status == "done").count(),
        "pending": base.filter(Task.status == "pending").count(),
        "overdue": base.filter(
            Task.deadline < datetime.utcnow(),
            Task.status != "done"
        ).count()
    }

def get_trend(db: Session, user_id: int, days: int = 30):
    since = datetime.utcnow() - timedelta(days=days)
    rows = (
        db.query(func.date(Task.completed_at), func.count(Task.id))
        .filter(Task.assigned_to == user_id, Task.completed_at >= since)
        .group_by(func.date(Task.completed_at))
        .all()
    )
    return [{"date": str(r[0]), "count": r[1]} for r in rows]