// src/Component/AISuggest.jsx
// Feature 9 – AI-Based Task Suggestions
//
// Drop this component inside the Task creation / edit modal.
// It sends the current task name + description to Claude (via your FastAPI backend)
// and fills in priority, deadline, and shows reasoning + sub-tasks.
//
// Usage:
//   <AISuggest
//     name={taskData.name}
//     description={taskData.description}
//     onApply={({ priority, deadline }) => setTaskData(prev => ({ ...prev, priority, deadline }))}
//   />

import React, { useState } from "react";
import {
  Button, Typography, Chip, CircularProgress,
  Collapse, LinearProgress, Tooltip,
} from "@mui/material";
import AutoAwesomeIcon  from "@mui/icons-material/AutoAwesome";
import CheckCircleIcon  from "@mui/icons-material/CheckCircle";
import ExpandMoreIcon   from "@mui/icons-material/ExpandMore";
import ExpandLessIcon   from "@mui/icons-material/ExpandLess";
import LightbulbIcon    from "@mui/icons-material/Lightbulb";
import { useAuth } from "../Context/AuthContext";
import "./AISuggest.css";

const PRIORITY_COLOR = {
  High:   { bg: "#fef2f2", border: "#fca5a5", text: "#dc2626" },
  Medium: { bg: "#fffbeb", border: "#fcd34d", text: "#d97706" },
  Low:    { bg: "#f0fdf4", border: "#86efac", text: "#16a34a" },
};

