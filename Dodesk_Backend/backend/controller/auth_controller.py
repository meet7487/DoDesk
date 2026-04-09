# backend/controller/auth_controller.py
from backend.db import users_collection
from backend.utils import (
    hash_password,
    verify_password,
    create_access_token,
    verify_google_token,
    verify_token,
)
from backend.model.user_model import UserSignup, UserLogin
from bson import ObjectId
from fastapi import Request


# ------------------ SIGNUP (Register New User) ------------------ #
async def signup_user(user: UserSignup):
    """
    Handles new user registration. 
    Checks for duplicate email/username, hashes the password, and issues a JWT token.
    """
    # Check if the email is already in the database
    existing_email = await users_collection.find_one({"email": user.email})
    if existing_email:
        return {"success": False, "error": "Email already registered"}

    # Check if the username is already taken
    existing_username = await users_collection.find_one({"username": user.username})
    if existing_username:
        return {"success": False, "error": "Username already taken"}

    # Security: Convert plain text password into a secure hash
    hashed_password = hash_password(user.password)

    # Prepare user document for MongoDB
    new_user = {
        "name": user.name,
        "username": user.username,
        "email": user.email,
        "address": user.address,
        "gender": user.gender,
        "password": hashed_password,
        "role": "user", # Default role for new signups
    }

    # Insert user into the collection
    result = await users_collection.insert_one(new_user)
    user_id = str(result.inserted_id)

    # Generate a JWT token so the user is logged in immediately after signup
    access_token = create_access_token({"user_id": user_id})

    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": user.name,
            "username": user.username,
            "email": user.email,
        },
    }


# ------------------ LOGIN (Standard Login) ------------------ #
async def login_user(user: UserLogin):
    """
    Authenticates existing users using email and password.
    """
    # Find user by email
    db_user = await users_collection.find_one({"email": user.email})

    if not db_user:
        return {"success": False, "error": "Invalid email or password"}

    # Safety check: If the user registered via Google, they won't have a password
    if not db_user.get("password"):
        return {"success": False, "error": "Use Google login for this account"}

    # Verify if the provided password matches the hashed password in the DB
    if not verify_password(user.password, db_user["password"]):
        return {"success": False, "error": "Invalid email or password"}

    user_id = str(db_user["_id"])

    # Issue a new session token (JWT)
    access_token = create_access_token({"user_id": user_id})

    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": db_user["name"],
            "username": db_user["username"],
            "email": db_user["email"],
        },
    }


# ------------------ GOOGLE LOGIN (OAuth2) ------------------ #
async def google_login(token: str):
    """
    Verifies the Google token and either logs in the existing user 
    or creates a new user account based on their Google profile.
    """
    try:
        # Step 1: Validate the token with Google servers
        user_info = verify_google_token(token)

        email = user_info["email"]
        name = user_info.get("name", "")
        picture = user_info.get("picture", "")

        # Check if this Google user already exists in our DB
        db_user = await users_collection.find_one({"email": email})

        if not db_user:
            # Create a new account if they are signing in for the first time
            new_user = {
                "name": name,
                "username": email.split("@")[0], # Generate username from email
                "email": email,
                "address": "",
                "gender": "",
                "password": None, # Google users don't need a local password
                "role": "user",
                "picture": picture,
            }

            result = await users_collection.insert_one(new_user)
            user_id = str(result.inserted_id)
        else:
            user_id = str(db_user["_id"])

        # Generate our own internal JWT token for the session
        access_token = create_access_token({"user_id": user_id})

        return {
            "success": True,
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "name": name,
                "email": email,
            },
        }

    except Exception as e:
        print("Google Auth Error:", e)
        return {
            "success": False,
            "error": "Google authentication failed",
        }


# ------------------ GET CURRENT USER (Session Check) ------------------ #
async def get_current_user(request: Request):
    """
    Manually extracts the user from the Authorization header. 
    Useful for quick profile checks.
    """
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return {"error": "Authorization header missing"}

    try:
        # Extract the token part after 'Bearer '
        token = auth_header.split(" ")[1]
        payload = verify_token(token)
        user_id = payload.get("user_id")

        # Fetch the latest user info from the database
        user = await users_collection.find_one({"_id": ObjectId(user_id)})

        if not user:
            return {"error": "User not found"}

        return {
            "id": str(user["_id"]),
            "name": user.get("name"),
            "username": user.get("username"),
            "email": user.get("email"),
            "role": user.get("role"),
        }

    except Exception:
        return {"error": "Invalid token"}


