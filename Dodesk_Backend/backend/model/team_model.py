# team_model.py
from pydantic import BaseModel
from typing import List, Optional

class TeamCreate(BaseModel):
    name: str              # The official name of the team
    projectId: str         # The ID of the project this team belongs to
    memberIds: List[str]   # A list of User IDs who will be in this team
    createdBy: str         # The ID of the user who is creating this team

class TeamUpdate(BaseModel):
    name: Optional[str]           # New name for the team (if changing)
    projectId: Optional[str]      # New project link (if changing)
    memberIds: Optional[List[str]] # Updated list of members









































# # team_model.py
# from pydantic import BaseModel
# from typing import List, Optional

# # --- Model for Creating a New Team ---
# # This defines exactly what fields are REQUIRED when a user 
# # submits a form to create a new team.
# class TeamCreate(BaseModel):
#     name: str              # The official name of the team
#     projectId: str         # The ID of the project this team belongs to
#     memberIds: List[str]   # A list of User IDs who will be in this team
#     createdBy: str         # The ID of the user who is creating this team


# # --- Model for Updating an Existing Team ---
# # This is used for 'PATCH' or 'PUT' requests.
# # All fields are 'Optional', meaning the user can update only 
# # one field (like just the name) without sending everything else.
# class TeamUpdate(BaseModel):
#     name: Optional[str]           # New name for the team (if changing)
#     projectId: Optional[str]      # New project link (if changing)
#     memberIds: Optional[List[str]] # Updated list of members