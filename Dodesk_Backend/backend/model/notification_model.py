# backend/model/notification_model.py
from pydantic import BaseModel
from typing import Optional

class NotificationCreate(BaseModel):
    """
    Used internally to create a new notification document.
    """
    user_id: str          # Who receives this notification
    title: str            # Short heading e.g. "Task Assigned"
    message: str          # Full message body
    type: str             # "task_assigned"|"task_updated"|"task_completed"|"deadline"|"team"|"project"
    related_id: Optional[str] = None    # task _id, project _id, etc.
    related_type: Optional[str] = None  # "task" | "project" | "team"