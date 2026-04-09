// File: dodesk/src/Pages/TeamSelection.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Container, Typography, TextField, Grid, Card, CardContent,
  Button, Select, MenuItem, Chip, Avatar, Snackbar, Alert,
  Box, IconButton, Divider, Collapse,
} from "@mui/material";
import DeleteIcon  from "@mui/icons-material/Delete";
import EditIcon    from "@mui/icons-material/Edit";
import GroupIcon   from "@mui/icons-material/Group";
import FolderIcon  from "@mui/icons-material/Folder";
import PeopleIcon  from "@mui/icons-material/People";
import PersonIcon  from "@mui/icons-material/Person";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useAuth } from "../Context/AuthContext";
import "./TeamSelection.css";

// ── How many members to show before collapsing ──
const MEMBER_PREVIEW_LIMIT = 3;

// ── Per-card expand/collapse toggle (pure UI, no state in parent) ──
const MemberList = ({ memberNames }) => {
  const [expanded, setExpanded] = useState(false);
  const hasMore = memberNames.length > MEMBER_PREVIEW_LIMIT;
  const visible = expanded ? memberNames : memberNames.slice(0, MEMBER_PREVIEW_LIMIT);

  return (
    <div className="team-members-wrapper">
      {/* Fixed-height chip row — clips overflow when collapsed */}
      <div className={`team-card-members-list${expanded ? " is-expanded" : ""}`}>
        {memberNames.length > 0 ? (
          visible.map((name, idx) => (
            <Chip
              key={idx}
              icon={<PersonIcon style={{ fontSize: "0.75rem" }} />}
              label={name}
              size="small"
              className="team-member-name-chip"
            />
          ))
        ) : (
          <span className="team-no-members">No members assigned</span>
        )}
      </div>

      {/* Toggle button sits OUTSIDE the clipped div — always visible */}
      {hasMore && (
        <button
          className="see-all-members-btn"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <>
              <ExpandLessIcon style={{ fontSize: "0.85rem" }} />
              Show less
            </>
          ) : (
            <>
              <ExpandMoreIcon style={{ fontSize: "0.85rem" }} />
              See all {memberNames.length} members
            </>
          )}
        </button>
      )}
    </div>
  );
};

