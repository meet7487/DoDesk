// src/Component/Chatbot.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  IconButton, Typography, TextField, CircularProgress, Chip,
} from "@mui/material";
import SmartToyIcon      from "@mui/icons-material/SmartToy";
import CloseIcon         from "@mui/icons-material/Close";
import SendIcon          from "@mui/icons-material/Send";
import AutoAwesomeIcon   from "@mui/icons-material/AutoAwesome";
import CheckCircleIcon   from "@mui/icons-material/CheckCircle";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import BarChartIcon      from "@mui/icons-material/BarChart";
import HelpOutlineIcon   from "@mui/icons-material/HelpOutline";
import DeleteSweepIcon   from "@mui/icons-material/DeleteSweep";
import { useAuth }       from "../Context/AuthContext";
import "./Chatbot.css";

// Intent icon map 
const INTENT_ICON = {
  create_task:    <CheckCircleIcon   sx={{ fontSize: "0.85rem" }} />,
  get_tasks:      <FormatListBulletedIcon sx={{ fontSize: "0.85rem" }} />,
  update_status:  <AssignmentTurnedInIcon sx={{ fontSize: "0.85rem" }} />,
  get_summary:    <BarChartIcon      sx={{ fontSize: "0.85rem" }} />,
  general_help:   <HelpOutlineIcon   sx={{ fontSize: "0.85rem" }} />,
};

const INTENT_LABEL = {
  create_task:   "Task Created",
  get_tasks:     "Tasks Listed",
  update_status: "Status Updated",
  get_summary:   "Summary",
  general_help:  "Help",
};

// Quick-action chips shown in the empty state 
const QUICK_ACTIONS = [
  { label: "Show my tasks",                  icon: <FormatListBulletedIcon sx={{ fontSize: "0.8rem" }} /> },
  { label: "Show completed tasks",           icon: <CheckCircleIcon sx={{ fontSize: "0.8rem" }} /> },
  { label: "Summarise my work",              icon: <BarChartIcon sx={{ fontSize: "0.8rem" }} /> },
  { label: "Create a task called Fix Bug with high priority", icon: <AutoAwesomeIcon sx={{ fontSize: "0.8rem" }} /> },
  { label: "What can you do?",               icon: <HelpOutlineIcon sx={{ fontSize: "0.8rem" }} /> },
];

