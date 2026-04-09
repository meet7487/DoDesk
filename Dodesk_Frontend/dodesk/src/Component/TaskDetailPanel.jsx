// src/Component/TaskDetailPanel.jsx
// Combines Features 3, 4, 5 — shown when clicking a task row

import React, { useState } from "react";
import {
  Modal, Box, Typography, IconButton, Tabs, Tab,
} from "@mui/material";
import CloseIcon            from "@mui/icons-material/Close";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import AttachFileIcon       from "@mui/icons-material/AttachFile";
import TimerIcon            from "@mui/icons-material/Timer";
import TaskComments         from "./TaskComments";     // Feature 3
import FileUpload           from "./FileUpload";       // Feature 4
import TaskTimer            from "./TaskTimer";        // Feature 5
import "./TaskDetailPanel.css";

export default function TaskDetailPanel({ open, onClose, task, projectId }) {
  const [tab, setTab] = useState(0);

  if (!task) return null;

  return (
    <Modal open={open} onClose={onClose} className="tdp-modal">
      <Box className="tdp-content">

        {/* Header */}
        <div className="tdp-header">
          <div className="tdp-header-left">
            <Typography className="tdp-task-name">{task.name}</Typography>
            <Typography className="tdp-task-desc">{task.description || "No description"}</Typography>
          </div>
          <IconButton onClick={onClose} size="small" className="tdp-close-btn">
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        {/* Task meta chips */}
        <div className="tdp-meta">
          <span className="tdp-meta-chip" style={{ "--chip-color": task.priority === "High" ? "#ef4444" : task.priority === "Low" ? "#22c55e" : "#f59e0b" }}>
            {task.priority || "Medium"}
          </span>
          <span className="tdp-meta-chip" style={{ "--chip-color": "#4f8ef7" }}>
            {task.status || "In Progress"}
          </span>
          {task.deadline && (
            <span className="tdp-meta-chip" style={{ "--chip-color": "#64748b" }}>
              📅 {new Date(task.deadline).toLocaleDateString()}
            </span>
          )}
          {task.assignee && (
            <span className="tdp-meta-chip" style={{ "--chip-color": "#7c5cfc" }}>
              👤 {task.assignee}
            </span>
          )}
        </div>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          className="tdp-tabs"
        >
          <Tab
            label={
              <div className="tdp-tab-label">
                <ChatBubbleOutlineIcon sx={{ fontSize: "0.9rem" }} />
                Comments
              </div>
            }
          />
          <Tab
            label={
              <div className="tdp-tab-label">
                <AttachFileIcon sx={{ fontSize: "0.9rem" }} />
                Files
              </div>
            }
          />
          <Tab
            label={
              <div className="tdp-tab-label">
                <TimerIcon sx={{ fontSize: "0.9rem" }} />
                Time
              </div>
            }
          />
        </Tabs>

        {/* Tab panels */}
        <div className="tdp-panel">
          {tab === 0 && (
            <TaskComments
              projectId={projectId}
              taskId={task._id || task.id}
            />
          )}
          {tab === 1 && (
            <FileUpload
              projectId={projectId}
              taskId={task._id || task.id}
            />
          )}
          {tab === 2 && (
            <TaskTimer
              projectId={projectId}
              taskId={task._id || task.id}
            />
          )}
        </div>

      </Box>
    </Modal>
  );
}