const TeamSelection = () => {
  const { user, api } = useAuth();

  // --- States ---
  const [teamName,           setTeamName]           = useState("");
  const [users,              setUsers]              = useState([]);
  const [projects,           setProjects]           = useState([]);
  const [teams,              setTeams]              = useState([]);
  const [selectedProjectId,  setSelectedProjectId]  = useState("");
  const [selectedUsers,      setSelectedUsers]      = useState([]);
  const [search,             setSearch]             = useState("");
  const [editMode,           setEditMode]           = useState(false);
  const [editingTeamId,      setEditingTeamId]      = useState(null);
  const [notification,       setNotification]       = useState({ open: false, message: "", type: "success" });

  // --- Fetch data ---
  const loadData = useCallback(async () => {
    try {
      const [usersRes, projectsRes, teamsRes] = await Promise.all([
        api.get("/api/auth/users"),
        api.get("/api/projects/all"),
        api.get("/api/teams"),
      ]);
      setUsers(usersRes.data?.users || []);
      setProjects(projectsRes.data || []);
      setTeams(teamsRes.data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  }, [api]);

  useEffect(() => {
    document.title = "Teams — DoDesk";

    // ── Starfield ──
    const createStarfield = () => {
      const container = document.querySelector(".team-starfield");
      if (!container) return;
      container.innerHTML = "";
      for (let i = 0; i < 280; i++) {
        const star = document.createElement("div");
        const size = Math.random();
        star.className =
          size < 0.30  ? "star star-small"  :
          size < 0.62  ? "star star-medium" :
          size < 0.86  ? "star star-large"  : "star star-bright";
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
    if (user) loadData();
  }, [user, loadData]);

  const showNotification = (message, type = "success") => {
    setNotification({ open: true, message, type });
  };

  const toggleUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  const editTeam = (team) => {
    setEditMode(true);
    setEditingTeamId(team._id);
    setTeamName(team.name);
    setSelectedProjectId(team.projectId);
    setSelectedUsers(team.memberIds || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const createTeam = async () => {
    if (!teamName || !selectedProjectId)
      return showNotification("Fill all fields", "warning");
    try {
      const memberList = [...new Set([...selectedUsers])];
      await api.post("/api/teams", {
        name:      teamName,
        projectId: selectedProjectId,
        memberIds: memberList,
        createdBy: user.id,
      });
      showNotification("Team formed successfully!");
      resetForm();
      loadData();
    } catch {
      showNotification("Failed to create team", "error");
    }
  };

  const updateTeam = async () => {
    try {
      const memberList = [...new Set([...selectedUsers])];
      await api.put(`/api/teams/${editingTeamId}`, {
        name:      teamName,
        projectId: selectedProjectId,
        memberIds: memberList,
      });
      showNotification("Team updated!");
      resetForm();
      loadData();
    } catch {
      showNotification("Update failed", "error");
    }
  };

  const deleteTeam = async (teamId) => {
    if (!window.confirm("Disband this team?")) return;
    try {
      await api.delete(`/api/teams/${teamId}`);
      showNotification("Team disbanded", "info");
      loadData();
    } catch {
      showNotification("Delete failed", "error");
    }
  };

  const resetForm = () => {
    setTeamName("");
    setSelectedProjectId("");
    setSelectedUsers([]);
    setEditMode(false);
    setEditingTeamId(null);
    setSearch("");
  };

  const filteredUsers = users.filter((u) => {
    const text = search.toLowerCase();
    return (
      (u.name?.toLowerCase().includes(text) ||
        u.email?.toLowerCase().includes(text)) &&
      u.id !== user?.id
    );
  });

  const getProjectName = (projectId) => {
    const p = projects.find((p) => p._id === projectId);
    return p?.name || "No project";
  };

  const resolveUserName = (id) => {
    if (!id) return "";
    const match = users.find((u) => u.id === id || u._id === id);
    if (match) return match.name || match.email || id;
    if (user?.id === id || user?._id === id)
      return user.name || user.email || id;
    return id;
  };

  const resolveMemberNames = (memberIds = []) =>
    memberIds.map((id) => resolveUserName(id));

  return (
    <>
      <div className="team-starfield-bg">
        <div className="team-starfield" />
      </div>

      <div className="team-page">
        <Container maxWidth="lg">

          {/* ── Page Header ── */}
          <div className="team-page-header">
            <Typography variant="h4" className="team-page-title">
              <GroupIcon />
              Team Management
            </Typography>
            <Typography variant="body2" className="team-page-subtitle">
              Build squads, assign projects, and manage your team roster
            </Typography>
          </div>

          {/* ── Form Card ── */}
          <Card elevation={0} className={`team-form-card ${editMode ? "edit-mode" : ""}`}>
            {editMode && (
              <div className="edit-mode-banner">
                <EditIcon sx={{ fontSize: "1rem" }} />
                Editing team — make your changes below
              </div>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Team Name"
                  fullWidth
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Alpha Squad"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Select
                  fullWidth
                  value={selectedProjectId}
                  displayEmpty
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  MenuProps={{
                    disableScrollLock: true,
                    BackdropProps: { invisible: true, style: { backdropFilter: "none", WebkitBackdropFilter: "none" } },
                    PaperProps: { elevation: 4 },
                    sx: {
                      "& .MuiBackdrop-root": {
                        backdropFilter: "none !important",
                        WebkitBackdropFilter: "none !important",
                        background: "transparent !important",
                      },
                    },
                  }}
                  sx={{
                    fontFamily:   "var(--font-body)",
                    background:   "var(--bg-muted)",
                    borderRadius: "var(--radius-md)",
                    color:        "var(--text-primary)",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-default)" },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-strong)" },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--accent-primary)" },
                    "& .MuiSelect-select": { color: "var(--text-primary)", fontFamily: "var(--font-body)" },
                    "& .MuiSvgIcon-root":  { color: "var(--text-muted)" },
                  }}
                >
                  <MenuItem value="">
                    <em style={{ color: "var(--text-muted)", fontStyle: "normal" }}>
                      Select Project
                    </em>
                  </MenuItem>
                  {projects.map((p) => (
                    <MenuItem key={p._id} value={p._id}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FolderIcon sx={{ fontSize: "1rem", color: "var(--warning)" }} />
                        {p.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Search Personnel"
                  fullWidth
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Grid>
            </Grid>

            {/* Personnel Grid */}
            <Box mt={3}>
              <Typography className="team-form-section-label">
                <PeopleIcon sx={{ fontSize: "1rem" }} />
                Select Team Members
                {selectedUsers.length > 0 && (
                  <span className="selected-count-badge">
                    {selectedUsers.length} selected
                  </span>
                )}
              </Typography>

              <div className="personnel-grid-wrapper">
                <Grid container spacing={1.5}>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <Grid item xs={12} sm={6} md={4} key={u.id}>
                        <Card
                          elevation={0}
                          className={`user-select-card ${selectedUsers.includes(u.id) ? "selected" : ""}`}
                          onClick={() => toggleUser(u.id)}
                        >
                          <CardContent>
                            <Avatar className="user-select-avatar">
                              {u.name?.[0]?.toUpperCase()}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography className="user-select-name" noWrap>
                                {u.name}
                              </Typography>
                              <Typography className="user-select-email" noWrap>
                                {u.email}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Typography sx={{
                        textAlign: "center", py: 3,
                        color: "var(--text-muted)", fontSize: "var(--text-sm)"
                      }}>
                        {search ? "No personnel matching your search." : "No other users found."}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </div>
            </Box>

            {/* Form Actions */}
            <Box sx={{ mt: 4, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
              <Button
                variant="contained"
                className="team-submit-btn"
                onClick={editMode ? updateTeam : createTeam}
                disabled={!teamName || !selectedProjectId}
                disableElevation
              >
                {editMode ? "Update" : "Form Squad"}
              </Button>
              {editMode && (
                <Button variant="outlined" className="team-cancel-btn" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </Box>
          </Card>

          {/* ── Active Squads ── */}
          <Typography variant="h5" className="squads-section-title">
            <GroupIcon sx={{ color: "var(--accent-primary)", fontSize: "1.5rem" }} />
            Active Squads
          </Typography>

          {teams.length > 0 ? (
            <Grid container spacing={3} alignItems="stretch">
              {teams.map((team, i) => {
                const projectName = team.projectName || getProjectName(team.projectId);
                const creatorName = resolveUserName(team.createdBy);
                const memberIds   = (team.memberIds || []).filter((id) => id !== team.createdBy);
                const memberNames = resolveMemberNames(memberIds);

                return (
                  <Grid item xs={12} md={4} key={team._id} sx={{ display: "flex" }}>
                    <Card
                      elevation={0}
                      className="team-card"
                      style={{ animationDelay: `${i * 0.08}s`, width: "100%" }}
                    >
                      <CardContent>

                        {/* Card Header */}
                        <div className="team-card-header">
                          <Typography className="team-card-name">
                            <GroupIcon />
                            {team.name}
                          </Typography>
                          <div className="team-card-actions">
                            <IconButton size="small" onClick={() => editTeam(team)} title="Edit team">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => deleteTeam(team._id)} title="Delete team">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </div>
                        </div>

                        {/* Project */}
                        <div className="team-card-project">
                          <FolderIcon sx={{ fontSize: "0.9rem" }} />
                          <span>{projectName || "No project linked"}</span>
                        </div>

                        <Divider className="team-card-divider" />

                        {/* Created By */}
                        {creatorName && (
                          <div className="team-card-creator">
                            <PersonIcon sx={{ fontSize: "0.85rem" }} />
                            <span className="team-card-creator-label">Created by</span>
                            <span className="team-card-creator-name">{creatorName}</span>
                          </div>
                        )}

                        <Divider className="team-card-divider" />

                        {/* Members — fixed height, collapses if many */}
                        <Typography className="team-card-members-label">
                          <PeopleIcon sx={{ fontSize: "0.85rem" }} />
                          Members ({memberNames.length})
                        </Typography>

                        <MemberList memberNames={memberNames} />

                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <div className="teams-empty">
              <GroupIcon sx={{ fontSize: "2.5rem", opacity: 0.3, display: "block", margin: "0 auto var(--sp-4)" }} />
              No active squads yet. Form your first team above!
            </div>
          )}

        </Container>

        {/* Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={4000}
          onClose={() => setNotification({ ...notification, open: false })}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert severity={notification.type} variant="filled">
            {notification.message}
          </Alert>
        </Snackbar>
      </div>
    </>
  );
};

export default TeamSelection;


















































































































// import React, { useEffect, useState, useCallback } from "react";
// import axios from "axios";
// import {
//   Container, Typography, TextField, Grid, Card, CardContent, Button,
//   Select, MenuItem, Chip, Avatar, Snackbar, Alert, Box, IconButton
// } from "@mui/material";

// import DeleteIcon from "@mui/icons-material/Delete";
// import EditIcon from "@mui/icons-material/Edit";
// import GroupIcon from "@mui/icons-material/Group";
// import FolderIcon from "@mui/icons-material/Folder";

// import { useAuth } from "../Context/AuthContext";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// const TeamSelection = () => {
//   // Use shared 'api' instance and 'user' data from AuthContext
//   const { user, api } = useAuth(); 

//   // --- States for Form and Data ---
//   const [teamName, setTeamName] = useState("");
//   const [users, setUsers] = useState([]); // List of all registered users
//   const [projects, setProjects] = useState([]); // List of all projects
//   const [teams, setTeams] = useState([]); // List of existing teams
//   const [selectedProjectId, setSelectedProjectId] = useState("");
//   const [selectedUsers, setSelectedUsers] = useState([]); // IDs of users selected for the team
//   const [search, setSearch] = useState(""); // Personnel search query
  
//   // --- Edit Mode States ---
//   const [editMode, setEditMode] = useState(false);
//   const [editingTeamId, setEditingTeamId] = useState(null);
  
//   // Notification Toast state
//   const [notification, setNotification] = useState({ open: false, message: "", type: "success" });

//   /**
//    * FETCH INITIAL DATA
//    * Loads all users, projects, and teams simultaneously on page load.
//    */
//   const loadData = useCallback(async () => {
//     try {
//       const [usersRes, projectsRes, teamsRes] = await Promise.all([
//         api.get("/api/auth/users"),
//         api.get("/api/projects/all"),
//         api.get("/api/teams"),
//       ]);
//       setUsers(usersRes.data?.users || []);
//       setProjects(projectsRes.data || []);
//       setTeams(teamsRes.data || []);
//     } catch (err) {
//       console.error("Fetch Error:", err);
//     }
//   }, [api]);

//   // Trigger data load only if a user is authenticated
//   useEffect(() => {
//     if (user) loadData();
//   }, [user, loadData]);

//   // Helper function to trigger the snackbar notification
//   const showNotification = (message, type = "success") => {
//     setNotification({ open: true, message, type });
//   };

//   /**
//    * USER SELECTION LOGIC
//    * Adds or removes a user ID from the 'selectedUsers' array when their card is clicked.
//    */
//   const toggleUser = (id) => {
//     setSelectedUsers((prev) =>
//       prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
//     );
//   };

//   /**
//    * PREPARE FOR EDIT
//    * Fills the form with existing team data when the Edit button is clicked.
//    */
//   const editTeam = (team) => {
//     setEditMode(true);
//     setEditingTeamId(team._id);
//     setTeamName(team.name);
//     setSelectedProjectId(team.projectId);
//     // Filter out the current user's ID to only show selected teammates
//     setSelectedUsers(team.memberIds.filter(id => id !== user.id));
//     // Smooth scroll back to the top form
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   /**
//    * CREATE TEAM
//    * Sends a POST request to create a new squad. 
//    * Note: The current user is automatically added as a member.
//    */
//   const createTeam = async () => {
//     if (!teamName || !selectedProjectId) return showNotification("Fill all fields", "warning");
//     try {
//       // Ensure the creator is always part of the member list and remove duplicates
//       const memberList = [...new Set([...selectedUsers, user.id])];
//       await api.post("/api/teams", {
//         name: teamName,
//         projectId: selectedProjectId,
//         memberIds: memberList,
//         createdBy: user.id,
//       });
//       showNotification("Team formed successfully!");
//       resetForm();
//       loadData(); // Refresh the squads list
//     } catch {
//       showNotification("Failed to create team", "error");
//     }
//   };

//   /**
//    * UPDATE TEAM
//    * Sends a PUT request to update existing squad details.
//    */
//   const updateTeam = async () => {
//     try {
//       const memberList = [...new Set([...selectedUsers, user.id])];
//       await api.put(`/api/teams/${editingTeamId}`, {
//         name: teamName,
//         projectId: selectedProjectId,
//         memberIds: memberList,
//       });
//       showNotification("Team updated!");
//       resetForm();
//       loadData();
//     } catch {
//       showNotification("Update failed", "error");
//     }
//   };

//   /**
//    * DELETE TEAM
//    * Sends a DELETE request and removes the squad from the database.
//    */
//   const deleteTeam = async (teamId) => {
//     if (!window.confirm("Disband this team?")) return;
//     try {
//       await api.delete(`/api/teams/${teamId}`);
//       showNotification("Team disbanded", "info");
//       loadData();
//     } catch {
//       showNotification("Delete failed", "error");
//     }
//   };

//   // Clears all form fields and exits Edit Mode
//   const resetForm = () => {
//     setTeamName("");
//     setSelectedProjectId("");
//     setSelectedUsers([]);
//     setEditMode(false);
//     setEditingTeamId(null);
//     setSearch("");
//   };

//   /**
//    * FILTER LOGIC
//    * Filters the user list based on search text (Name or Email).
//    * It also hides the current user so they don't select themselves.
//    */
//   const filteredUsers = users.filter((u) => {
//     const text = search.toLowerCase();
//     return (u.name?.toLowerCase().includes(text) || u.email?.toLowerCase().includes(text)) && u.id !== user?.id;
//   });

//   return (
//     <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
//       <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold", color: "#2575fc" }}>Team Management</Typography>

//       {/* --- Main Creation/Edit Card --- */}
//       <Card elevation={3} sx={{ mb: 4, p: 3, borderRadius: 4 }}>
//         <Grid container spacing={3}>
//           <Grid item xs={12} md={6}>
//             <TextField label="Team Name" fullWidth value={teamName} onChange={(e) => setTeamName(e.target.value)} />
//           </Grid>
//           <Grid item xs={12} md={6}>
//             <Select fullWidth value={selectedProjectId} displayEmpty onChange={(e) => setSelectedProjectId(e.target.value)}>
//               <MenuItem value="">Select Project</MenuItem>
//               {projects.map((p) => (
//                 <MenuItem key={p._id} value={p._id}><FolderIcon sx={{ mr: 1, color: "orange" }} /> {p.name}</MenuItem>
//               ))}
//             </Select>
//           </Grid>
//           <Grid item xs={12}>
//             <TextField label="Search Personnel" fullWidth placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
//           </Grid>
//         </Grid>

//         {/* --- Personnel Selection Grid --- */}
//         <Box sx={{ mt: 3, maxHeight: '250px', overflowY: 'auto', p: 1, bgcolor: '#f5f5f5', borderRadius: 2 }}>
//           <Grid container spacing={2}>
//             {filteredUsers.map((u) => (
//               <Grid item xs={12} sm={6} md={4} key={u.id}>
//                 {/* Visual indicator (blue border) if user is selected */}
//                 <Card onClick={() => toggleUser(u.id)} sx={{ cursor: "pointer", border: selectedUsers.includes(u.id) ? "2px solid #2575fc" : "1px solid #ddd" }}>
//                   <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5, p: "10px !important" }}>
//                     <Avatar sx={{ width: 30, height: 30 }}>{u.name?.[0]}</Avatar>
//                     <Box><Typography variant="body2" fontWeight="bold">{u.name}</Typography></Box>
//                   </CardContent>
//                 </Card>
//               </Grid>
//             ))}
//           </Grid>
//         </Box>

//         <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
//           <Button variant="contained" onClick={editMode ? updateTeam : createTeam} disabled={!teamName || !selectedProjectId}>
//             {editMode ? "Update Squad" : "Form Squad"}
//           </Button>
//           {editMode && <Button onClick={resetForm}>Abort</Button>}
//         </Box>
//       </Card>

//       {/* --- Display of Existing Teams --- */}
//       <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Active Squads</Typography>
//       <Grid container spacing={3}>
//         {teams.map((team) => (
//           <Grid item xs={12} md={4} key={team._id}>
//             <Card sx={{ borderRadius: 3, borderLeft: '6px solid #6a11cb' }}>
//               <CardContent>
//                 <Box display="flex" justifyContent="space-between" alignItems="center">
//                   <Typography variant="h6" fontWeight="bold"><GroupIcon /> {team.name}</Typography>
//                   <Box>
//                     <IconButton onClick={() => editTeam(team)} size="small"><EditIcon fontSize="small" /></IconButton>
//                     <IconButton onClick={() => deleteTeam(team._id)} size="small" color="error"><DeleteIcon fontSize="small" /></IconButton>
//                   </Box>
//                 </Box>
//                 {/* Show member count inside a Chip */}
//                 <Chip label={`Members: ${team.memberIds?.length || 0}`} size="small" sx={{ mt: 1 }} />
//               </CardContent>
//             </Card>
//           </Grid>
//         ))}
//       </Grid>

//       {/* --- Global Notifications --- */}
//       <Snackbar open={notification.open} autoHideDuration={4000} onClose={() => setNotification({ ...notification, open: false })}>
//         <Alert severity={notification.type} variant="filled">{notification.message}</Alert>
//       </Snackbar>
//     </Container>
//   );
// };

// export default TeamSelection;

























































// // File: dodesk/src/Pages/TeamSelection.jsx

// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import {
//   Container,
//   Typography,
//   TextField,
//   Grid,
//   Card,
//   CardContent,
//   Button,
//   Select,
//   MenuItem,
//   Chip,
//   Avatar,
//   Snackbar,
//   Alert,
//   Box,
//   IconButton,
// } from "@mui/material";

// import DeleteIcon from "@mui/icons-material/Delete";
// import EditIcon from "@mui/icons-material/Edit";
// import GroupIcon from "@mui/icons-material/Group";
// import FolderIcon from "@mui/icons-material/Folder";

// import { useAuth } from "../Context/AuthContext";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// const TeamSelection = () => {
//   const { user } = useAuth();

//   const [teamName, setTeamName] = useState("");
//   const [users, setUsers] = useState([]);
//   const [projects, setProjects] = useState([]);
//   const [teams, setTeams] = useState([]);

//   const [selectedProjectId, setSelectedProjectId] = useState("");
//   const [selectedUsers, setSelectedUsers] = useState([]);
//   const [search, setSearch] = useState("");

//   const [editMode, setEditMode] = useState(false);
//   const [editingTeamId, setEditingTeamId] = useState(null);

//   const [notification, setNotification] = useState({
//     open: false,
//     message: "",
//     type: "success",
//   });

//   const api = axios.create({
//     baseURL: API_URL,
//   });

//   api.interceptors.request.use((config) => {
//     const token = localStorage.getItem("token");
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   });

//   useEffect(() => {
//     if (user) loadData();
//   }, [user]);

//   const loadData = async () => {
//     try {
//       const [usersRes, projectsRes, teamsRes] = await Promise.all([
//         api.get("/api/auth/users"),
//         api.get("/api/projects"),
//         api.get("/api/teams"),
//       ]);

//       setUsers(usersRes.data?.users || []);
//       setProjects(projectsRes.data || []);
//       setTeams(teamsRes.data || []);
//     } catch {
//       showNotification("Failed to load data", "error");
//     }
//   };

//   const showNotification = (message, type = "success") => {
//     setNotification({
//       open: true,
//       message,
//       type,
//     });
//   };

//   const toggleUser = (id) => {
//     setSelectedUsers((prev) =>
//       prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
//     );
//   };

//   const createTeam = async () => {
//     try {
//       await api.post("/api/teams", {
//         name: teamName,
//         projectId: selectedProjectId,
//         memberIds: [...selectedUsers, user.id],
//         createdBy: user.id,
//       });

//       showNotification("Team created successfully");
//       resetForm();
//       loadData();
//     } catch {
//       showNotification("Team creation failed", "error");
//     }
//   };

//   const editTeam = (team) => {
//     setTeamName(team.name);
//     setSelectedProjectId(team.projectId);
//     setSelectedUsers(team.memberIds.filter((id) => id !== user.id));
//     setEditingTeamId(team._id);
//     setEditMode(true);
//   };

//   const updateTeam = async () => {
//     try {
//       await api.put(`/api/teams/${editingTeamId}`, {
//         name: teamName,
//         projectId: selectedProjectId,
//         memberIds: [...selectedUsers, user.id],
//       });

//       showNotification("Team updated");
//       resetForm();
//       loadData();
//     } catch {
//       showNotification("Update failed", "error");
//     }
//   };

//   const deleteTeam = async (teamId) => {
//     try {
//       await api.delete(`/api/teams/${teamId}`);

//       showNotification("Team deleted");
//       loadData();
//     } catch {
//       showNotification("Delete failed", "error");
//     }
//   };

//   const resetForm = () => {
//     setTeamName("");
//     setSelectedProjectId("");
//     setSelectedUsers([]);
//     setEditMode(false);
//     setEditingTeamId(null);
//   };

//   const filteredUsers = users.filter((u) => {
//     const text = search.toLowerCase();
//     return (
//       (u.name?.toLowerCase().includes(text) ||
//         u.email?.toLowerCase().includes(text)) &&
//       u.id !== user?.id
//     );
//   });

//   return (
//     <Container maxWidth="lg">

//       <Typography
//         variant="h4"
//         sx={{
//           mb: 3,
//           fontWeight: "bold",
//           background: "linear-gradient(90deg,#6a11cb,#2575fc)",
//           WebkitBackgroundClip: "text",
//           WebkitTextFillColor: "transparent",
//         }}
//       >
//         Team Management
//       </Typography>

//       {/* TEAM FORM */}

//       <Card sx={{ mb: 4, p: 2 }}>
//         <Grid container spacing={2}>

//           <Grid item xs={12} md={6}>
//             <TextField
//               label="Team Name"
//               fullWidth
//               value={teamName}
//               onChange={(e) => setTeamName(e.target.value)}
//             />
//           </Grid>

//           <Grid item xs={12} md={6}>
//             <Select
//               fullWidth
//               value={selectedProjectId}
//               displayEmpty
//               onChange={(e) => setSelectedProjectId(e.target.value)}
//             >
//               <MenuItem value="">Select Project</MenuItem>

//               {projects.map((p) => (
//                 <MenuItem key={p._id} value={p._id}>
//                   <FolderIcon sx={{ mr: 1 }} />
//                   {p.name}
//                 </MenuItem>
//               ))}
//             </Select>
//           </Grid>

//           <Grid item xs={12}>
//             <TextField
//               label="Search Members"
//               fullWidth
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//             />
//           </Grid>

//         </Grid>

//         {/* MEMBER CARDS */}

//         <Grid container spacing={2} sx={{ mt: 2 }}>
//           {filteredUsers.map((u) => (
//             <Grid item xs={12} sm={6} md={4} key={u.id}>
//               <Card
//                 onClick={() => toggleUser(u.id)}
//                 sx={{
//                   cursor: "pointer",
//                   transition: "0.3s",
//                   transform: selectedUsers.includes(u.id)
//                     ? "scale(1.05)"
//                     : "scale(1)",
//                   border: selectedUsers.includes(u.id)
//                     ? "2px solid #2575fc"
//                     : "1px solid #ccc",
//                 }}
//               >
//                 <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
//                   <Avatar sx={{ bgcolor: "#2575fc" }}>
//                     {u.name?.[0]}
//                   </Avatar>

//                   <Box>
//                     <Typography fontWeight="bold">{u.name}</Typography>
//                     <Typography variant="body2">{u.email}</Typography>

//                     <Chip
//                       label={u.role || "User"}
//                       size="small"
//                       color="primary"
//                       sx={{ mt: 1 }}
//                     />
//                   </Box>
//                 </CardContent>
//               </Card>
//             </Grid>
//           ))}
//         </Grid>

//         <Box sx={{ mt: 3 }}>
//           {!editMode ? (
//             <Button variant="contained" onClick={createTeam}>
//               Create Team
//             </Button>
//           ) : (
//             <Button variant="contained" onClick={updateTeam}>
//               Update Team
//             </Button>
//           )}
//         </Box>
//       </Card>

//       {/* TEAMS LIST */}

//       <Typography variant="h5" sx={{ mb: 2 }}>
//         Your Teams
//       </Typography>

//       <Grid container spacing={2}>

//         {teams.map((team) => (
//           <Grid item xs={12} md={4} key={team._id}>
//             <Card
//               sx={{
//                 background: "linear-gradient(135deg,#667eea,#764ba2)",
//                 color: "white",
//               }}
//             >
//               <CardContent>

//                 <Box display="flex" justifyContent="space-between">

//                   <Typography variant="h6">
//                     <GroupIcon sx={{ mr: 1 }} />
//                     {team.name}
//                   </Typography>

//                   <Box>
//                     <IconButton
//                       onClick={() => editTeam(team)}
//                       sx={{ color: "white" }}
//                     >
//                       <EditIcon />
//                     </IconButton>

//                     <IconButton
//                       onClick={() => deleteTeam(team._id)}
//                       sx={{ color: "white" }}
//                     >
//                       <DeleteIcon />
//                     </IconButton>
//                   </Box>

//                 </Box>

//                 <Typography variant="body2">
//                   Members: {team.memberIds?.length || 0}
//                 </Typography>

//               </CardContent>
//             </Card>
//           </Grid>
//         ))}

//       </Grid>

//       {/* NOTIFICATION */}

//       <Snackbar
//         open={notification.open}
//         autoHideDuration={3000}
//         onClose={() =>
//           setNotification({ ...notification, open: false })
//         }
//       >
//         <Alert severity={notification.type}>
//           {notification.message}
//         </Alert>
//       </Snackbar>

//     </Container>
//   );
// };

// export default TeamSelection;






































// // File: dodesk/src/Pages/TeamSelection.jsx

// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import {
//   Container,
//   Typography,
//   TextField,
//   Grid,
//   Card,
//   CardContent,
//   Button,
//   Select,
//   MenuItem,
//   Chip,
//   Avatar,
//   Snackbar,
//   Alert,
//   Box,
// } from "@mui/material";

// import { useAuth } from "../Context/AuthContext";
// import "./TeamSelection.css";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// const TeamSelection = () => {
//   const { user } = useAuth();

//   const [teamName, setTeamName] = useState("");
//   const [users, setUsers] = useState([]);
//   const [projects, setProjects] = useState([]);
//   const [teams, setTeams] = useState([]);
//   const [selectedProjectId, setSelectedProjectId] = useState("");
//   const [selectedUsers, setSelectedUsers] = useState([]);
//   const [search, setSearch] = useState("");

//   const [editMode, setEditMode] = useState(false);
//   const [editingTeamId, setEditingTeamId] = useState(null);

//   const [notification, setNotification] = useState({
//     open: false,
//     message: "",
//     type: "success",
//   });

//   const api = axios.create({
//     baseURL: API_URL,
//   });

//   api.interceptors.request.use((config) => {
//     const token = localStorage.getItem("token");
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   });

//   // ---------------- LOAD DATA ----------------

//   useEffect(() => {
//     if (user) loadData();
//   }, [user]);

//   const loadData = async () => {
//     try {
//       const [usersRes, projectsRes, teamsRes] = await Promise.all([
//         api.get("/api/auth/users"),
//         api.get("/api/projects"),
//         api.get("/api/teams"),
//       ]);

//       setUsers(usersRes.data?.users || []);
//       setProjects(projectsRes.data || []);
//       setTeams(teamsRes.data || []);
//     } catch {
//       showNotification("Failed to load data", "error");
//     }
//   };

//   // ---------------- NOTIFICATION ----------------

//   const showNotification = (message, type = "success") => {
//     setNotification({
//       open: true,
//       message,
//       type,
//     });
//   };

//   // ---------------- USER SELECT ----------------

//   const toggleUser = (id) => {
//     setSelectedUsers((prev) =>
//       prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
//     );
//   };

//   // ---------------- CREATE TEAM ----------------

//   const createTeam = async () => {
//     if (!teamName || !selectedProjectId || selectedUsers.length === 0) {
//       showNotification("Fill all fields", "error");
//       return;
//     }

//     try {
//       await api.post("/api/teams", {
//         name: teamName,
//         projectId: selectedProjectId,
//         memberIds: [...selectedUsers, user.id],
//         createdBy: user.id,
//       });

//       showNotification("Team created successfully");

//       resetForm();
//       loadData();
//     } catch {
//       showNotification("Team creation failed", "error");
//     }
//   };

//   // ---------------- EDIT TEAM ----------------

//   const editTeam = (team) => {
//     setTeamName(team.name);
//     setSelectedProjectId(team.projectId);
//     setSelectedUsers(team.memberIds.filter((id) => id !== user.id));
//     setEditingTeamId(team._id);
//     setEditMode(true);
//   };

//   const updateTeam = async () => {
//     try {
//       await api.put(`/api/teams/${editingTeamId}`, {
//         name: teamName,
//         projectId: selectedProjectId,
//         memberIds: [...selectedUsers, user.id],
//       });

//       showNotification("Team updated");

//       resetForm();
//       loadData();
//     } catch {
//       showNotification("Update failed", "error");
//     }
//   };

//   const resetForm = () => {
//     setTeamName("");
//     setSelectedProjectId("");
//     setSelectedUsers([]);
//     setEditMode(false);
//     setEditingTeamId(null);
//   };

//   // ---------------- FILTER USERS ----------------

//   const filteredUsers = users.filter((u) => {
//     const text = search.toLowerCase();
//     return (
//       (u.name?.toLowerCase().includes(text) ||
//         u.email?.toLowerCase().includes(text)) &&
//       u.id !== user?.id
//     );
//   });

//   // ---------------- UI ----------------

//   return (
//     <Container maxWidth="lg" className="team-selection-container">

//       <Typography variant="h4" gutterBottom>
//         Team Management
//       </Typography>

//       {/* TEAM FORM */}

//       <Card sx={{ mb: 4 }}>
//         <CardContent>

//           <Grid container spacing={2}>

//             <Grid item xs={12} md={6}>
//               <TextField
//                 label="Team Name"
//                 fullWidth
//                 value={teamName}
//                 onChange={(e) => setTeamName(e.target.value)}
//               />
//             </Grid>

//             <Grid item xs={12} md={6}>
//               <Select
//                 fullWidth
//                 value={selectedProjectId}
//                 displayEmpty
//                 onChange={(e) => setSelectedProjectId(e.target.value)}
//               >
//                 <MenuItem value="">Select Project</MenuItem>

//                 {projects.map((p) => (
//                   <MenuItem key={p._id || p.id} value={p._id || p.id}>
//                     {p.name}
//                   </MenuItem>
//                 ))}
//               </Select>
//             </Grid>

//             <Grid item xs={12}>
//               <TextField
//                 label="Search Users"
//                 fullWidth
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//               />
//             </Grid>

//           </Grid>

//           {/* USERS LIST */}

//           <Grid container spacing={2} sx={{ mt: 2 }}>
//             {filteredUsers.map((u) => (
//               <Grid item xs={12} sm={6} md={4} key={u.id}>
//                 <Card
//                   onClick={() => toggleUser(u.id)}
//                   sx={{
//                     cursor: "pointer",
//                     border: selectedUsers.includes(u.id)
//                       ? "2px solid #1976d2"
//                       : "1px solid #ccc",
//                   }}
//                 >
//                   <CardContent>

//                     <Box display="flex" alignItems="center" gap={2}>
//                       <Avatar>{u.name?.[0]}</Avatar>

//                       <Box>
//                         <Typography>{u.name}</Typography>
//                         <Typography variant="body2" color="text.secondary">
//                           {u.email}
//                         </Typography>
//                       </Box>
//                     </Box>

//                   </CardContent>
//                 </Card>
//               </Grid>
//             ))}
//           </Grid>

//           {/* SELECTED USERS */}

//           <Box sx={{ mt: 2 }}>
//             {selectedUsers.map((id) => {
//               const u = users.find((x) => x.id === id);
//               return (
//                 <Chip
//                   key={id}
//                   label={u?.name}
//                   onDelete={() => toggleUser(id)}
//                   sx={{ mr: 1, mb: 1 }}
//                 />
//               );
//             })}
//           </Box>

//           {/* BUTTON */}

//           <Box sx={{ mt: 3 }}>

//             {!editMode ? (
//               <Button variant="contained" onClick={createTeam}>
//                 Create Team
//               </Button>
//             ) : (
//               <Button variant="contained" onClick={updateTeam}>
//                 Update Team
//               </Button>
//             )}

//           </Box>

//         </CardContent>
//       </Card>

//       {/* USER TEAMS */}

//       <Typography variant="h5" gutterBottom>
//         Your Teams
//       </Typography>

//       <Grid container spacing={2}>

//         {teams.map((team) => (
//           <Grid item xs={12} md={4} key={team._id}>
//             <Card>
//               <CardContent>

//                 <Typography variant="h6">{team.name}</Typography>

//                 <Typography variant="body2" sx={{ mb: 1 }}>
//                   Members: {team.memberIds?.length || 0}
//                 </Typography>

//                 <Button size="small" onClick={() => editTeam(team)}>
//                   Edit
//                 </Button>

//               </CardContent>
//             </Card>
//           </Grid>
//         ))}

//       </Grid>

//       {/* NOTIFICATION */}

//       <Snackbar
//         open={notification.open}
//         autoHideDuration={3000}
//         onClose={() =>
//           setNotification({ ...notification, open: false })
//         }
//       >
//         <Alert severity={notification.type}>
//           {notification.message}
//         </Alert>
//       </Snackbar>

//     </Container>
//   );
// };

// export default TeamSelection;


































// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";
// import { useAuth } from "../Context/AuthContext";
// import "./TeamSelection.css";

// const TeamSelection = () => {
//   const { user } = useAuth();

//   const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

//   const [teamName, setTeamName] = useState("");
//   const [users, setUsers] = useState([]);
//   const [selectedUsers, setSelectedUsers] = useState([]);
//   const [userTeams, setUserTeams] = useState([]);
//   const [projects, setProjects] = useState([]);
//   const [selectedProjectId, setSelectedProjectId] = useState("");
//   const [search, setSearch] = useState("");

//   const [isLoading, setIsLoading] = useState(false);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [editingTeamId, setEditingTeamId] = useState(null);

//   const [notification, setNotification] = useState({
//     show: false,
//     message: "",
//     type: "success",
//   });

//   const api = useMemo(() => {
//     const instance = axios.create({
//       baseURL: API_URL,
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });

//     instance.interceptors.request.use((config) => {
//       const token = localStorage.getItem("token");
//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//       return config;
//     });

//     return instance;
//   }, [API_URL]);

//   useEffect(() => {
//     if (user) fetchInitialData();
//   }, [user]);

//   const fetchInitialData = async () => {
//     setIsLoading(true);

//     try {
//       const [usersRes, teamsRes, projectsRes] = await Promise.all([
//         api.get("/api/auth/users"),
//         api.get("/api/teams"),
//         api.get("/api/projects"),
//       ]);

//       setUsers(usersRes.data?.users || []);
//       setProjects(projectsRes.data || []);

//       const currentUserId = user?.id || user?._id;

//       const filteredTeams = (teamsRes.data || []).filter((team) =>
//         team.memberIds?.includes(currentUserId)
//       );

//       setUserTeams(teamsRes.data);
//     } catch (error) {
//       console.error(error);
//       showNotification("Server connection failed", "error");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const showNotification = (message, type = "success") => {
//     setNotification({ show: true, message, type });

//     setTimeout(() => {
//       setNotification({ show: false, message: "", type: "success" });
//     }, 4000);
//   };

//   const resetForm = () => {
//     setTeamName("");
//     setSelectedUsers([]);
//     setSelectedProjectId("");
//     setSearch("");
//     setIsEditMode(false);
//     setEditingTeamId(null);
//   };

//   const handleUserToggle = (userId) => {
//     if (isLoading) return;

//     setSelectedUsers((prev) =>
//       prev.includes(userId)
//         ? prev.filter((id) => id !== userId)
//         : [...prev, userId]
//     );
//   };

//   const handleCreateTeam = async () => {
//     if (!teamName.trim() || !selectedProjectId || selectedUsers.length === 0) {
//       showNotification("Please provide team name, project and members", "error");
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const currentUserId = user?.id || user?._id;

//       const memberIds = [...new Set([...selectedUsers, currentUserId])];

//       await api.post("/api/teams", {
//         name: teamName,
//         projectId: selectedProjectId,
//         memberIds,
//         createdBy: currentUserId,
//       });

//       showNotification("Team created successfully");

//       resetForm();
//       fetchInitialData();
//     } catch (error) {
//       showNotification(
//         error?.response?.data?.detail || "Team creation failed",
//         "error"
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleEditTeam = (team) => {
//     const currentUserId = user?.id || user?._id;

//     setTeamName(team.name);
//     setSelectedProjectId(team.projectId);
//     setSelectedUsers(team.memberIds.filter((id) => id !== currentUserId));

//     setEditingTeamId(team._id || team.id);
//     setIsEditMode(true);

//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   const handleUpdateTeam = async () => {
//     if (!editingTeamId) return;

//     setIsLoading(true);

//     try {
//       const currentUserId = user?.id || user?._id;

//       const memberIds = [...new Set([...selectedUsers, currentUserId])];

//       await api.put(`/api/teams/${editingTeamId}`, {
//         name: teamName,
//         projectId: selectedProjectId,
//         memberIds,
//       });

//       showNotification("Team updated successfully");

//       resetForm();
//       fetchInitialData();
//     } catch (error) {
//       showNotification(
//         error?.response?.data?.detail || "Update failed",
//         "error"
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const filteredUsersList = useMemo(() => {
//     const searchText = search.toLowerCase();

//     return users.filter(
//       (u) =>
//         (u.name?.toLowerCase().includes(searchText) ||
//           u.email?.toLowerCase().includes(searchText)) &&
//         u.id !== (user?.id || user?._id)
//     );
//   }, [users, search, user]);

//   return (
//     <div className="team-selection-container">
//       {notification.show && (
//         <div className={`notification ${notification.type}`}>
//           {notification.message}
//         </div>
//       )}

//       <div >
//         {userTeams && userTeams.length > 0 && userTeams.map((data, i) => (
//           <div
//             key={i}
//             className="star"
            
//           >{data.name}</div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default TeamSelection;





















// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";
// import { Users, Plus, Search, Star, Rocket, Target } from "lucide-react";
// import { useAuth } from "../Context/AuthContext";
// import "./TeamSelection.css";

// const TeamSelection = () => {
//   const { user } = useAuth();

//   const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

//   const [teamName, setTeamName] = useState("");
//   const [users, setUsers] = useState([]);
//   const [selectedUsers, setSelectedUsers] = useState([]);
//   const [userTeams, setUserTeams] = useState([]);
//   const [search, setSearch] = useState("");
//   const [projects, setProjects] = useState([]);
//   const [selectedProjectId, setSelectedProjectId] = useState("");

//   const [isLoading, setIsLoading] = useState(false);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [editingTeamId, setEditingTeamId] = useState(null);

//   const [notification, setNotification] = useState({
//     show: false,
//     message: "",
//     type: "success",
//   });

//   const api = useMemo(
//     () =>
//       axios.create({
//         baseURL: API_URL,
//         withCredentials: true,
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${localStorage.getItem("token")}`
//         },
//       }),
//     [API_URL]
//   );

//   useEffect(() => {
//     if (user) {
//       fetchInitialData();
//     }
//   }, [user]);

//   const fetchInitialData = async () => {
//     setIsLoading(true);
//     try {
//       const [usersRes, teamsRes, projectsRes] = await Promise.all([
//         api.get("/api/auth/users"),
//         api.get("/api/teams"),
//         api.get("/api/projects"),
//       ]);

//       setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
//       setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);

//       const currentUserId = user?._id || user?.id;

//       const filteredTeams = (Array.isArray(teamsRes.data) ? teamsRes.data : []).filter(
//         (team) => team.memberIds?.includes(currentUserId)
//       );

//       setUserTeams(filteredTeams);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       showNotification("Server connection failed", "error");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const showNotification = (message, type = "success") => {
//     const safeMsg = typeof message === "string" ? message : JSON.stringify(message);

//     setNotification({
//       show: true,
//       message: safeMsg,
//       type,
//     });

//     setTimeout(() => {
//       setNotification({
//         show: false,
//         message: "",
//         type: "success",
//       });
//     }, 4000);
//   };

//   const resetForm = () => {
//     setTeamName("");
//     setSelectedUsers([]);
//     setSelectedProjectId("");
//     setSearch("");
//     setIsEditMode(false);
//     setEditingTeamId(null);
//   };

//   const handleUserToggle = (userId) => {
//     if (isLoading) return;

//     setSelectedUsers((prev) =>
//       prev.includes(userId)
//         ? prev.filter((id) => id !== userId)
//         : [...prev, userId]
//     );
//   };

//   const handleCreateTeam = async () => {
//     if (!teamName.trim() || !selectedProjectId || selectedUsers.length === 0) {
//       showNotification(
//         "Please provide team name, project and members",
//         "error"
//       );
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const currentUserId = user?._id || user?.id;

//       const memberIds = Array.from(
//         new Set([...selectedUsers, currentUserId])
//       );

//       const payload = {
//         name: teamName,
//         projectId: selectedProjectId,
//         memberIds,
//         createdBy: currentUserId,
//       };

//       const res = await api.post("/api/teams", payload);

//       if (res.status === 200 || res.status === 201) {
//         showNotification("Team created successfully");
//         resetForm();
//         fetchInitialData();
//       }
//     } catch (error) {
//       showNotification(
//         error?.response?.data?.detail || "Team creation failed",
//         "error"
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleEditTeam = (team) => {
//     const currentUserId = user?._id || user?.id;

//     setTeamName(team.name);
//     setSelectedProjectId(team.projectId);

//     setSelectedUsers(
//       team.memberIds.filter((id) => id !== currentUserId)
//     );

//     setEditingTeamId(team._id || team.id);
//     setIsEditMode(true);

//     window.scrollTo({
//       top: 0,
//       behavior: "smooth",
//     });
//   };

//   const handleUpdateTeam = async () => {
//     if (!editingTeamId) return;

//     setIsLoading(true);

//     try {
//       const currentUserId = user?._id || user?.id;

//       const memberIds = Array.from(
//         new Set([...selectedUsers, currentUserId])
//       );

//       await api.put(`/api/teams/${editingTeamId}`, {
//         name: teamName,
//         projectId: selectedProjectId,
//         memberIds,
//       });

//       showNotification("Team updated successfully");

//       resetForm();
//       fetchInitialData();
//     } catch (error) {
//       showNotification(
//         error?.response?.data?.detail || "Update failed",
//         "error"
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const filteredUsersList = users.filter((u) => {
//     const searchText = search.toLowerCase();

//     return (
//       (u.name?.toLowerCase().includes(searchText) ||
//         u.email?.toLowerCase().includes(searchText)) &&
//       u._id !== (user?._id || user?.id)
//     );
//   });

//   return (
//     <div className="team-selection-container">

//       {notification.show && (
//         <div className={`notification ${notification.type}`}>
//           {notification.message}
//         </div>
//       )}

//       <div className="stars-background">
//         {[...Array(40)].map((_, i) => (
//           <div
//             key={i}
//             className="star"
//             style={{
//               left: `${Math.random() * 100}%`,
//               top: `${Math.random() * 100}%`,
//               animationDelay: `${Math.random() * 2}s`,
//             }}
//           ></div>
//         ))}
//       </div>

//     </div>
//   );
// };

// export default TeamSelection;





























// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";
// import { Users, Plus, Search, Star, Rocket, Target } from "lucide-react";
// import { useAuth } from "../Context/AuthContext";
// import "./TeamSelection.css";

// const TeamSelection = () => {
//   const { user } = useAuth();

//   const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

//   const [teamName, setTeamName] = useState("");
//   const [users, setUsers] = useState([]);
//   const [selectedUsers, setSelectedUsers] = useState([]);
//   const [userTeams, setUserTeams] = useState([]);
//   const [search, setSearch] = useState("");
//   const [projects, setProjects] = useState([]);
//   const [selectedProjectId, setSelectedProjectId] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [editingTeamId, setEditingTeamId] = useState(null);
//   const [notification, setNotification] = useState({
//     show: false,
//     message: "",
//     type: "success",
//   });

//   const api = useMemo(
//     () =>
//       axios.create({
//         baseURL: API_URL,
//         withCredentials: true,
//       }),
//     [API_URL]
//   );

//   useEffect(() => {
//     if (user) {
//       fetchInitialData();
//     }
//   }, [user]);

//   const fetchInitialData = async () => {
//     setIsLoading(true);
//     try {
//       const [usersRes, teamsRes, projectsRes] = await Promise.all([
//         api.get("/api/users"),
//         api.get("/api/teams"),
//         api.get("/api/projects"),
//       ]);

//       setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
//       setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);

//       const currentUserId = user?._id || user?.id;
//       const filteredTeams = (Array.isArray(teamsRes.data) ? teamsRes.data : []).filter(
//         (team) => team.memberIds?.includes(currentUserId)
//       );

//       setUserTeams(filteredTeams);
//     } catch (error) {
//       console.error("Error fetching initial data:", error);
//       showNotification("Could not sync with server. Check if backend is running.", "error");
//     } finally {
//       setIsLoading(false);
//     }
//   };
   

//   const handleUserToggle = (userId) => {
//     if (isLoading) return;
//     setSelectedUsers((prev) =>
//       prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
//     );
//   };

//   const showNotification = (message, type = "success") => {
//     const safeMsg = typeof message === "string" ? message : JSON.stringify(message);
//     setNotification({ show: true, message: safeMsg, type });
//     setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 4000);
//   };

//   const resetForm = () => {
//     setTeamName("");
//     setSelectedUsers([]);
//     setSearch("");
//     setSelectedProjectId("");
//     setIsEditMode(false);
//     setEditingTeamId(null);
//   };

//   const handleCreateTeam = async () => {
//     if (!teamName.trim() || !selectedProjectId || selectedUsers.length === 0) {
//       showNotification("Please provide a team name, project, and at least one member.", "error");
//       return;
//     }

//     setIsLoading(true);
//     const currentUserId = user?._id || user?.id;

//     const memberIds = Array.from(new Set([...selectedUsers, currentUserId]));

//     const teamPayload = {
//       name: teamName,
//       projectId: selectedProjectId,
//       memberIds,
//       createdBy: currentUserId,
//     };

//     try {
//       const response = await api.post("/api/teams", teamPayload);
//       if (response.status === 200 || response.status === 201) {
//         showNotification("Team created successfully! Project access updated.", "success");
//         resetForm();
//         fetchInitialData();
//       }
//     } catch (error) {
//       showNotification(error.response?.data?.detail || "Failed to create team", "error");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleEditTeam = (team) => {
//     setTeamName(team.name);
//     setSelectedProjectId(team.projectId);
//     const currentUserId = user?._id || user?.id;
//     setSelectedUsers(team.memberIds.filter((id) => id !== currentUserId));
//     setIsEditMode(true);
//     setEditingTeamId(team._id || team.id);
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   const handleUpdateTeam = async () => {
//     if (!editingTeamId) return;
//     setIsLoading(true);
//     const currentUserId = user?._id || user?.id;
//     const memberIds = Array.from(new Set([...selectedUsers, currentUserId]));

//     try {
//       await api.put(`/api/teams/${editingTeamId}`, {
//         name: teamName,
//         projectId: selectedProjectId,
//         memberIds,
//       });

//       showNotification("Team configuration updated!", "success");
//       resetForm();
//       fetchInitialData();
//     } catch (error) {
//       showNotification(error.response?.data?.detail || "Update failed", "error");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const filteredUsersList = users.filter(
//     (u) =>
//       (u.name?.toLowerCase().includes(search.toLowerCase()) ||
//         u.email?.toLowerCase().includes(search.toLowerCase())) &&
//       u._id !== (user?._id || user?.id)
//   );

//   return (
//     <div className="team-selection-container">
//       {notification.show && <div className={`notification ${notification.type}`}>{notification.message}</div>}

//       <div className="stars-background">
//         {[...Array(40)].map((_, i) => (
//           <div
//             key={i}
//             className="star"
//             style={{
//               left: `${Math.random() * 100}%`,
//               top: `${Math.random() * 100}%`,
//               animationDelay: `${Math.random() * 2}s`,
//             }}
//           ></div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default TeamSelection;
