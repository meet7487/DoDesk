# # backend/config/settings.py

# import os
# from dotenv import load_dotenv
# from pathlib import Path

# BASE_DIR = Path(__file__).resolve().parent.parent
# load_dotenv(BASE_DIR / ".env")


# class Settings:
#     # ── Database ───────────────────────────────────────────────
#     MONGO_URL                   = os.getenv("MONGO_URL")

#     # ── JWT Auth ───────────────────────────────────────────────
#     JWT_SECRET                  = os.getenv("JWT_SECRET", "fallbacksecret")
#     JWT_ALGORITHM               = os.getenv("JWT_ALGORITHM", "HS256")
#     ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

#     # ── Google OAuth ───────────────────────────────────────────
#     GOOGLE_CLIENT_ID            = os.getenv("GOOGLE_CLIENT_ID")

#     # ── Feature 9 – AI Task Guide (OpenAI) ────────────────────
#     # Install:  pip install openai
#     # Get key:  https://platform.openai.com/api-keys
#     OPENAI_API_KEY              = os.getenv("OPENAI_API_KEY", "")


# settings = Settings()


















# backend/config/settings.py

import os
from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    # ── Existing ───────────────────────────────────────────────
    MONGO_URL                   = os.getenv("MONGO_URL")
    JWT_SECRET                  = os.getenv("JWT_SECRET", "fallbacksecret")
    JWT_ALGORITHM               = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
    GOOGLE_CLIENT_ID            = os.getenv("GOOGLE_CLIENT_ID")

    # ── Feature 9 – AI Task Suggestions (Google Gemini) ───────
    # Get your free key at: https://aistudio.google.com/app/apikey
    # Install SDK: pip install google-genai
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

settings = Settings()








































# # # settings.py

# # import os
# # from dotenv import load_dotenv
# # from pathlib import Path

# # # --- Directory Setup ---
# # # Automatically find the base directory of the project (2 levels up from this file)
# # BASE_DIR = Path(__file__).resolve().parent.parent

# # # Load environment variables from the '.env' file located in the root folder
# # load_dotenv(BASE_DIR / ".env")

# # class Settings:
# #     """
# #     Central Configuration class to store and manage application constants.
# #     Values are fetched from environment variables for security and flexibility.
# #     """

# #     # MongoDB connection string (e.g., mongodb://localhost:27017)
# #     MONGO_URL = os.getenv("MONGO_URL")

# #     # Secret key used to sign JWT tokens. A fallback is provided for safety.
# #     JWT_SECRET = os.getenv("JWT_SECRET", "fallbacksecret")

# #     # The cryptographic algorithm used for JWT (default: HS256)
# #     JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# #     # How long the user stays logged in (converts string value from .env to integer)
# #     ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

# #     # The Unique Client ID provided by Google Cloud Console for OAuth
# #     GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# # # Create a single instance of Settings to be used across the entire application
# # settings = Settings()