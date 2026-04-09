# backend/router/ai_router.py
# Feature 9 – AI-Based Task Suggestions & Completion Guide  (OpenAI)
#
# Uses OpenAI gpt-4o-mini — fast, accurate, low cost.
#
# Setup:
#   1. pip install openai
#   2. Add to backend/.env:   OPENAI_API_KEY=sk-...
#   3. Get your key at:       https://platform.openai.com/api-keys

from fastapi import APIRouter, Body, Depends, HTTPException
from backend.dependencies import get_current_user
from backend.config.settings import settings
from datetime import datetime, timedelta
import json, re

router = APIRouter(prefix="/api/ai", tags=["AI"])

# ── Model to use ──────────────────────────────────────────────
OPENAI_MODEL = "gpt-3.5-turbo"


# ── OpenAI client helper ──────────────────────────────────────
def _get_client():
    """
    Returns a configured OpenAI client.
    Raises a clear 503 if the package is missing or the key is not set.
    """
    try:
        from openai import OpenAI
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail=(
                "openai package is not installed. "
                "Run: pip install openai"
            ),
        )

    key = settings.OPENAI_API_KEY
    if not key or not key.strip():
        raise HTTPException(
            status_code=503,
            detail=(
                "OpenAI API key is missing. "
                "Add  OPENAI_API_KEY=sk-...  to your backend .env file. "
                "Get your key at https://platform.openai.com/api-keys"
            ),
        )

    from openai import OpenAI
    return OpenAI(api_key=key)


def _call_openai(client, prompt: str) -> dict:
    """
    Send prompt to OpenAI, parse JSON response.
    Uses response_format=json_object to guarantee valid JSON output.
    Handles common errors with clear, user-friendly messages.
    """
    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a project management assistant. "
                        "Always respond with valid JSON only — no markdown, no extra text."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=2000,
        )
        raw_text = response.choices[0].message.content.strip()

    except Exception as e:
        err = str(e).lower()
        if "authentication" in err or "api_key" in err or "401" in err or "incorrect api key" in err:
            raise HTTPException(
                status_code=503,
                detail="Invalid OpenAI API key. Check OPENAI_API_KEY in your .env file.",
            )
        if "rate_limit" in err or "429" in err:
            raise HTTPException(
                status_code=429,
                detail="OpenAI rate limit reached. Please wait a few seconds and try again.",
            )
        if "quota" in err or "billing" in err or "insufficient_quota" in err:
            raise HTTPException(
                status_code=503,
                detail=(
                    "OpenAI quota exceeded. "
                    "Check your billing at https://platform.openai.com/billing"
                ),
            )
        if "model" in err and ("not found" in err or "does not exist" in err):
            raise HTTPException(
                status_code=503,
                detail=f"OpenAI model '{OPENAI_MODEL}' not found. Check your API key has access to this model.",
            )
        raise HTTPException(status_code=503, detail=f"OpenAI error: {str(e)}")

    # Strip accidental markdown fences (defensive — json_object mode usually prevents them)
    clean = re.sub(r"```(?:json)?|```", "", raw_text).strip()
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="AI returned an unexpected format. Please try again.",
        )


