# project_controller.py
from backend.db import projects_collection, teams_collection
from backend.model.project_model import ProjectCreate
from bson import ObjectId
from datetime import datetime
import uuid

# ===============================
# PROJECT CRUD OPERATIONS
# ===============================

# --- CREATE PROJECT ---
async def create_project(data: ProjectCreate, current_user_id: str):
    """
    Initializes a new project record.
    Attaches the creator's ID and sets up an empty task list by default.
    Tasks sent from Project.jsx use the field `title`; we normalize to `name`
    here so Task.jsx (which reads `t.name`) always gets the right value.
    """
    # Normalize initial tasks: Project.jsx sends {title, priority, status, description}
    # but the rest of the app expects {name, priority, status, description, _id, ...}
    normalized_tasks = []
    for t in (data.tasks or []):
        normalized_tasks.append({
            "_id":         str(uuid.uuid4()),
            "name":        t.get("name") or t.get("title", ""),  # accept both field names
            "description": t.get("description", ""),
            "priority":    t.get("priority", "Medium"),
            "status":      t.get("status", "In progress"),
            "assignee":    t.get("assignee", ""),
            "deadline":    t.get("deadline", None),
            "created_at":  datetime.utcnow().isoformat(),
        })

    new_project = {
        "name":        data.name,
        "description": data.description,
        "tasks":       normalized_tasks,
        "taskCount":   len(normalized_tasks),
        "created_by":  current_user_id,
        "created_at":  datetime.utcnow(),
    }

    # Save the project to MongoDB
    result = await projects_collection.insert_one(new_project)
    # Convert the BSON ObjectId to string for the frontend response
    new_project["_id"] = str(result.inserted_id)
    return new_project


# --- GET PROJECTS (Access Control) ---
async def get_projects(current_user_id: str):
    """
    Fetches projects that the user has access to.
    Access includes: Projects created by the user OR projects where the user is a team member.
    """
    projects = []
    try:
        # 1. Identify all teams where the current user is listed as a member
        user_teams_cursor = teams_collection.find({"memberIds": current_user_id})
        user_teams = await user_teams_cursor.to_list(length=None)

        # Extract project IDs from those teams
        assigned_project_ids = []
        for t in user_teams:
            if "projectId" in t:
                try:
                    assigned_project_ids.append(ObjectId(t["projectId"]))
                except Exception:
                    continue

        # 2. Final Query Strategy:
        # Show project if User is the OWNER ($or) User is a MEMBER via a team ($in)
        query = {
            "$or": [
                {"created_by": current_user_id},
                {"_id": {"$in": assigned_project_ids}}
            ]
        }

        cursor = projects_collection.find(query)

        async for p in cursor:
            p["_id"] = str(p["_id"])
            # Dynamically calculate task count based on the tasks array
            p["taskCount"] = len(p.get("tasks", []))
            projects.append(p)

    except Exception as e:
        print(f"Error fetching projects: {e}")
        return []

    return projects


# --- UPDATE PROJECT ---
async def update_project(project_id: str, data: ProjectCreate):
    """
    Updates the basic metadata (name/description/tasks) of a project.
    Normalizes task field names the same way create_project does.
    """
    normalized_tasks = []
    for t in (data.tasks or []):
        normalized_tasks.append({
            "_id":         t.get("_id") or str(uuid.uuid4()),
            "name":        t.get("name") or t.get("title", ""),  # accept both field names
            "description": t.get("description", ""),
            "priority":    t.get("priority", "Medium"),
            "status":      t.get("status", "In progress"),
            "assignee":    t.get("assignee", ""),
            "deadline":    t.get("deadline", None),
            "created_at":  t.get("created_at", datetime.utcnow().isoformat()),
        })

    await projects_collection.update_one(
        {"_id": ObjectId(project_id)},
        {
            "$set": {
                "name":        data.name,
                "description": data.description,
                "tasks":       normalized_tasks,
                "taskCount":   len(normalized_tasks),
            }
        },
    )
    return {"message": "Project updated successfully"}


# --- DELETE PROJECT ---
async def delete_project(project_id: str):
    """
    Permanently deletes a project from the database using its ID.
    """
    await projects_collection.delete_one({"_id": ObjectId(project_id)})
    return {"message": "Project deleted successfully"}


# ===============================
# TASK OPERATIONS (Embedded Logic)
# ===============================

# --- GET TASKS ---
async def get_project_tasks(project_id: str):
    """
    Retrieves the list of tasks stored inside a specific project document.
    Also ensures every task has a unique ID (UUID) and normalizes `title` -> `name`
    for any legacy tasks that were saved before the field name was standardized.
    """
    project = await projects_collection.find_one({"_id": ObjectId(project_id)})

    if not project:
        return []

    tasks = project.get("tasks", [])
    updated = False

    for t in tasks:
        # --- Normalize `title` -> `name` for legacy tasks ---
        if "name" not in t or not t["name"]:
            if "title" in t and t["title"]:
                t["name"] = t["title"]
                updated = True

        # --- Ensure every task has a unique _id ---
        if "_id" not in t:
            t["_id"] = str(uuid.uuid4())
            updated = True
        else:
            t["_id"] = str(t["_id"])

    # Persist any fixes back to MongoDB
    if updated:
        await projects_collection.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": {"tasks": tasks}}
        )

    return tasks


