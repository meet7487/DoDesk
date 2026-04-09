# utils.py
import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta
from backend.config.settings import settings
from google.oauth2 import id_token
from google.auth.transport import requests

# --- Password Security (Bcrypt) ---

def hash_password(password: str):
    """
    Converts a plain-text password into a secure, encrypted hash.
    Used during User Registration.
    """
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str):
    """
    Compares a plain-text password with the stored hash to see if they match.
    Used during User Login.
    """
    return bcrypt.checkpw(password.encode(), hashed.encode())

# --- JWT Token Management ---

def create_access_token(data: dict):
    """
    Generates a JWT (JSON Web Token) for a user session.
    It includes an expiration timestamp (e.g., 30 minutes).
    """
    to_encode = data.copy()
    # Calculate the expiration time based on current UTC time
    expire = datetime.utcnow() + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    # Add the 'exp' (expiration) claim to the token data
    to_encode.update({"exp": expire})
    # Sign the token using a Secret Key and a specific Algorithm (e.g., HS256)
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def verify_token(token: str):
    """
    Decodes and validates a JWT token.
    If the token is expired or tampered with, it returns None.
    """
    try:
        # Decode the token using the same Secret Key used to create it
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        # Returns the user data (payload) if valid
        return payload
    except JWTError:
        # Returns None if the token is invalid or expired
        return None

# --- Google OAuth2 Integration ---

def verify_google_token(token: str):
    """
    Validates the 'ID Token' received from Google on the frontend.
    It communicates with Google's servers to ensure the token is authentic.
    """
    try:
        # Use Google's library to verify the token against your Google Client ID
        return id_token.verify_oauth2_token(
            token,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
    except Exception as e:
        # Log the error if verification fails (e.g., expired or wrong Client ID)
        print(f"Google Token Verification Error: {str(e)}")
        return None


# def log_activity(db, user_id, action, entity_type, entity_id, desc):
#     entry = ActivityLog(
#         user_id=user_id,
#         action=action,
#         entity_type=entity_type,
#         entity_id=entity_id,
#         description=desc
#     )
#     db.add(entry); db.commit()

# # Call this in every controller that modifies data, e.g.:
# # log_activity(db, user.id, "created_task", "task", task.id,
# #              f"{user.username} created task '{task.title}'")






























# import bcrypt
# from jose import jwt, JWTError
# from datetime import datetime, timedelta
# from backend.config.settings import settings
# from google.oauth2 import id_token
# from google.auth.transport import requests

# def hash_password(password: str):
#     return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

# def verify_password(password: str, hashed: str):
#     return bcrypt.checkpw(password.encode(), hashed.encode())

# def create_access_token(data: dict):
#     to_encode = data.copy()
#     expire = datetime.utcnow() + timedelta(
#         minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
#     )
#     to_encode.update({"exp": expire})
#     return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

# def verify_token(token: str):
#     try:
#         payload = jwt.decode(
#             token,
#             settings.JWT_SECRET,
#             algorithms=[settings.JWT_ALGORITHM]
#         )
#         return payload
#     except JWTError:
#         return None

# def verify_google_token(token: str):
#     return id_token.verify_oauth2_token(
#         token,
#         requests.Request(),
#         settings.GOOGLE_CLIENT_ID
#     )