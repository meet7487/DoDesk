# backend/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os

from backend.router.auth_router        import router as auth_router
from backend.router.project_router     import router as project_router
from backend.router.team_router        import router as team_router
from backend.router.comment_router     import router as comment_router      
from backend.router.attachment_router  import router as attachment_router   
from backend.router.time_router        import router as time_router         
from backend.router.analytics_router   import router as analytics_router   
from backend.router.activity_router    import router as activity_router     
from backend.router.notification_router import router as notification_router 
from backend.router.search_router      import router as search_router       
from backend.router.ai_router          import router as ai_router            
from backend.router.chatbot_router      import router as chatbot_router       
from backend.utils import verify_token

app = FastAPI(title="DoDesk API")

# ── CORS ─────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ── Static files for uploads ──────────────────────────────────
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── Auth middleware ───────────────────────────────────────────
def get_cors_response(content: dict, status_code: int):
    response = JSONResponse(content=content, status_code=status_code)
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    path = request.url.path
    if request.method == "OPTIONS":
        return await call_next(request)

    # Public paths — no token required
    if (
        path == "/"
        or path.startswith("/api/auth")
        or path.startswith("/docs")
        or path.startswith("/openapi.json")
        or path.startswith("/uploads")
        or path.startswith("/ws")            # WebSocket connections handled separately
    ):
        return await call_next(request)

    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return get_cors_response({"message": "Authorization header missing"}, 401)

    try:
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return get_cors_response({"message": "Invalid token format"}, 401)
        payload = verify_token(parts[1])
        if not payload:
            return get_cors_response({"message": "Invalid or expired token"}, 401)
        request.state.user = payload
    except Exception as e:
        print(f"Middleware Error: {e}")
        return get_cors_response({"message": "Authentication failed"}, 401)

    return await call_next(request)

# ── Routers ───────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(project_router)
app.include_router(team_router)
app.include_router(comment_router)
app.include_router(attachment_router)
app.include_router(time_router)
app.include_router(analytics_router)
app.include_router(activity_router)
app.include_router(notification_router)
app.include_router(search_router)
app.include_router(ai_router)
app.include_router(chatbot_router)

@app.get("/")
async def root():
    return {"message": "DoDesk API is running 🚀"}





























# # backend/main.py
# from fastapi import FastAPI, Request
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# from fastapi.staticfiles import StaticFiles
# import os

# from backend.router.auth_router        import router as auth_router
# from backend.router.project_router     import router as project_router
# from backend.router.team_router        import router as team_router
# from backend.router.comment_router     import router as comment_router      # Feature 3
# from backend.router.attachment_router  import router as attachment_router   # Feature 4
# from backend.router.time_router        import router as time_router         # Feature 5
# from backend.router.analytics_router   import router as analytics_router    # Feature 2
# from backend.router.activity_router    import router as activity_router     # Feature 10
# from backend.router.notification_router import router as notification_router # Feature 1
# from backend.router.search_router      import router as search_router       # Feature 7
# from backend.router.ai_router          import router as ai_router            # Feature 9
# from backend.utils import verify_token

# app = FastAPI(title="DoDesk API")

# # ── CORS ─────────────────────────────────────────────────────
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
#     expose_headers=["*"],
# )

# # ── Static files for uploads ──────────────────────────────────
# os.makedirs("uploads", exist_ok=True)
# app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# # ── Auth middleware ───────────────────────────────────────────
# def get_cors_response(content: dict, status_code: int):
#     response = JSONResponse(content=content, status_code=status_code)
#     response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
#     response.headers["Access-Control-Allow-Credentials"] = "true"
#     return response

# @app.middleware("http")
# async def auth_middleware(request: Request, call_next):
#     path = request.url.path
#     if request.method == "OPTIONS":
#         return await call_next(request)

#     # Public paths — no token required
#     if (
#         path == "/"
#         or path.startswith("/api/auth")
#         or path.startswith("/docs")
#         or path.startswith("/openapi.json")
#         or path.startswith("/uploads")
#         or path.startswith("/ws")            # WebSocket connections handled separately
#     ):
#         return await call_next(request)

#     auth_header = request.headers.get("Authorization")
#     if not auth_header:
#         return get_cors_response({"message": "Authorization header missing"}, 401)

#     try:
#         parts = auth_header.split()
#         if len(parts) != 2 or parts[0].lower() != "bearer":
#             return get_cors_response({"message": "Invalid token format"}, 401)
#         payload = verify_token(parts[1])
#         if not payload:
#             return get_cors_response({"message": "Invalid or expired token"}, 401)
#         request.state.user = payload
#     except Exception as e:
#         print(f"Middleware Error: {e}")
#         return get_cors_response({"message": "Authentication failed"}, 401)

#     return await call_next(request)

# # ── Routers ───────────────────────────────────────────────────
# app.include_router(auth_router)
# app.include_router(project_router)
# app.include_router(team_router)
# app.include_router(comment_router)
# app.include_router(attachment_router)
# app.include_router(time_router)
# app.include_router(analytics_router)
# app.include_router(activity_router)
# app.include_router(notification_router)
# app.include_router(search_router)
# app.include_router(ai_router)

# @app.get("/")
# async def root():
#     return {"message": "DoDesk API is running 🚀"}



































# # backend/main.py
# from fastapi import FastAPI, Request
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse

# # Importing custom routers and utility functions from other files
# from backend.router.auth_router import router as auth_router
# from backend.router.project_router import router as project_router
# from backend.router.team_router import router as team_router
# from backend.utils import verify_token

