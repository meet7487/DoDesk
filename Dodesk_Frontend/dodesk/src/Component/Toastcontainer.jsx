// File: dodesk/src/Component/ToastContainer.jsx
import React from "react";
import { IconButton, Typography } from "@mui/material";
import {
  Close         as CloseIcon,
  Assignment    as TaskIcon,
  CheckCircle   as DoneIcon,
  Schedule      as DeadlineIcon,
  Group         as TeamIcon,
  FolderOpen    as ProjectIcon,
  Notifications as BellIcon,
  Info          as InfoIcon,
} from "@mui/icons-material";
import { useNotifications } from "../Context/NotificationContext";
import "./NotificationPanel.css";

const typeIcon = (type) => {
  const map = {
    task_assigned  : <TaskIcon    style={{ fontSize: "1rem" }} />,
    task_updated   : <InfoIcon    style={{ fontSize: "1rem" }} />,
    task_completed : <DoneIcon    style={{ fontSize: "1rem" }} />,
    deadline       : <DeadlineIcon style={{ fontSize: "1rem" }} />,
    team           : <TeamIcon    style={{ fontSize: "1rem" }} />,
    project        : <ProjectIcon  style={{ fontSize: "1rem" }} />,
  };
  return map[type] || <BellIcon style={{ fontSize: "1rem" }} />;
};

const typeColor = (type) => ({
  task_assigned  : "#4f8ef7",
  task_updated   : "#7c5cfc",
  task_completed : "#22c55e",
  deadline       : "#f59e0b",
  team           : "#06b6d4",
  project        : "#4f8ef7",
}[type] || "#64748b");

const ToastContainer = () => {
  const { toasts, dismissToast } = useNotifications();

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => {
        const color = typeColor(t.type);
        return (
          <div
            key={t.toastId}
            className="toast"
            style={{ "--toast-color": color }}
          >
            {/* Icon */}
            <div
              className="toast-icon"
              style={{ background: `${color}22`, border: `1px solid ${color}44`, color }}
            >
              {typeIcon(t.type)}
            </div>

            {/* Body */}
            <div className="toast-body">
              <Typography className="toast-title">{t.title}</Typography>
              <Typography className="toast-message">{t.message}</Typography>
            </div>

            {/* Dismiss */}
            <IconButton
              size="small"
              className="toast-close"
              onClick={() => dismissToast(t.toastId)}
            >
              <CloseIcon style={{ fontSize: "0.85rem" }} />
            </IconButton>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;