// File: dodesk/src/Pages/Task.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Box, Button, Typography, Container, TextField, InputAdornment,
  Paper, Tabs, Tab, Modal, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Avatar, Menu, MenuItem,
} from "@mui/material";
import {
  Search as SearchIcon, Add as AddIcon, PlayArrow as StartIcon,
  CheckCircle as CompleteIcon, Schedule as ScheduleIcon,
  Person as PersonIcon, CalendarToday as CalendarIcon,
  DragIndicator as DragIcon, Star as StarIcon, Rocket as RocketIcon,
  AutoAwesome as AutoAwesomeIcon,
} from "@mui/icons-material";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
const AIGuide = React.lazy(() => import("../Component/AIGuide").catch(() => ({ default: () => null })));
import "./Task.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Task = () => {
  // --- States ---
  const [statusTab,       setStatusTab]       = useState(0);
  const [open,            setOpen]            = useState(false);
  const [searchQuery,     setSearchQuery]     = useState("");
  const [tasks,           setTasks]           = useState([]);
  const [projects,        setProjects]        = useState([]);
  const [anchorEl,        setAnchorEl]        = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentUser,     setCurrentUser]     = useState(null);

  const [taskData, setTaskData] = useState({
    name: "", description: "", assignee: "",
    deadline: "", status: "In progress", priority: "Medium",
  });

  // ── AI Guide dialog state ──
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideTask, setGuideTask] = useState(null);

  // --- Axios (stable instance, interceptor added only once) ---
  const api = useMemo(() => {
    const instance = axios.create({ baseURL: API_URL });
    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    return instance;
  }, []);

  // --- Effects ---
  useEffect(() => {
    document.title = "Tasks — DoDesk";

    // ── Grok-style starfield ──────────────────────────────────
    const starfield = document.querySelector(".task-starfield");
    if (starfield) {
      starfield.innerHTML = "";

      // 300 twinkling stars across 4 size classes
      for (let i = 0; i < 300; i++) {
        const star = document.createElement("div");
        const rand = Math.random();
        star.className =
          rand < 0.35 ? "task-star task-star-small"  :
          rand < 0.68 ? "task-star task-star-medium" :
          rand < 0.90 ? "task-star task-star-large"  :
                        "task-star task-star-bright";
        star.style.left              = Math.random() * 100 + "%";
        star.style.top               = Math.random() * 100 + "%";
        star.style.animationDelay    = (Math.random() * 8) + "s";
        star.style.animationDuration = (Math.random() * 4 + 2) + "s";
        star.style.setProperty("--brightness", String(Math.random()));
        starfield.appendChild(star);
      }

      // 6 shooting stars at random intervals
      for (let i = 0; i < 6; i++) {
        const s = document.createElement("div");
        s.className = "task-shooting-star";
        s.style.top               = (Math.random() * 60) + "%";
        s.style.left              = "-200px";
        s.style.animationDelay    = (Math.random() * 20 + 3) + "s";
        s.style.animationDuration = (Math.random() * 2 + 1.5) + "s";
        starfield.appendChild(s);
      }
    }

    const fetchMe = async () => {
      try {
        const res = await api.get("/api/auth/me");
        setCurrentUser(res.data);
        setTaskData((prev) => ({ ...prev, assignee: res.data.name || res.data.email }));
      } catch (e) { console.error("Not logged in"); }
    };
    fetchMe();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get("/api/projects");
        setProjects(res.data || []);
      } catch (e) { console.error("Failed to load projects"); }
    };
    fetchProjects();
  }, []);

  const fetchProjectTasks = React.useCallback(async () => {
    if (!selectedProject?._id) return;
    try {
      const res = await api.get(`/api/projects/${selectedProject._id}/tasks`);
      setTasks(res.data || []);
    } catch (e) { console.error("Failed to load project tasks"); }
  }, [api, selectedProject]);

  useEffect(() => {
    if (!selectedProject) { setTasks([]); return; }
    fetchProjectTasks();
  }, [selectedProject]);

  // --- Handlers ---
  const openMenu      = (e) => setAnchorEl(e.currentTarget);
  const closeMenu     = ()  => setAnchorEl(null);
  const selectProject = (project) => { setSelectedProject(project); closeMenu(); };
  const handleTabChange = (_, newV) => setStatusTab(newV);
  const openModal = () => {
    if (!selectedProject) {
      alert("Please select a project first before creating a task.");
      return;
    }
    setOpen(true);
  };
  const closeModal    = ()  => {
    setTaskData({
      name: "", description: "",
      assignee: currentUser?.name || currentUser?.email || "",
      deadline: "", status: "In progress", priority: "Medium",
    });
    setOpen(false);
  };
  const onChange = (e) => setTaskData({ ...taskData, [e.target.name]: e.target.value });

  // --- CRUD ---
  const createTask = async () => {
    if (!selectedProject) { alert("Please select a project first."); return; }
    if (!taskData.name.trim()) { alert("Task name is required."); return; }
    try {
      await api.post(`/api/projects/${selectedProject._id}/tasks`, taskData);
      closeModal();
      fetchProjectTasks();
    } catch (e) { console.error("Error creating task:", e); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/api/projects/${selectedProject._id}/tasks/${id}/status`, { status });
      fetchProjectTasks();
    } catch (err) { console.error("Error updating status:", err); }
  };

  // --- Drag & Drop ---
  // Deadline assigned per column (representative date within that bucket)
  // Format a Date as "YYYY-MM-DD" using LOCAL timezone (not UTC)
  const toLocalDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const getDeadlineForColumn = (colId) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (colId === "overdue") { d.setDate(d.getDate() - 1); return toLocalDateStr(d); }
    if (colId === "today")   { return toLocalDateStr(d); }
    if (colId === "week")    { d.setDate(d.getDate() + 3);  return toLocalDateStr(d); }
    if (colId === "next")    { d.setDate(d.getDate() + 10); return toLocalDateStr(d); }
    if (colId === "later")   { d.setDate(d.getDate() + 20); return toLocalDateStr(d); }
    if (colId === "none")    return null;
    return null;
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a column or same column same position — do nothing
    if (!destination) return;
    if (!draggableId) return;                          // guard: task has no ID
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;
    if (!selectedProject) return;

    const newDeadline = getDeadlineForColumn(destination.droppableId);

    // ── Optimistic update: move card in local state immediately ──
    setTasks((prev) =>
      prev.map((t) =>
        safeId(t) === draggableId
          ? { ...t, deadline: newDeadline }
          : t
      )
    );

    // ── Background API sync (no await, no refetch) ──
    api.put(
      `/api/projects/${selectedProject._id}/tasks/${draggableId}/deadline`,
      { deadline: newDeadline }
    ).catch((e) => {
      console.error("Deadline update failed — reverting", e);
      // Revert on failure by re-fetching
      fetchProjectTasks();
    });
  };

  // --- Helpers ---
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":   return "#ff0080";
      case "Medium": return "#00f5ff";
      case "Low":    return "#39ff14";
      default:       return "#ffffff";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "In progress": return <ScheduleIcon />;
      case "Started":     return <StartIcon />;
      case "Completed":   return <CompleteIcon />;
      default:            return <ScheduleIcon />;
    }
  };

  const renderAction = (t) => {
    const taskId = t._id;
    if (t.status === "In progress")
      return (
        <Button variant="outlined" size="small"
          onClick={() => updateStatus(taskId, "Started")}
          startIcon={<StartIcon />}
          className="task-action-btn task-start-btn">
          Start
        </Button>
      );
    if (t.status === "Started")
      return (
        <Button variant="contained" size="small"
          onClick={() => updateStatus(taskId, "Completed")}
          startIcon={<CompleteIcon />}
          className="task-action-btn task-complete-btn"
          disableElevation>
          Complete
        </Button>
      );
    if (t.status === "Completed")
      return <Chip icon={<CompleteIcon />} label="Completed" className="task-completed-chip" />;
    return null;
  };

  // Filter tasks for non-timeline views
  // ── Filtering helpers ──────────────────────────────────────
  const todayStart = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Parse deadline safely: treat "YYYY-MM-DD" as local midnight
  const parseDeadline = (dl) => {
    if (!dl) return null;
    // "YYYY-MM-DD" → split to avoid UTC-vs-local shift
    const parts = dl.split("T")[0].split("-");
    if (parts.length === 3) {
      return new Date(
        parseInt(parts[0]),
        parseInt(parts[1]) - 1,
        parseInt(parts[2]),
        0, 0, 0, 0
      );
    }
    return new Date(dl);
  };

  // Guarantee a non-empty string ID for every task — critical for DnD
  const safeId = (t) => String(t._id || t.id || "");

  const isCompleted = (t) =>
    t.status?.toLowerCase().trim() === "completed";

  const isOverdue = (t) => {
    if (isCompleted(t)) return false;
    const dl = parseDeadline(t.deadline);
    return dl !== null && dl < todayStart();
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.name?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // Tab 0 — Active: not completed, not overdue
    if (statusTab === 0) return !isCompleted(t) && !isOverdue(t);

    // Tab 2 — Completed
    if (statusTab === 2) return isCompleted(t);

    // Tab 3 — Overdue
    if (statusTab === 3) return isOverdue(t);

    // Tab 1 — Timeline (all non-completed, handled by Kanban columns)
    return true;
  });

  // ── Memoize board columns — recompute only when tasks/searchQuery change ──
  const boardColumns = React.useMemo(() => {
    const now      = new Date();
    const today0   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const today1   = new Date(today0); today1.setDate(today0.getDate() + 1);
    const week1End = new Date(today0); week1End.setDate(today0.getDate() + 7);
    const week2End = new Date(today0); week2End.setDate(today0.getDate() + 14);

    const activeTasks = tasks
      .filter((t) => !isCompleted(t))
      .filter((t) => !searchQuery ||
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()))
      .map((t) => ({ ...t, _id: safeId(t), _dl: parseDeadline(t.deadline) }));

    const COLUMNS = [
      { id: "overdue", label: "Critical",  icon: "🔥", color: "#ff0080" },
      { id: "today",   label: "Today",     icon: "⚡", color: "#39ff14" },
      { id: "week",    label: "This Week", icon: "🚀", color: "#00f5ff" },
      { id: "next",    label: "Next Week", icon: "🌟", color: "#b347d9" },
      { id: "later",   label: "Future",    icon: "🌌", color: "#ff6600" },
      { id: "none",    label: "Backlog",   icon: "📋", color: "#8a8aa0" },
    ];

    return COLUMNS.map(({ id, label, icon, color }) => {
      const filtered = activeTasks.filter(({ _dl }) => {
        if (id === "overdue") return _dl && _dl < today0;
        if (id === "today")   return _dl && _dl >= today0 && _dl < today1;
        if (id === "week")    return _dl && _dl >= today1 && _dl < week1End;
        if (id === "next")    return _dl && _dl >= week1End && _dl < week2End;
        if (id === "later")   return _dl && _dl >= week2End;
        if (id === "none")    return !_dl;
        return false;
      });
      return { id, label, icon, color, filtered };
    });
  }, [tasks, searchQuery]);

  return (
    <>
      <div className="task-background"><div className="task-starfield" /></div>

      <motion.div 
        className="task-container component-wrapper"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5 }}
      >
        <Container maxWidth="xl">

          {/* ── Header ── */}
          <Box className="task-header cosmic-header">
            <div className="header-content">
              <Typography variant="h3" className="cosmic-title">
                <RocketIcon className="title-icon" />
                <span className="title-text">Task Command Center</span>
                <div className="title-glow" />
              </Typography>
              <Typography variant="subtitle1" className="header-subtitle">
                Manage your missions with cosmic precision
              </Typography>
            </div>

            <div>
              <Button className="cosmic-create-btn" variant="outlined"
                color="inherit" onClick={openMenu} sx={{ mr: 2 }}>
                {selectedProject ? selectedProject.name : "Select Project"}
              </Button>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
                {projects.length > 0
                  ? projects.map((proj) => (
                      <MenuItem key={proj._id || proj.id} onClick={() => selectProject(proj)}>
                        {proj.name}
                      </MenuItem>
                    ))
                  : <MenuItem disabled>No Projects Found</MenuItem>
                }
              </Menu>
            </div>

            <Button startIcon={<AddIcon />} variant="contained"
              onClick={openModal} className="cosmic-create-btn" disableElevation>
              <span>Create Mission</span>
              <div className="btn-ripple" />
            </Button>
          </Box>

          {/* ── Controls ── */}
          <Box className="task-controls cosmic-controls">
            <div className="tabs-container">
              <Tabs value={statusTab} onChange={handleTabChange} className="cosmic-tabs">
                <Tab label={<div className="tab-content"><ScheduleIcon className="tab-icon" /><span>Active</span><div className="tab-glow" /></div>} />
                <Tab label={<div className="tab-content"><CalendarIcon className="tab-icon" /><span>Timeline</span><div className="tab-glow" /></div>} />
                <Tab label={<div className="tab-content"><CompleteIcon className="tab-icon" /><span>Completed</span><div className="tab-glow" /></div>} />
                <Tab label={<div className="tab-content"><StarIcon className="tab-icon" /><span>Overdue</span><div className="tab-glow" /></div>} />
              </Tabs>
            </div>
            <TextField size="small" placeholder="Search missions..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon className="search-icon" /></InputAdornment> }}
              className="cosmic-search" />
          </Box>

          {/* ── Timeline Kanban ── */}
          {statusTab === 1 ? (
            <Box className="cosmic-board">
              <DragDropContext onDragEnd={onDragEnd}>
                <div className="board-columns">
                  {boardColumns.map(({ id, label, icon, color, filtered }) => (
                      <Droppable droppableId={id} key={id}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.droppableProps}
                            className={`cosmic-column ${snapshot.isDraggingOver ? "drag-over" : ""}`}
                            style={{ "--column-color": color }}>
                            <div className="column-header">
                              <div className="column-icon">{icon}</div>
                              <div className="column-info">
                                <Typography className="column-title">{label}</Typography>
                                <Typography className="column-count">{filtered.length} missions</Typography>
                              </div>
                              <div className="column-glow" />
                            </div>
                            <div className="column-content">
                              {filtered.map((t, index) => (
                                <Draggable key={safeId(t)} draggableId={safeId(t)} index={index}>
                                  {(provided, snapshot) => (
                                    <motion.div ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      layoutId={safeId(t)}
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ duration: 0.2 }}
                                      className={`cosmic-task-card ${snapshot.isDragging ? "dragging" : ""}`}>
                                      <div className="task-card-header">
                                        <div className="task-priority"
                                          style={{ backgroundColor: getPriorityColor(t.priority || "Medium") }}>
                                          {t.priority || "Medium"}
                                        </div>
                                        <DragIcon className="drag-handle" />
                                      </div>
                                      <Typography className="task-name">{t.name}</Typography>
                                      <Typography className="task-description">{t.description}</Typography>
                                      <div className="task-meta">
                                        <div className="task-assignee">
                                          <Avatar className="assignee-avatar" sx={{ width: 24, height: 24 }}>
                                            <PersonIcon sx={{ fontSize: 16 }} />
                                          </Avatar>
                                          <span>{t.assignee}</span>
                                        </div>
                                        {t.deadline && (
                                          <div className="task-deadline">
                                            <CalendarIcon sx={{ fontSize: 16 }} />
                                            <span>{new Date(t.deadline).toLocaleDateString()}</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="task-actions">{renderAction(t)}</div>
                                      <div className="card-shine" />
                                      <div className="card-border" />
                                    </motion.div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          </div>
                        )}
                      </Droppable>
                  ))}
                </div>
              </DragDropContext>
            </Box>
          ) : (
            /* ── Table View — 6 columns ── */
            <TableContainer component={Paper} className="cosmic-table" elevation={0}>
              <Table>
                <TableHead>
                  <TableRow className="table-header">
                    <TableCell><b>Mission</b></TableCell>
                    <TableCell><b>Description</b></TableCell>
                    <TableCell><b>Deadline</b></TableCell>
                    <TableCell><b>Status</b></TableCell>
                    <TableCell><b>Priority</b></TableCell>
                    <TableCell><b>AI Guide</b></TableCell>
                    <TableCell><b>Actions</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((t, index) => (
                      <TableRow key={t._id || t.id} className="table-row"
                        style={{ animationDelay: `${index * 0.05}s` }}>

                        {/* Task name */}
                        <TableCell>
                          <div className="task-name-cell">
                            {getStatusIcon(t.status)}
                            <span>{t.name}</span>
                          </div>
                        </TableCell>

                        {/* Description */}
                        <TableCell>
                          <Typography className="task-desc-cell">
                            {t.description || <span className="no-deadline">—</span>}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {t.deadline
                            ? <Chip icon={<CalendarIcon />}
                                label={new Date(t.deadline).toLocaleDateString()}
                                size="small" className="deadline-chip" />
                            : <span className="no-deadline">No deadline</span>
                          }
                        </TableCell>

                        <TableCell>
                          <Chip label={t.status} size="small"
                            className={`status-chip status-${t.status.toLowerCase().replace(" ", "-")}`} />
                        </TableCell>

                        <TableCell>
                          <div className="priority-indicator"
                            style={{ backgroundColor: getPriorityColor(t.priority || "Medium") }}>
                            {t.priority || "Medium"}
                          </div>
                        </TableCell>

                        {/* AI Guide button */}
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            className="ai-row-btn"
                            startIcon={<AutoAwesomeIcon sx={{ fontSize: "0.85rem !important" }} />}
                            onClick={() => { setGuideTask(t); setGuideOpen(true); }}
                          >
                            AI Guide
                          </Button>
                        </TableCell>

                        <TableCell>{renderAction(t)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="empty-state">
                        <div className="empty-content">
                          <RocketIcon className="empty-icon" />
                          <Typography>
                            {selectedProject
                              ? "No tasks found. Create your first task!"
                              : "Select a project to view tasks."}
                          </Typography>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* ── Modal ── */}
          <Modal open={open} onClose={closeModal} className="cosmic-modal">
            <motion.div 
              className="modal-content"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="modal-header">
                <Typography variant="h5" className="modal-title">
                  <AddIcon className="modal-icon" /> Create Task
                </Typography>
                <div className="modal-glow" />
              </div>
              {selectedProject && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--sp-2)",
                  background: "var(--accent-glow)",
                  border: "1px solid var(--border-accent)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--sp-2) var(--sp-4)",
                  marginBottom: "var(--sp-4)",
                  fontSize: "var(--text-sm)",
                  color: "var(--accent-primary)",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                }}>
                  📁 Adding to: <strong style={{ marginLeft: 4 }}>{selectedProject.name}</strong>
                </div>
              )}
              <div className="modal-form">
                <TextField label="Mission Name" name="name" fullWidth margin="normal"
                  value={taskData.name} onChange={onChange} className="cosmic-input" autoFocus />
                <TextField label="Mission Description" name="description" fullWidth margin="normal"
                  multiline rows={3} value={taskData.description} onChange={onChange} className="cosmic-input" />

                <TextField label="Deadline" name="deadline" fullWidth margin="normal"
                  type="date" InputLabelProps={{ shrink: true }}
                  value={taskData.deadline} onChange={onChange} className="cosmic-input" />
                <TextField label="Priority" name="priority" fullWidth margin="normal"
                  select SelectProps={{ native: true }}
                  value={taskData.priority} onChange={onChange} className="cosmic-input">
                  {["Low", "Medium", "High"].map((p) => <option key={p} value={p}>{p}</option>)}
                </TextField>
              </div>
              <div className="modal-actions">
                <Button onClick={closeModal} className="cancel-btn">Cancel</Button>
                <Button variant="contained" onClick={createTask}
                  disabled={!taskData.name.trim()} className="create-btn" disableElevation>
                  Launch Mission
                </Button>
              </div>
            </motion.div>
          </Modal>

        </Container>

        {/* ── AI Task Completion Guide Dialog ── */}
        <React.Suspense fallback={null}>
          <AIGuide
            open={guideOpen}
            onClose={() => setGuideOpen(false)}
            task={guideTask}
            api={api}
          />
        </React.Suspense>

      </motion.div>
    </>
  );
};

export default Task;










































// // File: dodesk/src/Pages/Task.jsx
// import React, { useState, useEffect, useRef, useMemo } from "react";
// import {
//   Box, Button, Typography, Container, TextField, InputAdornment,
//   Paper, Tabs, Tab, Modal, Table, TableBody, TableCell,
//   TableContainer, TableHead, TableRow, Chip, Avatar, Menu, MenuItem,
// } from "@mui/material";
// import {
//   Search as SearchIcon, Add as AddIcon, PlayArrow as StartIcon,
//   CheckCircle as CompleteIcon, Schedule as ScheduleIcon,
//   Person as PersonIcon, CalendarToday as CalendarIcon,
//   DragIndicator as DragIcon, Star as StarIcon, Rocket as RocketIcon,
// } from "@mui/icons-material";
// import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
// import axios from "axios";
// import "./Task.css";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// const Task = () => {
//   // --- States ---
//   const [statusTab,       setStatusTab]       = useState(0);
//   const [open,            setOpen]            = useState(false);
//   const [searchQuery,     setSearchQuery]     = useState("");
//   const [tasks,           setTasks]           = useState([]);
//   const [projects,        setProjects]        = useState([]);
//   const [anchorEl,        setAnchorEl]        = useState(null);
//   const [selectedProject, setSelectedProject] = useState(null);
//   const [currentUser,     setCurrentUser]     = useState(null);

//   const [taskData, setTaskData] = useState({
//     name: "", description: "", assignee: "",
//     deadline: "", status: "In progress", priority: "Medium",
//   });

//   // --- Axios (stable instance, interceptor added only once) ---
//   const api = useMemo(() => {
//     const instance = axios.create({ baseURL: API_URL });
//     instance.interceptors.request.use((config) => {
//       const token = localStorage.getItem("token");
//       if (token) config.headers.Authorization = `Bearer ${token}`;
//       return config;
//     });
//     return instance;
//   }, []);

//   // --- Effects ---
//   useEffect(() => {
//     document.title = "Tasks — DoDesk";

//     // ── Grok-style starfield ──────────────────────────────────
//     const starfield = document.querySelector(".task-starfield");
//     if (starfield) {
//       starfield.innerHTML = "";

//       // 300 twinkling stars across 4 size classes
//       for (let i = 0; i < 300; i++) {
//         const star = document.createElement("div");
//         const rand = Math.random();
//         star.className =
//           rand < 0.35 ? "task-star task-star-small"  :
//           rand < 0.68 ? "task-star task-star-medium" :
//           rand < 0.90 ? "task-star task-star-large"  :
//                         "task-star task-star-bright";
//         star.style.left              = Math.random() * 100 + "%";
//         star.style.top               = Math.random() * 100 + "%";
//         star.style.animationDelay    = (Math.random() * 8) + "s";
//         star.style.animationDuration = (Math.random() * 4 + 2) + "s";
//         star.style.setProperty("--brightness", String(Math.random()));
//         starfield.appendChild(star);
//       }

//       // 6 shooting stars at random intervals
//       for (let i = 0; i < 6; i++) {
//         const s = document.createElement("div");
//         s.className = "task-shooting-star";
//         s.style.top               = (Math.random() * 60) + "%";
//         s.style.left              = "-200px";
//         s.style.animationDelay    = (Math.random() * 20 + 3) + "s";
//         s.style.animationDuration = (Math.random() * 2 + 1.5) + "s";
//         starfield.appendChild(s);
//       }
//     }

//     const fetchMe = async () => {
//       try {
//         const res = await api.get("/api/auth/me");
//         setCurrentUser(res.data);
//         setTaskData((prev) => ({ ...prev, assignee: res.data.name || res.data.email }));
//       } catch (e) { console.error("Not logged in"); }
//     };
//     fetchMe();
//   }, []);

//   useEffect(() => {
//     const fetchProjects = async () => {
//       try {
//         const res = await api.get("/api/projects");
//         setProjects(res.data || []);
//       } catch (e) { console.error("Failed to load projects"); }
//     };
//     fetchProjects();
//   }, []);

//   const fetchProjectTasks = React.useCallback(async () => {
//     if (!selectedProject?._id) return;
//     try {
//       const res = await api.get(`/api/projects/${selectedProject._id}/tasks`);
//       setTasks(res.data || []);
//     } catch (e) { console.error("Failed to load project tasks"); }
//   }, [api, selectedProject]);

//   useEffect(() => {
//     if (!selectedProject) { setTasks([]); return; }
//     fetchProjectTasks();
//   }, [selectedProject]);

//   // --- Handlers ---
//   const openMenu      = (e) => setAnchorEl(e.currentTarget);
//   const closeMenu     = ()  => setAnchorEl(null);
//   const selectProject = (project) => { setSelectedProject(project); closeMenu(); };
//   const handleTabChange = (_, newV) => setStatusTab(newV);
//   const openModal = () => {
//     if (!selectedProject) {
//       alert("Please select a project first before creating a task.");
//       return;
//     }
//     setOpen(true);
//   };
//   const closeModal    = ()  => {
//     setTaskData({
//       name: "", description: "",
//       assignee: currentUser?.name || currentUser?.email || "",
//       deadline: "", status: "In progress", priority: "Medium",
//     });
//     setOpen(false);
//   };
//   const onChange = (e) => setTaskData({ ...taskData, [e.target.name]: e.target.value });

//   // --- CRUD ---
//   const createTask = async () => {
//     if (!selectedProject) { alert("Please select a project first."); return; }
//     if (!taskData.name.trim()) { alert("Task name is required."); return; }
//     try {
//       await api.post(`/api/projects/${selectedProject._id}/tasks`, taskData);
//       closeModal();
//       fetchProjectTasks();
//     } catch (e) { console.error("Error creating task:", e); }
//   };

//   const updateStatus = async (id, status) => {
//     try {
//       await api.put(`/api/projects/${selectedProject._id}/tasks/${id}/status`, { status });
//       fetchProjectTasks();
//     } catch (err) { console.error("Error updating status:", err); }
//   };

//   // --- Drag & Drop ---
//   // Deadline assigned per column (representative date within that bucket)
//   // Format a Date as "YYYY-MM-DD" using LOCAL timezone (not UTC)
//   const toLocalDateStr = (d) => {
//     const y = d.getFullYear();
//     const m = String(d.getMonth() + 1).padStart(2, "0");
//     const day = String(d.getDate()).padStart(2, "0");
//     return `${y}-${m}-${day}`;
//   };

//   const getDeadlineForColumn = (colId) => {
//     const d = new Date();
//     d.setHours(0, 0, 0, 0);
//     if (colId === "overdue") { d.setDate(d.getDate() - 1); return toLocalDateStr(d); }
//     if (colId === "today")   { return toLocalDateStr(d); }
//     if (colId === "week")    { d.setDate(d.getDate() + 3);  return toLocalDateStr(d); }
//     if (colId === "next")    { d.setDate(d.getDate() + 10); return toLocalDateStr(d); }
//     if (colId === "later")   { d.setDate(d.getDate() + 20); return toLocalDateStr(d); }
//     if (colId === "none")    return null;
//     return null;
//   };

//   const onDragEnd = (result) => {
//     const { destination, source, draggableId } = result;

//     // Dropped outside a column or same column same position — do nothing
//     if (!destination) return;
//     if (!draggableId) return;                          // guard: task has no ID
//     if (
//       destination.droppableId === source.droppableId &&
//       destination.index === source.index
//     ) return;
//     if (!selectedProject) return;

//     const newDeadline = getDeadlineForColumn(destination.droppableId);

//     // ── Optimistic update: move card in local state immediately ──
//     setTasks((prev) =>
//       prev.map((t) =>
//         safeId(t) === draggableId
//           ? { ...t, deadline: newDeadline }
//           : t
//       )
//     );

//     // ── Background API sync (no await, no refetch) ──
//     api.put(
//       `/api/projects/${selectedProject._id}/tasks/${draggableId}/deadline`,
//       { deadline: newDeadline }
//     ).catch((e) => {
//       console.error("Deadline update failed — reverting", e);
//       // Revert on failure by re-fetching
//       fetchProjectTasks();
//     });
//   };

//   // --- Helpers ---
//   const getPriorityColor = (priority) => {
//     switch (priority) {
//       case "High":   return "#ff0080";
//       case "Medium": return "#00f5ff";
//       case "Low":    return "#39ff14";
//       default:       return "#ffffff";
//     }
//   };

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case "In progress": return <ScheduleIcon />;
//       case "Started":     return <StartIcon />;
//       case "Completed":   return <CompleteIcon />;
//       default:            return <ScheduleIcon />;
//     }
//   };

//   const renderAction = (t) => {
//     const taskId = t._id;
//     if (t.status === "In progress")
//       return (
//         <Button variant="outlined" size="small"
//           onClick={() => updateStatus(taskId, "Started")}
//           startIcon={<StartIcon />}
//           className="task-action-btn task-start-btn">
//           Start
//         </Button>
//       );
//     if (t.status === "Started")
//       return (
//         <Button variant="contained" size="small"
//           onClick={() => updateStatus(taskId, "Completed")}
//           startIcon={<CompleteIcon />}
//           className="task-action-btn task-complete-btn"
//           disableElevation>
//           Complete
//         </Button>
//       );
//     if (t.status === "Completed")
//       return <Chip icon={<CompleteIcon />} label="Completed" className="task-completed-chip" />;
//     return null;
//   };

//   // Filter tasks for non-timeline views
//   // ── Filtering helpers ──────────────────────────────────────
//   const todayStart = () => {
//     const d = new Date();
//     d.setHours(0, 0, 0, 0);
//     return d;
//   };

//   // Parse deadline safely: treat "YYYY-MM-DD" as local midnight
//   const parseDeadline = (dl) => {
//     if (!dl) return null;
//     // "YYYY-MM-DD" → split to avoid UTC-vs-local shift
//     const parts = dl.split("T")[0].split("-");
//     if (parts.length === 3) {
//       return new Date(
//         parseInt(parts[0]),
//         parseInt(parts[1]) - 1,
//         parseInt(parts[2]),
//         0, 0, 0, 0
//       );
//     }
//     return new Date(dl);
//   };

//   // Guarantee a non-empty string ID for every task — critical for DnD
//   const safeId = (t) => String(t._id || t.id || "");

//   const isCompleted = (t) =>
//     t.status?.toLowerCase().trim() === "completed";

//   const isOverdue = (t) => {
//     if (isCompleted(t)) return false;
//     const dl = parseDeadline(t.deadline);
//     return dl !== null && dl < todayStart();
//   };

//   const filteredTasks = tasks.filter((t) => {
//     const matchesSearch =
//       !searchQuery ||
//       t.name?.toLowerCase().includes(searchQuery.toLowerCase());
//     if (!matchesSearch) return false;

//     // Tab 0 — Active: not completed, not overdue
//     if (statusTab === 0) return !isCompleted(t) && !isOverdue(t);

//     // Tab 2 — Completed
//     if (statusTab === 2) return isCompleted(t);

//     // Tab 3 — Overdue
//     if (statusTab === 3) return isOverdue(t);

//     // Tab 1 — Timeline (all non-completed, handled by Kanban columns)
//     return true;
//   });

//   // ── Memoize board columns — recompute only when tasks/searchQuery change ──
//   const boardColumns = React.useMemo(() => {
//     const now      = new Date();
//     const today0   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
//     const today1   = new Date(today0); today1.setDate(today0.getDate() + 1);
//     const week1End = new Date(today0); week1End.setDate(today0.getDate() + 7);
//     const week2End = new Date(today0); week2End.setDate(today0.getDate() + 14);

//     const activeTasks = tasks
//       .filter((t) => !isCompleted(t))
//       .filter((t) => !searchQuery ||
//         t.name?.toLowerCase().includes(searchQuery.toLowerCase()))
//       .map((t) => ({ ...t, _id: safeId(t), _dl: parseDeadline(t.deadline) }));

//     const COLUMNS = [
//       { id: "overdue", label: "Critical",  icon: "🔥", color: "#ff0080" },
//       { id: "today",   label: "Today",     icon: "⚡", color: "#39ff14" },
//       { id: "week",    label: "This Week", icon: "🚀", color: "#00f5ff" },
//       { id: "next",    label: "Next Week", icon: "🌟", color: "#b347d9" },
//       { id: "later",   label: "Future",    icon: "🌌", color: "#ff6600" },
//       { id: "none",    label: "Backlog",   icon: "📋", color: "#8a8aa0" },
//     ];

//     return COLUMNS.map(({ id, label, icon, color }) => {
//       const filtered = activeTasks.filter(({ _dl }) => {
//         if (id === "overdue") return _dl && _dl < today0;
//         if (id === "today")   return _dl && _dl >= today0 && _dl < today1;
//         if (id === "week")    return _dl && _dl >= today1 && _dl < week1End;
//         if (id === "next")    return _dl && _dl >= week1End && _dl < week2End;
//         if (id === "later")   return _dl && _dl >= week2End;
//         if (id === "none")    return !_dl;
//         return false;
//       });
//       return { id, label, icon, color, filtered };
//     });
//   }, [tasks, searchQuery]);

//   return (
//     <>
//       <div className="task-background"><div className="task-starfield" /></div>

//       <Box className="task-container">
//         <Container maxWidth="xl">

//           {/* ── Header ── */}
//           <Box className="task-header cosmic-header">
//             <div className="header-content">
//               <Typography variant="h3" className="cosmic-title">
//                 <RocketIcon className="title-icon" />
//                 <span className="title-text">Task Command Center</span>
//                 <div className="title-glow" />
//               </Typography>
//               <Typography variant="subtitle1" className="header-subtitle">
//                 Manage your missions with cosmic precision
//               </Typography>
//             </div>

//             <div>
//               <Button className="cosmic-create-btn" variant="outlined"
//                 color="inherit" onClick={openMenu} sx={{ mr: 2 }}>
//                 {selectedProject ? selectedProject.name : "Select Project"}
//               </Button>
//               <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
//                 {projects.length > 0
//                   ? projects.map((proj) => (
//                       <MenuItem key={proj._id || proj.id} onClick={() => selectProject(proj)}>
//                         {proj.name}
//                       </MenuItem>
//                     ))
//                   : <MenuItem disabled>No Projects Found</MenuItem>
//                 }
//               </Menu>
//             </div>

//             <Button startIcon={<AddIcon />} variant="contained"
//               onClick={openModal} className="cosmic-create-btn" disableElevation>
//               <span>Create Mission</span>
//               <div className="btn-ripple" />
//             </Button>
//           </Box>

//           {/* ── Controls ── */}
//           <Box className="task-controls cosmic-controls">
//             <div className="tabs-container">
//               <Tabs value={statusTab} onChange={handleTabChange} className="cosmic-tabs">
//                 <Tab label={<div className="tab-content"><ScheduleIcon className="tab-icon" /><span>Active</span><div className="tab-glow" /></div>} />
//                 <Tab label={<div className="tab-content"><CalendarIcon className="tab-icon" /><span>Timeline</span><div className="tab-glow" /></div>} />
//                 <Tab label={<div className="tab-content"><CompleteIcon className="tab-icon" /><span>Completed</span><div className="tab-glow" /></div>} />
//                 <Tab label={<div className="tab-content"><StarIcon className="tab-icon" /><span>Overdue</span><div className="tab-glow" /></div>} />
//               </Tabs>
//             </div>
//             <TextField size="small" placeholder="Search missions..."
//               value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
//               InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon className="search-icon" /></InputAdornment> }}
//               className="cosmic-search" />
//           </Box>

//           {/* ── Timeline Kanban ── */}
//           {statusTab === 1 ? (
//             <Box className="cosmic-board">
//               <DragDropContext onDragEnd={onDragEnd}>
//                 <div className="board-columns">
//                   {boardColumns.map(({ id, label, icon, color, filtered }) => (
//                       <Droppable droppableId={id} key={id}>
//                         {(provided, snapshot) => (
//                           <div ref={provided.innerRef} {...provided.droppableProps}
//                             className={`cosmic-column ${snapshot.isDraggingOver ? "drag-over" : ""}`}
//                             style={{ "--column-color": color }}>
//                             <div className="column-header">
//                               <div className="column-icon">{icon}</div>
//                               <div className="column-info">
//                                 <Typography className="column-title">{label}</Typography>
//                                 <Typography className="column-count">{filtered.length} missions</Typography>
//                               </div>
//                               <div className="column-glow" />
//                             </div>
//                             <div className="column-content">
//                               {filtered.map((t, index) => (
//                                 <Draggable key={safeId(t)} draggableId={safeId(t)} index={index}>
//                                   {(provided, snapshot) => (
//                                     <div ref={provided.innerRef}
//                                       {...provided.draggableProps}
//                                       {...provided.dragHandleProps}
//                                       className={`cosmic-task-card ${snapshot.isDragging ? "dragging" : ""}`}>
//                                       <div className="task-card-header">
//                                         <div className="task-priority"
//                                           style={{ backgroundColor: getPriorityColor(t.priority || "Medium") }}>
//                                           {t.priority || "Medium"}
//                                         </div>
//                                         <DragIcon className="drag-handle" />
//                                       </div>
//                                       <Typography className="task-name">{t.name}</Typography>
//                                       <Typography className="task-description">{t.description}</Typography>
//                                       <div className="task-meta">
//                                         <div className="task-assignee">
//                                           <Avatar className="assignee-avatar" sx={{ width: 24, height: 24 }}>
//                                             <PersonIcon sx={{ fontSize: 16 }} />
//                                           </Avatar>
//                                           <span>{t.assignee}</span>
//                                         </div>
//                                         {t.deadline && (
//                                           <div className="task-deadline">
//                                             <CalendarIcon sx={{ fontSize: 16 }} />
//                                             <span>{new Date(t.deadline).toLocaleDateString()}</span>
//                                           </div>
//                                         )}
//                                       </div>
//                                       <div className="task-actions">{renderAction(t)}</div>
//                                       <div className="card-shine" />
//                                       <div className="card-border" />
//                                     </div>
//                                   )}
//                                 </Draggable>
//                               ))}
//                               {provided.placeholder}
//                             </div>
//                           </div>
//                         )}
//                       </Droppable>
//                   ))}
//                 </div>
//               </DragDropContext>
//             </Box>
//           ) : (
//             /* ── Table View — 6 columns ── */
//             <TableContainer component={Paper} className="cosmic-table" elevation={0}>
//               <Table>
//                 <TableHead>
//                   <TableRow className="table-header">
//                     <TableCell><b>Mission</b></TableCell>
//                     <TableCell><b>Description</b></TableCell>
//                     <TableCell><b>Deadline</b></TableCell>
//                     <TableCell><b>Status</b></TableCell>
//                     <TableCell><b>Priority</b></TableCell>
//                     <TableCell><b>Actions</b></TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {filteredTasks.length > 0 ? (
//                     filteredTasks.map((t, index) => (
//                       <TableRow key={t._id || t.id} className="table-row"
//                         style={{ animationDelay: `${index * 0.05}s` }}>

//                         {/* Task name */}
//                         <TableCell>
//                           <div className="task-name-cell">
//                             {getStatusIcon(t.status)}
//                             <span>{t.name}</span>
//                           </div>
//                         </TableCell>

//                         {/* Description */}
//                         <TableCell>
//                           <Typography className="task-desc-cell">
//                             {t.description || <span className="no-deadline">—</span>}
//                           </Typography>
//                         </TableCell>

//                         <TableCell>
//                           {t.deadline
//                             ? <Chip icon={<CalendarIcon />}
//                                 label={new Date(t.deadline).toLocaleDateString()}
//                                 size="small" className="deadline-chip" />
//                             : <span className="no-deadline">No deadline</span>
//                           }
//                         </TableCell>

//                         <TableCell>
//                           <Chip label={t.status} size="small"
//                             className={`status-chip status-${t.status.toLowerCase().replace(" ", "-")}`} />
//                         </TableCell>

//                         <TableCell>
//                           <div className="priority-indicator"
//                             style={{ backgroundColor: getPriorityColor(t.priority || "Medium") }}>
//                             {t.priority || "Medium"}
//                           </div>
//                         </TableCell>

//                         <TableCell>{renderAction(t)}</TableCell>
//                       </TableRow>
//                     ))
//                   ) : (
//                     <TableRow>
//                       <TableCell colSpan={7} className="empty-state">
//                         <div className="empty-content">
//                           <RocketIcon className="empty-icon" />
//                           <Typography>
//                             {selectedProject
//                               ? "No tasks found. Create your first task!"
//                               : "Select a project to view tasks."}
//                           </Typography>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   )}
//                 </TableBody>
//               </Table>
//             </TableContainer>
//           )}

//           {/* ── Modal ── */}
//           <Modal open={open} onClose={closeModal} className="cosmic-modal">
//             <Box className="modal-content">
//               <div className="modal-header">
//                 <Typography variant="h5" className="modal-title">
//                   <AddIcon className="modal-icon" /> Create Task
//                 </Typography>
//                 <div className="modal-glow" />
//               </div>
//               {selectedProject && (
//                 <div style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: "var(--sp-2)",
//                   background: "var(--accent-glow)",
//                   border: "1px solid var(--border-accent)",
//                   borderRadius: "var(--radius-md)",
//                   padding: "var(--sp-2) var(--sp-4)",
//                   marginBottom: "var(--sp-4)",
//                   fontSize: "var(--text-sm)",
//                   color: "var(--accent-primary)",
//                   fontFamily: "var(--font-body)",
//                   fontWeight: 600,
//                 }}>
//                   📁 Adding to: <strong style={{ marginLeft: 4 }}>{selectedProject.name}</strong>
//                 </div>
//               )}
//               <div className="modal-form">
//                 <TextField label="Mission Name" name="name" fullWidth margin="normal"
//                   value={taskData.name} onChange={onChange} className="cosmic-input" autoFocus />
//                 <TextField label="Mission Description" name="description" fullWidth margin="normal"
//                   multiline rows={3} value={taskData.description} onChange={onChange} className="cosmic-input" />
//                 <TextField label="Deadline" name="deadline" fullWidth margin="normal"
//                   type="date" InputLabelProps={{ shrink: true }}
//                   value={taskData.deadline} onChange={onChange} className="cosmic-input" />
//                 <TextField label="Priority" name="priority" fullWidth margin="normal"
//                   select SelectProps={{ native: true }}
//                   value={taskData.priority} onChange={onChange} className="cosmic-input">
//                   {["Low", "Medium", "High"].map((p) => <option key={p} value={p}>{p}</option>)}
//                 </TextField>
//               </div>
//               <div className="modal-actions">
//                 <Button onClick={closeModal} className="cancel-btn">Cancel</Button>
//                 <Button variant="contained" onClick={createTask}
//                   disabled={!taskData.name.trim()} className="create-btn" disableElevation>
//                   Launch Mission
//                 </Button>
//               </div>
//             </Box>
//           </Modal>

//         </Container>
//       </Box>
//     </>
//   );
// };

// export default Task;













































// // File: dodesk/src/Pages/Task.jsx
// import React, { useState, useEffect } from "react";
// import {
//   Box, Button, Typography, Container, TextField, InputAdornment,
//   Paper, Tabs, Tab, Modal, Table, TableBody, TableCell,
//   TableContainer, TableHead, TableRow, Chip, Avatar, Menu, MenuItem,
// } from "@mui/material";
// import {
//   Search as SearchIcon, Add as AddIcon, PlayArrow as StartIcon,
//   CheckCircle as CompleteIcon, Schedule as ScheduleIcon,
//   Person as PersonIcon, CalendarToday as CalendarIcon,
//   DragIndicator as DragIcon, Star as StarIcon, Rocket as RocketIcon,
// } from "@mui/icons-material";
// import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
// import axios from "axios";
// import "./Task.css";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// const Task = () => {
//   // --- States ---
//   const [statusTab,        setStatusTab]        = useState(0);
//   const [open,             setOpen]             = useState(false);
//   const [searchQuery,      setSearchQuery]      = useState("");
//   const [tasks,            setTasks]            = useState([]);
//   const [projects,         setProjects]         = useState([]);
//   const [anchorEl,         setAnchorEl]         = useState(null);
//   const [selectedProject,  setSelectedProject]  = useState(null);
//   const [currentUser,      setCurrentUser]      = useState(null);

//   const [taskData, setTaskData] = useState({
//     name:        "",
//     description: "", // ← already existed, preserved
//     assignee:    "",
//     deadline:    "",
//     status:      "In progress",
//     priority:    "Medium",
//   });

//   // --- Axios ---
//   const api = axios.create({ baseURL: API_URL });
//   api.interceptors.request.use((config) => {
//     const token = localStorage.getItem("token");
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   });

//   // --- Effects ---
//   useEffect(() => {
//     document.title = "Tasks — DoDesk";

//     // ── Grok-style starfield ──
//     const createStarfield = () => {
//       const container = document.querySelector(".task-starfield-layer");
//       if (!container) return;
//       container.innerHTML = "";
//       for (let i = 0; i < 280; i++) {
//         const star = document.createElement("div");
//         const size = Math.random();
//         star.className =
//           size < 0.30 ? "star star-small"  :
//           size < 0.62 ? "star star-medium" :
//           size < 0.86 ? "star star-large"  : "star star-bright";
//         star.style.left              = Math.random() * 100 + "%";
//         star.style.top               = Math.random() * 100 + "%";
//         star.style.animationDelay    = (Math.random() * 6) + "s";
//         star.style.animationDuration = (Math.random() * 3 + 2) + "s";
//         star.style.setProperty("--brightness", Math.random());
//         container.appendChild(star);
//       }
//       for (let i = 0; i < 5; i++) {
//         const s = document.createElement("div");
//         s.className = "shooting-star";
//         s.style.top               = Math.random() * 65 + "%";
//         s.style.left              = "-300px";
//         s.style.animationDelay    = (Math.random() * 18 + 2) + "s";
//         s.style.animationDuration = (Math.random() * 2.5 + 1.5) + "s";
//         container.appendChild(s);
//       }
//     };
//     createStarfield();

//     const fetchMe = async () => {
//       try {
//         const res = await api.get("/api/auth/me");
//         setCurrentUser(res.data);
//         setTaskData((prev) => ({ ...prev, assignee: res.data.name || res.data.email }));
//       } catch (e) { console.error("Not logged in"); }
//     };
//     fetchMe();
//   }, []);

//   useEffect(() => {
//     const fetchProjects = async () => {
//       try {
//         const res = await api.get("/api/projects");
//         setProjects(res.data || []);
//       } catch (e) { console.error("Failed to load projects"); }
//     };
//     fetchProjects();
//   }, []);

//   const fetchProjectTasks = async () => {
//     try {
//       const res = await api.get(`/api/projects/${selectedProject._id}/tasks`);
//       setTasks(res.data || []);
//     } catch (e) { console.error("Failed to load project tasks"); }
//   };

//   useEffect(() => {
//     if (!selectedProject) { setTasks([]); return; }
//     fetchProjectTasks();
//   }, [selectedProject]);

//   // --- Handlers ---
//   const openMenu      = (e) => setAnchorEl(e.currentTarget);
//   const closeMenu     = ()  => setAnchorEl(null);
//   const selectProject = (project) => { setSelectedProject(project); closeMenu(); };
//   const handleTabChange = (_, newV) => setStatusTab(newV);
//   const openModal     = ()  => setOpen(true);
//   const closeModal    = ()  => {
//     setTaskData({
//       name:        "",
//       description: "",
//       assignee:    currentUser?.name || currentUser?.email || "",
//       deadline:    "",
//       status:      "In progress",
//       priority:    "Medium",
//     });
//     setOpen(false);
//   };
//   const onChange = (e) => setTaskData({ ...taskData, [e.target.name]: e.target.value });

//   // --- CRUD ---
//   const createTask = async () => {
//     if (!selectedProject) { alert("Please select a project first."); return; }
//     if (!taskData.name.trim()) { alert("Task name is required."); return; }
//     try {
//       // taskData already includes description, so no change needed here
//       await api.post(`/api/projects/${selectedProject._id}/tasks`, taskData);
//       closeModal();
//       fetchProjectTasks();
//     } catch (e) { console.error("Error creating task:", e); }
//   };

//   const updateStatus = async (id, status) => {
//     try {
//       await api.put(`/api/projects/${selectedProject._id}/tasks/${id}/status`, { status });
//       fetchProjectTasks();
//     } catch (err) { console.error("Error updating status:", err); }
//   };

//   // --- Drag & Drop ---
//   const onDragEnd = async (result) => {
//     const { destination, draggableId } = result;
//     if (!destination || !selectedProject) return;

//     const columnMap = {
//       overdue: () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split("T")[0]; },
//       today:   () => new Date().toISOString().split("T")[0],
//       week:    () => { const d = new Date(); d.setDate(d.getDate() + 3);  return d.toISOString().split("T")[0]; },
//       next:    () => { const d = new Date(); d.setDate(d.getDate() + 10); return d.toISOString().split("T")[0]; },
//       later:   () => { const d = new Date(); d.setDate(d.getDate() + 20); return d.toISOString().split("T")[0]; },
//       none:    () => null,
//     };

//     try {
//       await api.put(
//         `/api/projects/${selectedProject._id}/tasks/${draggableId}/deadline`,
//         { deadline: columnMap[destination.droppableId]() }
//       );
//       fetchProjectTasks();
//     } catch (e) { console.error("Deadline update failed", e); }
//   };

//   // --- Helpers ---
//   const getPriorityColor = (priority) => {
//     switch (priority) {
//       case "High":   return "#ff0080";
//       case "Medium": return "#00f5ff";
//       case "Low":    return "#39ff14";
//       default:       return "#ffffff";
//     }
//   };

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case "In progress": return <ScheduleIcon />;
//       case "Started":     return <StartIcon />;
//       case "Completed":   return <CompleteIcon />;
//       default:            return <ScheduleIcon />;
//     }
//   };

//   const renderAction = (t) => {
//     const taskId = t._id;
//     if (t.status === "In progress")
//       return (
//         <Button variant="outlined" size="small"
//           onClick={() => updateStatus(taskId, "Started")}
//           startIcon={<StartIcon />}
//           className="task-action-btn task-start-btn">
//           Start
//         </Button>
//       );
//     if (t.status === "Started")
//       return (
//         <Button variant="contained" size="small"
//           onClick={() => updateStatus(taskId, "Completed")}
//           startIcon={<CompleteIcon />}
//           className="task-action-btn task-complete-btn"
//           disableElevation>
//           Complete
//         </Button>
//       );
//     if (t.status === "Completed")
//       return <Chip icon={<CompleteIcon />} label="Completed" className="task-completed-chip" />;
//     return null;
//   };

//   // Filter tasks for non-timeline views
//   const filteredTasks = tasks.filter((t) => {
//     const matchesSearch = !searchQuery ||
//       t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       t.description?.toLowerCase().includes(searchQuery.toLowerCase()); // ← also search description
//     if (!matchesSearch) return false;
//     if (statusTab === 0) return t.status !== "Completed";
//     if (statusTab === 2) return t.status === "Completed";
//     if (statusTab === 3) {
//       const deadline = t.deadline ? new Date(t.deadline) : null;
//       const today = new Date(); today.setHours(0, 0, 0, 0);
//       return deadline && deadline < today && t.status !== "Completed";
//     }
//     return true;
//   });

//   return (
//     <>
//       {/* Grok-style starfield background */}
//       <div className="task-starfield-bg">
//         <div className="task-starfield-layer" />
//       </div>

//       <Box className="task-container">
//         <Container maxWidth="xl">

//           {/* ── Header ── */}
//           <Box className="task-header cosmic-header">
//             <div className="header-content">
//               <Typography variant="h3" className="cosmic-title">
//                 <RocketIcon className="title-icon" />
//                 <span className="title-text">Task Command Center</span>
//                 <div className="title-glow" />
//               </Typography>
//               <Typography variant="subtitle1" className="header-subtitle">
//                 Manage your missions with cosmic precision
//               </Typography>
//             </div>

//             <div>
//               <Button className="cosmic-create-btn" variant="outlined"
//                 color="inherit" onClick={openMenu} sx={{ mr: 2 }}>
//                 {selectedProject ? selectedProject.name : "Select Project"}
//               </Button>
//               <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
//                 {projects.length > 0
//                   ? projects.map((proj) => (
//                       <MenuItem key={proj._id || proj.id} onClick={() => selectProject(proj)}>
//                         {proj.name}
//                       </MenuItem>
//                     ))
//                   : <MenuItem disabled>No Projects Found</MenuItem>
//                 }
//               </Menu>
//             </div>

//             <Button startIcon={<AddIcon />} variant="contained"
//               onClick={openModal} className="cosmic-create-btn" disableElevation>
//               <span>Create Mission</span>
//               <div className="btn-ripple" />
//             </Button>
//           </Box>

//           {/* ── Controls ── */}
//           <Box className="task-controls cosmic-controls">
//             <div className="tabs-container">
//               <Tabs value={statusTab} onChange={handleTabChange} className="cosmic-tabs">
//                 <Tab label={<div className="tab-content"><ScheduleIcon className="tab-icon" /><span><b>Active</b></span><div className="tab-glow" /></div>} />
//                 <Tab label={<div className="tab-content"><CalendarIcon className="tab-icon" /><span><b>Timeline</b></span><div className="tab-glow" /></div>} />
//                 <Tab label={<div className="tab-content"><CompleteIcon className="tab-icon" /><span><b>Completed</b></span><div className="tab-glow" /></div>} />
//                 <Tab label={<div className="tab-content"><StarIcon className="tab-icon" /><span><b>Overdue</b></span><div className="tab-glow" /></div>} />
//               </Tabs>
//             </div>
//             <TextField size="small" placeholder="Search missions..."
//               value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
//               InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon className="search-icon" /></InputAdornment> }}
//               className="cosmic-search" />
//           </Box>

//           {/* ── Timeline Kanban ── */}
//           {statusTab === 1 ? (
//             <Box className="cosmic-board">
//               <DragDropContext onDragEnd={onDragEnd}>
//                 <div className="board-columns">
//                   {[
//                     { id: "overdue", label: "Critical",  icon: "🔥", color: "#ff0080" },
//                     { id: "today",   label: "Today",     icon: "⚡", color: "#39ff14" },
//                     { id: "week",    label: "This Week", icon: "🚀", color: "#00f5ff" },
//                     { id: "next",    label: "Next Week", icon: "🌟", color: "#b347d9" },
//                     { id: "later",   label: "Future",    icon: "🌌", color: "#ff6600" },
//                     { id: "none",    label: "Backlog",   icon: "📋", color: "#8a8aa0" },
//                   ].map(({ id, label, icon, color }) => {
//                     const now = new Date();
//                     const filtered = tasks.filter((t) => {
//                       if (t.status === "Completed") return false;
//                       if (searchQuery && !t.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
//                       const deadline = t.deadline ? new Date(t.deadline) : null;
//                       if (id === "overdue") return deadline && deadline < new Date(now.setHours(0,0,0,0));
//                       if (id === "today")   return deadline?.toDateString() === new Date().toDateString();
//                       if (id === "week")    { const e = new Date(); e.setDate(now.getDate()+7); return deadline && deadline > now && deadline <= e; }
//                       if (id === "next")    { const s = new Date(); const e = new Date(); s.setDate(now.getDate()+7); e.setDate(now.getDate()+14); return deadline && deadline > s && deadline <= e; }
//                       if (id === "later")  { const tw = new Date(); tw.setDate(now.getDate()+14); return deadline && deadline > tw; }
//                       if (id === "none")   return !deadline;
//                       return false;
//                     });

//                     return (
//                       <Droppable droppableId={id} key={id}>
//                         {(provided, snapshot) => (
//                           <div ref={provided.innerRef} {...provided.droppableProps}
//                             className={`cosmic-column ${snapshot.isDraggingOver ? "drag-over" : ""}`}
//                             style={{ "--column-color": color }}>
//                             <div className="column-header">
//                               <div className="column-icon">{icon}</div>
//                               <div className="column-info">
//                                 <Typography className="column-title">{label}</Typography>
//                                 <Typography className="column-count">{filtered.length} missions</Typography>
//                               </div>
//                               <div className="column-glow" />
//                             </div>
//                             <div className="column-content">
//                               {filtered.map((t, index) => (
//                                 <Draggable key={t._id || t.id} draggableId={t._id || t.id} index={index}>
//                                   {(provided, snapshot) => (
//                                     <div ref={provided.innerRef}
//                                       {...provided.draggableProps}
//                                       {...provided.dragHandleProps}
//                                       className={`cosmic-task-card ${snapshot.isDragging ? "dragging" : ""}`}>
//                                       <div className="task-card-header">
//                                         <div className="task-priority"
//                                           style={{ backgroundColor: getPriorityColor(t.priority || "Medium") }}>
//                                           {t.priority || "Medium"}
//                                         </div>
//                                         <DragIcon className="drag-handle" />
//                                       </div>
//                                       <Typography className="task-name">{t.name || t.title || "Untitled"}</Typography>
//                                       {/* ← Description shown on Kanban card if present */}
//                                       {t.description && (
//                                         <Typography className="task-description">
//                                           {t.description}
//                                         </Typography>
//                                       )}
//                                       <div className="task-meta">
//                                         <div className="task-assignee">
//                                           <Avatar className="assignee-avatar" sx={{ width: 24, height: 24 }}>
//                                             <PersonIcon sx={{ fontSize: 16 }} />
//                                           </Avatar>
//                                           <span>{t.assignee}</span>
//                                         </div>
//                                         {t.deadline && (
//                                           <div className="task-deadline">
//                                             <CalendarIcon sx={{ fontSize: 16 }} />
//                                             <span>{new Date(t.deadline).toLocaleDateString()}</span>
//                                           </div>
//                                         )}
//                                       </div>
//                                       <div className="task-actions">{renderAction(t)}</div>
//                                       <div className="card-shine" />
//                                       <div className="card-border" />
//                                     </div>
//                                   )}
//                                 </Draggable>
//                               ))}
//                               {provided.placeholder}
//                             </div>
//                           </div>
//                         )}
//                       </Droppable>
//                     );
//                   })}
//                 </div>
//               </DragDropContext>
//             </Box>
//           ) : (
//             /* ── Table View ── now includes Description column ← NEW */
//             <TableContainer component={Paper} className="cosmic-table" elevation={0}>
//               <Table>
//                 <TableHead>
//                   <TableRow className="table-header">
//                     <TableCell><b>Mission</b></TableCell>
//                     <TableCell className="hide-xs-task"><b>Description</b></TableCell>{/* ← NEW column */}
//                     <TableCell><b>Deadline</b></TableCell>
//                     <TableCell><b>Status</b></TableCell>
//                     <TableCell><b>Priority</b></TableCell>
//                     <TableCell><b>Actions</b></TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {filteredTasks.length > 0 ? (
//                     filteredTasks.map((t, index) => (
//                       <TableRow key={t._id || t.id} className="table-row"
//                         style={{ animationDelay: `${index * 0.05}s` }}>

//                         {/* Task name — use name, fall back to title for legacy tasks */}
//                         <TableCell>
//                           <div className="task-name-cell">
//                             {getStatusIcon(t.status)}
//                             <span>{t.name || t.title || "Untitled"}</span>
//                           </div>
//                         </TableCell>

//                         {/* Description ← NEW cell */}
//                         <TableCell className="hide-xs-task">
//                           <span className="task-description-cell">
//                             {t.description || <span className="no-description">—</span>}
//                           </span>
//                         </TableCell>

//                         <TableCell>
//                           {t.deadline
//                             ? <Chip icon={<CalendarIcon />}
//                                 label={new Date(t.deadline).toLocaleDateString()}
//                                 size="small" className="deadline-chip" />
//                             : <span className="no-deadline">No deadline</span>
//                           }
//                         </TableCell>

//                         <TableCell>
//                           <Chip label={t.status} size="small"
//                             className={`status-chip status-${t.status.toLowerCase().replace(" ", "-")}`} />
//                         </TableCell>

//                         <TableCell>
//                           <div className="priority-indicator"
//                             style={{ backgroundColor: getPriorityColor(t.priority || "Medium") }}>
//                             {t.priority || "Medium"}
//                           </div>
//                         </TableCell>

//                         <TableCell>{renderAction(t)}</TableCell>
//                       </TableRow>
//                     ))
//                   ) : (
//                     <TableRow>
//                       <TableCell colSpan={7} className="empty-state">{/* ← colSpan updated to 6 */}
//                         <div className="empty-content">
//                           <RocketIcon className="empty-icon" />
//                           <Typography>
//                             {selectedProject
//                               ? "No tasks found. Create your first task!"
//                               : "Select a project to view tasks."}
//                           </Typography>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   )}
//                 </TableBody>
//               </Table>
//             </TableContainer>
//           )}

//           {/* ── Modal ── */}
//           <Modal open={open} onClose={closeModal} className="cosmic-modal">
//             <Box className="modal-content">
//               <div className="modal-header">
//                 <Typography variant="h5" className="modal-title">
//                   <AddIcon className="modal-icon" /> Create New Mission
//                 </Typography>
//                 <div className="modal-glow" />
//               </div>
//               <div className="modal-form">
//                 <TextField label="Mission Name" name="name" fullWidth margin="normal"
//                   value={taskData.name} onChange={onChange} className="cosmic-input" autoFocus />

//                 {/* Description field — already existed, now clearly labelled ← */}
//                 <TextField label="Mission Description" name="description" fullWidth margin="normal"
//                   multiline rows={3} value={taskData.description} onChange={onChange}
//                   className="cosmic-input"
//                   placeholder="What does this task involve? (optional)" />

//                 <TextField label="Deadline" name="deadline" fullWidth margin="normal"
//                   type="date" InputLabelProps={{ shrink: true }}
//                   value={taskData.deadline} onChange={onChange} className="cosmic-input" />
//                 <TextField label="Priority" name="priority" fullWidth margin="normal"
//                   select SelectProps={{ native: true }}
//                   value={taskData.priority} onChange={onChange} className="cosmic-input">
//                   {["Low", "Medium", "High"].map((p) => <option key={p} value={p}>{p}</option>)}
//                 </TextField>
//               </div>
//               <div className="modal-actions">
//                 <Button onClick={closeModal} className="cancel-btn">Cancel</Button>
//                 <Button variant="contained" onClick={createTask}
//                   disabled={!taskData.name.trim()} className="create-btn" disableElevation>
//                   Launch Mission
//                 </Button>
//               </div>
//             </Box>
//           </Modal>

//         </Container>
//       </Box>
//     </>
//   );
// };

// export default Task;









































































































// // File: dodesk/src/Pages/Task.jsx

// import React, { useState, useEffect } from "react";
// import {
//   Box, Button, Typography, Container, TextField, InputAdornment, 
//   Paper, Tabs, Tab, Modal, Table, TableBody, TableCell, 
//   TableContainer, TableHead, TableRow, Chip, Avatar, Menu, MenuItem,
// } from "@mui/material";
// import {
//   Search as SearchIcon, Add as AddIcon, PlayArrow as StartIcon, 
//   CheckCircle as CompleteIcon, Schedule as ScheduleIcon, 
//   Person as PersonIcon, CalendarToday as CalendarIcon, 
//   DragIndicator as DragIcon, Star as StarIcon, Rocket as RocketIcon,
// } from "@mui/icons-material";
// import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
// import axios from "axios";
// import "./Task.css";

// // API configuration from environment variables
// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// const Task = () => {
//   // --- States for UI and Data ---
//   const [statusTab, setStatusTab] = useState(0); // For switching between Active/Timeline/Completed views
//   const [open, setOpen] = useState(false); // Controls the "Create Task" modal
//   const [searchQuery, setSearchQuery] = useState(""); // Filter tasks by name
//   const [tasks, setTasks] = useState([]); // Stores tasks of the selected project
//   const [projects, setProjects] = useState([]); // List of projects available to the user
//   const [anchorEl, setAnchorEl] = useState(null); // Anchor for the Project Selection menu
//   const [selectedProject, setSelectedProject] = useState(null); // Current active project
//   const [currentUser, setCurrentUser] = useState(null); // Stores logged-in user profile

//   // Form state for creating a new task
//   const [taskData, setTaskData] = useState({
//     name: "",
//     description: "",
//     assignee: "",
//     deadline: "",
//     status: "In progress",
//     priority: "Medium",
//   });

//   // --- Axios Setup ---
//   const api = axios.create({
//     baseURL: API_URL,
//   });

//   // Interceptor to attach JWT token to every request for security
//   api.interceptors.request.use((config) => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   });

//   // --- Side Effects (Fetch Data) ---

//   // Get current logged-in user details on component mount
//   useEffect(() => {
//     const fetchMe = async () => {
//       try {
//         const res = await api.get("/api/auth/me");
//         setCurrentUser(res.data);
//         // Default the assignee to the current user's name
//         setTaskData((prev) => ({
//           ...prev,
//           assignee: res.data.name || res.data.email,
//         }));
//       } catch (e) {
//         console.error("Not logged in");
//       }
//     };
//     fetchMe();
//   }, []);

//   // Fetch all projects where the user is a creator or a team member
//   useEffect(() => {
//     const fetchProjects = async () => {
//       try {
//         const res = await api.get("/api/projects");
//         setProjects(res.data || []);
//       } catch (e) {
//         console.error("Failed to load projects");
//       }
//     };
//     fetchProjects();
//   }, []);

//   // Fetch tasks belonging to a specific project
//   const fetchProjectTasks = async () => {
//     try {
//       const res = await api.get(
//         `/api/projects/${selectedProject._id}/tasks`
//       );
//       setTasks(res.data || []);
//     } catch (e) {
//       console.error("Failed to load project tasks");
//     }
//   };

//   // Re-fetch tasks whenever the user switches the selected project
//   useEffect(() => {
//     if (!selectedProject) {
//       setTasks([]);
//       return;
//     } else {
//       fetchProjectTasks();
//     }
//   }, [selectedProject]);

//   // --- Menu and Modal Handlers ---

//   const openMenu = (e) => setAnchorEl(e.currentTarget);
//   const closeMenu = () => setAnchorEl(null);
  
//   const selectProject = (project) => {
//     setSelectedProject(project);
//     closeMenu();
//   };

//   const handleTabChange = (_, newV) => setStatusTab(newV);

//   const openModal = () => setOpen(true);
//   const closeModal = () => {
//     // Reset form fields back to default when closing the modal
//     setTaskData({
//       name: "",
//       description: "",
//       assignee: currentUser?.name || currentUser?.email || "",
//       deadline: "",
//       status: "In progress",
//       priority: "Medium",
//     });
//     setOpen(false);
//   };

//   const onChange = (e) =>
//     setTaskData({ ...taskData, [e.target.name]: e.target.value });

//   // --- CRUD Operations ---

//   // Adds a new task to the selected project's embedded task array
//   const createTask = async () => {
//     if (!selectedProject) {
//       alert("Please select a project first.");
//       return;
//     }

//     if (!taskData.name.trim()) {
//       alert("Task name is required.");
//       return;
//     }

//     try {
//       await api.post(
//         `/api/projects/${selectedProject._id}/tasks`,
//         taskData
//       );
//       closeModal();
//       fetchProjectTasks(); // Refresh the list after creation
//     } catch (e) {
//       console.error("Error creating task:", e);
//     }
//   };

//   // Updates the task status (e.g., In progress -> Started -> Completed)
//   const updateStatus = async (id, status) => {
//     try {
//       await api.put(
//         `/api/projects/${selectedProject._id}/tasks/${id}/status`,
//         { status }
//       );
//       fetchProjectTasks(); // Sync UI with the database
//     } catch (err) {
//       console.error("Error updating status:", err);
//     }
//   };

//   // --- Drag and Drop Logic (Kanban/Timeline Board) ---
//   const onDragEnd = async (result) => {
//     const { destination, draggableId } = result;
//     if (!destination || !selectedProject) return;

//     // Map column names to specific future/past dates for the task deadline
//     const columnMap = {
//       overdue: () => {
//         const d = new Date();
//         d.setDate(d.getDate() - 1);
//         return d.toISOString().split("T")[0];
//       },
//       today: () => new Date().toISOString().split("T")[0],
//       week: () => {
//         const d = new Date();
//         d.setDate(d.getDate() + 3);
//         return d.toISOString().split("T")[0];
//       },
//       next: () => {
//         const d = new Date();
//         d.setDate(d.getDate() + 10);
//         return d.toISOString().split("T")[0];
//       },
//       later: () => {
//         const d = new Date();
//         d.setDate(d.getDate() + 20);
//         return d.toISOString().split("T")[0];
//       },
//       none: () => null,
//     };

//     try {
//       // Update the task deadline in the database when moved to a different column
//       await api.put(
//         `/api/projects/${selectedProject._id}/tasks/${draggableId}/deadline`,
//         {
//           deadline: columnMap[destination.droppableId](),
//         }
//       );
//       fetchProjectTasks();
//     } catch (e) {
//       console.error("Deadline update failed", e);
//     }
//   };

//   // --- Styling Helpers ---
//   const getPriorityColor = (priority) => {
//     switch (priority) {
//       case "High": return "#ff0080";
//       case "Medium": return "#00f5ff";
//       case "Low": return "#39ff14";
//       default: return "#ffffff";
//     }
//   };

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case "In progress": return <ScheduleIcon />;
//       case "Started": return <StartIcon />;
//       case "Completed": return <CompleteIcon />;
//       default: return <ScheduleIcon />;
//     }
//   };

//   // Renders context-aware action buttons based on task status
//   const renderAction = (t) => {
//     const taskId = t._id;
//     if (t.status === "In progress")
//       return (
//         <Button
//           variant="outlined"
//           size="small"
//           onClick={() => updateStatus(taskId, "Started")}
//           startIcon={<StartIcon />}
//           className="task-action-btn task-start-btn"
//         >
//           Start
//         </Button>
//       );
//     if (t.status === "Started")
//       return (
//         <Button
//           variant="contained"
//           size="small"
//           onClick={() => updateStatus(taskId, "Completed")}
//           startIcon={<CompleteIcon />}
//           className="task-action-btn task-complete-btn"
//         >
//           Complete
//         </Button>
//       );
//     if (t.status === "Completed")
//       return <Chip icon={<CompleteIcon />} label="Completed" className="task-completed-chip" />;
//     return null;
//   };

//   return (
//     <>
//       {/* Background visual effects */}
//       <div className="task-background">
//         <div className="task-starfield"></div>
//       </div>

//       <Box className="task-container">
//         <Container maxWidth="xl">
//           {/* Dashboard Header Section */}
//           <Box className="task-header cosmic-header">
//             <div className="header-content">
//               <Typography variant="h3" className="cosmic-title">
//                 <RocketIcon className="title-icon" />
//                 <span className="title-text">Task Command Center</span>
//                 <div className="title-glow"></div>
//               </Typography>
//               <Typography variant="subtitle1" className="header-subtitle">
//                 Manage your missions with cosmic precision
//               </Typography>
//             </div>

//             {/* Project Selection Menu */}
//             <div>
//               <Button
//                 className="cosmic-create-btn"
//                 variant="outlined"
//                 color="inherit"
//                 onClick={openMenu}
//                 sx={{ mr: 2 }}
//               >
//                 {selectedProject ? selectedProject.name : "Select Project"}
//               </Button>
//               <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
//                 {projects.length > 0 ? (
//                   projects.map((proj) => (
//                     <MenuItem key={proj._id || proj.id} onClick={() => selectProject(proj)}>
//                       {proj.name}
//                     </MenuItem>
//                   ))
//                 ) : (
//                   <MenuItem disabled>No Projects Found</MenuItem>
//                 )}
//               </Menu>
//             </div>

//             <Button
//               startIcon={<AddIcon />}
//               variant="contained"
//               onClick={openModal}
//               className="cosmic-create-btn"
//             >
//               <span>Create Mission</span>
//               <div className="btn-ripple"></div>
//             </Button>
//           </Box>

//           {/* Search and Tabs Filter Section */}
//           <Box className="task-controls cosmic-controls">
//             <div className="tabs-container">
//               <Tabs value={statusTab} onChange={handleTabChange} className="cosmic-tabs">
//                 <Tab label={<div className="tab-content"><ScheduleIcon className="tab-icon" /><span>Active</span><div className="tab-glow"></div></div>} />
//                 <Tab label={<div className="tab-content"><CalendarIcon className="tab-icon" /><span>Timeline</span><div className="tab-glow"></div></div>} />
//                 <Tab label={<div className="tab-content"><CompleteIcon className="tab-icon" /><span>Completed</span><div className="tab-glow"></div></div>} />
//                 <Tab label={<div className="tab-content"><StarIcon className="tab-icon" /><span>Overdue</span><div className="tab-glow"></div></div>} />
//               </Tabs>
//             </div>

//             <TextField
//               size="small"
//               placeholder="Search missions..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <SearchIcon className="search-icon" />
//                   </InputAdornment>
//                 ),
//               }}
//               className="cosmic-search"
//             />
//           </Box>

//           {/* View 1: Timeline Board (Drag and Drop Kanban) */}
//           {statusTab === 1 ? (
//             <Box className="cosmic-board">
//               <DragDropContext onDragEnd={onDragEnd}>
//                 <div className="board-columns">
//                   {[
//                     { id: "overdue", label: "Critical", icon: "🔥", color: "#ff0080" },
//                     { id: "today", label: "Today", icon: "⚡", color: "#39ff14" },
//                     { id: "week", label: "This Week", icon: "🚀", color: "#00f5ff" },
//                     { id: "next", label: "Next Week", icon: "🌟", color: "#b347d9" },
//                     { id: "later", label: "Future", icon: "🌌", color: "#ff6600" },
//                     { id: "none", label: "Backlog", icon: "📋", color: "#8a8aa0" },
//                   ].map(({ id, label, icon, color }) => {
//                     const now = new Date();
//                     const filtered = tasks.filter((t) => {
//                       if (t.status === "Completed") return false;
//                       const deadline = t.deadline ? new Date(t.deadline) : null;
//                       if (id === "overdue") return deadline && deadline < new Date(now.setHours(0, 0, 0, 0));
//                       if (id === "today") return deadline?.toDateString() === new Date().toDateString();
//                       if (id === "week") {
//                         const endOfWeek = new Date();
//                         endOfWeek.setDate(now.getDate() + 7);
//                         return deadline && deadline > now && deadline <= endOfWeek;
//                       }
//                       if (id === "next") {
//                         const start = new Date();
//                         const end = new Date();
//                         start.setDate(now.getDate() + 7);
//                         end.setDate(now.getDate() + 14);
//                         return deadline && deadline > start && deadline <= end;
//                       }
//                       if (id === "later") {
//                         const twoWeeks = new Date();
//                         twoWeeks.setDate(now.getDate() + 14);
//                         return deadline && deadline > twoWeeks;
//                       }
//                       if (id === "none") return !deadline;
//                       return false;
//                     });

//                     return (
//                       <Droppable droppableId={id} key={id}>
//                         {(provided, snapshot) => (
//                           <div
//                             ref={provided.innerRef}
//                             {...provided.droppableProps}
//                             className={`cosmic-column ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
//                             style={{ '--column-color': color }}
//                           >
//                             <div className="column-header">
//                               <div className="column-icon">{icon}</div>
//                               <div className="column-info">
//                                 <Typography className="column-title">{label}</Typography>
//                                 <Typography className="column-count">{filtered.length} missions</Typography>
//                               </div>
//                               <div className="column-glow"></div>
//                             </div>

//                             <div className="column-content">
//                               {filtered.map((t, index) => (
//                                 <Draggable key={t._id || t.id} draggableId={t._id || t.id} index={index}>
//                                   {(provided, snapshot) => (
//                                     <div
//                                       ref={provided.innerRef}
//                                       {...provided.draggableProps}
//                                       {...provided.dragHandleProps}
//                                       className={`cosmic-task-card ${snapshot.isDragging ? 'dragging' : ''}`}
//                                     >
//                                       <div className="task-card-header">
//                                         <div className="task-priority" style={{ backgroundColor: getPriorityColor(t.priority || 'Medium') }}>
//                                           {t.priority || 'Medium'}
//                                         </div>
//                                         <DragIcon className="drag-handle" />
//                                       </div>
//                                       <Typography className="task-name">{t.name}</Typography>
//                                       <Typography className="task-description">{t.description}</Typography>
//                                       <div className="task-meta">
//                                         <div className="task-assignee">
//                                           <Avatar className="assignee-avatar" sx={{ width: 24, height: 24 }}><PersonIcon sx={{ fontSize: 16 }} /></Avatar>
//                                           <span>{t.assignee}</span>
//                                         </div>
//                                         {t.deadline && (
//                                           <div className="task-deadline">
//                                             <CalendarIcon sx={{ fontSize: 16 }} />
//                                             <span>{new Date(t.deadline).toLocaleDateString()}</span>
//                                           </div>
//                                         )}
//                                       </div>
//                                       <div className="task-actions">{renderAction(t)}</div>
//                                       <div className="card-shine"></div>
//                                       <div className="card-border"></div>
//                                     </div>
//                                   )}
//                                 </Draggable>
//                               ))}
//                               {provided.placeholder}
//                             </div>
//                           </div>
//                         )}
//                       </Droppable>
//                     );
//                   })}
//                 </div>
//               </DragDropContext>
//             </Box>
//           ) : (
//             // View 2: Data Table List View
//             <TableContainer component={Paper} className="cosmic-table">
//               <Table>
//                 <TableHead>
//                   <TableRow className="table-header">
//                     <TableCell>Mission</TableCell>
//                     <TableCell>Description</TableCell>
//                     <TableCell>Assignee</TableCell>
//                     <TableCell>Deadline</TableCell>
//                     <TableCell>Status</TableCell>
//                     <TableCell>Priority</TableCell>
//                     <TableCell>Actions</TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {tasks.map((t, index) => (
//                     <TableRow key={t._id || t.id} className="table-row" style={{ animationDelay: `${index * 0.1}s` }}>
//                       <TableCell><div className="task-name-cell">{getStatusIcon(t.status)}<span>{t.name}</span></div></TableCell>
//                       <TableCell className="description-cell">{t.description}</TableCell>
//                       <TableCell><div className="assignee-cell"><Avatar sx={{ width: 32, height: 32, mr: 1 }}><PersonIcon /></Avatar>{t.assignee}</div></TableCell>
//                       <TableCell>
//                         {t.deadline ? (
//                           <Chip icon={<CalendarIcon />} label={new Date(t.deadline).toLocaleDateString()} size="small" className="deadline-chip" />
//                         ) : <span className="no-deadline">No deadline</span>}
//                       </TableCell>
//                       <TableCell><Chip label={t.status} className={`status-chip status-${t.status.toLowerCase().replace(' ', '-')}`} /></TableCell>
//                       <TableCell><div className="priority-indicator" style={{ backgroundColor: getPriorityColor(t.priority || 'Medium') }}>{t.priority || 'Medium'}</div></TableCell>
//                       <TableCell>{renderAction(t)}</TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </TableContainer>
//           )}

//           {/* Task Creation Modal */}
//           <Modal open={open} onClose={closeModal} className="cosmic-modal">
//             <Box className="modal-content">
//               <div className="modal-header">
//                 <Typography variant="h5" className="modal-title"><AddIcon className="modal-icon" /> Create New Mission</Typography>
//                 <div className="modal-glow"></div>
//               </div>
//               <div className="modal-form">
//                 <TextField label="Mission Name" name="name" fullWidth margin="normal" value={taskData.name} onChange={onChange} className="cosmic-input" />
//                 <TextField label="Mission Description" name="description" fullWidth margin="normal" multiline rows={3} value={taskData.description} onChange={onChange} className="cosmic-input" />
//                 <TextField label="Deadline" name="deadline" fullWidth margin="normal" type="date" InputLabelProps={{ shrink: true }} value={taskData.deadline} onChange={onChange} className="cosmic-input" />
//                 <TextField label="Priority" name="priority" fullWidth margin="normal" select SelectProps={{ native: true }} value={taskData.priority} onChange={onChange} className="cosmic-input">
//                   {["Low", "Medium", "High"].map((p) => <option key={p} value={p}>{p}</option>)}
//                 </TextField>
//               </div>
//               <div className="modal-actions">
//                 <Button onClick={closeModal} className="cancel-btn">Cancel</Button>
//                 <Button variant="contained" onClick={createTask} disabled={!taskData.name.trim()} className="create-btn">Launch Mission</Button>
//               </div>
//             </Box>
//           </Modal>
//         </Container>
//       </Box>
//     </>
//   );
// };

// export default Task;














































// import React, { useState, useEffect } from "react";
// import {
//   Box,
//   Button,
//   Typography,
//   Container,
//   TextField,
//   InputAdornment,
//   Paper,
//   Tabs,
//   Tab,
//   Modal,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Chip,
//   Avatar,
//   Menu,
//   MenuItem,
// } from "@mui/material";
// import {
//   Search as SearchIcon,
//   Add as AddIcon,
//   PlayArrow as StartIcon,
//   CheckCircle as CompleteIcon,
//   Schedule as ScheduleIcon,
//   Person as PersonIcon,
//   CalendarToday as CalendarIcon,
//   DragIndicator as DragIcon,
//   Star as StarIcon,
//   Rocket as RocketIcon,
// } from "@mui/icons-material";
// import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
// import axios from "axios";
// import "./Task.css";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// const Task = () => {
//   const [statusTab, setStatusTab] = useState(0);
//   const [open, setOpen] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [tasks, setTasks] = useState([]);
//   const [projects, setProjects] = useState([]);
//   const [anchorEl, setAnchorEl] = useState(null);
//   const [selectedProject, setSelectedProject] = useState(null);
//   const [currentUser, setCurrentUser] = useState(null);

//   const [taskData, setTaskData] = useState({
//     name: "",
//     description: "",
//     assignee: "",
//     deadline: "",
//     status: "In progress",
//     priority: "Medium",
//   });

//   const api = axios.create({
//     baseURL: API_URL,
//     withCredentials: true,
//   });

//   // Get current user
//   useEffect(() => {
//     const fetchMe = async () => {
//       try {
//         const res = await api.get("/api/auth/me");
//         setCurrentUser(res.data);
//         setTaskData((prev) => ({
//           ...prev,
//           assignee: res.data.name || res.data.email,
//         }));
//       } catch (e) {
//         console.error("Not logged in");
//       }
//     };
//     fetchMe();
//   }, []);

//   // Fetch projects
//   useEffect(() => {
//     const fetchProjects = async () => {
//       try {
//         const res = await api.get("/api/projects/my");
//         setProjects(res.data || []);
//       } catch (e) {
//         console.error("Failed to load projects");
//       }
//     };
//     fetchProjects();
//   }, []);

//   // Fetch tasks
//   const fetchTasks = async () => {
//     try {
//       const res = await api.get("/api/tasks/my");
//       setTasks(res.data || []);
//     } catch (e) {
//       console.error("Failed to load tasks");
//     }
//   };

//   useEffect(() => {
//     fetchTasks();
//   }, []);

//   // Menu handlers
//   const openMenu = (e) => setAnchorEl(e.currentTarget);
//   const closeMenu = () => setAnchorEl(null);
//   const selectProject = (project) => {
//     setSelectedProject(project);
//     closeMenu();
//   };

//   const handleTabChange = (_, newV) => setStatusTab(newV);
//   const openModal = () => setOpen(true);
//   const closeModal = () => {
//     setTaskData({
//       name: "",
//       description: "",
//       assignee: currentUser?.name || currentUser?.email || "",
//       deadline: "",
//       status: "In progress",
//       priority: "Medium",
//     });
//     setOpen(false);
//   };

//   const onChange = (e) =>
//     setTaskData({ ...taskData, [e.target.name]: e.target.value });

//   // Create task
//   const createTask = async () => {
//     if (!taskData.name.trim()) {
//       alert("Task name is required.");
//       return;
//     }
//     try {
//       await api.post("/api/tasks/create", {
//         ...taskData,
//         project_id: selectedProject?._id || selectedProject?.id || null, // FastAPI usually uses project_id
//       });
//       closeModal();
//       fetchTasks();
//     } catch (e) {
//       console.error("Error creating task:", e);
//       alert("Failed to create task.");
//     }
//   };

//   // Update status (FastAPI Logic)
//   const updateStatus = async (id, status) => {
//     try {
//       await api.put(`/api/tasks/${id}/status`, { status });
//       fetchTasks();
//     } catch (err) {
//       console.error("Error updating status:", err);
//     }
//   };

//   // Drag & Drop deadline update (REPLACED FIREBASE WITH API)
//   const onDragEnd = async (result) => {
//     const { destination, draggableId } = result;
//     if (!destination) return;

//     const columnMap = {
//       overdue: () => {
//         const d = new Date();
//         d.setDate(d.getDate() - 1);
//         return d.toISOString().split("T")[0];
//       },
//       today: () => new Date().toISOString().split("T")[0],
//       week: () => {
//         const d = new Date();
//         d.setDate(d.getDate() + 3);
//         return d.toISOString().split("T")[0];
//       },
//       next: () => {
//         const d = new Date();
//         d.setDate(d.getDate() + 10);
//         return d.toISOString().split("T")[0];
//       },
//       later: () => {
//         const d = new Date();
//         d.setDate(d.getDate() + 20);
//         return d.toISOString().split("T")[0];
//       },
//       none: () => null, // FastAPI handled null/None better than empty string
//     };

//     try {
//       // Logic: Update the deadline via FastAPI endpoint
//       await api.put(`/api/tasks/${draggableId}/deadline`, {
//         deadline: columnMap[destination.droppableId](),
//       });
//       fetchTasks(); // Refresh UI after update
//     } catch (e) {
//       console.error("Error updating deadline via API:", e);
//     }
//   };

//   // Filters
//   const filteredTasks = tasks.filter((t) => {
//     const matches =
//       (statusTab === 0 && (t.status === "In progress" || t.status === "Started")) ||
//       (statusTab === 2 && t.status === "Completed") ||
//       (statusTab === 3 &&
//         t.status !== "Completed" &&
//         t.deadline &&
//         new Date(t.deadline) < new Date());

//     return matches && t.name.toLowerCase().includes(searchQuery.toLowerCase());
//   });

//   const getPriorityColor = (priority) => {
//     switch (priority) {
//       case "High": return "#ff0080";
//       case "Medium": return "#00f5ff";
//       case "Low": return "#39ff14";
//       default: return "#ffffff";
//     }
//   };

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case "In progress": return <ScheduleIcon />;
//       case "Started": return <StartIcon />;
//       case "Completed": return <CompleteIcon />;
//       default: return <ScheduleIcon />;
//     }
//   };

//   const renderAction = (t) => {
//     // Note: FastAPI tasks usually have _id or id depending on your DB (MongoDB uses _id)
//     const taskId = t._id || t.id;
//     if (t.status === "In progress")
//       return (
//         <Button
//           variant="outlined"
//           size="small"
//           onClick={() => updateStatus(taskId, "Started")}
//           startIcon={<StartIcon />}
//           className="task-action-btn task-start-btn"
//         >
//           Start
//         </Button>
//       );
//     if (t.status === "Started")
//       return (
//         <Button
//           variant="contained"
//           size="small"
//           onClick={() => updateStatus(taskId, "Completed")}
//           startIcon={<CompleteIcon />}
//           className="task-action-btn task-complete-btn"
//         >
//           Complete
//         </Button>
//       );
//     if (t.status === "Completed")
//       return <Chip icon={<CompleteIcon />} label="Completed" className="task-completed-chip" />;
//     return null;
//   };

//   return (
//     <>
//       <div className="task-background">
//         <div className="task-starfield"></div>
//       </div>

//       <Box className="task-container">
//         <Container maxWidth="xl">
//           <Box className="task-header cosmic-header">
//             <div className="header-content">
//               <Typography variant="h3" className="cosmic-title">
//                 <RocketIcon className="title-icon" />
//                 <span className="title-text">Task Command Center</span>
//                 <div className="title-glow"></div>
//               </Typography>
//               <Typography variant="subtitle1" className="header-subtitle">
//                 Manage your missions with cosmic precision
//               </Typography>
//             </div>

//             <div>
//               <Button
//                 className="cosmic-create-btn"
//                 variant="outlined"
//                 color="inherit"
//                 onClick={openMenu}
//                 sx={{ mr: 2 }}
//               >
//                 {selectedProject ? selectedProject.name : "Select Project"}
//               </Button>
//               <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
//                 {projects.length > 0 ? (
//                   projects.map((proj) => (
//                     <MenuItem key={proj._id || proj.id} onClick={() => selectProject(proj)}>
//                       {proj.name}
//                     </MenuItem>
//                   ))
//                 ) : (
//                   <MenuItem disabled>No Projects Found</MenuItem>
//                 )}
//               </Menu>
//             </div>

//             <Button
//               startIcon={<AddIcon />}
//               variant="contained"
//               onClick={openModal}
//               className="cosmic-create-btn"
//             >
//               <span>Create Mission</span>
//               <div className="btn-ripple"></div>
//             </Button>
//           </Box>

//           <Box className="task-controls cosmic-controls">
//             <div className="tabs-container">
//               <Tabs value={statusTab} onChange={handleTabChange} className="cosmic-tabs">
//                 <Tab label={<div className="tab-content"><ScheduleIcon className="tab-icon" /><span>Active</span><div className="tab-glow"></div></div>} />
//                 <Tab label={<div className="tab-content"><CalendarIcon className="tab-icon" /><span>Timeline</span><div className="tab-glow"></div></div>} />
//                 <Tab label={<div className="tab-content"><CompleteIcon className="tab-icon" /><span>Completed</span><div className="tab-glow"></div></div>} />
//                 <Tab label={<div className="tab-content"><StarIcon className="tab-icon" /><span>Overdue</span><div className="tab-glow"></div></div>} />
//               </Tabs>
//             </div>

//             <TextField
//               size="small"
//               placeholder="Search missions..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <SearchIcon className="search-icon" />
//                   </InputAdornment>
//                 ),
//               }}
//               className="cosmic-search"
//             />
//           </Box>

//           {statusTab === 1 ? (
//             <Box className="cosmic-board">
//               <DragDropContext onDragEnd={onDragEnd}>
//                 <div className="board-columns">
//                   {[
//                     { id: "overdue", label: "Critical", icon: "🔥", color: "#ff0080" },
//                     { id: "today", label: "Today", icon: "⚡", color: "#39ff14" },
//                     { id: "week", label: "This Week", icon: "🚀", color: "#00f5ff" },
//                     { id: "next", label: "Next Week", icon: "🌟", color: "#b347d9" },
//                     { id: "later", label: "Future", icon: "🌌", color: "#ff6600" },
//                     { id: "none", label: "Backlog", icon: "📋", color: "#8a8aa0" },
//                   ].map(({ id, label, icon, color }) => {
//                     const now = new Date();
//                     const filtered = tasks.filter((t) => {
//                       if (t.status === "Completed") return false;
//                       const deadline = t.deadline ? new Date(t.deadline) : null;
//                       if (id === "overdue") return deadline && deadline < new Date(now.setHours(0, 0, 0, 0));
//                       if (id === "today") return deadline?.toDateString() === new Date().toDateString();
//                       if (id === "week") {
//                         const endOfWeek = new Date();
//                         endOfWeek.setDate(now.getDate() + 7);
//                         return deadline && deadline > now && deadline <= endOfWeek;
//                       }
//                       if (id === "next") {
//                         const start = new Date();
//                         const end = new Date();
//                         start.setDate(now.getDate() + 7);
//                         end.setDate(now.getDate() + 14);
//                         return deadline && deadline > start && deadline <= end;
//                       }
//                       if (id === "later") {
//                         const twoWeeks = new Date();
//                         twoWeeks.setDate(now.getDate() + 14);
//                         return deadline && deadline > twoWeeks;
//                       }
//                       if (id === "none") return !deadline;
//                       return false;
//                     });

//                     return (
//                       <Droppable droppableId={id} key={id}>
//                         {(provided, snapshot) => (
//                           <div
//                             ref={provided.innerRef}
//                             {...provided.droppableProps}
//                             className={`cosmic-column ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
//                             style={{ '--column-color': color }}
//                           >
//                             <div className="column-header">
//                               <div className="column-icon">{icon}</div>
//                               <div className="column-info">
//                                 <Typography className="column-title">{label}</Typography>
//                                 <Typography className="column-count">{filtered.length} missions</Typography>
//                               </div>
//                               <div className="column-glow"></div>
//                             </div>

//                             <div className="column-content">
//                               {filtered.map((t, index) => (
//                                 <Draggable key={t._id || t.id} draggableId={t._id || t.id} index={index}>
//                                   {(provided, snapshot) => (
//                                     <div
//                                       ref={provided.innerRef}
//                                       {...provided.draggableProps}
//                                       {...provided.dragHandleProps}
//                                       className={`cosmic-task-card ${snapshot.isDragging ? 'dragging' : ''}`}
//                                     >
//                                       <div className="task-card-header">
//                                         <div className="task-priority" style={{ backgroundColor: getPriorityColor(t.priority || 'Medium') }}>
//                                           {t.priority || 'Medium'}
//                                         </div>
//                                         <DragIcon className="drag-handle" />
//                                       </div>
//                                       <Typography className="task-name">{t.name}</Typography>
//                                       <Typography className="task-description">{t.description}</Typography>
//                                       <div className="task-meta">
//                                         <div className="task-assignee">
//                                           <Avatar className="assignee-avatar" sx={{ width: 24, height: 24 }}><PersonIcon sx={{ fontSize: 16 }} /></Avatar>
//                                           <span>{t.assignee}</span>
//                                         </div>
//                                         {t.deadline && (
//                                           <div className="task-deadline">
//                                             <CalendarIcon sx={{ fontSize: 16 }} />
//                                             <span>{new Date(t.deadline).toLocaleDateString()}</span>
//                                           </div>
//                                         )}
//                                       </div>
//                                       <div className="task-actions">{renderAction(t)}</div>
//                                       <div className="card-shine"></div>
//                                       <div className="card-border"></div>
//                                     </div>
//                                   )}
//                                 </Draggable>
//                               ))}
//                               {provided.placeholder}
//                             </div>
//                           </div>
//                         )}
//                       </Droppable>
//                     );
//                   })}
//                 </div>
//               </DragDropContext>
//             </Box>
//           ) : (
//             <TableContainer component={Paper} className="cosmic-table">
//               <Table>
//                 <TableHead>
//                   <TableRow className="table-header">
//                     <TableCell>Mission</TableCell>
//                     <TableCell>Description</TableCell>
//                     <TableCell>Assignee</TableCell>
//                     <TableCell>Deadline</TableCell>
//                     <TableCell>Status</TableCell>
//                     <TableCell>Priority</TableCell>
//                     <TableCell>Actions</TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {filteredTasks.map((t, index) => (
//                     <TableRow key={t._id || t.id} className="table-row" style={{ animationDelay: `${index * 0.1}s` }}>
//                       <TableCell><div className="task-name-cell">{getStatusIcon(t.status)}<span>{t.name}</span></div></TableCell>
//                       <TableCell className="description-cell">{t.description}</TableCell>
//                       <TableCell><div className="assignee-cell"><Avatar sx={{ width: 32, height: 32, mr: 1 }}><PersonIcon /></Avatar>{t.assignee}</div></TableCell>
//                       <TableCell>
//                         {t.deadline ? (
//                           <Chip icon={<CalendarIcon />} label={new Date(t.deadline).toLocaleDateString()} size="small" className="deadline-chip" />
//                         ) : <span className="no-deadline">No deadline</span>}
//                       </TableCell>
//                       <TableCell><Chip label={t.status} className={`status-chip status-${t.status.toLowerCase().replace(' ', '-')}`} /></TableCell>
//                       <TableCell><div className="priority-indicator" style={{ backgroundColor: getPriorityColor(t.priority || 'Medium') }}>{t.priority || 'Medium'}</div></TableCell>
//                       <TableCell>{renderAction(t)}</TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </TableContainer>
//           )}

//           {/* Modal remains the same structure but uses the API-driven createTask */}
//           <Modal open={open} onClose={closeModal} className="cosmic-modal">
//             <Box className="modal-content">
//               <div className="modal-header">
//                 <Typography variant="h5" className="modal-title"><AddIcon className="modal-icon" /> Create New Mission</Typography>
//                 <div className="modal-glow"></div>
//               </div>
//               <div className="modal-form">
//                 <TextField label="Mission Name" name="name" fullWidth margin="normal" value={taskData.name} onChange={onChange} className="cosmic-input" />
//                 <TextField label="Mission Description" name="description" fullWidth margin="normal" multiline rows={3} value={taskData.description} onChange={onChange} className="cosmic-input" />
//                 <TextField label="Deadline" name="deadline" fullWidth margin="normal" type="date" InputLabelProps={{ shrink: true }} value={taskData.deadline} onChange={onChange} className="cosmic-input" />
//                 <TextField label="Priority" name="priority" fullWidth margin="normal" select SelectProps={{ native: true }} value={taskData.priority} onChange={onChange} className="cosmic-input">
//                   {["Low", "Medium", "High"].map((p) => <option key={p} value={p}>{p}</option>)}
//                 </TextField>
//               </div>
//               <div className="modal-actions">
//                 <Button onClick={closeModal} className="cancel-btn">Cancel</Button>
//                 <Button variant="contained" onClick={createTask} disabled={!taskData.name.trim()} className="create-btn">Launch Mission</Button>
//               </div>
//             </Box>
//           </Modal>
//         </Container>
//       </Box>
//     </>
//   );
// };

// export default Task;