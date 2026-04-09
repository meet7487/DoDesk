# backend/router/chatbot_router.py
# DoDesk Chatbot — conversational task management assistant
#
# Supports intents:
#   create_task    — "create a task called X with deadline Y and priority Z"
#   get_tasks      — "show my tasks", "list all tasks"
#   update_status  — "mark X as completed", "start task X"
#   get_summary    — "summarise my work", "how many tasks are done?"
#   general_help   — any other question about DoDesk
#
# Each user message is analysed by GPT-4o-mini which returns a structured
# JSON intent + extracted entities.  The router then performs the actual
# DB operation and returns a natural-language reply + optional data payload.

from fastapi import APIRouter, Body, Depends, HTTPException
from backend.dependencies import get_current_user
from backend.config.settings import settings
from backend.db import projects_collection
from datetime import datetime, timedelta
from typing import Tuple
from bson import ObjectId
import uuid, json, re

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])

# ── OpenAI helper (reuses same key as ai_router) ─────────────
def _get_client():
    try:
        from openai import OpenAI
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="openai package not installed. Run: pip install openai",
        )
    key = settings.OPENAI_API_KEY
    if not key or not key.strip():
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY is missing from your .env file.",
        )
    from openai import OpenAI
    return OpenAI(api_key=key)


# ── Intent detection via GPT-4o-mini ─────────────────────────
def _detect_intent(client, message: str, conversation_history: list) -> dict:
    """
    Send the user message to GPT-4o-mini.
    Returns a JSON object with intent + extracted entities.
    """
    system_prompt = """You are the intent-detection engine for DoDesk, a project management app.

Analyse the user's message and return ONLY a valid JSON object — no markdown, no extra text.

Supported intents:
- create_task   : user wants to create / add a task
- get_tasks     : user wants to see / list / show tasks
- update_status : user wants to change a task's status (start, complete, mark as done, etc.)
- get_summary   : user wants a summary, count, stats, or overview of tasks
- general_help  : anything else (questions about DoDesk, greetings, help requests)

Return this exact structure:
{
  "intent": "<one of the five intents above>",
  "entities": {
    "task_name":   "<extracted task title or null>",
    "deadline":    "<YYYY-MM-DD if mentioned, or null>",
    "priority":    "<High | Medium | Low or null>",
    "status":      "<In progress | Started | Completed or null>",
    "project_name":"<project name if mentioned or null>",
    "filter_status":"<status to filter by when listing tasks or null>"
  },
  "reply_hint": "<1-sentence natural reply to give the user based on what you're about to do>"
}

Deadline parsing rules:
- "tomorrow"      → today + 1 day
- "next week"     → today + 7 days
- "in 3 days"     → today + 3 days
- "Friday"        → nearest upcoming Friday
- explicit dates  → convert to YYYY-MM-DD
- Today's date for reference: """ + datetime.now().strftime("%Y-%m-%d") + """

Priority parsing rules:
- urgent / high / important → High
- normal / medium           → Medium
- low / minor / later       → Low

Status update rules:
- start / begin / working on → Started
- done / complete / finished → Completed
- in progress / resume       → In progress"""

    # Build messages with conversation history for context
    messages = [{"role": "system", "content": system_prompt}]
    for turn in conversation_history[-6:]:  # last 6 turns for context
        messages.append({"role": turn["role"], "content": turn["content"]})
    messages.append({"role": "user", "content": message})

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=400,
        )
        raw = response.choices[0].message.content.strip()
        clean = re.sub(r"```(?:json)?|```", "", raw).strip()
        return json.loads(clean)
    except Exception as e:
        err = str(e).lower()
        if "authentication" in err or "api_key" in err or "401" in err:
            raise HTTPException(status_code=503, detail="Invalid OpenAI API key.")
        if "429" in err or "rate_limit" in err:
            raise HTTPException(status_code=429, detail="Rate limit reached. Please wait a moment.")
        raise HTTPException(status_code=503, detail=f"AI error: {str(e)}")


# ── Reply generation via GPT-4o-mini ─────────────────────────
async def _generate_reply(client, message: str, context: str, conversation_history: list) -> str:
    """Generate a warm, conversational final reply given the outcome of the action."""
    system = """You are the DoDesk AI assistant — friendly, concise, and helpful.
You help users manage projects and tasks through chat.
Keep replies short (2-4 sentences max).
Use plain English, no markdown formatting.
Never invent task data — only reference what the context tells you."""

    messages = [{"role": "system", "content": system}]
    for turn in conversation_history[-4:]:
        messages.append({"role": turn["role"], "content": turn["content"]})
    messages.append({
        "role": "user",
        "content": f"User said: {message}\n\nOutcome: {context}\n\nGenerate a friendly reply."
    })

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.6,
            max_tokens=200,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return context  # fall back to the plain context string