export default function AISuggest({ name, description, onApply, api: apiProp }) {
  // Accept api as a prop so Task.jsx can pass its own axios instance.
  // Falls back to AuthContext api if no prop is provided.
  const { api: authApi } = useAuth();
  const api = apiProp || authApi;

  const [loading,     setLoading]     = useState(false);
  const [suggestion,  setSuggestion]  = useState(null);   // AI result
  const [error,       setError]       = useState("");
  const [showDetails, setShowDetails] = useState(false);  // expand sub-tasks
  const [applied,     setApplied]     = useState(false);

  const hasInput = !!(name?.trim() || description?.trim());

  // ── Call AI backend ───────────────────────────────────────
  const getSuggestion = async () => {
    if (!hasInput) return;
    setLoading(true);
    setError("");
    setSuggestion(null);
    setApplied(false);

    try {
      const res = await api.post("/api/ai/suggest-task", {
        name:        name?.trim()        || "",
        description: description?.trim() || "",
      });
      setSuggestion(res.data);
      setShowDetails(true);
    } catch (e) {
      // Show the actual backend error so the user knows exactly what to fix
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "AI service is unavailable. Make sure: (1) OPENAI_API_KEY is in your backend .env, (2) pip install openai, (3) backend server is running.";
      setError(msg);
      console.error("[AISuggest] Error:", e?.response?.data || e?.message || e);
    } finally {
      setLoading(false);
    }
  };

  // ── Apply suggestions to the form ─────────────────────────
  const applySuggestion = () => {
    if (!suggestion) return;
    onApply({
      priority: suggestion.priority,
      deadline: suggestion.suggested_date,
    });
    setApplied(true);
  };

  const pColor = suggestion ? PRIORITY_COLOR[suggestion.priority] : null;

  return (
    <div className="ai-suggest-wrapper">
      {/* ── Trigger button ── */}
      <Tooltip
        title={hasInput ? "Get AI priority & deadline suggestion" : "Enter a task name or description first"}
        placement="top"
        arrow
      >
        <span>
          <Button
            variant="outlined"
            size="small"
            className={`ai-suggest-btn ${loading ? "loading" : ""}`}
            onClick={getSuggestion}
            disabled={loading || !hasInput}
            startIcon={
              loading
                ? <CircularProgress size={14} sx={{ color: "var(--accent-secondary)" }} />
                : <AutoAwesomeIcon sx={{ fontSize: "1rem" }} />
            }
            disableElevation
          >
            {loading ? "Analysing…" : "✨ AI Suggest"}
          </Button>
        </span>
      </Tooltip>

      {/* ── Error ── */}
      {error && (
        <div className="ai-error">
          <Typography className="ai-error-text">⚠ {error}</Typography>
        </div>
      )}

      {/* ── Result card ── */}
      {suggestion && !error && (
        <div className="ai-result-card">

          {/* Header row */}
          <div className="ai-result-header">
            <LightbulbIcon sx={{ fontSize: "1rem", color: "var(--accent-secondary)" }} />
            <Typography className="ai-result-title">AI Suggestion</Typography>
            <div className="ai-confidence">
              <Typography className="ai-confidence-label">Confidence</Typography>
              <div className="ai-confidence-bar-wrap">
                <LinearProgress
                  variant="determinate"
                  value={suggestion.confidence}
                  sx={{
                    height: 5,
                    borderRadius: 99,
                    background: "var(--bg-muted)",
                    "& .MuiLinearProgress-bar": {
                      background: suggestion.confidence >= 80
                        ? "#22c55e"
                        : suggestion.confidence >= 55
                        ? "#f59e0b"
                        : "#ef4444",
                      borderRadius: 99,
                    },
                  }}
                />
              </div>
              <Typography className="ai-confidence-pct">{suggestion.confidence}%</Typography>
            </div>
          </div>

          {/* Main suggestion chips */}
          <div className="ai-chips-row">
            {/* Priority */}
            <div className="ai-chip-group">
              <Typography className="ai-chip-label">Priority</Typography>
              <Chip
                label={suggestion.priority}
                size="small"
                className="ai-priority-chip"
                style={{
                  background:   pColor.bg,
                  border:       `1px solid ${pColor.border}`,
                  color:        pColor.text,
                  fontWeight:   700,
                  fontSize:     "12px",
                }}
              />
            </div>

            {/* Deadline */}
            <div className="ai-chip-group">
              <Typography className="ai-chip-label">Suggested deadline</Typography>
              <Chip
                label={`${suggestion.deadline_days} days — ${new Date(suggestion.suggested_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`}
                size="small"
                className="ai-deadline-chip"
              />
            </div>

            {/* Estimate */}
            <div className="ai-chip-group">
              <Typography className="ai-chip-label">Estimate</Typography>
              <Chip
                label={`~${suggestion.estimated_hours}h`}
                size="small"
                className="ai-hours-chip"
              />
            </div>
          </div>

          {/* Reasoning */}
          <Typography className="ai-reasoning">
            💡 {suggestion.reasoning}
          </Typography>

          {/* Sub-tasks — collapsible */}
          {suggestion.sub_tasks?.length > 0 && (
            <div className="ai-subtasks-section">
              <button
                className="ai-subtasks-toggle"
                onClick={() => setShowDetails((v) => !v)}
              >
                {showDetails ? <ExpandLessIcon sx={{ fontSize: "0.9rem" }} /> : <ExpandMoreIcon sx={{ fontSize: "0.9rem" }} />}
                {showDetails ? "Hide" : "Show"} suggested sub-tasks ({suggestion.sub_tasks.length})
              </button>

              <Collapse in={showDetails}>
                <div className="ai-subtasks-list">
                  {suggestion.sub_tasks.map((task, i) => (
                    <div key={i} className="ai-subtask-item">
                      <span className="ai-subtask-num">{i + 1}</span>
                      <Typography className="ai-subtask-text">{task}</Typography>
                    </div>
                  ))}
                </div>
              </Collapse>
            </div>
          )}

          {/* Apply button */}
          <div className="ai-apply-row">
            {applied ? (
              <div className="ai-applied-badge">
                <CheckCircleIcon sx={{ fontSize: "0.9rem" }} />
                Applied to form!
              </div>
            ) : (
              <Button
                variant="contained"
                size="small"
                className="ai-apply-btn"
                onClick={applySuggestion}
                startIcon={<CheckCircleIcon sx={{ fontSize: "0.9rem" }} />}
                disableElevation
              >
                Apply Priority & Deadline
              </Button>
            )}
            <button className="ai-retry-btn" onClick={getSuggestion} disabled={loading}>
              <AutoAwesomeIcon sx={{ fontSize: "0.8rem" }} />
              Re-analyse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}