# --- ADD TASK ---
async def add_task_to_project(project_id: str, data: dict):
    """
    Appends a new task object into the project's 'tasks' array.
    Always stores as `name` (never `title`) for consistency.
    """
    task = {
        "_id":         str(uuid.uuid4()),
        "name":        data.get("name") or data.get("title", ""),  # accept both
        "description": data.get("description", ""),
        "assignee":    data.get("assignee", ""),
        "deadline":    data.get("deadline", None),
        "status":      data.get("status", "In progress"),
        "priority":    data.get("priority", "Medium"),
        "created_at":  datetime.utcnow().isoformat(),
    }

    # $push adds the new task to the end of the existing array in MongoDB
    await projects_collection.update_one(
        {"_id": ObjectId(project_id)},
        {"$push": {"tasks": task}},
    )

    return {"message": "Task added successfully"}


# --- UPDATE TASK STATUS ---
async def update_task_status(project_id: str, task_id: str, status: str):
    """
    Locates a specific task inside the project and updates only its status field.
    Uses the positional operator ($) to find the correct array element.
    """
    await projects_collection.update_one(
        {
            "_id":      ObjectId(project_id),
            "tasks._id": task_id,
        },
        {"$set": {"tasks.$.status": status}},
    )
    return {"message": "Status updated successfully"}


# --- UPDATE TASK DEADLINE ---
async def update_task_deadline(project_id: str, task_id: str, deadline):
    """
    Updates the deadline of a specific task within the project's task array.
    """
    await projects_collection.update_one(
        {
            "_id":      ObjectId(project_id),
            "tasks._id": task_id,
        },
        {"$set": {"tasks.$.deadline": deadline}},
    )
    return {"message": "Deadline updated successfully"}


# --- DELETE TASK ---
async def delete_task(project_id: str, task_id: str):
    """
    Removes a specific task from the 'tasks' array using its unique ID.
    """
    # $pull filters out the task with the matching _id from the array
    await projects_collection.update_one(
        {"_id": ObjectId(project_id)},
        {"$pull": {"tasks": {"_id": task_id}}},
    )
    return {"message": "Task deleted successfully"}

































































# # project_controller.py
# from backend.db import projects_collection
# from backend.model.project_model import ProjectCreate
# from bson import ObjectId
# from datetime import datetime
# import uuid


# # ===============================
# # PROJECT CRUD
# # ===============================

# # CREATE PROJECT
# async def create_project(data: ProjectCreate):

#     new_project = {
#         "name": data.name,
#         "description": data.description,
#         "tasks": data.tasks,
#         "taskCount": len(data.tasks),
#         "created_at": datetime.utcnow(),
#     }

#     result = await projects_collection.insert_one(new_project)

#     new_project["_id"] = str(result.inserted_id)
#     return new_project


# # GET ALL PROJECTS
# async def get_projects():

#     projects = []
#     cursor = projects_collection.find({})

#     async for p in cursor:
#         p["_id"] = str(p["_id"])
#         p["taskCount"] = len(p.get("tasks", []))
#         projects.append(p)

#     return projects


# # UPDATE PROJECT
# async def update_project(project_id: str, data: ProjectCreate):

#     await projects_collection.update_one(
#         {
#             "_id": ObjectId(project_id),
#         },
#         {
#             "$set": {
#                 "name": data.name,
#                 "description": data.description,
#             }
#         },
#     )

#     return {"message": "Project updated successfully"}


# # DELETE PROJECT
# async def delete_project(project_id: str):

#     await projects_collection.delete_one(
#         {
#             "_id": ObjectId(project_id),
#         }
#     )

#     return {"message": "Project deleted successfully"}


# # ===============================
# # TASK OPERATIONS (Embedded)
# # ===============================

# # GET TASKS OF A PROJECT
# async def get_project_tasks(project_id: str):

#     project = await projects_collection.find_one(
#         {
#             "_id": ObjectId(project_id),
#         }
#     )

#     if not project:
#         return []

#     tasks = project.get("tasks", [])

#     updated = False

#     for t in tasks:
#         if "_id" not in t:
#             t["_id"] = str(uuid.uuid4())
#             updated = True
#         else:
#             t["_id"] = str(t["_id"])

#     if updated:
#         await projects_collection.update_one(
#             {"_id": ObjectId(project_id)},
#             {"$set": {"tasks": tasks}}
#         )

#     return tasks


# # ADD TASK TO PROJECT
# async def add_task_to_project(project_id: str, data: dict):

#     task = {
#         "_id": str(uuid.uuid4()),
#         "name": data.get("name"),
#         "description": data.get("description"),
#         "assignee": data.get("assignee"),
#         "deadline": data.get("deadline"),
#         "status": data.get("status", "In progress"),
#         "priority": data.get("priority", "Medium"),
#         "created_at": datetime.utcnow(),
#     }

#     await projects_collection.update_one(
#         {
#             "_id": ObjectId(project_id),
#         },
#         {
#             "$push": {"tasks": task}
#         },
#     )

#     return {"message": "Task added successfully"}


# # UPDATE TASK STATUS
# async def update_task_status(project_id: str, task_id: str, status: str):

#     await projects_collection.update_one(
#         {
#             "_id": ObjectId(project_id),
#             "tasks._id": task_id,
#         },
#         {
#             "$set": {"tasks.$.status": status}
#         },
#     )

#     return {"message": "Status updated successfully"}


# # UPDATE TASK DEADLINE
# async def update_task_deadline(project_id: str, task_id: str, deadline):

#     await projects_collection.update_one(
#         {
#             "_id": ObjectId(project_id),
#             "tasks._id": task_id,
#         },
#         {
#             "$set": {"tasks.$.deadline": deadline}
#         },
#     )

#     return {"message": "Deadline updated successfully"}


# # DELETE TASK
# async def delete_task(project_id: str, task_id: str):

#     await projects_collection.update_one(
#         {
#             "_id": ObjectId(project_id),
#         },
#         {
#             "$pull": {"tasks": {"_id": task_id}}
#         },
#     )

#     return {"message": "Task deleted successfully"}