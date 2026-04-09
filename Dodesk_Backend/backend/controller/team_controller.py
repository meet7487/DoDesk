# team_controller.py
from backend.db import teams_collection, projects_collection
from backend.db import db  # for users_collection
from bson import ObjectId
from datetime import datetime

# Helper: get users collection
users_collection = db["users"]

# ===============================
# CREATE TEAM
# ===============================
async def create_team(data):
    """
    Creates a new team in the database and updates the associated project's member list.
    """
    team = {
        "name":       data.name,
        "projectId":  str(data.projectId),
        "memberIds":  data.memberIds,
        "createdBy":  str(data.createdBy),
        "createdAt":  datetime.utcnow()
    }

    result = await teams_collection.insert_one(team)

    await projects_collection.update_one(
        {"_id": ObjectId(data.projectId)},
        {"$addToSet": {"members": {"$each": data.memberIds}}}
    )

    return {
        "success":  True,
        "message":  "Team created successfully",
        "team_id":  str(result.inserted_id)
    }


# ===============================
# GET ALL TEAMS  (enriched)
# ===============================
async def get_teams():
    """
    Retrieves all teams, enriched with the project name and member names
    so the frontend can display them without extra calls.
    """
    teams = []
    cursor = teams_collection.find()

    async for team in cursor:
        team["_id"] = str(team["_id"])
        if "projectId" in team:
            team["projectId"] = str(team["projectId"])

        # --- Enrich: project name ---
        project_name = ""
        try:
            project = await projects_collection.find_one(
                {"_id": ObjectId(team["projectId"])}
            )
            if project:
                project_name = project.get("name", "")
        except Exception:
            pass
        team["projectName"] = project_name

        # --- Enrich: member names ---
        member_names = []
        for member_id in team.get("memberIds", []):
            try:
                # Users may be stored with _id as ObjectId or as a plain string
                user = await users_collection.find_one(
                    {"$or": [
                        {"_id": ObjectId(member_id)},
                        {"id":  member_id},
                    ]}
                )
                if user:
                    name = user.get("name") or user.get("email") or member_id
                    member_names.append(name)
                else:
                    member_names.append(member_id)
            except Exception:
                member_names.append(member_id)

        team["memberNames"] = member_names
        teams.append(team)

    return teams


# ===============================
# UPDATE TEAM
# ===============================
async def update_team(team_id: str, data):
    """
    Updates team details and synchronizes member changes with the linked project.
    """
    old_team = await teams_collection.find_one({"_id": ObjectId(team_id)})
    if not old_team:
        return {"success": False, "error": "Team not found"}

    update_data = data.dict(exclude_unset=True)

    if "memberIds" in update_data:
        project_id = old_team.get("projectId")
        if project_id:
            await projects_collection.update_one(
                {"_id": ObjectId(project_id)},
                {"$pull": {"members": {"$in": old_team.get("memberIds", [])}}}
            )
            await projects_collection.update_one(
                {"_id": ObjectId(project_id)},
                {"$addToSet": {"members": {"$each": update_data["memberIds"]}}}
            )

    await teams_collection.update_one(
        {"_id": ObjectId(team_id)},
        {"$set": update_data}
    )

    return {"success": True, "message": "Team updated successfully"}


# ===============================
# DELETE TEAM
# ===============================
async def delete_team(team_id: str):
    """
    Deletes a team and removes its members' access from the associated project.
    """
    team = await teams_collection.find_one({"_id": ObjectId(team_id)})
    if not team:
        return {"success": False, "error": "Team not found"}

    project_id = team.get("projectId")
    members    = team.get("memberIds", [])

    if project_id:
        await projects_collection.update_one(
            {"_id": ObjectId(project_id)},
            {"$pull": {"members": {"$in": members}}}
        )

    await teams_collection.delete_one({"_id": ObjectId(team_id)})

    return {"success": True, "message": "Team deleted successfully"}















































# # team_controller.py

# from backend.db import teams_collection, projects_collection
# from bson import ObjectId
# from datetime import datetime


# # ===============================
# # CREATE TEAM
# # ===============================
# async def create_team(data):

