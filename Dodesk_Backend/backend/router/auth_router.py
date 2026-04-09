# auth_router.py
from fastapi import APIRouter, Depends
from backend.model.user_model import UserSignup, UserLogin, GoogleLogin
from backend.controller.auth_controller import (
    signup_user,
    login_user,
    google_login,
    get_all_users
)
# Import the security logic that verifies the JWT token
from backend.dependencies import get_current_user

# Define the router with a common prefix '/api/auth' 
# and a 'Auth' tag for Swagger documentation grouping
router = APIRouter(prefix="/api/auth", tags=["Auth"])


# ---------------- SIGNUP (Public Route) ----------------
@router.post("/signup")
async def signup(user: UserSignup):
    """
    Endpoint for new user registration. 
    Accepts name, email, username, and password.
    """
    return await signup_user(user)


# ---------------- LOGIN (Public Route) ----------------
@router.post("/login")
async def login(user: UserLogin):
    """
    Endpoint for traditional email/password login.
    """
    return await login_user(user)


# ---------------- GOOGLE LOGIN (Public Route) ----------------
@router.post("/google")
async def google_auth(data: GoogleLogin):
    """
    Endpoint to authenticate users via Google OAuth token.
    Used by the frontend 'Sign in with Google' button.
    """
    return await google_login(data.token)


# ---------------- GET CURRENT USER (Protected Route) ----------------
@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    This endpoint is used by the frontend (e.g., AuthContext.jsx) 
    to verify if the user's session is still valid.
    The 'get_current_user' dependency handles the token verification automatically.
    """
    # Since the dependency has already verified the token and fetched the user,
    # we simply return the current_user object.
    return current_user


# ---------------- GET ALL USERS (Protected Route) ----------------
@router.get("/users")
async def get_users(current_user: dict = Depends(get_current_user)):
    """
    Fetches a list of all users to display in the TeamSelection or 
    Member assignment pages. This is protected; only logged-in users can call it.
    """
    return await get_all_users()















































# # backend/router/auth_router.py

# from fastapi import APIRouter, Request
# from backend.model.user_model import UserSignup, UserLogin, GoogleLogin
# from backend.controller.auth_controller import (
#     signup_user,
#     login_user,
#     google_login,
#     get_all_users,
#     get_current_user
# )

# router = APIRouter(prefix="/api/auth", tags=["Auth"])


# # ---------------- SIGNUP ----------------
# @router.post("/signup")
# async def signup(user: UserSignup):
#     return await signup_user(user)


# # ---------------- LOGIN ----------------
# @router.post("/login")
# async def login(user: UserLogin):
#     return await login_user(user)


# # ---------------- GOOGLE LOGIN ----------------
# @router.post("/google")
# async def google_auth(data: GoogleLogin):
#     return await google_login(data.token)


# # ---------------- GET CURRENT USER ----------------
# @router.get("/me")
# async def get_me(request: Request):
#     return await get_current_user(request)


# # ---------------- GET ALL USERS ----------------
# @router.get("/users")
# async def get_users():
#     return await get_all_users()
















# #auth_router.py
# from fastapi import APIRouter
# from backend.model.user_model import UserSignup, UserLogin, GoogleLogin
# from backend.controller.auth_controller import (
#     signup_user,
#     login_user,
#     google_login,
#     get_all_users
# )

# router = APIRouter(prefix="/api/auth", tags=["Auth"])


# # ---------------- SIGNUP ----------------
# @router.post("/signup")
# async def signup(user: UserSignup):
#     return await signup_user(user)


# # ---------------- LOGIN ----------------
# @router.post("/login")
# async def login(user: UserLogin):
#     return await login_user(user)


# # ---------------- GOOGLE LOGIN ----------------
# @router.post("/google")
# async def google_auth(data: GoogleLogin):
#     return await google_login(data.token)


# # ---------------- GET ALL USERS ----------------
# @router.get("/users")
# async def get_users():
#     return await get_all_users()












# from fastapi import APIRouter, Depends
# from backend.model.user_model import UserSignup, UserLogin, GoogleLogin
# from backend.controller.auth_controller import signup_user, login_user, google_login
# from backend.dependencies import get_current_user

# router = APIRouter(prefix="/api/auth", tags=["Auth"])

# @router.post("/signup")
# async def signup(user: UserSignup):
#     return await signup_user(user)

# @router.post("/login")
# async def login(user: UserLogin):
#     return await login_user(user)

# @router.post("/google")
# async def google_auth(data: GoogleLogin):
#     return await google_login(data.token)

# @router.get("/me")
# async def get_me(current_user=Depends(get_current_user)):
#     return {
#         "id": current_user["id"],
#         "name": current_user["name"],
#         "email": current_user["email"]
#     }