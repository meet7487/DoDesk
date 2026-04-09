// src/Component/ActivityFeed.jsx
// Feature 10 – Activity Log System

import React, { useEffect, useState } from "react";
import { Typography, CircularProgress, Chip } from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import { useAuth } from "../Context/AuthContext";
import "./ActivityFeed.css";

const ACTION_META = {
  created_task:    { icon: "✅", color: "#22c55e", label: "Created task" },
  updated_task:    { icon: "✏️", color: "#4f8ef7", label: "Updated task" },
  completed_task:  { icon: "🏁", color: "#7c5cfc", label: "Completed task" },
  deleted_task:    { icon: "🗑️", color: "#ef4444", label: "Deleted task" },
  created_project: { icon: "📁", color: "#f59e0b", label: "Created project" },
  updated_project: { icon: "📝", color: "#22d3ee", label: "Updated project" },
  deleted_project: { icon: "❌", color: "#ef4444", label: "Deleted project" },
  created_team:    { icon: "👥", color: "#a78bfa", label: "Created team" },
  updated_team:    { icon: "👤", color: "#4f8ef7", label: "Updated team" },
  deleted_team:    { icon: "💨", color: "#ef4444", label: "Disbanded team" },
  uploaded_file:   { icon: "📎", color: "#22d3ee", label: "Attached file" },
  added_comment:   { icon: "💬", color: "#4f8ef7", label: "Commented" },
};

const timeAgo = (ts) => {
  const diff = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (diff < 1)    return "just now";
  if (diff < 60)   return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  if (diff < 10080)return `${Math.floor(diff / 1440)}d ago`;
  return new Date(ts).toLocaleDateString();
};

export default function ActivityFeed({ projectId = "", limit = 30 }) {
  const { api } = useAuth();
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ limit });
    if (projectId) params.append("project_id", projectId);

    api.get(`/api/activity/?${params.toString()}`)
      .then((r) => setLogs(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <div className="activity-feed">
      <div className="af-header">
        <HistoryIcon sx={{ fontSize: "1rem", color: "var(--accent-primary)" }} />
        <Typography className="af-title">Activity Log</Typography>
      </div>

      {loading ? (
        <div className="af-loading">
          <CircularProgress size={20} sx={{ color: "var(--accent-primary)" }} />
        </div>
      ) : logs.length === 0 ? (
        <div className="af-empty">
          <HistoryIcon sx={{ fontSize: "2rem", opacity: 0.2, display: "block", margin: "0 auto 6px" }} />
          <Typography sx={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
            No activity yet
          </Typography>
        </div>
      ) : (
        <div className="af-list">
          {logs.map((log, i) => {
            const meta = ACTION_META[log.action] || { icon: "📌", color: "#64748b", label: log.action };
            return (
              <div key={log._id || i} className="af-item">
                {/* Timeline line */}
                {i < logs.length - 1 && <div className="af-line" />}

                {/* Icon dot */}
                <div className="af-dot" style={{ background: meta.color + "22", border: `2px solid ${meta.color}` }}>
                  <span className="af-dot-icon">{meta.icon}</span>
                </div>

                {/* Content */}
                <div className="af-content">
                  <Typography className="af-desc">{log.description}</Typography>
                  <div className="af-meta">
                    <Chip
                      label={meta.label}
                      size="small"
                      sx={{
                        fontSize: "10px",
                        height: "18px",
                        background: meta.color + "22",
                        color: meta.color,
                        border: `1px solid ${meta.color}44`,
                      }}
                    />
                    <span className="af-time">{timeAgo(log.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}