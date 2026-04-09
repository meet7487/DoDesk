// src/Component/TaskTimer.jsx
// Feature 5 – Time Tracking System

import React, { useState, useEffect, useRef } from "react";
import { Typography, Button, Chip } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon      from "@mui/icons-material/Stop";
import TimerIcon     from "@mui/icons-material/Timer";
import HistoryIcon   from "@mui/icons-material/History";
import { useAuth } from "../Context/AuthContext";
import "./TaskTimer.css";

const fmt = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export default function TaskTimer({ projectId, taskId }) {
  const { api } = useAuth();
  const [running,   setRunning]   = useState(false);
  const [elapsed,   setElapsed]   = useState(0);   // live seconds since start
  const [totalTime, setTotalTime] = useState("");   // HH:MM:SS of all past logs
  const [logs,      setLogs]      = useState([]);
  const [loading,   setLoading]   = useState(false);
  const intervalRef = useRef(null);
  const startRef    = useRef(null);

  // ── Fetch existing logs + check for active timer ────────────
  const fetchLogs = async () => {
    if (!projectId || !taskId) return;
    try {
      const [logsRes, activeRes] = await Promise.all([
        api.get(`/api/time/${projectId}/${taskId}`),
        api.get(`/api/time/active/${taskId}`),
      ]);
      setLogs(logsRes.data.logs || []);
      setTotalTime(logsRes.data.total_display || "00:00:00");

      // Restore live timer if it was running
      if (activeRes.data.active) {
        const startedAt = new Date(activeRes.data.log.start_time).getTime();
        const already   = Math.floor((Date.now() - startedAt) / 1000);
        startRef.current = startedAt;
        setElapsed(already);
        setRunning(true);
      }
    } catch (e) {
      console.error("Failed to load time logs", e);
    }
  };

  useEffect(() => {
    fetchLogs();
    return () => clearInterval(intervalRef.current);
  }, [projectId, taskId]);

  // ── Tick interval ───────────────────────────────────────────
  useEffect(() => {
    clearInterval(intervalRef.current);
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  // ── Start timer ─────────────────────────────────────────────
  const startTimer = async () => {
    setLoading(true);
    try {
      await api.post(`/api/time/start/${projectId}/${taskId}`);
      startRef.current = Date.now();
      setElapsed(0);
      setRunning(true);
    } catch (e) {
      alert(e?.response?.data?.detail || "Could not start timer.");
    } finally {
      setLoading(false);
    }
  };

  // ── Stop timer ──────────────────────────────────────────────
  const stopTimer = async () => {
    setLoading(true);
    try {
      await api.put(`/api/time/stop/${projectId}/${taskId}`);
      setRunning(false);
      setElapsed(0);
      await fetchLogs();          // refresh total
    } catch (e) {
      alert(e?.response?.data?.detail || "Could not stop timer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="timer-section">
      <div className="timer-header">
        <TimerIcon sx={{ fontSize: "1rem", color: "var(--accent-primary)" }} />
        <Typography className="timer-title">Time Tracking</Typography>
        <Chip
          label={`Total: ${totalTime}`}
          size="small"
          className="timer-total-chip"
        />
      </div>

      {/* Live display */}
      <div className={`timer-display ${running ? "active" : ""}`}>
        <Typography className="timer-clock">
          {running ? fmt(elapsed) : "00:00:00"}
        </Typography>
        <Typography className="timer-status">
          {running ? "⏱ Timer running…" : "Ready to track"}
        </Typography>
      </div>

      {/* Controls */}
      <div className="timer-controls">
        {!running ? (
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={startTimer}
            disabled={loading}
            className="timer-start-btn"
            disableElevation
          >
            Start Timer
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<StopIcon />}
            onClick={stopTimer}
            disabled={loading}
            className="timer-stop-btn"
            disableElevation
          >
            Stop Timer
          </Button>
        )}
      </div>

      {/* Log history */}
      {logs.length > 0 && (
        <div className="timer-log-section">
          <div className="timer-log-header">
            <HistoryIcon sx={{ fontSize: "0.85rem", color: "var(--text-muted)" }} />
            <Typography sx={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
              Session history
            </Typography>
          </div>
          <div className="timer-log-list">
            {logs.slice(0, 5).map((log) => (
              <div key={log._id} className="timer-log-item">
                <span className="tl-time">
                  {new Date(log.start_time).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
                <span className="tl-duration">{log.duration_display}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}