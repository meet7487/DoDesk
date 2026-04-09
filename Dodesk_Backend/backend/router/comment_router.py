# backend/router/comment_router.py
# Feature 3 – Task Comments System

from fastapi import APIRouter, Body, Depends, HTTPException
from backend.dependencies import get_current_user
from backend.db import comments_collection
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/api/comments", tags=["Comments"])


# ── Add a comment to a task ───────────────────────────────────
@router.post("/{project_id}/{task_id}")
async def add_comment(
    project_id: str,
    task_id:    str,
    body:       dict = Body(...),
    current_user: dict = Depends(get_current_user),
):
    text = body.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Comment text is required.")

    comment = {
        "project_id":  project_id,
        "task_id":     task_id,
        "user_id":     current_user["id"],
        "user_name":   current_user.get("name") or current_user.get("email", "Unknown"),
        "text":        text,
        "created_at":  datetime.utcnow().isoformat(),
    }
    result = await comments_collection.insert_one(comment)
    comment["_id"] = str(result.inserted_id)
    return comment


# ── Get all comments for a task ───────────────────────────────
@router.get("/{project_id}/{task_id}")
async def get_comments(
    project_id:   str,
    task_id:      str,
    current_user: dict = Depends(get_current_user),
):
    cursor  = comments_collection.find(
        {"project_id": project_id, "task_id": task_id},
        sort=[("created_at", 1)],
    )
    results = []
    async for c in cursor:
        c["_id"] = str(c["_id"])
        results.append(c)
    return results


# ── Delete a comment (owner only) ─────────────────────────────
@router.delete("/{comment_id}")
async def delete_comment(
    comment_id:   str,
    current_user: dict = Depends(get_current_user),
):
    comment = await comments_collection.find_one({"_id": ObjectId(comment_id)})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found.")
    if comment["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only delete your own comments.")
    await comments_collection.delete_one({"_id": ObjectId(comment_id)})
    return {"message": "Comment deleted."}