// File: dodesk/src/Pages/Project.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../Context/AuthContext";
import {
  Box, Button, Container, TextField, Typography, Stack,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, List,
  ListItem, ListItemText, Chip, Snackbar, Alert, MenuItem,
} from "@mui/material";
import {
  Add, Delete, Edit,
  RocketLaunch as RocketIcon,
  Assignment as TaskIcon,
} from "@mui/icons-material";
import "./Project.css";

const Project = () => {
  const { api } = useAuth();

  // --- Project Data ---
  const [projects,            setProjects]            = useState([]);
  const [openCreateModal,     setOpenCreateModal]     = useState(false);
  const [editingId,           setEditingId]           = useState(null);

  // --- Project Form Fields ---
  const [projectName,         setProjectName]         = useState("");
  const [description,         setDescription]         = useState("");

  // --- Task Form Fields ---
  const [tasks,               setTasks]               = useState([]);
  const [newTaskTitle,        setNewTaskTitle]        = useState("");
  const [newTaskDescription,  setNewTaskDescription]  = useState(""); // ← NEW
  const [newTaskPriority,     setNewTaskPriority]     = useState("Medium");

  // --- Notification ---
  const [notification, setNotification] = useState({
    open: false, message: "", severity: "success",
  });

  /* ── Fetch Projects ── */
  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get("/api/projects");
      setProjects(res.data || []);
    } catch (err) {
      console.error("Fetch Projects Error:", err);
      if (err.response?.status === 401) {
        setNotification({ open: true, message: "Session expired. Please login again.", severity: "error" });
      }
    }
  }, [api]);

  useEffect(() => {
    document.title = "Projects — DoDesk";

    // ── Grok-style starfield ──
    const createStarfield = () => {
      const container = document.querySelector(".project-starfield-layer");
      if (!container) return;
      container.innerHTML = "";
      for (let i = 0; i < 280; i++) {
        const star = document.createElement("div");
        const size = Math.random();
        star.className =
          size < 0.30 ? "star star-small"  :
          size < 0.62 ? "star star-medium" :
          size < 0.86 ? "star star-large"  : "star star-bright";
        star.style.left              = Math.random() * 100 + "%";
        star.style.top               = Math.random() * 100 + "%";
        star.style.animationDelay    = (Math.random() * 6) + "s";
        star.style.animationDuration = (Math.random() * 3 + 2) + "s";
        star.style.setProperty("--brightness", Math.random());
        container.appendChild(star);
      }
      for (let i = 0; i < 5; i++) {
        const s = document.createElement("div");
        s.className = "shooting-star";
        s.style.top               = Math.random() * 65 + "%";
        s.style.left              = "-300px";
        s.style.animationDelay    = (Math.random() * 18 + 2) + "s";
        s.style.animationDuration = (Math.random() * 2.5 + 1.5) + "s";
        container.appendChild(s);
      }
    };
    createStarfield();

    fetchProjects();
  }, [fetchProjects]);

  /* ── Task Handlers ── */
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    setTasks([
      ...tasks,
      {
        title:       newTaskTitle,
        description: newTaskDescription, // ← NEW: include description in task object
        priority:    newTaskPriority,
        status:      "In progress",
      },
    ]);
    setNewTaskTitle("");
    setNewTaskDescription(""); // ← NEW: reset after adding
    setNewTaskPriority("Medium");
  };

  const handleDeleteTask = (index) => {
    const updated = [...tasks];
    updated.splice(index, 1);
    setTasks(updated);
  };

  /* ── Edit / Delete ── */
  const handleEditProject = (project) => {
    setEditingId(project._id);
    setProjectName(project.name);
    setDescription(project.description);
    setTasks(project.tasks || []);
    setOpenCreateModal(true);
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.delete(`/api/projects/${id}`);
      setNotification({ open: true, message: "Project deleted.", severity: "info" });
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  /* ── Create / Update ── */
  const handleSubmit = async () => {
    if (!projectName.trim()) return;
    try {
      const payload = { name: projectName, description, tasks };
      if (editingId) {
        await api.put(`/api/projects/${editingId}`, payload);
        setNotification({ open: true, message: "Project updated successfully! 🚀", severity: "success" });
      } else {
        await api.post("/api/projects", payload);
        setNotification({ open: true, message: "New project launched! 🚀", severity: "success" });
      }
      fetchProjects();
      handleCloseModal();
    } catch (err) {
      console.error("Submit Error:", err);
      setNotification({ open: true, message: "Something went wrong. Try again.", severity: "error" });
    }
  };

  const handleCloseModal = () => {
    setOpenCreateModal(false);
    setEditingId(null);
    setProjectName("");
    setDescription("");
    setTasks([]);
    setNewTaskTitle("");
    setNewTaskDescription(""); // ← NEW: reset on close
    setNewTaskPriority("Medium");
  };

  return (
    <>
      {/* Grok-style starfield background */}
      <div className="project-starfield-bg">
        <div className="project-starfield-layer" />
      </div>

    <div className="project-container">

      {/* ── Toast ── */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={notification.severity} variant="filled" sx={{ width: "100%" }}>
          {notification.message}
        </Alert>
      </Snackbar>

      <Container maxWidth="xl">

        {/* ── Header ── */}
        <Box className="project-header">
          <Typography variant="h3" className="project-title">
            <RocketIcon fontSize="large" />
            Command Center
          </Typography>
          <Button
            className="create-buttonp"
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={() => setOpenCreateModal(true)}
            disableElevation
          >
            Launch Project
          </Button>
        </Box>

        {/* ── Table ── */}
        <TableContainer
          component={Paper}
          elevation={0}
          className="project-table-wrap"
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><b>Mission ID</b></TableCell>
                <TableCell><b>Project Name</b></TableCell>
                <TableCell className="hide-xs"><b>Description</b></TableCell>
                <TableCell><b>Tasks</b></TableCell>
                <TableCell align="center"><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.length > 0 ? (
                projects.map((p) => (
                  <TableRow key={p._id} hover>
                    <TableCell>
                      <span className="mission-id">
                        {String(p._id).slice(-6).toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="project-name-cell">{p.name}</span>
                    </TableCell>
                    <TableCell
                      className="hide-xs"
                      sx={{
                        maxWidth: 280,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<TaskIcon style={{ fontSize: "0.85rem" }} />}
                        label={`${p.taskCount || 0} Tasks`}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => handleEditProject(p)}
                        color="primary"
                        size="small"
                        title="Edit project"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteProject(p._id)}
                        color="error"
                        size="small"
                        title="Delete project"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="empty-state">
                    <div className="empty-content">
                      <RocketIcon className="empty-icon" />
                      <Typography className="empty-title">
                        No active projects
                      </Typography>
                      <Typography className="empty-description">
                        Click "Launch Project" to create your first one.
                      </Typography>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      {/* ── Create / Edit Modal ── */}
      <Dialog
        open={openCreateModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingId ? "Edit Project" : "Launch New Project"}
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.5} mt={0.5}>

            {/* Project Name */}
            <TextField
              fullWidth
              label="Project Name"
              variant="outlined"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              autoFocus
            />

            {/* Project Description */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Project Description"
              variant="outlined"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* ── Task Builder ── */}
            <Box className="task-builder-box">
              <Typography component="span" className="task-builder-label">
                Initial Tasks
              </Typography>

              {/* Row 1: Title + Priority + Add button */}
              <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Task title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                />
                <TextField
                  select
                  size="small"
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  sx={{ width: 120, flexShrink: 0 }}
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                </TextField>
                <Button
                  variant="contained"
                  onClick={handleAddTask}
                  disableElevation
                  sx={{
                    flexShrink: 0,
                    borderRadius: "var(--radius-md)",
                    textTransform: "none",
                    fontWeight: 600,
                    background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                  }}
                >
                  Add
                </Button>
              </Box>

              {/* Row 2: Task Description ← NEW */}
              <TextField
                fullWidth
                size="small"
                label="Task description (optional)"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />

              {/* Task List */}
              <List dense sx={{ maxHeight: 200, overflowY: "auto" }}>
                {tasks.map((t, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleDeleteTask(index)}
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={t.title || t.name}
                      secondary={
                        // Show priority and description if available ← NEW
                        `Priority: ${t.priority}${t.description ? ` • ${t.description}` : ""}`
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseModal} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit} disableElevation>
            {editingId ? "Save Changes" : "Confirm Launch"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
    </>
  );
};

export default Project;




































































































// import React, { useState, useEffect, useCallback } from "react";
// import { useAuth } from "../Context/AuthContext"; 
// import {
//   Box, Button, Container, TextField, Typography, Table, TableBody,
//   TableCell, TableContainer, TableHead, TableRow, Paper, Dialog,
//   DialogTitle, DialogContent, DialogActions, IconButton, List,
//   ListItem, ListItemText, Chip, Snackbar, Alert, MenuItem,
// } from "@mui/material";

// import {
//   Add, Delete, Edit, RocketLaunch as RocketIcon, Assignment as TaskIcon,
// } from "@mui/icons-material";

// import "./Project.css";

// const Project = () => {
//   const { api } = useAuth(); // Axios instance with pre-configured Auth headers

//   // --- States for Project Data ---
//   const [projects, setProjects] = useState([]);
//   const [openCreateModal, setOpenCreateModal] = useState(false);
//   const [editingId, setEditingId] = useState(null); // Tracks if we are editing or creating

//   // --- States for Form Fields ---
//   const [projectName, setProjectName] = useState("");
//   const [description, setDescription] = useState("");
//   const [tasks, setTasks] = useState([]); // Temporary list for tasks in the modal
//   const [newTaskTitle, setNewTaskTitle] = useState("");
//   const [newTaskPriority, setNewTaskPriority] = useState("Medium");

//   // Notification Toast state
//   const [notification, setNotification] = useState({
//     open: false,
//     message: "",
//     severity: "success",
//   });

//   /* ===============================
//       FETCH PROJECTS 
//       Calls the backend to get projects where user is Owner or Member
//   =============================== */
//   const fetchProjects = useCallback(async () => {
//     try {
//       const res = await api.get("/api/projects");
//       setProjects(res.data || []);
//     } catch (err) {
//       console.error("Fetch Projects Error:", err);
//       if (err.response?.status === 401) {
//         setNotification({
//           open: true,
//           message: "Session expired. Please login again.",
//           severity: "error",
//         });
//       }
//     }
//   }, [api]);

//   // Load projects on component mount
//   useEffect(() => {
//     fetchProjects();
//   }, [fetchProjects]);

//   /* ===============================
//       TASK HANDLERS (Local State)
//       Manages the task list inside the "Create Project" modal
//   =============================== */
//   const handleAddTask = () => {
//     if (!newTaskTitle.trim()) return;

//     const newTask = {
//       title: newTaskTitle,
//       priority: newTaskPriority,
//       status: "In progress",
//     };

//     setTasks([...tasks, newTask]); // Add task to local array
//     setNewTaskTitle(""); // Reset task input
//     setNewTaskPriority("Medium");
//   };

//   const handleDeleteTask = (index) => {
//     const updated = [...tasks];
//     updated.splice(index, 1);
//     setTasks(updated);
//   };

//   /* ===============================
//       EDIT & DELETE LOGIC
//   =============================== */
//   const handleEditProject = (project) => {
//     setEditingId(project._id);
//     setProjectName(project.name);
//     setDescription(project.description);
//     setTasks(project.tasks || []); // Load existing tasks into the modal
//     setOpenCreateModal(true);
//   };

//   const handleDeleteProject = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this project?")) return;
//     try {
//       await api.delete(`/api/projects/${id}`);
//       setNotification({ open: true, message: "Mission Terminated!", severity: "info" });
//       fetchProjects(); // Refresh the list
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   /* ===============================
//       CREATE / UPDATE PROJECT (Submit)
//   =============================== */
//   const handleSubmit = async () => {
//     if (!projectName.trim()) return;

//     try {
//       const payload = {
//         name: projectName,
//         description,
//         tasks,
//       };

//       if (editingId) {
//         // UPDATE: If editingId exists, send a PUT request
//         await api.put(`/api/projects/${editingId}`, payload);
//         setNotification({
//           open: true,
//           message: "Mission Specs Updated! 🚀",
//           severity: "success",
//         });
//       } else {
//         // CREATE: Send a POST request for a new project
//         await api.post(`/api/projects`, payload);
//         setNotification({
//           open: true,
//           message: "New Mission Launched! It's now visible in your dashboard. 🚀",
//           severity: "success",
//         });
//       }

//       fetchProjects(); // Reload list to show updates
//       handleCloseModal();
//     } catch (err) {
//       console.error("Submit Error:", err);
//       setNotification({ open: true, message: "System override failed. Try again.", severity: "error" });
//     }
//   };

//   // Resets all modal states to default
//   const handleCloseModal = () => {
//     setOpenCreateModal(false);
//     setEditingId(null);
//     setProjectName("");
//     setDescription("");
//     setTasks([]);
//     setNewTaskTitle("");
//     setNewTaskPriority("Medium");
//   };

//   return (
//     <div className="project-container">
//       {/* --- Notification Toast --- */}
//       <Snackbar
//         open={notification.open}
//         autoHideDuration={4000}
//         onClose={() => setNotification({ ...notification, open: false })}
//         anchorOrigin={{ vertical: "top", horizontal: "right" }}
//       >
//         <Alert severity={notification.severity} variant="filled" sx={{ width: "100%" }}>
//           {notification.message}
//         </Alert>
//       </Snackbar>

//       <Container maxWidth="xl">
//         {/* --- Dashboard Header --- */}
//         <Box className="project-header" sx={{ mt: 4, mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//           <Typography variant="h3" className="project-title" sx={{ display: "flex", alignItems: "center", gap: 2, fontWeight: 'bold' }}>
//             <RocketIcon fontSize="large" color="primary" /> Command Center
//           </Typography>

//           <Button
//             className="create-buttonp"
//             variant="contained"
//             size="large"
//             startIcon={<Add />}
//             onClick={() => setOpenCreateModal(true)}
//             sx={{ borderRadius: "10px", textTransform: "none", fontWeight: "bold" }}
//           >
//             Launch Project
//           </Button>
//         </Box>

//         {/* --- Projects Table --- */}
//         <TableContainer component={Paper} elevation={6} sx={{ borderRadius: "15px", overflow: "hidden" }}>
//           <Table>
//             <TableHead sx={{ backgroundColor: "#f4f7fe" }}>
//               <TableRow>
//                 <TableCell><strong>MISSION ID</strong></TableCell>
//                 <TableCell><strong>PROJECT NAME</strong></TableCell>
//                 <TableCell><strong>DESCRIPTION</strong></TableCell>
//                 <TableCell><strong>TASKS</strong></TableCell>
//                 <TableCell align="center"><strong>ACTIONS</strong></TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {projects.length > 0 ? (
//                 projects.map((p) => (
//                   <TableRow key={p._id} hover>
//                     <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
//                       {/* Show last 6 chars of the ID for a cleaner look */}
//                       {String(p._id).slice(-6).toUpperCase()}
//                     </TableCell>
//                     <TableCell><strong>{p.name}</strong></TableCell>
//                     <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                       {p.description || "No mission objective"}
//                     </TableCell>
//                     <TableCell>
//                       <Chip
//                         icon={<TaskIcon />}
//                         label={`${p.taskCount || 0} Tasks`}
//                         color="primary"
//                         variant="outlined"
//                         size="small"
//                         sx={{ fontWeight: 'bold' }}
//                       />
//                     </TableCell>
//                     <TableCell align="center">
//                       <IconButton onClick={() => handleEditProject(p)} color="primary" size="small">
//                         <Edit />
//                       </IconButton>
//                       <IconButton onClick={() => handleDeleteProject(p._id)} color="error" size="small">
//                         <Delete />
//                       </IconButton>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               ) : (
//                 <TableRow>
//                   <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
//                     <Typography variant="h6" color="textSecondary">
//                       No active missions. Click "Launch Project" to begin.
//                     </Typography>
//                   </TableCell>
//                 </TableRow>
//               )}
//             </TableBody>
//           </Table>
//         </TableContainer>
//       </Container>

//       {/* --- CREATE / UPDATE MODAL --- */}
//       <Dialog open={openCreateModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
//         <DialogTitle sx={{ fontWeight: "bold", fontSize: '1.5rem' }}>
//           {editingId ? "Update Mission specs" : "Launch New Mission"}
//         </DialogTitle>
//         <DialogContent dividers>
//           <TextField
//             fullWidth
//             label="Mission Name"
//             variant="outlined"
//             value={projectName}
//             onChange={(e) => setProjectName(e.target.value)}
//             sx={{ mb: 3, mt: 1 }}
//           />
//           <TextField
//             fullWidth
//             multiline
//             rows={3}
//             label="Objective Description"
//             variant="outlined"
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//             sx={{ mb: 3 }}
//           />

//           {/* Nested Task Builder */}
//           <Box sx={{ p: 2, bgcolor: "#f0f4f8", borderRadius: "12px", border: '1px solid #d1d9e6' }}>
//             <Typography variant="subtitle2" sx={{ mb: 2, color: "#5c6b8a", fontWeight: 'bold' }}>Assign Initial Tasks</Typography>
//             <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
//               <TextField
//                 fullWidth
//                 size="small"
//                 label="Task Title"
//                 value={newTaskTitle}
//                 onChange={(e) => setNewTaskTitle(e.target.value)}
//               />
//               <TextField
//                 select
//                 size="small"
//                 value={newTaskPriority}
//                 onChange={(e) => setNewTaskPriority(e.target.value)}
//                 sx={{ width: "130px" }}
//               >
//                 <MenuItem value="Low">Low</MenuItem>
//                 <MenuItem value="Medium">Medium</MenuItem>
//                 <MenuItem value="High">High</MenuItem>
//               </TextField>
//               <Button variant="contained" onClick={handleAddTask} disableElevation>Add</Button>
//             </Box>

//             <List dense sx={{ maxHeight: '150px', overflowY: 'auto' }}>
//               {tasks.map((t, index) => (
//                 <ListItem
//                   key={index}
//                   divider={index !== tasks.length - 1}
//                   secondaryAction={
//                     <IconButton edge="end" onClick={() => handleDeleteTask(index)}>
//                       <Delete fontSize="small" color="error" />
//                     </IconButton>
//                   }
//                   sx={{ bgcolor: 'white', mb: 0.5, borderRadius: '4px' }}
//                 >
//                   <ListItemText
//                     primary={t.title || t.name}
//                     secondary={`Priority: ${t.priority}`}
//                   />
//                 </ListItem>
//               ))}
//             </List>
//           </Box>
//         </DialogContent>
//         <DialogActions sx={{ p: 3, bgcolor: '#f9fafb' }}>
//           <Button onClick={handleCloseModal} color="inherit" sx={{ fontWeight: 'bold' }}>Abort</Button>
//           <Button variant="contained" onClick={handleSubmit} color="primary" sx={{ px: 4, borderRadius: '8px', fontWeight: 'bold' }}>
//             {editingId ? "Save Changes" : "Confirm Launch"}
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </div>
//   );
// };

// export default Project;








































// // File: dodesk/src/Pages/Project.jsx

// import React, { useState, useEffect, useCallback } from "react";
// import axios from "axios";
// import {
//   Box,
//   Button,
//   Container,
//   TextField,
//   Typography,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   IconButton,
//   List,
//   ListItem,
//   ListItemText,
//   Chip,
//   Snackbar,
//   Alert,
//   MenuItem,
// } from "@mui/material";

// import {
//   Add,
//   Delete,
//   Edit,
//   RocketLaunch as RocketIcon,
//   Assignment as TaskIcon,
// } from "@mui/icons-material";

// import "./Project.css";

// const API_URL = "http://localhost:8000";

// /* ===============================
//    AXIOS INSTANCE WITH TOKEN
// =============================== */
// const api = axios.create({
//   baseURL: API_URL,
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

// const Project = () => {

//   const [projects, setProjects] = useState([]);
//   const [openCreateModal, setOpenCreateModal] = useState(false);
//   const [projectName, setProjectName] = useState("");
//   const [description, setDescription] = useState("");
//   const [tasks, setTasks] = useState([]);
//   const [newTaskTitle, setNewTaskTitle] = useState("");
//   const [newTaskPriority, setNewTaskPriority] = useState("Medium");
//   const [editingId, setEditingId] = useState(null);

//   const [notification, setNotification] = useState({
//     open: false,
//     message: "",
//     severity: "success",
//   });


//   /* ===============================
//      FETCH PROJECTS
//   =============================== */
//   const fetchProjects = useCallback(async () => {

//     try {

//       const res = await api.get("/api/projects");

//       setProjects(res.data || []);

//     } catch (err) {

//       console.error(err);

//     }

//   }, []);


//   useEffect(() => {

//     fetchProjects();

//   }, [fetchProjects]);


//   /* ===============================
//      ADD TASK
//   =============================== */
//   const handleAddTask = () => {

//     if (!newTaskTitle.trim()) return;

//     const newTask = {
//       title: newTaskTitle,
//       priority: newTaskPriority,
//       status: "In progress",
//     };

//     setTasks([...tasks, newTask]);

//     setNewTaskTitle("");
//     setNewTaskPriority("Medium");

//   };


//   const handleDeleteTask = (index) => {

//     const updated = [...tasks];

//     updated.splice(index, 1);

//     setTasks(updated);

//   };


//   /* ===============================
//      EDIT PROJECT
//   =============================== */
//   const handleEditProject = (project) => {

//     setEditingId(project._id);

//     setProjectName(project.name);

//     setDescription(project.description);

//     setTasks(project.tasks || []);

//     setOpenCreateModal(true);

//   };


//   /* ===============================
//      DELETE PROJECT
//   =============================== */
//   const handleDeleteProject = async (id) => {

//     try {

//       await api.delete(`/api/projects/${id}`);

//       fetchProjects();

//     } catch (err) {

//       console.error(err);

//     }

//   };


//   /* ===============================
//      CREATE / UPDATE PROJECT
//   =============================== */
//   const handleSubmit = async () => {

//     if (!projectName.trim()) return;

//     try {

//       if (editingId) {

//         await api.put(`/api/projects/${editingId}`, {
//           name: projectName,
//           description,
//           tasks,
//         });

//         setNotification({
//           open: true,
//           message: "Project Updated 🚀",
//           severity: "success",
//         });

//       } else {

//         await api.post(`/api/projects`, {
//           name: projectName,
//           description,
//           tasks,
//         });

//         setNotification({
//           open: true,
//           message: "Mission Launched 🚀",
//           severity: "success",
//         });

//       }

//       fetchProjects();

//       handleCloseModal();

//     } catch (err) {

//       console.error(err);

//     }

//   };


//   /* ===============================
//      CLOSE MODAL
//   =============================== */
//   const handleCloseModal = () => {

//     setOpenCreateModal(false);

//     setEditingId(null);

//     setProjectName("");

//     setDescription("");

//     setTasks([]);

//     setNewTaskTitle("");

//     setNewTaskPriority("Medium");

//   };


//   return (
//     <div className="project-container">

//       <Snackbar
//         open={notification.open}
//         autoHideDuration={3000}
//         onClose={() => setNotification({ ...notification, open: false })}
//       >
//         <Alert severity={notification.severity} variant="filled">
//           {notification.message}
//         </Alert>
//       </Snackbar>


//       <Container maxWidth="xl">

//         <Box className="project-header">

//           <Typography variant="h3" className="project-title">
//             <RocketIcon /> Command Center
//           </Typography>

//           <Button
//             className="create-buttonp"
//             variant="contained"
//             startIcon={<Add />}
//             onClick={() => setOpenCreateModal(true)}
//           >
//             Launch Project
//           </Button>

//         </Box>


//         <TableContainer component={Paper} className="project-table">

//           <Table>

//             <TableHead>
//               <TableRow>
//                 <TableCell>MISSION ID</TableCell>
//                 <TableCell>PROJECT NAME</TableCell>
//                 <TableCell>DESCRIPTION</TableCell>
//                 <TableCell>TASKS</TableCell>
//                 <TableCell>ACTIONS</TableCell>
//               </TableRow>
//             </TableHead>

//             <TableBody>

//               {projects.map((p) => (

//                 <TableRow key={p._id}>

//                   <TableCell>
//                     {String(p._id).slice(-6).toUpperCase()}
//                   </TableCell>

//                   <TableCell>{p.name}</TableCell>

//                   <TableCell>{p.description}</TableCell>

//                   <TableCell>
//                     <Chip
//                       icon={<TaskIcon />}
//                       label={`${p.taskCount || 0} Tasks`}
//                     />
//                   </TableCell>

//                   <TableCell>

//                     <IconButton onClick={() => handleEditProject(p)}>
//                       <Edit />
//                     </IconButton>

//                     <IconButton onClick={() => handleDeleteProject(p._id)}>
//                       <Delete color="error" />
//                     </IconButton>

//                   </TableCell>

//                 </TableRow>

//               ))}

//             </TableBody>

//           </Table>

//         </TableContainer>

//       </Container>


//       {/* CREATE / UPDATE MODAL */}

//       <Dialog open={openCreateModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>

//         <DialogTitle>
//           {editingId ? "Update Project" : "Create Project"}
//         </DialogTitle>

//         <DialogContent>

//           <TextField
//             fullWidth
//             label="Project Name"
//             value={projectName}
//             onChange={(e) => setProjectName(e.target.value)}
//             sx={{ mb: 2 }}
//           />

//           <TextField
//             fullWidth
//             multiline
//             rows={2}
//             label="Description"
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//           />

//           <Box sx={{ mt: 3 }}>

//             <Typography>Add Tasks</Typography>

//             <Box sx={{ display: "flex", gap: 1, mt: 1 }}>

//               <TextField
//                 fullWidth
//                 size="small"
//                 label="Task Title"
//                 value={newTaskTitle}
//                 onChange={(e) => setNewTaskTitle(e.target.value)}
//               />

//               <TextField
//                 select
//                 size="small"
//                 label="Priority"
//                 value={newTaskPriority}
//                 onChange={(e) => setNewTaskPriority(e.target.value)}
//                 sx={{ width: "140px" }}
//               >
//                 <MenuItem value="Low">Low</MenuItem>
//                 <MenuItem value="Medium">Medium</MenuItem>
//                 <MenuItem value="High">High</MenuItem>
//               </TextField>

//               <Button onClick={handleAddTask}>Add</Button>

//             </Box>

//             <List>

//               {tasks.map((t, index) => (

//                 <ListItem
//                   key={index}
//                   secondaryAction={
//                     <IconButton onClick={() => handleDeleteTask(index)}>
//                       <Delete color="error" />
//                     </IconButton>
//                   }
//                 >

//                   <ListItemText
//                     primary={t.title}
//                     secondary={`Priority: ${t.priority}`}
//                   />

//                 </ListItem>

//               ))}

//             </List>

//           </Box>

//         </DialogContent>

//         <DialogActions>
//           <Button onClick={handleCloseModal}>Cancel</Button>
//           <Button variant="contained" onClick={handleSubmit}>
//             {editingId ? "Update" : "Create"}
//           </Button>
//         </DialogActions>

//       </Dialog>

//     </div>
//   );
// };

// export default Project;




































// import React, { useState, useEffect, useCallback } from "react";
// import axios from "axios";
// import {
//   Box,
//   Button,
//   Container,
//   TextField,
//   Typography,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   IconButton,
//   List,
//   ListItem,
//   ListItemText,
//   Chip,
//   Snackbar,
//   Alert,
//   MenuItem,
// } from "@mui/material";

// import {
//   Add,
//   Delete,
//   Edit,
//   RocketLaunch as RocketIcon,
//   Assignment as TaskIcon,
// } from "@mui/icons-material";

// import "./Project.css";

// const API_URL = "http://localhost:8000";

// const Project = () => {

//   const [projects, setProjects] = useState([]);
//   const [openCreateModal, setOpenCreateModal] = useState(false);
//   const [projectName, setProjectName] = useState("");
//   const [description, setDescription] = useState("");
//   const [tasks, setTasks] = useState([]);
//   const [newTaskTitle, setNewTaskTitle] = useState("");
//   const [newTaskPriority, setNewTaskPriority] = useState("Medium");
//   const [editingId, setEditingId] = useState(null);

//   const [notification, setNotification] = useState({
//     open: false,
//     message: "",
//     severity: "success",
//   });


//   // ===============================
//   // FETCH PROJECTS
//   // ===============================
//   const fetchProjects = useCallback(async () => {
//     try {
//       const res = await axios.get(`${API_URL}/api/projects`);
//       setProjects(res.data || []);
//     } catch (err) {
//       console.error(err);
//     }
//   }, []);


//   useEffect(() => {
//     fetchProjects();
//   }, [fetchProjects]);


//   // ===============================
//   // ADD TASK
//   // ===============================
//   const handleAddTask = () => {
//     if (!newTaskTitle.trim()) return;

//     const newTask = {
//       title: newTaskTitle,
//       priority: newTaskPriority,
//       status: "In progress",
//     };

//     setTasks([...tasks, newTask]);
//     setNewTaskTitle("");
//     setNewTaskPriority("Medium");
//   };


//   const handleDeleteTask = (index) => {
//     const updated = [...tasks];
//     updated.splice(index, 1);
//     setTasks(updated);
//   };


//   // ===============================
//   // EDIT PROJECT
//   // ===============================
//   const handleEditProject = (project) => {
//     setEditingId(project._id);
//     setProjectName(project.name);
//     setDescription(project.description);
//     setTasks(project.tasks || []);
//     setOpenCreateModal(true);
//   };


//   // ===============================
//   // DELETE PROJECT
//   // ===============================
//   const handleDeleteProject = async (id) => {
//     await axios.delete(`${API_URL}/api/projects/${id}`);
//     fetchProjects();
//   };


//   // ===============================
//   // CREATE / UPDATE PROJECT
//   // ===============================
//   const handleSubmit = async () => {
//     if (!projectName.trim()) return;

//     try {

//       if (editingId) {

//         await axios.put(`${API_URL}/api/projects/${editingId}`, {
//           name: projectName,
//           description,
//           tasks,
//         });

//         setNotification({
//           open: true,
//           message: "Project Updated 🚀",
//           severity: "success",
//         });

//       } else {
// console.log("tasks", {
//   name: projectName,
//   description,
//   tasks,
// });
//         await axios.post(`${API_URL}/api/projects`, {
//           name: projectName,
//           description,
//           tasks,
//         });

//         setNotification({
//           open: true,
//           message: "Mission Launched 🚀",
//           severity: "success",
//         });

//       }

//       fetchProjects();
//       handleCloseModal();

//     } catch (err) {
//       console.error(err);
//     }
//   };


//   // ===============================
//   // CLOSE MODAL
//   // ===============================
//   const handleCloseModal = () => {
//     setOpenCreateModal(false);
//     setEditingId(null);
//     setProjectName("");
//     setDescription("");
//     setTasks([]);
//     setNewTaskTitle("");
//     setNewTaskPriority("Medium");
//   };


//   return (
//     <div className="project-container">

//       <Snackbar
//         open={notification.open}
//         autoHideDuration={3000}
//         onClose={() => setNotification({ ...notification, open: false })}
//       >
//         <Alert severity={notification.severity} variant="filled">
//           {notification.message}
//         </Alert>
//       </Snackbar>


//       <Container maxWidth="xl">

//         <Box className="project-header">

//           <Typography variant="h3" className="project-title">
//             <RocketIcon /> Command Center
//           </Typography>

//           <Button
//             className="create-buttonp"
//             variant="contained"
//             startIcon={<Add />}
//             onClick={() => setOpenCreateModal(true)}
//           >
//             Launch Project
//           </Button>

//         </Box>


//         <TableContainer component={Paper} className="project-table">

//           <Table>

//             <TableHead>
//               <TableRow>
//                 <TableCell>MISSION ID</TableCell>
//                 <TableCell>PROJECT NAME</TableCell>
//                 <TableCell>DESCRIPTION</TableCell>
//                 <TableCell>TASKS</TableCell>
//                 <TableCell>ACTIONS</TableCell>
//               </TableRow>
//             </TableHead>

//             <TableBody>

//               {projects.map((p) => (

//                 <TableRow key={p._id}>

//                   <TableCell>
//                     {String(p._id).slice(-6).toUpperCase()}
//                   </TableCell>

//                   <TableCell>{p.name}</TableCell>

//                   <TableCell>{p.description}</TableCell>

//                   <TableCell>
//                     <Chip
//                       icon={<TaskIcon />}
//                       label={`${p.taskCount || 0} Tasks`}
//                     />
//                   </TableCell>

//                   <TableCell>

//                     <IconButton onClick={() => handleEditProject(p)}>
//                       <Edit />
//                     </IconButton>

//                     <IconButton onClick={() => handleDeleteProject(p._id)}>
//                       <Delete color="error" />
//                     </IconButton>

//                   </TableCell>

//                 </TableRow>

//               ))}

//             </TableBody>

//           </Table>

//         </TableContainer>

//       </Container>


//       {/* CREATE / UPDATE MODAL */}

//       <Dialog open={openCreateModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>

//         <DialogTitle>
//           {editingId ? "Update Project" : "Create Project"}
//         </DialogTitle>

//         <DialogContent>

//           <TextField
//             fullWidth
//             label="Project Name"
//             value={projectName}
//             onChange={(e) => setProjectName(e.target.value)}
//             sx={{ mb: 2 }}
//           />

//           <TextField
//             fullWidth
//             multiline
//             rows={2}
//             label="Description"
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//           />


//           <Box sx={{ mt: 3 }}>

//             <Typography>Add Tasks</Typography>

//             <Box sx={{ display: "flex", gap: 1, mt: 1 }}>

//               <TextField
//                 fullWidth
//                 size="small"
//                 label="Task Title"
//                 value={newTaskTitle}
//                 onChange={(e) => setNewTaskTitle(e.target.value)}
//               />

//               <TextField
//                 select
//                 size="small"
//                 label="Priority"
//                 value={newTaskPriority}
//                 onChange={(e) => setNewTaskPriority(e.target.value)}
//                 sx={{ width: "140px" }}
//               >
//                 <MenuItem value="Low">Low</MenuItem>
//                 <MenuItem value="Medium">Medium</MenuItem>
//                 <MenuItem value="High">High</MenuItem>
//               </TextField>

//               <Button onClick={handleAddTask}>Add</Button>

//             </Box>


//             <List>

//               {tasks.map((t, index) => (

//                 <ListItem
//                   key={index}
//                   secondaryAction={
//                     <IconButton onClick={() => handleDeleteTask(index)}>
//                       <Delete color="error" />
//                     </IconButton>
//                   }
//                 >

//                   <ListItemText
//                     primary={t.title}
//                     secondary={`Priority: ${t.priority}`}
//                   />

//                 </ListItem>

//               ))}

//             </List>

//           </Box>

//         </DialogContent>

//         <DialogActions>
//           <Button onClick={handleCloseModal}>Cancel</Button>
//           <Button variant="contained" onClick={handleSubmit}>
//             {editingId ? "Update" : "Create"}
//           </Button>
//         </DialogActions>

//       </Dialog>

//     </div>
//   );
// };

// export default Project;
























// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import axios from "axios";
// import {
//   Box,
//   Button,
//   Container,
//   TextField,
//   Typography,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   IconButton,
//   List,
//   ListItem,
//   ListItemText,
//   Divider,
//   Chip,
//   Snackbar,
//   Alert,
// } from "@mui/material";
// import {
//   Add,
//   Delete,
//   RocketLaunch as RocketIcon,
//   Assignment as TaskIcon,
// } from "@mui/icons-material";
// import { useAuth } from "../Context/AuthContext";
// import "./Project.css";

// const Project = () => {
//   const { user } = useAuth();
//   const API_URL = "http://localhost:8000";

//   const api = useMemo(
//     () =>
//       axios.create({
//         baseURL: API_URL,
//         withCredentials: true, // IMPORTANT: send cookies
//       }),
//     []
//   );

//   // States
//   const [projects, setProjects] = useState([]);
//   const [openCreateModal, setOpenCreateModal] = useState(false);
//   const [projectName, setProjectName] = useState("");
//   const [description, setDescription] = useState("");
//   const [tasks, setTasks] = useState([]);
//   const [newTaskTitle, setNewTaskTitle] = useState("");
//   const [newTaskPriority, setNewTaskPriority] = useState("Medium");
//   const [notification, setNotification] = useState({
//     open: false,
//     message: "",
//     severity: "success",
//   });

//   // ✅ Fetch Projects (NO userId check, backend uses JWT cookie)
//   const fetchProjects = useCallback(async () => {
//     try {
//       const response = await api.get(`/api/projects`);
//       setProjects(Array.isArray(response.data) ? response.data : []);
//     } catch (err) {
//       console.error("Fetch projects error", err);
//     }
//   }, [api]);

//   useEffect(() => {
//     if (user) fetchProjects();
//   }, [user, fetchProjects]);

//   useEffect(() => {
//     const starfield = document.querySelector(".project-starfield");
//     if (starfield) {
//       starfield.innerHTML = "";
//       for (let i = 0; i < 200; i++) {
//         const star = document.createElement("div");
//         const size = Math.random();
//         star.className = `project-star ${
//           size < 0.3
//             ? "project-star-small"
//             : size < 0.6
//             ? "project-star-medium"
//             : "project-star-large"
//         }`;
//         star.style.left = Math.random() * 100 + "%";
//         star.style.top = Math.random() * 100 + "%";
//         star.style.animationDelay = Math.random() * 5 + "s";
//         starfield.appendChild(star);
//       }
//     }
//   }, []);

//   const handleAddTask = () => {
//     if (!newTaskTitle.trim()) return;
//     const newTask = {
//       id: Date.now().toString(),
//       title: String(newTaskTitle),
//       priority: String(newTaskPriority),
//       status: "In progress",
//     };
//     setTasks((prev) => [...prev, newTask]);
//     setNewTaskTitle("");
//   };

//   const handleCreateProject = async () => {
//     if (!projectName.trim()) return;

//     const payload = {
//       name: String(projectName),
//       description: String(description || ""),
//       tasks: tasks.map((t) => ({
//         title: t.title,
//         priority: t.priority,
//         status: t.status,
//       })),
//       // These will be ignored by backend and replaced using JWT user
//       createdBy: "ignore",
//       memberIds: ["ignore"],
//     };

//     try {
//       const response = await api.post("/api/projects", payload);
//       if (response.data?.status === "success") {
//         setNotification({
//           open: true,
//           message: "Mission Launched! 🚀",
//           severity: "success",
//         });
//         await fetchProjects(); // ✅ refresh list
//         handleCloseModal();
//       }
//     } catch (err) {
//       console.error(err);
//       setNotification({
//         open: true,
//         message: "Launch Failed",
//         severity: "error",
//       });
//     }
//   };

//   const handleCloseModal = () => {
//     setOpenCreateModal(false);
//     setProjectName("");
//     setDescription("");
//     setTasks([]);
//     setNewTaskTitle("");
//   };

//   return (
//     <div className="project-container">
//       {/* Background Layer */}
//       <div className="project-background">
//         <div className="project-starfield"></div>
//       </div>

//       <Snackbar
//         open={notification.open}
//         autoHideDuration={3000}
//         onClose={() =>
//           setNotification({ ...notification, open: false })
//         }
//       >
//         <Alert severity={notification.severity} variant="filled">
//           {notification.message}
//         </Alert>
//       </Snackbar>

//       <Container maxWidth="xl" sx={{ position: "relative", zIndex: 2 }}>
//         <Box className="project-header">
//           <Typography variant="h3" className="project-title">
//             <RocketIcon className="title-icon" /> Command Center
//           </Typography>
//           <Button
//             className="create-buttonp"
//             variant="contained"
//             startIcon={<Add />}
//             onClick={() => setOpenCreateModal(true)}
//           >
//             Launch Project
//           </Button>
//         </Box>

//         <TableContainer component={Paper} className="project-table">
//           <Table>
//             <TableHead>
//               <TableRow>
//                 <TableCell>MISSION ID</TableCell>
//                 <TableCell>PROJECT NAME</TableCell>
//                 <TableCell>INTEL (DESCRIPTION)</TableCell>
//                 <TableCell>ASSETS (TASKS)</TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {projects.length === 0 ? (
//                 <TableRow>
//                   <TableCell
//                     colSpan={4}
//                     align="center"
//                     className="empty-state"
//                   >
//                     <Box className="empty-content">
//                       <RocketIcon className="empty-icon" />
//                       <Typography className="empty-title">
//                         No Active Missions
//                       </Typography>
//                     </Box>
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 projects.map((p) => (
//                   <TableRow key={p._id || p.id}>
//                     <TableCell
//                       sx={{
//                         fontFamily: "monospace",
//                         color: "var(--text-muted)",
//                       }}
//                     >
//                       {String(p._id || p.id || "")
//                         .slice(-6)
//                         .toUpperCase()}
//                     </TableCell>
//                     <TableCell sx={{ fontWeight: "bold" }}>
//                       {p.name}
//                     </TableCell>
//                     <TableCell sx={{ color: "var(--text-secondary)" }}>
//                       {p.description || "N/A"}
//                     </TableCell>
//                     <TableCell>
//                       <Chip
//                         icon={
//                           <TaskIcon
//                             style={{ color: "var(--neon-green)" }}
//                           />
//                         }
//                         label={`${p.taskCount || 0} Tasks`}
//                         variant="outlined"
//                         onClick={() => {}}
//                         sx={{
//                           color: "var(--neon-green)",
//                           borderColor: "var(--neon-green)",
//                         }}
//                       />
//                     </TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </TableContainer>
//       </Container>

//       {/* Create Project Dialog */}
//       <Dialog
//         open={openCreateModal}
//         onClose={handleCloseModal}
//         maxWidth="sm"
//         fullWidth
//         PaperProps={{ className: "MuiDialog-paper" }}
//       >
//         <DialogTitle>Initialize New Mission</DialogTitle>
//         <DialogContent dividers>
//           <TextField
//             fullWidth
//             label="Project Name"
//             value={projectName}
//             onChange={(e) => setProjectName(e.target.value)}
//             sx={{ mb: 2 }}
//           />
//           <TextField
//             fullWidth
//             multiline
//             rows={2}
//             label="Project Description"
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//           />

//           <Box
//             sx={{
//               p: 2,
//               border: "1px solid var(--border-primary)",
//               borderRadius: "12px",
//               mt: 3,
//               bgcolor: "rgba(255,255,255,0.02)",
//             }}
//           >
//             <Typography
//               variant="subtitle2"
//               sx={{ mb: 1, color: "var(--primary)" }}
//             >
//               Add Initial Assets
//             </Typography>
//             <Box sx={{ display: "flex", gap: 1 }}>
//               <TextField
//                 fullWidth
//                 size="small"
//                 label="Task Name"
//                 value={newTaskTitle}
//                 onChange={(e) => setNewTaskTitle(e.target.value)}
//               />
//               <Button
//                 variant="outlined"
//                 onClick={handleAddTask}
//                 sx={{
//                   color: "var(--primary)",
//                   borderColor: "var(--primary)",
//                 }}
//               >
//                 Add
//               </Button>
//             </Box>
//           </Box>

//           <List dense sx={{ mt: 2, maxHeight: "150px", overflow: "auto" }}>
//             {tasks.map((t) => (
//               <ListItem
//                 key={t.id}
//                 secondaryAction={
//                   <IconButton
//                     edge="end"
//                     onClick={() =>
//                       setTasks((prev) =>
//                         prev.filter((tk) => tk.id !== t.id)
//                       )
//                     }
//                   >
//                     <Delete sx={{ color: "var(--error)" }} />
//                   </IconButton>
//                 }
//               >
//                 <ListItemText
//                   primary={t.title}
//                   sx={{ color: "var(--text-primary)" }}
//                 />
//               </ListItem>
//             ))}
//           </List>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleCloseModal} className="MuiButton-text">
//             Abort
//           </Button>
//           <Button
//             onClick={handleCreateProject}
//             variant="contained"
//             className="MuiButton-contained"
//           >
//             Launch Mission
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </div>
//   );
// };

// export default Project;
