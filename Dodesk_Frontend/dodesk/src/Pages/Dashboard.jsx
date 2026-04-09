// src/Pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { 
  Container, Typography, Grid, Card, Box, CircularProgress, Stack 
} from "@mui/material";
import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import AssignmentIcon     from "@mui/icons-material/Assignment";
import CheckCircleIcon    from "@mui/icons-material/CheckCircle";
import PendingIcon        from "@mui/icons-material/Pending";
import WarningAmberIcon   from "@mui/icons-material/WarningAmber";
import FolderOpenIcon     from "@mui/icons-material/FolderOpen";
import { useAuth } from "../Context/AuthContext";
import "./Dashboard.css";

const COLORS = { 
  High: "#ef4444", high: "#ef4444",
  Medium: "#f59e0b", medium: "#f59e0b",
  Low: "#22c55e", low: "#22c55e" 
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

export default function Dashboard() {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Dashboard — DoDesk";
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
    api.get("/api/analytics/dashboard")
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api]);

  if (loading) return (
    <Box className="dashboard-loading">
      <CircularProgress sx={{ color: "var(--accent-primary)" }} />
      <Typography sx={{ color: "var(--text-muted)", mt: 2 }}>Loading analytics…</Typography>
    </Box>
  );

  if (!data) return null;
  const { summary, priority_breakdown, status_breakdown, project_stats } = data;

  const statCards = [
    { label: "Total Projects",   value: summary.total_projects,   icon: <FolderOpenIcon />,  color: "#4f8ef7" },
    { label: "Total Tasks",      value: summary.total_tasks,      icon: <AssignmentIcon />,  color: "#7c5cfc" },
    { label: "Completed",        value: summary.completed_tasks, icon: <CheckCircleIcon />, color: "#22c55e" },
    { label: "In Progress",      value: summary.in_progress,     icon: <PendingIcon />,     color: "#f59e0b" },
    { label: "Overdue",          value: summary.overdue,         icon: <WarningAmberIcon />,color: "#ef4444" },
    { label: "Completion Rate",  value: `${summary.completion_rate}%`, icon: <CheckCircleIcon />, color: "#22d3ee" },
  ];

  return (
    <motion.div 
      className="dashboard-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5 }}
    >
      {/* Grok-style starfield background */}
      <div className="page-starfield-bg">
        <div className="page-starfield" />
      </div>
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>

        {/* Header */}
        <Box className="dashboard-header" sx={{ mb: 5 }}>
          <Typography variant="h4" className="dashboard-title">
            <span className="title-emoji">📊</span>
            <span className="title-gradient">Analytics Dashboard</span>
          </Typography>
          <Typography variant="body2" className="dashboard-subtitle">
            Real-time overview of your projects and tasks
          </Typography>
        </Box>

        {/* Stat Cards - Grid with better spacing control */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Grid container spacing={2.5} sx={{ mb: 6 }} alignItems="stretch">
            {statCards.map((s, i) => (
              <Grid item xs={6} sm={4} md={4} lg={2} key={i} sx={{ display: "flex" }}>
                <motion.div variants={itemVariants} whileHover={{ scale: 1.05, y: -5 }} style={{ width: "100%" }}>
                  <Card elevation={0} className="stat-card" sx={{ width: "100%", height: "100%" }}>
                {/* Custom Box instead of CardContent to avoid MUI padding bugs */}
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Box className="stat-icon" sx={{ color: s.color, mb: 1.5 }}>
                    {s.icon}
                  </Box>
                  <Typography className="stat-value" sx={{ color: s.color, fontWeight: 800, fontSize: '2.2rem' }}>
                    {s.value}
                  </Typography>
                  <Typography className="stat-label" sx={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                    {s.label}
                  </Typography>
                </Box>
              </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
        </motion.div>

        {/* Charts Row */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Status Pie Chart */}
            <Grid item xs={12} md={5}>
              <motion.div variants={itemVariants} style={{ height: "100%" }}>
                <Card elevation={0} className="chart-card" sx={{ height: "100%" }}>
              <Box sx={{ p: 3 }}>
                <Typography className="chart-title" sx={{ mb: 2 }}>Task Status Breakdown</Typography>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={status_breakdown}
                      cx="50%" cy="50%"
                      innerRadius={70} outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {status_breakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color || "#444"} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', background: '#171b22', border: '1px solid #30363d' }} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Card>
            </motion.div>
          </Grid>

          {/* Priority Bar Chart */}
          <Grid item xs={12} md={7}>
            <motion.div variants={itemVariants} style={{ height: "100%" }}>
              <Card elevation={0} className="chart-card" sx={{ height: "100%" }}>
              <Box sx={{ p: 3 }}>
                <Typography className="chart-title" sx={{ mb: 2 }}>Task Priority Distribution</Typography>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={priority_breakdown} barSize={45} margin={{ top: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ borderRadius: '12px', background: '#171b22', border: '1px solid #30363d' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {priority_breakdown.map((entry, i) => (
                        <Cell key={i} fill={COLORS[entry.name] || "#4f8ef7"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>
            </motion.div>
          </Grid>
        </Grid>
        </motion.div>

        {/* Project Progress */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants}>
            <Card elevation={0} className="chart-card">
          <Box sx={{ p: 3 }}>
            <Typography className="chart-title" sx={{ mb: 3 }}>Project Progress</Typography>
            <Stack spacing={3} className="project-progress-list">
              {project_stats.map((p, i) => (
                <Box key={i} className="project-progress-item">
                  <Stack direction="row" alignItems="center" spacing={1.5} className="pp-name">
                    <FolderOpenIcon sx={{ fontSize: "1.1rem", color: "var(--warning)" }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography>
                  </Stack>
                  <Box className="pp-bar-wrap">
                    <Box
                      className="pp-bar"
                      style={{ 
                        width: `${p.completion}%`, 
                        background: p.completion === 100 ? "#22c55e" : "var(--accent-primary)",
                      }}
                    />
                  </Box>
                  <Box className="pp-stats">
                    <Typography variant="caption" sx={{ color: "var(--text-muted)" }}>
                      {p.completed}/{p.total} tasks &nbsp;·&nbsp; <strong>{p.completion}%</strong>
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        </Card>
        </motion.div>
        </motion.div>

      </Container>
    </motion.div>
  );
}