# # Initialize the FastAPI application with a custom title
# app = FastAPI(title="DoDesk API")

# # ===============================
# # CORS (Cross-Origin Resource Sharing) Configuration
# # ===============================
# # This allows your Frontend (React/Vite) to talk to this Backend API
# app.add_middleware(
#     CORSMiddleware,
#     # List of allowed URLs that can access this API
#     allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
#     allow_credentials=True, # Allows cookies and auth headers
#     allow_methods=["*"],    # Allows all HTTP methods (GET, POST, PUT, DELETE, etc.)
#     allow_headers=["*"],    # Allows all custom headers
#     expose_headers=["*"]    # Makes all headers visible to the frontend
# )

# # Helper function to manually inject CORS headers into JSON responses
# # Useful for returning errors from the middleware where standard CORS might fail
# def get_cors_response(content: dict, status_code: int):
#     response = JSONResponse(content=content, status_code=status_code)
#     response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
#     response.headers["Access-Control-Allow-Credentials"] = "true"
#     return response

# # ===============================
# # AUTH MIDDLEWARE
# # ===============================
# # This function runs automatically for every incoming HTTP request
# @app.middleware("http")
# async def auth_middleware(request: Request, call_next):
#     path = request.url.path

#     # Skip authentication for 'OPTIONS' requests (pre-flight checks by browsers)
#     if request.method == "OPTIONS":
#         return await call_next(request)

#     # Whitelist: These paths do NOT require a token to be accessed
#     if (
#         path == "/"
#         or path.startswith("/api/auth")   # Login/Signup routes
#         or path.startswith("/docs")       # Swagger UI documentation
#         or path.startswith("/openapi.json") # API schema
#     ):
#         return await call_next(request)

#     # Check for the Authorization header (usually: Bearer <token>)
#     auth_header = request.headers.get("Authorization")
#     if not auth_header:
#         return get_cors_response({"message": "Authorization header missing"}, 401)

#     try:
#         # Split 'Bearer' and the 'Token' string
#         parts = auth_header.split()
#         if len(parts) != 2 or parts[0].lower() != "bearer":
#             return get_cors_response({"message": "Invalid token format"}, 401)

#         token = parts[1]
#         # Validate the token using the helper function
#         payload = verify_token(token)

#         if not payload:
#             return get_cors_response({"message": "Invalid or expired token"}, 401)

#         # Store user details in 'request.state' so they are available in the routes
#         request.state.user = payload
#     except Exception as e:
#         print(f"Middleware Error: {e}")
#         return get_cors_response({"message": "Authentication failed"}, 401)

#     # Proceed to the actual route handler if authentication is successful
#     return await call_next(request)

# # Registering specialized routers for different features
# app.include_router(auth_router)    # Handles Login/Signup
# app.include_router(project_router) # Handles Projects
# app.include_router(team_router)    # Handles Teams

# # Basic Root Route to check if API is alive
# @app.get("/")
# async def root():
#     return {"message": "DoDesk API is running 🚀"}





# To run the server, use the command:
# python -m uvicorn backend.main:app --reload


























# from fastapi import FastAPI, Request
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse

# from backend.router.auth_router import router as auth_router
# from backend.router.project_router import router as project_router
# from backend.router.team_router import router as team_router
# from backend.utils import verify_token


# app = FastAPI(title="DoDesk API")


# # ===============================
# # CORS Configuration (React Vite)
# # ===============================
# origins = [
#     "http://localhost:5173",
#     "http://127.0.0.1:5173",
# ]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,   # React frontend
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# # ===============================
# # AUTH MIDDLEWARE
# # ===============================
# @app.middleware("http")
# async def auth_middleware(request: Request, call_next):

#     path = request.url.path

#     # Allow CORS preflight requests
#     if request.method == "OPTIONS":
#         return await call_next(request)

#     # Public routes (no token required)
#     if (
#         path == "/"
#         or path.startswith("/api/auth")
#         or path.startswith("/docs")
#         or path.startswith("/openapi.json")
#     ):
#         return await call_next(request)

#     # Check Authorization header
#     auth_header = request.headers.get("Authorization")

#     if not auth_header:
#         return JSONResponse(
#             status_code=401,
#             content={"message": "Authorization header missing"},
#         )

#     try:
#         token = auth_header.split(" ")[1]
#         payload = verify_token(token)

#         if not payload:
#             return JSONResponse(
#                 status_code=401,
#                 content={"message": "Invalid token"},
#             )

#     except Exception:
#         return JSONResponse(
#             status_code=401,
#             content={"message": "Token error"},
#         )

#     return await call_next(request)


# # ===============================
# # ROUTERS
# # ===============================
# app.include_router(auth_router)
# app.include_router(project_router)
# app.include_router(team_router)


# # ===============================
# # ROOT TEST ROUTE
# # ===============================
# @app.get("/")
# async def root():
#     return {"message": "DoDesk API is running 🚀"}













# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from backend.router.auth_router import router as auth_router
# from backend.router.project_router import router as project_router

# app = FastAPI(title="DoDesk API")

# # ✅ CORS Configuration for Vite React (Port 5173)
# origins = [
#     "http://localhost:5173",
#     "http://127.0.0.1:5173",
# ]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,      # only allow frontend
#     allow_credentials=False,    # JWT header-based auth → no cookies
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# # Routers
# app.include_router(auth_router)
# app.include_router(project_router)


# # Root test route (optional but useful)
# @app.get("/")
# async def root():
#     return {"message": "DoDesk API is running 🚀"}





# #  python -m uvicorn backend.main:app --reload