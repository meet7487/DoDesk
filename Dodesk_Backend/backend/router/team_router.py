# team_router.py
from fastapi import APIRouter, Depends, HTTPException
from backend.model.team_model import TeamCreate, TeamUpdate
from backend.controller.team_controller import (
    create_team,
    get_teams,
    update_team,
    delete_team
)
# Import the dependency that validates the user's token/session
from backend.dependencies import get_current_user 

# Initialize the router with a prefix so all routes start with /api/teams
# 'tags' help group these endpoints in the Swagger UI (/docs)
router = APIRouter(prefix="/api/teams", tags=["Teams"])

# --- CREATE TEAM ---
# This endpoint handles POST requests to create a new team.
# It requires a valid login token (current_user).
@router.post("/")
async def create_team_api(data: TeamCreate, current_user: dict = Depends(get_current_user)):
    """
    Calls the controller to save a new team in the database.
    """
    return await create_team(data)

# --- GET ALL TEAMS ---
# This endpoint handles GET requests to fetch the list of teams.
@router.get("/")
async def get_teams_api(current_user: dict = Depends(get_current_user)):
    """
    Returns all teams. Filtering by project or user can be handled on the frontend.
    """
    return await get_teams()

# --- UPDATE TEAM ---
# This endpoint handles PUT requests to modify an existing team using its ID.
@router.put("/{team_id}")
async def update_team_api(team_id: str, data: TeamUpdate, current_user: dict = Depends(get_current_user)):
    """
    Updates team details like name or members based on the team_id provided in the URL.
    """
    return await update_team(team_id, data)

# --- DELETE TEAM ---
# This endpoint handles DELETE requests to remove a team from the system.
@router.delete("/{team_id}")
async def delete_team_api(team_id: str, current_user: dict = Depends(get_current_user)):
    """
    Permanently removes a team and cleans up its references in the project.
    """
    return await delete_team(team_id)






























































# # team_router.py
# from fastapi import APIRouter
# from backend.model.team_model import TeamCreate, TeamUpdate
# from backend.controller.team_controller import (
#     create_team,
#     get_teams,
#     update_team,
#     delete_team
# )

# router = APIRouter(prefix="/api/teams", tags=["Teams"])


# @router.post("/")
# async def create_team_api(data: TeamCreate):
#     return await create_team(data)


# @router.get("/")
# async def get_teams_api():
#     return await get_teams()


# @router.put("/{team_id}")
# async def update_team_api(team_id: str, data: TeamUpdate):
#     return await update_team(team_id, data)


# @router.delete("/{team_id}")
# async def delete_team_api(team_id: str):
#     return await delete_team(team_id)