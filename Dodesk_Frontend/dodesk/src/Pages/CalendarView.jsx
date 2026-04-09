// src/Pages/CalendarView.jsx
// Feature 6 & 8 – Calendar View Integration

import React, { useEffect, useState, useRef } from "react";
import { Container, Typography, Card, CardContent, Chip, Box, CircularProgress } from "@mui/material";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin     from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useAuth } from "../Context/AuthContext";
import "./CalendarView.css";

const PRIORITY_COLOR = { High: "#ef4444", Medium: "#f59e0b", Low: "#22c55e" };

export default function CalendarView() {
  const { api } = useAuth();
  const [events,   setEvents]   = useState([]);
  const [selected, setSelected] = useState(null); // clicked task popup
  const [loading,  setLoading]  = useState(true);
  const calRef = useRef(null);

  useEffect(() => {
    document.title = "Calendar — DoDesk";
    // ── Grok-style starfield ──────────────────────────────────
    const sf = document.querySelector(".page-starfield");
    if (sf && !sf.dataset.built) {
      sf.dataset.built = "1";
      for (let i = 0; i < 280; i++) {
        const s = document.createElement("div");
        const r = Math.random();
        s.className = "page-star " + (r < 0.35 ? "ps-small" : r < 0.68 ? "ps-medium" : r < 0.90 ? "ps-large" : "ps-bright");
        s.style.left = Math.random() * 100 + "%";
        s.style.top  = Math.random() * 100 + "%";
        s.style.animationDelay    = (Math.random() * 8) + "s";
        s.style.animationDuration = (Math.random() * 4 + 2) + "s";
        s.style.setProperty("--brightness", String(Math.random()));
        sf.appendChild(s);
      }
      for (let i = 0; i < 5; i++) {
        const s = document.createElement("div");
        s.className = "page-shooting-star";
        s.style.top               = (Math.random() * 65) + "%";
        s.style.left              = "-200px";
        s.style.animationDelay    = (Math.random() * 20 + 3) + "s";
        s.style.animationDuration = (Math.random() * 2 + 1.5) + "s";
        sf.appendChild(s);
      }
    }
    api.get("/api/search/calendar")
      .then((r) => setEvents(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleEventClick = ({ event }) => {
    setSelected({
      title:        event.title,
      start:        event.startStr,
      color:        event.backgroundColor,
      ...event.extendedProps,
    });
  };

  return (
    <div className="calendar-page">
      {/* Grok-style starfield background */}
      <div className="page-starfield-bg">
        <div className="page-starfield" />
      </div>
      <Container maxWidth="xl">
        {/* Header */}
        <div className="calendar-header">
          <Typography variant="h4" className="calendar-title">
            <span className="title-emoji">📅</span>
            <span className="title-gradient">Task Calendar</span>
          </Typography>
          <Typography variant="body2" className="calendar-subtitle">
            All tasks with deadlines — color coded by status
          </Typography>

          {/* Legend */}
          <div className="calendar-legend">
            {[
              { label: "Completed",   color: "#22c55e" },
              { label: "Overdue",     color: "#ef4444" },
              { label: "Started",     color: "#f59e0b" },
              { label: "In Progress", color: "#4f8ef7" },
            ].map((l) => (
              <div key={l.label} className="legend-item">
                <span className="legend-dot" style={{ background: l.color }} />
                <span>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar */}
        <Card elevation={0} className="calendar-card">
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                <CircularProgress sx={{ color: "var(--accent-primary)" }} />
              </Box>
            ) : (
              <FullCalendar
                ref={calRef}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={events}
                eventClick={handleEventClick}
                headerToolbar={{
                  left:   "prev,next today",
                  center: "title",
                  right:  "dayGridMonth,dayGridWeek",
                }}
                height="auto"
                dayMaxEvents={3}
                eventDisplay="block"
                eventTimeFormat={{ hour: undefined }}
              />
            )}
          </CardContent>
        </Card>

        {/* Task detail popup */}
        {selected && (
          <div className="cal-popup-overlay" onClick={() => setSelected(null)}>
            <div className="cal-popup" onClick={(e) => e.stopPropagation()}>
              <button className="cal-popup-close" onClick={() => setSelected(null)}>✕</button>

              <Typography className="cal-popup-title">{selected.title}</Typography>

              <div className="cal-popup-row">
                <span className="cal-popup-label">Project</span>
                <span className="cal-popup-value">{selected.project_name}</span>
              </div>
              <div className="cal-popup-row">
                <span className="cal-popup-label">Deadline</span>
                <span className="cal-popup-value">
                  {new Date(selected.start).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </span>
              </div>
              <div className="cal-popup-row">
                <span className="cal-popup-label">Status</span>
                <Chip label={selected.status} size="small"
                  sx={{ background: selected.color + "22", color: selected.color, border: `1px solid ${selected.color}44` }} />
              </div>
              <div className="cal-popup-row">
                <span className="cal-popup-label">Priority</span>
                <Chip label={selected.priority} size="small"
                  sx={{ background: (PRIORITY_COLOR[selected.priority] || "#4f8ef7") + "22",
                        color: PRIORITY_COLOR[selected.priority] || "#4f8ef7" }} />
              </div>
              {selected.assignee && (
                <div className="cal-popup-row">
                  <span className="cal-popup-label">Assignee</span>
                  <span className="cal-popup-value">{selected.assignee}</span>
                </div>
              )}
              {selected.description && (
                <div className="cal-popup-desc">
                  <span className="cal-popup-label">Description</span>
                  <Typography sx={{ fontSize: "13px", color: "var(--text-secondary)", mt: 0.5 }}>
                    {selected.description}
                  </Typography>
                </div>
              )}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}