# project_router.py
from fastapi import APIRouter, Body, Depends, HTTPException
from backend.model.project_model import ProjectCreate
from backend.controller.project_controller import (
    create_project,
    get_projects,
    update_project,
    delete_project,
    get_project_tasks,
    add_task_to_project,
    update_task_status,
    update_task_deadline,
    delete_task,
)
from backend.db import projects_collection
from backend.dependencies import get_current_user

# Prefix ensures all routes start with /api/projects
router = APIRouter(prefix="/api/projects", tags=["Projects"])

# ===============================
# PROJECT ROUTES
# ===============================

# 1. GET EVERY PROJECT (Unfiltered for Dropdowns)
# Useful for selecting a project when creating a Team or assigning a Task.
@router.get("/all")
async def get_every_project(current_user: dict = Depends(get_current_user)):
    """
    Fetches a lightweight list of all projects (only IDs and Names).
    Used primarily for frontend dropdown menus.
    """
    projects = []
    cursor = projects_collection.find({})
    async for p in cursor:
        p["_id"] = str(p["_id"])
        # Returning only necessary fields to keep the response fast
        projects.append({
            "_id": p["_id"],
            "name": p.get("name", "Untitled Project")
        })
    return projects


# 2. GET FILTERED PROJECTS (Access-Based)
@router.get("/")
async def get_all(current_user: dict = Depends(get_current_user)):
    """
    Fetches projects specific to the logged-in user (Owner or Member).
    """
    user_id = current_user.get("id")
    return await get_projects(user_id)


# 3. CREATE PROJECT
@router.post("/")
async def create(data: ProjectCreate, current_user: dict = Depends(get_current_user)):
    """
    Creates a new project and assigns the current user as the owner.
    """
    user_id = current_user.get("id")
    return await create_project(data, user_id)


# 4. UPDATE PROJECT
@router.put("/{project_id}")
async def update(
    project_id: str,
    data: ProjectCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Updates general project info like name, description, and tasks.
    """
    return await update_project(project_id, data)


# 5. DELETE PROJECT
@router.delete("/{project_id}")
async def delete(project_id: str, current_user: dict = Depends(get_current_user)):
    """
    Permanently deletes a project and all its embedded tasks.
    """
    return await delete_project(project_id)


# ===============================
# TASK ROUTES (Embedded Inside Project)
# ===============================

# --- GET TASKS ---
@router.get("/{project_id}/tasks")
async def get_tasks(project_id: str, current_user: dict = Depends(get_current_user)):
    """
    Retrieves all tasks associated with a specific project ID.
    """
    return await get_project_tasks(project_id)


# --- CREATE TASK ---
@router.post("/{project_id}/tasks")
async def create_task(
    project_id: str,
    data: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Adds a new task object (including description) into the project's task array.
    """
    return await add_task_to_project(project_id, data)


# --- UPDATE TASK STATUS ---
@router.put("/{project_id}/tasks/{task_id}/status")
async def update_status(
    project_id: str,
    task_id: str,
    body: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Updates only the 'status' field (e.g., 'Completed') of a specific task.
    """
    return await update_task_status(
        project_id,
        task_id,
        body.get("status"),
    )


# --- UPDATE TASK DEADLINE ---
@router.put("/{project_id}/tasks/{task_id}/deadline")
async def update_deadline(
    project_id: str,
    task_id: str,
    body: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Updates the 'deadline' date for a specific task.
    """
    return await update_task_deadline(
        project_id,
        task_id,
        body.get("deadline"),
    )


# --- DELETE TASK ---
@router.delete("/{project_id}/tasks/{task_id}")
async def remove_task(
    project_id: str,
    task_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Removes a specific task from the project's array.
    """
    return await delete_task(project_id, task_id)

# from typing import Optional
# from fastapi import Query

# @router.get("/tasks")
# def list_tasks(
#     status:   Optional[str]      = Query(None),
#     priority: Optional[str]      = Query(None),
#     assigned: Optional[int]      = Query(None),
#     keyword:  Optional[str]      = Query(None),
#     due_before: Optional[str]    = Query(None),
#     db=Depends(get_db)
# ):
#     q = db.query(Task)
#     if status:     q = q.filter(Task.status == status)
#     if priority:   q = q.filter(Task.priority == priority)
#     if assigned:   q = q.filter(Task.assigned_to == assigned)
#     if keyword:    q = q.filter(Task.title.ilike(f"%{keyword}%"))
#     if due_before: q = q.filter(Task.deadline <= due_before)
#     return q.all()





































































# # project_router.py
# from fastapi import APIRouter, Body
# from backend.model.project_model import ProjectCreate
# from backend.controller.project_controller import (
#     create_project,
#     get_projects,
#     update_project,
#     delete_project,
#     get_project_tasks,
#     add_task_to_project,
#     update_task_status,
#     update_task_deadline,
#     delete_task,
# )

# router = APIRouter(prefix="/api/projects", tags=["Projects"])


# # ===============================
# # PROJECT ROUTES
# # ===============================

# @router.post("/")
# async def create(data: ProjectCreate):
#     return await create_project(data)


# @router.get("/")
# async def get_all():
#     return await get_projects()


# @router.put("/{project_id}")
# async def update(
#     project_id: str,
#     data: ProjectCreate,
# ):
#     return await update_project(project_id, data)


# @router.delete("/{project_id}")
# async def delete(project_id: str):
#     return await delete_project(project_id)


# # ===============================
# # TASK ROUTES (Embedded Inside Project)
# # ===============================

# # Get all tasks of selected project
# @router.get("/{project_id}/tasks")
# async def get_tasks(project_id: str):
#     return await get_project_tasks(project_id)


# # Add new task to project
# @router.post("/{project_id}/tasks")
# async def create_task(
#     project_id: str,
#     data: dict = Body(...),
# ):
#     return await add_task_to_project(project_id, data)


# # Update task status
# @router.put("/{project_id}/tasks/{task_id}/status")
# async def update_status(
#     project_id: str,
#     task_id: str,
#     body: dict = Body(...),
# ):
#     return await update_task_status(
#         project_id,
#         task_id,
#         body.get("status"),
#     )


# # Update task deadline
# @router.put("/{project_id}/tasks/{task_id}/deadline")
# async def update_deadline(
#     project_id: str,
#     task_id: str,
#     body: dict = Body(...),
# ):
#     return await update_task_deadline(
#         project_id,
#         task_id,
#         body.get("deadline"),
#     )


# # Delete task
# @router.delete("/{project_id}/tasks/{task_id}")
# async def remove_task(
#     project_id: str,
#     task_id: str,
# ):
#     return await delete_task(project_id, task_id)