// Task list card rendered inside a bot message
function TaskListCard({ tasks }) {
  if (!tasks || tasks.length === 0) return null;
  const statusColor = (s) => {
    if (s === "Completed")  return "var(--success)";
    if (s === "Started")    return "var(--info)";
    if (s === "In progress") return "var(--warning)";
    return "var(--text-muted)";
  };
  const priorityColor = (p) => {
    if (p === "High")   return "#ff0080";
    if (p === "Medium") return "#00f5ff";
    return "#39ff14";
  };

  return (
    <div className="cb-task-list">
      {tasks.slice(0, 8).map((t, i) => (
        <div key={i} className="cb-task-card">
          <div className="cb-task-card-row">
            <span className="cb-task-name">{t.name}</span>
            <span
              className="cb-task-priority"
              style={{ color: priorityColor(t.priority) }}
            >
              {t.priority || "Medium"}
            </span>
          </div>
          <div className="cb-task-card-row cb-task-meta">
            <span style={{ color: statusColor(t.status) }}>{t.status || "In progress"}</span>
            {t.project_name && (
              <span className="cb-task-project">{t.project_name}</span>
            )}
            {t.deadline && (
              <span className="cb-task-deadline">
                {new Date(t.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      ))}
      {tasks.length > 8 && (
        <p className="cb-task-more">+{tasks.length - 8} more tasks</p>
      )}
    </div>
  );
}

// Summary card
function SummaryCard({ summary }) {
  if (!summary) return null;
  return (
    <div className="cb-summary-card">
      <div className="cb-summary-grid">
        {[
          { label: "Projects",    value: summary.total_projects,   color: "var(--accent-primary)" },
          { label: "Total Tasks", value: summary.total_tasks,      color: "var(--text-primary)" },
          { label: "Completed",   value: summary.completed,        color: "var(--success)" },
          { label: "In Progress", value: summary.in_progress,      color: "var(--warning)" },
          { label: "Started",     value: summary.started,          color: "var(--info)" },
          { label: "Overdue",     value: summary.overdue,          color: "var(--danger)" },
        ].map((item, i) => (
          <div key={i} className="cb-summary-stat">
            <span className="cb-summary-value" style={{ color: item.color }}>
              {item.value}
            </span>
            <span className="cb-summary-label">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="cb-summary-rate">
        <div className="cb-summary-rate-bar">
          <div
            className="cb-summary-rate-fill"
            style={{ width: `${summary.completion_rate}%` }}
          />
        </div>
        <span className="cb-summary-rate-text">
          {summary.completion_rate}% completion rate
        </span>
      </div>
    </div>
  );
}

// Message bubble
function Message({ msg }) {
  const isBot = msg.role === "assistant";
  const d     = msg.data || {};

  return (
    <div className={`cb-msg ${isBot ? "cb-msg-bot" : "cb-msg-user"}`}>
      {isBot && (
        <div className="cb-msg-avatar">
          <SmartToyIcon sx={{ fontSize: "1rem" }} />
        </div>
      )}
      <div className="cb-msg-body">
        {/* Intent badge */}
        {isBot && msg.intent && msg.intent !== "general_help" && (
          <div className="cb-intent-badge">
            {INTENT_ICON[msg.intent]}
            <span>{INTENT_LABEL[msg.intent] || msg.intent}</span>
          </div>
        )}

        {/* Message text */}
        <div className="cb-msg-text">{msg.content}</div>

        {/* Embedded data cards */}
        {isBot && d.action === "tasks_listed" && (
          <TaskListCard tasks={d.tasks} />
        )}
        {isBot && d.action === "summary" && (
          <SummaryCard summary={d.summary} />
        )}
        {isBot && d.action === "task_created" && d.task && (
          <div className="cb-created-card">
            <span className="cb-created-icon">✓</span>
            <div>
              <div className="cb-created-name">{d.task.name}</div>
              <div className="cb-created-meta">
                {d.project && <span>{d.project}</span>}
                {d.task.priority && (
                  <span className={`cb-created-priority cb-pri-${d.task.priority.toLowerCase()}`}>
                    {d.task.priority}
                  </span>
                )}
                {d.task.deadline && <span>{d.task.deadline}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="cb-msg-time">{msg.time}</div>
      </div>
    </div>
  );
}

// Main Chatbot Component
export default function Chatbot() {
  const { api: authApi } = useAuth();

  const [open,        setOpen]        = useState(false);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [hasNewMsg,   setHasNewMsg]   = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 120);
      setHasNewMsg(false);
    }
  }, [open]);

  // Welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id:      "welcome",
        role:    "assistant",
        content: "Hi! I'm your DoDesk assistant. I can help you create tasks, list your tasks, update task status, or give you a summary of your work. What would you like to do?",
        intent:  "general_help",
        data:    {},
        time:    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    }
  }, [open]);

  // Build conversation history for the API
  const buildHistory = useCallback(() => {
    return messages
      .filter(m => m.id !== "welcome")
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMsg = {
      id:      Date.now() + "_u",
      role:    "user",
      content: msg,
      time:    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await authApi.post("/api/chatbot/message", {
        message:              msg,
        conversation_history: buildHistory(),
      });

      const botMsg = {
        id:      Date.now() + "_b",
        role:    "assistant",
        content: res.data.reply,
        intent:  res.data.intent,
        data:    res.data.data || {},
        time:    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages(prev => [...prev, botMsg]);

      if (!open) setHasNewMsg(true);
    } catch (e) {
      const errText =
        e?.response?.data?.detail ||
        e?.message ||
        "Something went wrong. Please try again.";
      setMessages(prev => [...prev, {
        id:      Date.now() + "_err",
        role:    "assistant",
        content: `⚠ ${errText}`,
        intent:  "general_help",
        data:    {},
        time:    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setTimeout(() => {
      setMessages([{
        id:      "welcome-fresh",
        role:    "assistant",
        content: "Chat cleared. How can I help you?",
        intent:  "general_help",
        data:    {},
        time:    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    }, 50);
  };

  return (
    <>
      {/* ── Floating toggle button ── */}
      <button
        className={`cb-fab ${hasNewMsg ? "cb-fab-pulse" : ""}`}
        onClick={() => setOpen(v => !v)}
        aria-label="Open DoDesk assistant"
      >
        {open
          ? <CloseIcon sx={{ fontSize: "1.5rem" }} />
          : <SmartToyIcon sx={{ fontSize: "1.5rem" }} />
        }
        {hasNewMsg && !open && <span className="cb-fab-dot" />}
      </button>

      {/* ── Chat window ── */}
      <div className={`cb-window ${open ? "cb-window-open" : ""}`}>

        {/* Header */}
        <div className="cb-header">
          <div className="cb-header-left">
            <div className="cb-header-avatar">
              <SmartToyIcon sx={{ fontSize: "1.1rem" }} />
            </div>
            <div>
              <div className="cb-header-title">DoDesk Assistant</div>
              <div className="cb-header-subtitle">
                <span className="cb-online-dot" /> AI-powered
              </div>
            </div>
          </div>
          <div className="cb-header-actions">
            <IconButton
              size="small"
              onClick={clearChat}
              className="cb-icon-btn"
              title="Clear chat"
            >
              <DeleteSweepIcon sx={{ fontSize: "1.1rem" }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setOpen(false)}
              className="cb-icon-btn"
              title="Close"
            >
              <CloseIcon sx={{ fontSize: "1.1rem" }} />
            </IconButton>
          </div>
        </div>

        {/* Messages area */}
        <div className="cb-messages">
          {messages.map(msg => (
            <Message key={msg.id} msg={msg} />
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="cb-msg cb-msg-bot">
              <div className="cb-msg-avatar">
                <SmartToyIcon sx={{ fontSize: "1rem" }} />
              </div>
              <div className="cb-typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          {/* Quick-action chips (shown only when messages is just the welcome) */}
          {messages.length <= 1 && !loading && (
            <div className="cb-quick-actions">
              <Typography className="cb-quick-label">Try asking:</Typography>
              <div className="cb-quick-chips">
                {QUICK_ACTIONS.map((qa, i) => (
                  <Chip
                    key={i}
                    icon={qa.icon}
                    label={qa.label}
                    size="small"
                    className="cb-quick-chip"
                    onClick={() => sendMessage(qa.label)}
                    clickable
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="cb-input-area">
          <TextField
            inputRef={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your tasks…"
            multiline
            maxRows={3}
            fullWidth
            variant="outlined"
            size="small"
            disabled={loading}
            className="cb-input"
          />
          <IconButton
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="cb-send-btn"
            aria-label="Send message"
          >
            {loading
              ? <CircularProgress size={18} className="cb-send-spinner" />
              : <SendIcon sx={{ fontSize: "1.1rem" }} />
            }
          </IconButton>
        </div>

      </div>
    </>
  );
}