#     team = {
#         "name": data.name,
#         "projectId": data.projectId,
#         "memberIds": data.memberIds,
#         "createdBy": data.createdBy,
#         "createdAt": datetime.utcnow()
#     }

#     result = await teams_collection.insert_one(team)

#     # add members to project without duplicates
#     await projects_collection.update_one(
#         {"_id": ObjectId(data.projectId)},
#         {
#             "$addToSet": {
#                 "members": {"$each": data.memberIds}
#             }
#         }
#     )

#     return {
#         "success": True,
#         "message": "Team created successfully",
#         "team_id": str(result.inserted_id)
#     }


# # ===============================
# # GET ALL TEAMS
# # ===============================
# async def get_teams():

#     teams = []

#     async for team in teams_collection.find():
#         team["_id"] = str(team["_id"])
#         teams.append(team)

#     return teams


# # ===============================
# # UPDATE TEAM
# # ===============================
# async def update_team(team_id, data):

#     team = await teams_collection.find_one({"_id": ObjectId(team_id)})

#     if not team:
#         return {"success": False, "error": "Team not found"}

#     update_data = {k: v for k, v in data.dict().items() if v is not None}

#     old_members = team.get("memberIds", [])
#     new_members = update_data.get("memberIds", old_members)

#     project_id = update_data.get("projectId", team["projectId"])

#     # remove old members
#     await projects_collection.update_one(
#         {"_id": ObjectId(project_id)},
#         {"$pull": {"members": {"$in": old_members}}}
#     )

#     # add new members
#     await projects_collection.update_one(
#         {"_id": ObjectId(project_id)},
#         {"$addToSet": {"members": {"$each": new_members}}}
#     )

#     await teams_collection.update_one(
#         {"_id": ObjectId(team_id)},
#         {"$set": update_data}
#     )

#     return {
#         "success": True,
#         "message": "Team updated successfully"
#     }


# # ===============================
# # DELETE TEAM
# # ===============================
# async def delete_team(team_id: str):

#     team = await teams_collection.find_one({"_id": ObjectId(team_id)})

#     if not team:
#         return {"success": False, "error": "Team not found"}

#     project_id = team.get("projectId")
#     members = team.get("memberIds", [])

#     # remove members from project
#     await projects_collection.update_one(
#         {"_id": ObjectId(project_id)},
#         {"$pull": {"members": {"$in": members}}}
#     )

#     await teams_collection.delete_one({"_id": ObjectId(team_id)})

#     return {
#         "success": True,
#         "message": "Team deleted successfully"
#     }

























# # team_controller.py
# from backend.db import teams_collection, projects_collection
# from bson import ObjectId
# from datetime import datetime


# async def create_team(data):

#     team = {
#         "name": data.name,
#         "projectId": data.projectId,
#         "memberIds": data.memberIds,
#         "createdBy": data.createdBy,
#         "createdAt": datetime.utcnow()
#     }

#     result = await teams_collection.insert_one(team)

#     # update project members so only they can see it
#     await projects_collection.update_one(
#         {"_id": ObjectId(data.projectId)},
#         {"$set": {"members": data.memberIds}}
#     )

#     return {
#         "message": "Team created successfully",
#         "team_id": str(result.inserted_id)
#     }


# async def get_teams():

#     teams = []

#     async for team in teams_collection.find():
#         team["_id"] = str(team["_id"])
#         teams.append(team)

#     return teams


# async def update_team(team_id, data):

#     update_data = {k: v for k, v in data.dict().items() if v is not None}

#     if "projectId" in update_data and "memberIds" in update_data:

#         await projects_collection.update_one(
#             {"_id": ObjectId(update_data["projectId"])},
#             {"$set": {"members": update_data["memberIds"]}}
#         )

#     await teams_collection.update_one(
#         {"_id": ObjectId(team_id)},
#         {"$set": update_data}
#     )

#     return {"message": "Team updated successfully"}



# async def delete_team(team_id: str):

#     result = await teams_collection.delete_one({"_id": ObjectId(team_id)})

#     if result.deleted_count == 0:
#         return {"success": False, "error": "Team not found"}

#     return {
#         "success": True,
#         "message": "Team deleted successfully"
#     }