# ── DB helpers ────────────────────────────────────────────────
async def _get_user_projects(user_id: str):
    """Return all projects the user has access to."""
    projects = await projects_collection.find(
        {"created_by": user_id}
    ).to_list(length=100)
    return projects


async def _find_task_by_name(user_id: str, name: str):
    """Find the first task whose name contains the given string (case-insensitive)."""
    projects = await _get_user_projects(user_id)
    name_lower = name.lower().strip()
    for proj in projects:
        for task in proj.get("tasks", []):
            if name_lower in task.get("name", "").lower():
                return proj, task
    return None, None


def _serialize(obj):
    """Make MongoDB documents JSON-serialisable."""
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items() if k != "_id" or True}
    if isinstance(obj, list):
        return [_serialize(i) for i in obj]
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj


# ── Intent handlers ───────────────────────────────────────────

async def _handle_create_task(entities: dict, user_id: str) -> Tuple[str, dict]:
    task_name = (entities.get("task_name") or "").strip()
    if not task_name:
        return "Please tell me the task name so I can create it for you.", {}

    priority  = entities.get("priority") or "Medium"
    if priority not in ("High", "Medium", "Low"):
        priority = "Medium"

    deadline = entities.get("deadline") or ""

    # Find the best project to add to — the user's most recent project
    projects = await projects_collection.find(
        {"created_by": user_id}
    ).sort("created_at", -1).to_list(length=50)

    # Try to match by project name if provided
    proj_name = (entities.get("project_name") or "").strip().lower()
    target_project = None
    if proj_name:
        for p in projects:
            if proj_name in p.get("name", "").lower():
                target_project = p
                break
    if not target_project and projects:
        target_project = projects[0]

    if not target_project:
        return (
            "You don't have any projects yet. Please create a project first, then I can add tasks to it.",
            {}
        )

    new_task = {
        "_id":        str(uuid.uuid4()),
        "name":       task_name,
        "description": "",
        "assignee":   "",
        "deadline":   deadline,
        "status":     "In progress",
        "priority":   priority,
        "created_at": datetime.utcnow().isoformat(),
    }

    await projects_collection.update_one(
        {"_id": target_project["_id"]},
        {"$push": {"tasks": new_task}}
    )

    context = (
        f"Task '{task_name}' was successfully created in project '{target_project['name']}' "
        f"with priority {priority}"
        + (f" and deadline {deadline}." if deadline else ".")
    )
    return context, {
        "action":   "task_created",
        "task":     new_task,
        "project":  target_project.get("name", ""),
    }


async def _handle_get_tasks(entities: dict, user_id: str) -> Tuple[str, dict]:
    projects = await _get_user_projects(user_id)
    filter_status = (entities.get("filter_status") or "").strip().lower()

    all_tasks = []
    for proj in projects:
        for task in proj.get("tasks", []):
            t = dict(task)
            t["project_name"] = proj.get("name", "")
            all_tasks.append(t)

    # Apply status filter if provided
    if filter_status:
        status_map = {
            "completed": "Completed",
            "done":      "Completed",
            "started":   "Started",
            "in progress": "In progress",
            "active":    "In progress",
        }
        mapped = status_map.get(filter_status)
        if mapped:
            all_tasks = [t for t in all_tasks if t.get("status") == mapped]

    # Overdue filter
    if "overdue" in filter_status:
        today = datetime.now().date().isoformat()
        all_tasks = [
            t for t in all_tasks
            if t.get("deadline") and t.get("deadline") < today
               and t.get("status") != "Completed"
        ]

    context = (
        f"Found {len(all_tasks)} task(s)"
        + (f" with status filter '{filter_status}'" if filter_status else "")
        + "."
    )
    return context, {
        "action": "tasks_listed",
        "tasks":  _serialize(all_tasks),
        "count":  len(all_tasks),
    }


async def _handle_update_status(entities: dict, user_id: str) -> Tuple[str, dict]:
    task_name = (entities.get("task_name") or "").strip()
    new_status = (entities.get("status") or "").strip()

    if not task_name:
        return "Please tell me which task you want to update.", {}

    valid_statuses = {"In progress", "Started", "Completed"}
    if new_status not in valid_statuses:
        return (
            f"I couldn't understand the status. You can set a task to "
            f"'In progress', 'Started', or 'Completed'.", {}
        )

    proj, task = await _find_task_by_name(user_id, task_name)
    if not proj or not task:
        return f"I couldn't find a task matching '{task_name}' in your projects.", {}

    task_id = task.get("_id") or task.get("id")

    await projects_collection.update_one(
        {"_id": proj["_id"], "tasks._id": task_id},
        {"$set": {"tasks.$.status": new_status}}
    )

    context = (
        f"Task '{task.get('name')}' in project '{proj.get('name')}' "
        f"has been updated to '{new_status}'."
    )
    return context, {
        "action":     "status_updated",
        "task_name":  task.get("name"),
        "project":    proj.get("name"),
        "new_status": new_status,
    }


