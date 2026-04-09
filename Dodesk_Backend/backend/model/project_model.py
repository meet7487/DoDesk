# project_model.py
from pydantic import BaseModel
from typing import List, Optional

class TaskModel(BaseModel):
    title: str                          # The heading or name of the task
    priority: str                       # Importance level (e.g., Low, Medium, High)
    status: str                         # Current state (e.g., In progress, Started, Completed)
    description: Optional[str] = ""    # ← NEW: Brief details about the task


class ProjectCreate(BaseModel):
    name: str                           # Required: The name of the project
    description: Optional[str] = ""
    tasks: Optional[List[dict]] = []





























































# # project_model.py
# from pydantic import BaseModel
# from typing import List, Optional


# # --- Model for an Individual Task ---
# # This defines the structure of a single task inside a project.
# class TaskModel(BaseModel):
#     title: str                          # The heading or name of the task
#     priority: str                       # Importance level (e.g., Low, Medium, High)
#     status: str                         # Current state (e.g., In progress, Started, Completed)
#     description: Optional[str] = ""    # ← NEW: Brief details about the task


# # --- Model for Creating a New Project ---
# # This is used when a user sends a POST request to create a project.
# class ProjectCreate(BaseModel):
#     name: str                           # Required: The name of the project

#     # Optional: Brief details about the project.
#     # Defaults to an empty string if not provided.
#     description: Optional[str] = ""

#     # Optional: A list of task objects (dictionaries).
#     # Defaults to an empty list [] if the project starts with no tasks.
#     tasks: Optional[List[dict]] = []