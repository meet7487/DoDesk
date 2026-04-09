# backend/db.py
from motor.motor_asyncio import AsyncIOMotorClient
from backend.config.settings import settings

client = AsyncIOMotorClient(settings.MONGO_URL)
db     = client.get_database("dodesk")

# ── Existing collections ──────────────────────────────────────
users_collection    = db.get_collection("users")
projects_collection = db.get_collection("projects")
teams_collection    = db.get_collection("teams")

# ── New collections for added features ───────────────────────
comments_collection    = db.get_collection("comments")       # Feature 3 – Task Comments
attachments_collection = db.get_collection("attachments")    # Feature 4 – File Attachments
time_logs_collection   = db.get_collection("time_logs")      # Feature 5 – Time Tracking
activity_logs_collection = db.get_collection("activity_logs")# Feature 10 – Activity Log
notifications_collection = db.get_collection("notifications")# Feature 1 – Notifications

































# # backend/db.py

# # Import the asynchronous MongoDB driver for Python
# from motor.motor_asyncio import AsyncIOMotorClient
# # Import the application settings (like database URLs) from your config file
# from backend.config.settings import settings

# # Initialize the MongoDB client using the connection URL from your settings
# client = AsyncIOMotorClient(settings.MONGO_URL)

# # Connect to the specific database named "dodesk"
# db = client.get_database("dodesk")

# # --- Collections Setup ---
# # These variables act as direct references to specific tables (collections) in MongoDB

# # Reference for storing and managing user data
# users_collection = db.get_collection("users")

# # Reference for storing and managing project-related data
# projects_collection = db.get_collection("projects")

# # Reference for storing and managing team-related data
# teams_collection = db.get_collection("teams")