async def _handle_get_summary(user_id: str) -> Tuple[str, dict]:
    projects = await _get_user_projects(user_id)
    today = datetime.now().date().isoformat()

    total = completed = started = in_progress = overdue = 0
    high = medium = low = 0

    for proj in projects:
        for task in proj.get("tasks", []):
            total += 1
            s = task.get("status", "")
            p = task.get("priority", "")
            d = task.get("deadline", "")

            if s == "Completed":     completed   += 1
            elif s == "Started":     started     += 1
            elif s == "In progress": in_progress += 1

            if s != "Completed" and d and d < today:
                overdue += 1

            if p == "High":   high   += 1
            elif p == "Medium": medium += 1
            elif p == "Low":  low    += 1

    completion_rate = round((completed / total * 100)) if total else 0

    summary = {
        "total_projects": len(projects),
        "total_tasks":    total,
        "completed":      completed,
        "started":        started,
        "in_progress":    in_progress,
        "overdue":        overdue,
        "completion_rate": completion_rate,
        "by_priority":    {"High": high, "Medium": medium, "Low": low},
    }

    context = (
        f"You have {len(projects)} project(s) and {total} task(s) in total. "
        f"{completed} completed, {in_progress} in progress, {started} started, "
        f"{overdue} overdue. Overall completion rate: {completion_rate}%."
    )
    return context, {"action": "summary", "summary": summary}


async def _handle_general_help(client, message: str, conversation_history: list) -> Tuple[str, dict]:
    """Use GPT to answer a general DoDesk question."""
    system = """You are the DoDesk assistant. DoDesk is a project management web app.
Help the user with questions about DoDesk features. Be concise (3-5 sentences max).

DoDesk features: Projects, Tasks (Table + Kanban board), Teams, Dashboard analytics,
Calendar view, Advanced Search, AI Guide (step-by-step task completion), Comments,
File attachments, Time tracking, Notifications, Dark/light theme.

If the user greets you, greet them back and briefly explain what you can do."""

    messages = [{"role": "system", "content": system}]
    for turn in conversation_history[-4:]:
        messages.append({"role": turn["role"], "content": turn["content"]})
    messages.append({"role": "user", "content": message})

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7,
            max_tokens=300,
        )
        reply = response.choices[0].message.content.strip()
    except Exception:
        reply = (
            "I'm DoDesk's assistant. I can help you create tasks, list your tasks, "
            "update task status, or give you a summary of your work. Try saying "
            "'Show my tasks' or 'Create a task called Design Login Page'."
        )

    return reply, {"action": "general_help"}


# ── Main chatbot endpoint ─────────────────────────────────────
@router.post("/message")
async def chatbot_message(
    body: dict = Body(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Process a single user message.

    Request body:
    {
      "message": "Create a task called Fix Login Bug with high priority",
      "conversation_history": [
        { "role": "user",      "content": "..." },
        { "role": "assistant", "content": "..." }
      ]
    }

    Response:
    {
      "reply":   "Done! I've created 'Fix Login Bug' with High priority...",
      "intent":  "create_task",
      "data":    { ... action-specific payload ... }
    }
    """
    message = (body.get("message") or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    conversation_history = body.get("conversation_history") or []
    user_id = str(current_user.get("_id") or current_user.get("id", ""))

    client = _get_client()

    # Step 1: Detect intent and extract entities
    intent_result = _detect_intent(client, message, conversation_history)
    intent   = intent_result.get("intent", "general_help")
    entities = intent_result.get("entities", {})

    # Step 2: Execute the corresponding action
    if intent == "create_task":
        context, data = await _handle_create_task(entities, user_id)

    elif intent == "get_tasks":
        context, data = await _handle_get_tasks(entities, user_id)

    elif intent == "update_status":
        context, data = await _handle_update_status(entities, user_id)

    elif intent == "get_summary":
        context, data = await _handle_get_summary(user_id)

    else:
        # general_help or unknown intent
        context, data = await _handle_general_help(client, message, conversation_history)
        return {"reply": context, "intent": intent, "data": data}

    # Step 3: Generate a warm conversational reply
    reply = await _generate_reply(client, message, context, conversation_history)

    return {"reply": reply, "intent": intent, "data": data}