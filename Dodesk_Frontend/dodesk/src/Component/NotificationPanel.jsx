// src/Component/NotificationPanel.jsx
// Feature 1 – Notification Bell + Dropdown Panel

import React, { useState, useRef, useEffect } from "react";
import { Badge, IconButton, Typography, Chip } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DeleteIcon        from "@mui/icons-material/Delete";
import DoneAllIcon       from "@mui/icons-material/DoneAll";
import { useNotifications } from "../Context/NotificationContext";
import "./NotificationPanel.css";

const TYPE_COLOR = {
  success: "#22c55e",
  error:   "#ef4444",
  warning: "#f59e0b",
  info:    "#4f8ef7",
};

const timeAgo = (ts) => {
  const diff = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (diff < 1)  return "just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
};

export default function NotificationPanel() {
  const { notifications, unreadCount, markRead, markAllRead, deleteNotif } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = (id) => {
    setOpen(false);
    markRead(id);
  };

  return (
    <div className="notif-wrapper" ref={panelRef}>
      {/* ── Bell button ── */}
      <IconButton
        className="notif-bell-btn"
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        size="small"
      >
        <Badge
          badgeContent={unreadCount}
          max={99}
          sx={{
            "& .MuiBadge-badge": {
              background: "#ef4444",
              color: "#fff",
              fontSize: "10px",
              minWidth: "16px",
              height: "16px",
            },
          }}
        >
          <NotificationsIcon sx={{ fontSize: "1.3rem", color: "var(--text-secondary)" }} />
        </Badge>
      </IconButton>

      {/* ── Dropdown panel ── */}
      {open && (
        <div className="notif-panel">
          {/* Header */}
          <div className="notif-panel-header">
            <Typography className="notif-panel-title">Notifications</Typography>
            {unreadCount > 0 && (
              <button className="notif-mark-all-btn" onClick={markAllRead}>
                <DoneAllIcon style={{ fontSize: "0.85rem" }} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <NotificationsIcon sx={{ fontSize: "2rem", opacity: 0.3, display: "block", margin: "0 auto 8px" }} />
                <Typography style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center" }}>
                  No notifications yet
                </Typography>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`notif-item ${!n.read ? "unread" : ""}`}
                  onClick={() => handleOpen(n._id)}
                >
                  <div
                    className="notif-dot"
                    style={{ background: TYPE_COLOR[n.type] || TYPE_COLOR.info }}
                  />
                  <div className="notif-body">
                    <Typography className="notif-title">{n.title}</Typography>
                    <Typography className="notif-message">{n.message}</Typography>
                    <Typography className="notif-time">{timeAgo(n.created_at)}</Typography>
                  </div>
                  <button
                    className="notif-delete-btn"
                    onClick={(e) => { e.stopPropagation(); deleteNotif(n._id); }}
                    title="Delete"
                  >
                    <DeleteIcon style={{ fontSize: "0.85rem" }} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}