# ------------------ GET ALL USERS (Admin/Team List) ------------------ #
async def get_all_users():
    """
    Retrieves a list of all registered users. 
    Passwords are excluded for security.
    """
    users = []
    # Project specific fields and exclude password field
    async for user in users_collection.find({}, {"password": 0}):
        users.append({
            "id": str(user["_id"]),
            "name": user.get("name"),
            "username": user.get("username"),
            "email": user.get("email"),
            "role": user.get("role"),
        })

    return {
        "success": True,
        "users": users
    }











































































# from backend.db import users_collection
# from backend.utils import (
#     hash_password,
#     verify_password,
#     create_access_token,
#     verify_google_token,
# )
# from backend.model.user_model import UserSignup, UserLogin
# from bson import ObjectId


# # ------------------ SIGNUP ------------------ #
# async def signup_user(user: UserSignup):

#     # check email
#     existing_email = await users_collection.find_one({"email": user.email})
#     if existing_email:
#         return {"success": False, "error": "Email already registered"}

#     # check username
#     existing_username = await users_collection.find_one(
#         {"username": user.username}
#     )
#     if existing_username:
#         return {"success": False, "error": "Username already taken"}

#     hashed_password = hash_password(user.password)

#     new_user = {
#         "name": user.name,
#         "username": user.username,
#         "email": user.email,
#         "address": user.address,
#         "gender": user.gender,
#         "password": hashed_password,
#         "role": "user",
#     }

#     result = await users_collection.insert_one(new_user)

#     access_token = create_access_token(
#         {"user_id": str(result.inserted_id)}
#     )

#     return {
#         "success": True,
#         "access_token": access_token,
#         "token_type": "bearer",
#         "user": {
#             "id": str(result.inserted_id),
#             "name": user.name,
#             "username": user.username,
#             "email": user.email,
#         },
#     }


# # ------------------ LOGIN ------------------ #
# async def login_user(user: UserLogin):

#     db_user = await users_collection.find_one({"email": user.email})

#     if not db_user:
#         return {"success": False, "error": "Invalid email or password"}

#     if not db_user.get("password"):
#         return {"success": False, "error": "Use Google login for this account"}

#     if not verify_password(user.password, db_user["password"]):
#         return {"success": False, "error": "Invalid email or password"}

#     access_token = create_access_token(
#         {"user_id": str(db_user["_id"])}
#     )

#     return {
#         "success": True,
#         "access_token": access_token,
#         "token_type": "bearer",
#         "user": {
#             "id": str(db_user["_id"]),
#             "name": db_user["name"],
#             "username": db_user["username"],
#             "email": db_user["email"],
#         },
#     }


# # ------------------ GOOGLE LOGIN ------------------ #
# async def google_login(token: str):

#     try:
#         user_info = verify_google_token(token)

#         email = user_info["email"]
#         name = user_info.get("name", "")
#         picture = user_info.get("picture", "")

#         db_user = await users_collection.find_one({"email": email})

#         if not db_user:
#             new_user = {
#                 "name": name,
#                 "username": email.split("@")[0],
#                 "email": email,
#                 "address": "",
#                 "gender": "",
#                 "password": None,
#                 "role": "user",
#                 "picture": picture,
#             }

#             result = await users_collection.insert_one(new_user)
#             user_id = str(result.inserted_id)
#         else:
#             user_id = str(db_user["_id"])

#         access_token = create_access_token({"user_id": user_id})

#         return {
#             "success": True,
#             "access_token": access_token,
#             "token_type": "bearer",
#             "user": {
#                 "id": user_id,
#                 "name": name,
#                 "email": email,
#             },
#         }

#     except Exception as e:
#         print("Google Auth Error:", e)
#         return {
#             "success": False,
#             "error": "Google authentication failed",
#         }