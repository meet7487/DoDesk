# dependencies.py
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.utils import verify_token
from backend.db import users_collection
from bson import ObjectId
import logging

# --- Logging Setup ---
# Helps display clear, formatted error messages in your terminal/console
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Standard FastAPI utility to handle 'Bearer' tokens in the Authorization header
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Middleware function that validates the user's authentication for every protected route.
    It decodes the JWT, finds the user in MongoDB, and cleans up the sensitive data.
    """
    # Extract the raw token string from the Authorization header
    token = credentials.credentials
    
    # 1. Decode the JWT (JSON Web Token)
    # This uses the verify_token function from your utils.py
    payload = verify_token(token)
    
    # DEBUG: Logs useful info to the terminal to help you troubleshoot auth issues
    print(f"\n--- AUTH DEBUG START ---")
    print(f"Incoming Token Payload: {payload}")

    # If the token is expired, tampered with, or invalid, payload will be None
    if not payload:
        print("ERROR: Payload is None. Token might be expired or JWT_SECRET is wrong.")
        print(f"--- AUTH DEBUG END ---\n")
        raise HTTPException(
            status_code=401, 
            detail="Could not validate credentials. Please login again."
        )

    # 2. Extract User ID
    # Checks if 'user_id' exists inside the token data
    user_id = payload.get("user_id")
    if not user_id:
        print("ERROR: 'user_id' key not found in token payload.")
        print(f"--- AUTH DEBUG END ---\n")
        raise HTTPException(
            status_code=401, 
            detail="Token payload is invalid."
        )

    # 3. MongoDB Lookup with Safe ObjectId Validation
    try:
        # Check if the user_id string is a valid 24-character hexadecimal MongoDB ID
        if not ObjectId.is_valid(user_id):
            print(f"ERROR: {user_id} is not a valid MongoDB ObjectId.")
            raise HTTPException(status_code=401, detail="Malformed user identification.")
            
        # Search for the user in the database
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        
        # If the ID exists in the token but the user was deleted from the DB
        if not user:
            print(f"ERROR: No user found in DB for ID: {user_id}")
            raise HTTPException(status_code=401, detail="User no longer exists.")

        # 4. Final Formatting & Security Cleanup
        # Convert the MongoDB _id (BSON) to a standard string for easy use
        user["id"] = str(user["_id"])
        
        # Security: Remove the hashed password before passing user data to the route
        user.pop("password", None)
        user.pop("_id", None) # Use 'id' (string) instead of '_id' (object)
        
        print(f"SUCCESS: User '{user.get('email')}' authenticated successfully.")
        print(f"--- AUTH DEBUG END ---\n")
        
        # Return the cleaned user object to the API route
        return user

    except Exception as e:
        # Catch any unexpected errors (database connection, etc.)
        print(f"CRITICAL ERROR in get_current_user: {str(e)}")
        print(f"--- AUTH DEBUG END ---\n")
        raise HTTPException(
            status_code=500, 
            detail="Internal server error during authentication."
        )


# from fastapi import HTTPException, status

# def require_role(*roles):
#     """Factory: returns a dependency that checks user.role."""
#     def _check(user = Depends(get_current_user)):
#         if user.role not in roles:
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="Insufficient permissions"
#             )
#         return user
#     return _check
























































# # dependencies.py
# from fastapi import Depends, HTTPException
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# from backend.utils import verify_token
# from backend.db import users_collection
# from bson import ObjectId

# security = HTTPBearer()

# async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):

#     payload = verify_token(credentials.credentials)
#     if not payload:
#         raise HTTPException(status_code=401, detail="Invalid token")

#     user = await users_collection.find_one({"_id": ObjectId(payload["user_id"])})
#     if not user:
#         raise HTTPException(status_code=401, detail="User not found")

#     user["id"] = str(user["_id"])
#     return user