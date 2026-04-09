// src/Pages/SearchPage.jsx
// Feature 7 – Advanced Search and Filtering

import React, { useState, useCallback, useEffect } from "react";
import {
  Container, Typography, TextField, Select, MenuItem,
  Grid, Card, CardContent, Chip, Button, Box, CircularProgress,
  InputAdornment, InputLabel, FormControl,
} from "@mui/material";
import SearchIcon       from "@mui/icons-material/Search";
import FilterListIcon   from "@mui/icons-material/FilterList";
import FolderIcon       from "@mui/icons-material/Folder";
import ClearIcon        from "@mui/icons-material/Clear";
import { useAuth } from "../Context/AuthContext";
import "./SearchPage.css";

const STATUS_OPTIONS   = ["", "In progress", "Started", "Completed"];
const PRIORITY_OPTIONS = ["", "High", "Medium", "Low"];

const PRIORITY_COLOR = { High: "#ef4444", Medium: "#f59e0b", Low: "#22c55e" };
const STATUS_COLOR   = {
  "In progress": "#4f8ef7",
  "Started":     "#f59e0b",
  "Completed":   "#22c55e",
};

export default function SearchPage() {
  const { api } = useAuth();
  const [q,        setQ]        = useState("");

  useEffect(() => {
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
  }, []);
  const [status,   setStatus]   = useState("");
  const [priority, setPriority] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate,   setToDate]   = useState("");
  const [results,  setResults]  = useState([]);
  const [count,    setCount]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (q)        params.append("q",         q);
      if (status)   params.append("status",    status);
      if (priority) params.append("priority",  priority);
      if (fromDate) params.append("from_date", fromDate);
      if (toDate)   params.append("to_date",   toDate);

      const res = await api.get(`/api/search/tasks?${params.toString()}`);
      setResults(res.data.tasks || []);
      setCount(res.data.count   || 0);
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setLoading(false);
    }
  }, [q, status, priority, fromDate, toDate, api]);

  const handleClear = () => {
    setQ(""); setStatus(""); setPriority("");
    setFromDate(""); setToDate("");
    setResults([]); setCount(null); setSearched(false);
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleSearch(); };

  return (
    <div className="search-page">
      {/* Grok-style starfield background */}
      <div className="page-starfield-bg">
        <div className="page-starfield" />
      </div>
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>

        {/* Header */}
        <div className="search-header">
          <Typography variant="h4" className="search-title">
            <span className="title-emoji">🔍</span>
            <span className="title-gradient">Advanced Search</span>
          </Typography>
          <Typography variant="body2" className="search-subtitle">
            Find tasks across all your projects using filters
          </Typography>
        </div>

        {/* Filter bar */}
        <Card elevation={0} className="search-filter-card">
          <CardContent>
            <Grid container spacing={2} alignItems="flex-end">

              {/* Text search */}
              <Grid item xs={12} sm={12} md={4}>
                <TextField
                  label="Search tasks"
                  fullWidth
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search by name or description…"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "var(--text-muted)", fontSize: "1.1rem" }} />
                      </InputAdornment>
                    ),
                  }}
                  className="sf-input"
                />
              </Grid>

              {/* Status */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth className="sf-input">
                  <InputLabel sx={{ color: "var(--text-muted)", "&.Mui-focused": { color: "var(--accent-primary)" } }}>Status</InputLabel>
                  <Select
                    value={status}
                    label="Status"
                    onChange={(e) => setStatus(e.target.value)}
                    sx={{
                      background: "var(--bg-muted)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-primary)",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-default)" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-strong)" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--accent-primary)" },
                      "& .MuiSelect-select": { color: "var(--text-primary)", fontFamily: "var(--font-body)" },
                      "& .MuiSvgIcon-root": { color: "var(--text-muted)" },
                    }}
                    MenuProps={{
                      disableScrollLock: true,
                      PaperProps: {
                        sx: {
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border-default)",
                          borderRadius: "var(--radius-md)",
                          boxShadow: "var(--shadow-lg)",
                          "& .MuiMenuItem-root": {
                            color: "var(--text-secondary)",
                            fontFamily: "var(--font-body)",
                            fontSize: "0.875rem",
                          },
                          "& .MuiMenuItem-root:hover": { background: "var(--bg-overlay)", color: "var(--text-primary)" },
                          "& .MuiMenuItem-root.Mui-selected": { background: "var(--accent-glow)", color: "var(--accent-primary)" },
                        },
                      },
                    }}
                  >
                    <MenuItem value=""><em style={{ color: "var(--text-muted)", fontStyle: "normal" }}>Any</em></MenuItem>
                    {STATUS_OPTIONS.slice(1).map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Priority */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth className="sf-input">
                  <InputLabel sx={{ color: "var(--text-muted)", "&.Mui-focused": { color: "var(--accent-primary)" } }}>Priority</InputLabel>
                  <Select
                    value={priority}
                    label="Priority"
                    onChange={(e) => setPriority(e.target.value)}
                    sx={{
                      background: "var(--bg-muted)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-primary)",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-default)" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-strong)" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--accent-primary)" },
                      "& .MuiSelect-select": { color: "var(--text-primary)", fontFamily: "var(--font-body)" },
                      "& .MuiSvgIcon-root": { color: "var(--text-muted)" },
                    }}
                    MenuProps={{
                      disableScrollLock: true,
                      PaperProps: {
                        sx: {
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border-default)",
                          borderRadius: "var(--radius-md)",
                          boxShadow: "var(--shadow-lg)",
                          "& .MuiMenuItem-root": {
                            color: "var(--text-secondary)",
                            fontFamily: "var(--font-body)",
                            fontSize: "0.875rem",
                          },
                          "& .MuiMenuItem-root:hover": { background: "var(--bg-overlay)", color: "var(--text-primary)" },
                          "& .MuiMenuItem-root.Mui-selected": { background: "var(--accent-glow)", color: "var(--accent-primary)" },
                        },
                      },
                    }}
                  >
                    <MenuItem value=""><em style={{ color: "var(--text-muted)", fontStyle: "normal" }}>Any</em></MenuItem>
                    {PRIORITY_OPTIONS.slice(1).map((p) => (
                      <MenuItem key={p} value={p}>{p}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* From date */}
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  label="Deadline from"
                  type="date"
                  fullWidth
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  className="sf-input"
                />
              </Grid>

              {/* To date */}
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  label="Deadline to"
                  type="date"
                  fullWidth
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  className="sf-input"
                />
              </Grid>

            </Grid>

            {/* Action buttons */}
            <Box sx={{ display: "flex", gap: 2, mt: 3, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <SearchIcon />}
                onClick={handleSearch}
                disabled={loading}
                className="sf-search-btn"
                disableElevation
              >
                Search
              </Button>
              {searched && (
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleClear}
                  className="sf-clear-btn"
                >
                  Clear
                </Button>
              )}
              {count !== null && (
                <Chip
                  label={`${count} result${count !== 1 ? "s" : ""}`}
                  className="sf-count-chip"
                />
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Results */}
        {searched && !loading && (
          <>
            {results.length === 0 ? (
              <div className="search-empty">
                <SearchIcon sx={{ fontSize: "2.5rem", opacity: 0.2, display: "block", margin: "0 auto 8px" }} />
                <Typography sx={{ color: "var(--text-muted)", textAlign: "center" }}>
                  No tasks matched your search.
                </Typography>
              </div>
            ) : (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {results.map((t, i) => (
                  <Grid item xs={12} md={6} lg={4} key={t._id || i}>
                    <Card elevation={0} className="search-result-card">
                      <CardContent>
                        {/* Project badge */}
                        <div className="sr-project">
                          <FolderIcon sx={{ fontSize: "0.85rem", color: "var(--warning)" }} />
                          <span>{t.project_name}</span>
                        </div>

                        <Typography className="sr-name">{t.name}</Typography>

                        {t.description && (
                          <Typography className="sr-desc" noWrap title={t.description}>
                            {t.description}
                          </Typography>
                        )}

                        <div className="sr-chips">
                          <Chip
                            label={t.status}
                            size="small"
                            sx={{
                              background: (STATUS_COLOR[t.status] || "#4f8ef7") + "22",
                              color: STATUS_COLOR[t.status] || "#4f8ef7",
                              border: `1px solid ${(STATUS_COLOR[t.status] || "#4f8ef7")}44`,
                              fontSize: "11px",
                            }}
                          />
                          <Chip
                            label={t.priority || "Medium"}
                            size="small"
                            sx={{
                              background: (PRIORITY_COLOR[t.priority] || "#4f8ef7") + "22",
                              color: PRIORITY_COLOR[t.priority] || "#4f8ef7",
                              border: `1px solid ${(PRIORITY_COLOR[t.priority] || "#4f8ef7")}44`,
                              fontSize: "11px",
                            }}
                          />
                          {t.deadline && (
                            <Chip
                              label={new Date(t.deadline).toLocaleDateString()}
                              size="small"
                              sx={{ fontSize: "11px", background: "var(--bg-elevated)", color: "var(--text-muted)" }}
                            />
                          )}
                        </div>

                        {t.assignee && (
                          <Typography className="sr-assignee">👤 {t.assignee}</Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}

      </Container>
    </div>
  );
}