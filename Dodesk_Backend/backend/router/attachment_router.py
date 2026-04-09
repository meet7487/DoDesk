# backend/router/attachment_router.py
# Feature 4 – File Upload and Attachments

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from backend.dependencies import get_current_user
from backend.db import attachments_collection
from datetime import datetime
from bson import ObjectId
import os, uuid, aiofiles

router     = APIRouter(prefix="/api/attachments", tags=["Attachments"])
UPLOAD_DIR = "uploads"
MAX_MB     = 10
ALLOWED    = {".pdf", ".png", ".jpg", ".jpeg", ".gif", ".docx", ".xlsx", ".txt", ".zip"}

os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Upload a file ─────────────────────────────────────────────
@router.post("/{project_id}/{task_id}")
async def upload_file(
    project_id:   str,
    task_id:      str,
    file:         UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    # Validate extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED:
        raise HTTPException(status_code=400, detail=f"File type '{ext}' is not allowed.")

    # Read and validate size
    content = await file.read()
    if len(content) > MAX_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds {MAX_MB} MB limit.")

    # Save with a unique filename
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path   = os.path.join(UPLOAD_DIR, unique_name)
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    doc = {
        "project_id":     project_id,
        "task_id":        task_id,
        "uploaded_by":    current_user["id"],
        "uploader_name":  current_user.get("name") or current_user.get("email", "Unknown"),
        "original_name":  file.filename,
        "stored_name":    unique_name,
        "url":            f"/uploads/{unique_name}",
        "size_bytes":     len(content),
        "mime_type":      file.content_type or "application/octet-stream",
        "created_at":     datetime.utcnow().isoformat(),
    }
    result = await attachments_collection.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


# ── List attachments for a task ───────────────────────────────
@router.get("/{project_id}/{task_id}")
async def get_attachments(
    project_id:   str,
    task_id:      str,
    current_user: dict = Depends(get_current_user),
):
    cursor  = attachments_collection.find(
        {"project_id": project_id, "task_id": task_id},
        sort=[("created_at", -1)],
    )
    results = []
    async for a in cursor:
        a["_id"] = str(a["_id"])
        results.append(a)
    return results


# ── Delete an attachment ──────────────────────────────────────
@router.delete("/{attachment_id}")
async def delete_attachment(
    attachment_id: str,
    current_user:  dict = Depends(get_current_user),
):
    doc = await attachments_collection.find_one({"_id": ObjectId(attachment_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Attachment not found.")
    if doc["uploaded_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Cannot delete someone else's file.")

    # Remove the physical file
    file_path = os.path.join(UPLOAD_DIR, doc["stored_name"])
    if os.path.exists(file_path):
        os.remove(file_path)

    await attachments_collection.delete_one({"_id": ObjectId(attachment_id)})
    return {"message": "Attachment deleted."}