# ── POST /api/ai/suggest-task ─────────────────────────────────
@router.post("/suggest-task")
async def suggest_task(
    body: dict = Body(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Accepts task name + description, calls OpenAI, returns:
    priority, deadline, confidence, reasoning, sub-tasks, estimated hours.
    """
    task_name   = (body.get("name",        "") or "").strip()
    description = (body.get("description", "") or "").strip()

    if not task_name and not description:
        raise HTTPException(
            status_code=400,
            detail="Provide at least a task name or description.",
        )

    context_block = ""
    if task_name:
        context_block += f"Task name: {task_name}\n"
    if description:
        context_block += f"Task description: {description}"

    prompt = f"""You are an expert project management assistant for a software development team.

Analyze the following task and provide intelligent recommendations:

{context_block}

Respond ONLY with a valid JSON object — no markdown, no extra text.

{{
  "priority": "Low" | "Medium" | "High",
  "deadline_days": <integer 1-90>,
  "confidence": <integer 0-100>,
  "reasoning": "<1-2 sentence explanation of your priority and deadline choices>",
  "sub_tasks": [
    "<actionable sub-task 1>",
    "<actionable sub-task 2>",
    "<actionable sub-task 3>"
  ],
  "estimated_hours": <integer 1-100>
}}

Guidelines:
- "High"   = urgent, blocking, security-related, or client-facing
- "Medium" = important but not immediately blocking
- "Low"    = nice-to-have, refactoring, or documentation
- deadline_days = realistic calendar days to complete the task
- sub_tasks = 3-5 specific, actionable steps to complete this task
- estimated_hours = realistic total work hours
- confidence = 100 if task is obvious, 60 if description is ambiguous"""

    client = _get_client()
    data   = _call_openai(client, prompt)

    # Sanitise & validate
    priority = data.get("priority", "Medium")
    if priority not in ("Low", "Medium", "High"):
        priority = "Medium"

    deadline_days = max(1, min(int(data.get("deadline_days",  7)), 90))
    confidence    = max(0, min(int(data.get("confidence",    70)), 100))
    estimated_hrs = max(1, int(data.get("estimated_hours",   4)))

    sub_tasks = data.get("sub_tasks", [])
    if not isinstance(sub_tasks, list):
        sub_tasks = []
    sub_tasks = [str(s) for s in sub_tasks[:5]]

    reasoning      = str(data.get("reasoning", ""))
    suggested_date = (datetime.now() + timedelta(days=deadline_days)).strftime("%Y-%m-%d")

    return {
        "priority":        priority,
        "deadline_days":   deadline_days,
        "suggested_date":  suggested_date,
        "confidence":      confidence,
        "reasoning":       reasoning,
        "sub_tasks":       sub_tasks,
        "estimated_hours": estimated_hrs,
    }


# ── POST /api/ai/guide-task ───────────────────────────────────
@router.post("/guide-task")
async def guide_task(
    body: dict = Body(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Accepts task details, calls OpenAI, returns a step-by-step
    completion guide so the employee knows exactly how to do the task.
    """
    task_name   = (body.get("name",        "") or "").strip()
    description = (body.get("description", "") or "").strip()
    priority    = (body.get("priority",    "Medium") or "Medium").strip()
    status      = (body.get("status",      "") or "").strip()

    if not task_name:
        raise HTTPException(status_code=400, detail="Task name is required.")

    context = f"Task name: {task_name}\n"
    if description:
        context += f"Task description: {description}\n"
    context += f"Priority: {priority}\n"
    if status:
        context += f"Current status: {status}"

    prompt = f"""You are a senior software engineer and project management expert helping a development team member complete a task.

The team member has been assigned the following task and needs a thorough, expert-level guide to complete it successfully.

{context}

Your response must be a SINGLE valid JSON object — no markdown fences, no extra text outside the JSON.

{{
  "summary": "<3-5 sentence high-level overview: what this task is about, why it matters, and what the end goal looks like>",
  "description_breakdown": {{
    "what_it_means": "<2-4 sentences: explain the task description in plain language — what exactly is being asked, broken down clearly so anyone can understand it>",
    "why_it_matters": "<2-3 sentences: explain the business or technical reason this task exists and why it needs to be done properly>",
    "scope": "<2-3 sentences: define the exact boundaries of this task — what is IN scope and what is explicitly OUT of scope>",
    "key_concepts": ["<concept or term the employee needs to understand>", "<another key concept>"]
  }},
  "estimated_hours": <integer 1-100>,
  "difficulty": "Easy" | "Medium" | "Hard",
  "tools_needed": ["<specific tool, library, or technology>"],
  "steps": [
    {{
      "title": "<short step title, max 6 words>",
      "detail": "<4-6 sentence thorough explanation: what to do, how to do it, what decisions to make, and what the output of this step should be>",
      "sub_points": ["<specific action or command within this step>", "<another sub-action>"]
    }}
  ],
  "expected_outcome": "<3-4 sentences: describe exactly what the completed task looks like — what should work, what should exist, and how to verify it is truly done>",
  "tips": [
    "<specific, actionable best practice or shortcut that saves time or improves quality>",
    "<another practical tip>"
  ],
  "watch_out": [
    "<specific common mistake with an explanation of why it happens and how to avoid it>",
    "<another pitfall with context>"
  ]
}}

Strict rules:
- summary: 3-5 sentences, comprehensive overview
- description_breakdown: always include all four fields — this is the most important section
- description_breakdown.key_concepts: 2-5 terms the employee must understand to do this task
- steps: 5-10 entries, ordered chronologically, covering the FULL workflow from start to finish
- steps[].detail: minimum 4 sentences — be thorough, not brief
- steps[].sub_points: 2-4 specific actions, commands, or decisions within that step
- expected_outcome: always include — this tells the employee when they are truly done
- tips: 3-5 entries — specific and actionable, never generic
- watch_out: 2-4 entries — explain WHY each pitfall happens, not just what it is
- tools_needed: list specific packages, frameworks, tools with version hints if relevant
- difficulty: Easy = routine well-understood work, Medium = requires design decisions, Hard = complex/high-risk
- Every field must be populated — never return null or empty arrays"""

    client = _get_client()
    data   = _call_openai(client, prompt)

    # Sanitise & validate
    steps_raw = data.get("steps", [])
    if not isinstance(steps_raw, list):
        steps_raw = []
    steps = []
    for s in steps_raw[:10]:
        sub = s.get("sub_points", [])
        if not isinstance(sub, list):
            sub = []
        steps.append({
            "title":      str(s.get("title",  "")),
            "detail":     str(s.get("detail", "")),
            "sub_points": [str(p) for p in sub[:4]],
        })

    tips      = [str(t) for t in (data.get("tips",         []) or [])[:5]]
    watch_out = [str(w) for w in (data.get("watch_out",    []) or [])[:4]]
    tools     = [str(t) for t in (data.get("tools_needed", []) or [])[:8]]

    difficulty = data.get("difficulty", "Medium")
    if difficulty not in ("Easy", "Medium", "Hard"):
        difficulty = "Medium"

    # description_breakdown — always return all sub-fields
    db_raw = data.get("description_breakdown", {}) or {}
    description_breakdown = {
        "what_it_means": str(db_raw.get("what_it_means", "")),
        "why_it_matters": str(db_raw.get("why_it_matters", "")),
        "scope":          str(db_raw.get("scope", "")),
        "key_concepts":   [str(k) for k in (db_raw.get("key_concepts", []) or [])[:5]],
    }

    return {
        "summary":               str(data.get("summary", "")),
        "description_breakdown": description_breakdown,
        "estimated_hours":       max(1, int(data.get("estimated_hours", 4))),
        "difficulty":            difficulty,
        "tools_needed":          tools,
        "steps":                 steps,
        "expected_outcome":      str(data.get("expected_outcome", "")),
        "tips":                  tips,
        "watch_out":             watch_out,
    }
















# # backend/router/ai_router.py
# # Feature 9 – AI-Based Task Suggestions & Completion Guide  (Google Gemini)
# #
# # Uses Google Gemini 2.0 Flash via the new google-genai SDK.
# #
# # Setup:
# #   1. pip install google-genai          ← new SDK (replaces google-generativeai)
# #   2. Add to backend/.env:   GEMINI_API_KEY=AIza...
# #   3. Get your free key at:  https://aistudio.google.com/app/apikey

# from fastapi import APIRouter, Body, Depends, HTTPException
# from backend.dependencies import get_current_user
# from backend.config.settings import settings
# from datetime import datetime, timedelta
# import json, re

# router = APIRouter(prefix="/api/ai", tags=["AI"])


# # ── Gemini client helper ──────────────────────────────────────
# # Model to use — gemini-2.0-flash is the current stable fast model
# GEMINI_MODEL = "gemini-2.0-flash"


# def _get_client():
#     """
#     Returns a configured google-genai Client.
#     Raises a clear 503 if the package is missing or the key is not set.
#     """
#     try:
#         from google import genai
#     except ImportError:
#         raise HTTPException(
#             status_code=503,
#             detail=(
#                 "google-genai package is not installed. "
#                 "Run: pip install google-genai"
#             ),
#         )

#     key = settings.GEMINI_API_KEY
#     if not key or not key.strip():
#         raise HTTPException(
#             status_code=503,
#             detail=(
#                 "Gemini API key is missing. "
#                 "Add  GEMINI_API_KEY=AIza...  to your backend .env file. "
#                 "Get a free key at https://aistudio.google.com/app/apikey"
#             ),
#         )

#     from google import genai
#     return genai.Client(api_key=key)


# def _call_gemini(client, prompt: str) -> dict:
#     """
#     Send prompt to Gemini 2.0 Flash, parse JSON response.
#     Uses the new google-genai SDK (google.genai.Client).
#     Handles common errors with clear messages.
#     """
#     from google.genai import types

#     try:
#         response = client.models.generate_content(
#             model=GEMINI_MODEL,
#             contents=prompt,
#             config=types.GenerateContentConfig(
#                 temperature=0.3,
#                 top_p=0.95,
#                 top_k=40,
#                 response_mime_type="application/json",  # forces JSON output
#             ),
#         )
#         raw_text = response.text.strip()
#     except Exception as e:
#         err = str(e).lower()
#         if "api_key" in err or "invalid" in err or "403" in err or "401" in err:
#             raise HTTPException(
#                 status_code=503,
#                 detail="Invalid Gemini API key. Check GEMINI_API_KEY in your .env file.",
#             )
#         if "quota" in err or "429" in err or "resource" in err:
#             raise HTTPException(
#                 status_code=429,
#                 detail="Gemini rate limit reached. Please wait a few seconds and try again.",
#             )
#         if "not found" in err or "404" in err:
#             raise HTTPException(
#                 status_code=503,
#                 detail=f"Gemini model not found. Ensure your API key has access to {GEMINI_MODEL}.",
#             )
#         raise HTTPException(status_code=503, detail=f"Gemini error: {str(e)}")

#     # Strip accidental markdown fences
#     clean = re.sub(r"```(?:json)?|```", "", raw_text).strip()
#     try:
#         return json.loads(clean)
#     except json.JSONDecodeError:
#         raise HTTPException(
#             status_code=500,
#             detail="AI returned an unexpected format. Please try again.",
#         )


# # ── POST /api/ai/suggest-task ─────────────────────────────────
# @router.post("/suggest-task")
# async def suggest_task(
#     body: dict = Body(...),
#     current_user: dict = Depends(get_current_user),
# ):
#     """
#     Accepts task name + description, calls Gemini, returns:
#     priority, deadline, confidence, reasoning, sub-tasks, estimated hours.
#     """
#     task_name   = (body.get("name",        "") or "").strip()
#     description = (body.get("description", "") or "").strip()

#     if not task_name and not description:
#         raise HTTPException(
#             status_code=400,
#             detail="Provide at least a task name or description.",
#         )

#     context_block = ""
#     if task_name:
#         context_block += f"Task name: {task_name}\n"
#     if description:
#         context_block += f"Task description: {description}"

#     prompt = f"""You are an expert project management assistant for a software development team.

# Analyze the following task and provide intelligent recommendations:

# {context_block}

# Respond ONLY with a valid JSON object — no markdown, no extra text.

# {{
#   "priority": "Low" | "Medium" | "High",
#   "deadline_days": <integer 1-90>,
#   "confidence": <integer 0-100>,
#   "reasoning": "<1-2 sentence explanation of your priority and deadline choices>",
#   "sub_tasks": [
#     "<actionable sub-task 1>",
#     "<actionable sub-task 2>",
#     "<actionable sub-task 3>"
#   ],
#   "estimated_hours": <integer 1-100>
# }}

# Guidelines:
# - "High"   = urgent, blocking, security-related, or client-facing
# - "Medium" = important but not immediately blocking
# - "Low"    = nice-to-have, refactoring, or documentation
# - deadline_days = realistic calendar days to complete the task
# - sub_tasks = 3-5 specific, actionable steps to complete this task
# - estimated_hours = realistic total work hours
# - confidence = 100 if task is obvious, 60 if description is ambiguous"""

#     client = _get_client()
#     data   = _call_gemini(client, prompt)

#     # Sanitise & validate
#     priority = data.get("priority", "Medium")
#     if priority not in ("Low", "Medium", "High"):
#         priority = "Medium"

#     deadline_days  = max(1, min(int(data.get("deadline_days",  7)), 90))
#     confidence     = max(0, min(int(data.get("confidence",    70)), 100))
#     estimated_hrs  = max(1, int(data.get("estimated_hours",   4)))

#     sub_tasks = data.get("sub_tasks", [])
#     if not isinstance(sub_tasks, list):
#         sub_tasks = []
#     sub_tasks = [str(s) for s in sub_tasks[:5]]

#     reasoning      = str(data.get("reasoning", ""))
#     suggested_date = (datetime.now() + timedelta(days=deadline_days)).strftime("%Y-%m-%d")

#     return {
#         "priority":        priority,
#         "deadline_days":   deadline_days,
#         "suggested_date":  suggested_date,
#         "confidence":      confidence,
#         "reasoning":       reasoning,
#         "sub_tasks":       sub_tasks,
#         "estimated_hours": estimated_hrs,
#     }


# # ── POST /api/ai/guide-task ───────────────────────────────────
# @router.post("/guide-task")
# async def guide_task(
#     body: dict = Body(...),
#     current_user: dict = Depends(get_current_user),
# ):
#     """
#     Accepts task details, calls Gemini, returns a step-by-step
#     completion guide so the employee knows exactly how to do the task.
#     """
#     task_name   = (body.get("name",        "") or "").strip()
#     description = (body.get("description", "") or "").strip()
#     priority    = (body.get("priority",    "Medium") or "Medium").strip()
#     status      = (body.get("status",      "") or "").strip()

#     if not task_name:
#         raise HTTPException(status_code=400, detail="Task name is required.")

#     context = f"Task name: {task_name}\n"
#     if description:
#         context += f"Task description: {description}\n"
#     context += f"Priority: {priority}\n"
#     if status:
#         context += f"Current status: {status}"

#     prompt = f"""You are an expert project management assistant helping a software development team.

# A team member needs to complete the following task and wants a detailed guide on HOW to do it.

# {context}

# Respond ONLY with a valid JSON object — no markdown, no extra text.

# {{
#   "summary": "<2-3 sentence overview of what this task involves and the end goal>",
#   "estimated_hours": <integer 1-100>,
#   "difficulty": "Easy" | "Medium" | "Hard",
#   "tools_needed": ["<tool or technology 1>", "<tool or technology 2>"],
#   "steps": [
#     {{
#       "title": "<short step title, max 6 words>",
#       "detail": "<2-3 sentence explanation of exactly what to do in this step>"
#     }}
#   ],
#   "tips": [
#     "<practical tip 1 for doing this well>",
#     "<practical tip 2>"
#   ],
#   "watch_out": [
#     "<common mistake or thing to be careful about>",
#     "<another potential pitfall>"
#   ]
# }}

# Rules:
# - steps: 4-7 entries covering the complete workflow
# - tips: 2-4 entries (best practices, shortcuts, quality advice)
# - watch_out: 2-3 entries (common errors, gotchas)
# - tools_needed: list the actual technologies and frameworks relevant to the task
# - Be specific and actionable — practical guidance, not generic advice
# - difficulty: Easy = well-known straightforward task, Medium = requires planning, Hard = complex or risky"""

#     client = _get_client()
#     data   = _call_gemini(client, prompt)

#     # Sanitise & validate
#     steps = data.get("steps", [])
#     if not isinstance(steps, list):
#         steps = []
#     steps = [
#         {"title": str(s.get("title", "")), "detail": str(s.get("detail", ""))}
#         for s in steps[:7]
#     ]

#     tips       = [str(t) for t in (data.get("tips",         []) or [])[:4]]
#     watch_out  = [str(w) for w in (data.get("watch_out",    []) or [])[:3]]
#     tools      = [str(t) for t in (data.get("tools_needed", []) or [])[:6]]

#     difficulty = data.get("difficulty", "Medium")
#     if difficulty not in ("Easy", "Medium", "Hard"):
#         difficulty = "Medium"

#     return {
#         "summary":         str(data.get("summary", "")),
#         "estimated_hours": max(1, int(data.get("estimated_hours", 4))),
#         "difficulty":      difficulty,
#         "tools_needed":    tools,
#         "steps":           steps,
#         "tips":            tips,
#         "watch_out":       watch_out,
#     }