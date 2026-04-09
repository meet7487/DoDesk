// File: dodesk/src/Component/Navbar.jsx
import React, { useState, useEffect } from "react";
import {
  AppBar, Toolbar, Typography, Button,
  Alert, Collapse, IconButton, Box, Avatar, Popover,
} from "@mui/material";
import {
  Close     as CloseIcon,
  Rocket    as RocketIcon,
  Person    as PersonIcon,
  Home      as HomeIcon,
  Assignment as TaskIcon,
  Work      as ProjectIcon,
  Info      as AboutIcon,
  Login     as LoginIcon,
  Logout    as LogoutIcon,
  Group     as GroupIcon,
  LightMode as LightModeIcon,
  DarkMode  as DarkModeIcon,
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarIcon,
  Search    as SearchIcon,
} from "@mui/icons-material";
import NotificationPanel from "./NotificationPanel";  // Feature 1
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth }  from "../Context/AuthContext";
import { useTheme } from "../Context/ThemeContext";
import "./Navbar.css";

const Navbar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout }    = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [alertOpen,     setAlertOpen]     = useState(false);
  const [alertMessage,  setAlertMessage]  = useState("");
  const [alertSeverity, setAlertSeverity] = useState("success");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeSpinning,  setThemeSpinning]  = useState(false);
  const [profileAnchor,  setProfileAnchor]  = useState(null);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  // Starfield logic preserved
  useEffect(() => {
    const createNavbarStarfield = () => {
      const el = document.querySelector(".navbar-starfield");
      if (!el) return;
      el.innerHTML = "";
      for (let i = 0; i < 50; i++) {
        const star = document.createElement("div");
        const size = Math.random();
        star.className = size < 0.4 ? "navbar-star navbar-star-small"
          : size < 0.7             ? "navbar-star navbar-star-medium"
          :                          "navbar-star navbar-star-large";
        star.style.left              = Math.random() * 100 + "%";
        star.style.top               = Math.random() * 100 + "%";
        star.style.animationDelay    = Math.random() * 3 + "s";
        star.style.animationDuration = (Math.random() * 2 + 1.5) + "s";
        el.appendChild(star);
      }
    };
    createNavbarStarfield();
  }, []);

  const showAlert = (message, severity = "success") => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
    setTimeout(() => setAlertOpen(false), 3000);
  };

  const handleAuthClick = () => {
    if (user) {
      logout()
        .then(() => {
          showAlert("Logged out successfully!", "success");
          setTimeout(() => navigate("/login"), 1500);
        })
        .catch((err) => {
          console.error("Logout error:", err);
          showAlert("Logout failed. Try again.", "error");
        });
    } else {
      navigate("/login");
    }
  };

  const handleThemeToggle = () => {
    setThemeSpinning(true);
    toggleTheme();
    setTimeout(() => setThemeSpinning(false), 500);
  };

  const isLoginOrSignupPage =
    location.pathname === "/login" || location.pathname === "/signup";

  const getInitials = (name) => {
    if (!name) return "US";
    const parts = name.split(" ");
    return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
  };

  const isActivePage = (path) => location.pathname === path;

  const navigationItems = [
    { path: "/",          label: "Home",      icon: HomeIcon,      show: !isLoginOrSignupPage },
    { path: "/tasks",     label: "Tasks",     icon: TaskIcon,      show: !!user },
    { path: "/projects",  label: "Projects",  icon: ProjectIcon,   show: !!user },
    { path: "/teams",     label: "Teams",     icon: GroupIcon,     show: !!user },
    { path: "/dashboard", label: "Dashboard", icon: DashboardIcon, show: !!user },
    { path: "/calendar",  label: "Calendar",  icon: CalendarIcon,  show: !!user },
    { path: "/search",    label: "Search",    icon: SearchIcon,    show: !!user },
    { path: "/about",     label: "About",     icon: AboutIcon,     show: !isLoginOrSignupPage },
  ];

  return (
    <div className="nav">
      <div className="navbar-starfield" />

      {/* Alert Banner */}
      <Collapse in={alertOpen}>
        <Alert
          severity={alertSeverity}
          className="cosmic-alert"
          action={
            <IconButton aria-label="close" color="inherit" size="small"
              onClick={() => setAlertOpen(false)} className="alert-close-btn">
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <div className="alert-content">
            <span className="alert-text">{alertMessage}</span>
          </div>
        </Alert>
      </Collapse>

      <AppBar position="sticky" elevation={0} className="cosmic-navbar">
        <div className="navbar-background-overlay" />

        <Toolbar className="cosmic-toolbar">

          {/* Logo */}
          <div className="navbar-logo-section" onClick={() => navigate("/")}
            role="button" tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate("/")}
            aria-label="DoDesk Home">
            <div className="logo-container">
              <RocketIcon className="logo-icon" />
              <Typography variant="h5" className="logo-text" component="span">
                <span className="logo-do">Do</span>
                <span className="logo-desk">Desk</span>
              </Typography>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <Box className="navbar-links-desktop">
            {navigationItems.map(({ path, label, icon: Icon, show }) =>
              show && (
                <Button key={path} color="inherit" onClick={() => navigate(path)}
                  className={`nav-link ${isActivePage(path) ? "active" : ""}`}
                  startIcon={<Icon className="nav-icon" />} disableRipple={false}>
                  <span className="nav-text">{label}</span>
                </Button>
              )
            )}
          </Box>

          {/* Right Section */}
          <Box className="navbar-user-section">
            {/* ── Theme Toggle ── */}
            <button
              className={`theme-toggle-btn ${themeSpinning ? "spinning" : ""}`}
              onClick={handleThemeToggle}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              data-tooltip={isDark ? "Light mode" : "Dark mode"}
            >
              <span className="theme-toggle-icon">
                {isDark
                  ? <LightModeIcon style={{ fontSize: 18, color: "inherit" }} />
                  : <DarkModeIcon  style={{ fontSize: 18, color: "inherit" }} />
                }
              </span>
            </button>

            {/* User pill */}
            {user && (
              <>
                {user && <NotificationPanel />}

              <div
                  className="user-profile"
                  onClick={(e) => setProfileAnchor(e.currentTarget)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setProfileAnchor(e.currentTarget)}
                  aria-label="View profile"
                  style={{ cursor: "pointer" }}
                >
                  <Avatar className="user-avatar">
                    <PersonIcon style={{ fontSize: "1rem" }} />
                  </Avatar>
                  <Typography className="user-initials" component="span">
                    {getInitials(user.name || user.email)}
                  </Typography>
                </div>

                {/* Profile Popover */}
                <Popover
                  open={Boolean(profileAnchor)}
                  anchorEl={profileAnchor}
                  onClose={() => setProfileAnchor(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                  transformOrigin={{ vertical: "top", horizontal: "center" }}
                  PaperProps={{ className: "profile-popover" }}
                  disableRestoreFocus
                >
                  <div className="profile-popover-content">
                    {/* Avatar */}
                    <div className="profile-popover-avatar">
                      {getInitials(user.name || user.email)}
                    </div>
                    {/* Name */}
                    <Typography className="profile-popover-name">
                      {user.name || "—"}
                    </Typography>
                    {/* Email */}
                    <Typography className="profile-popover-email">
                      {user.email || "—"}
                    </Typography>
                  </div>
                </Popover>
              </>
            )}

            {/* Auth button */}
            {!isLoginOrSignupPage && (
              <Button variant="contained" onClick={handleAuthClick}
                className="cosmic-auth-btn"
                startIcon={user ? <LogoutIcon /> : <LoginIcon />}
                disableElevation>
                <span className="auth-btn-text">{user ? "Logout" : "Login"}</span>
              </Button>
            )}
          </Box>

          {/* Hamburger */}
          <IconButton className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}>
            <div className={`hamburger ${mobileMenuOpen ? "active" : ""}`}>
              <span /><span /><span />
            </div>
          </IconButton>
        </Toolbar>

        {/* Mobile Dropdown */}
        <Collapse in={mobileMenuOpen} className="mobile-nav-collapse">
          <Box className="mobile-nav-menu">
            {navigationItems.map(({ path, label, icon: Icon, show }) =>
              show && (
                <Button key={path} color="inherit"
                  onClick={() => { navigate(path); setMobileMenuOpen(false); }}
                  className={`mobile-nav-link ${isActivePage(path) ? "active" : ""}`}
                  startIcon={<Icon className="mobile-nav-icon" />} fullWidth>
                  <span className="mobile-nav-text">{label}</span>
                </Button>
              )
            )}

            {/* Mobile theme toggle row */}
            <div className="mobile-theme-row">
              <span className="mobile-theme-label">
                {isDark ? "Dark mode" : "Light mode"}
              </span>
              <button
                className={`theme-toggle-btn ${themeSpinning ? "spinning" : ""}`}
                onClick={handleThemeToggle}
                aria-label="Toggle theme"
              >
                <span className="theme-toggle-icon">
                  {isDark
                    ? <LightModeIcon style={{ fontSize: 18, color: "inherit" }} />
                    : <DarkModeIcon  style={{ fontSize: 18, color: "inherit" }} />
                  }
                </span>
              </button>
            </div>

            {!isLoginOrSignupPage && (
              <Button variant="contained" disableElevation fullWidth
                onClick={() => { handleAuthClick(); setMobileMenuOpen(false); }}
                className="mobile-auth-btn"
                startIcon={user ? <LogoutIcon /> : <LoginIcon />}>
                <span className="mobile-auth-text">{user ? "Logout" : "Login"}</span>
              </Button>
            )}
          </Box>
        </Collapse>
      </AppBar>
    </div>
  );
};

export default Navbar;





























// // File: dodesk/src/Component/Navbar.jsx
// import React, { useState, useEffect } from "react";
// import {
//   AppBar, Toolbar, Typography, Button,
//   Alert, Collapse, IconButton, Box, Avatar, Popover,
// } from "@mui/material";
// import {
//   Close     as CloseIcon,
//   Rocket    as RocketIcon,
//   Person    as PersonIcon,
//   Home      as HomeIcon,
//   Assignment as TaskIcon,
//   Work      as ProjectIcon,
//   Info      as AboutIcon,
//   Login     as LoginIcon,
//   Logout    as LogoutIcon,
//   Group     as GroupIcon,
//   LightMode as LightModeIcon,
//   DarkMode  as DarkModeIcon,
// } from "@mui/icons-material";
// import { useNavigate, useLocation } from "react-router-dom";
// import { useAuth }  from "../Context/AuthContext";
// import { useTheme } from "../Context/ThemeContext";
// import "./Navbar.css";

// const Navbar = () => {
//   const navigate  = useNavigate();
//   const location  = useLocation();
//   const { user, logout }    = useAuth();
//   const { isDark, toggleTheme } = useTheme();

//   const [alertOpen,     setAlertOpen]     = useState(false);
//   const [alertMessage,  setAlertMessage]  = useState("");
//   const [alertSeverity, setAlertSeverity] = useState("success");
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [themeSpinning,  setThemeSpinning]  = useState(false);
//   const [profileAnchor,  setProfileAnchor]  = useState(null);

//   // Close mobile menu on route change
//   useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

//   // Starfield logic preserved
//   useEffect(() => {
//     const createNavbarStarfield = () => {
//       const el = document.querySelector(".navbar-starfield");
//       if (!el) return;
//       el.innerHTML = "";
//       for (let i = 0; i < 50; i++) {
//         const star = document.createElement("div");
//         const size = Math.random();
//         star.className = size < 0.4 ? "navbar-star navbar-star-small"
//           : size < 0.7             ? "navbar-star navbar-star-medium"
//           :                          "navbar-star navbar-star-large";
//         star.style.left              = Math.random() * 100 + "%";
//         star.style.top               = Math.random() * 100 + "%";
//         star.style.animationDelay    = Math.random() * 3 + "s";
//         star.style.animationDuration = (Math.random() * 2 + 1.5) + "s";
//         el.appendChild(star);
//       }
//     };
//     createNavbarStarfield();
//   }, []);

//   const showAlert = (message, severity = "success") => {
//     setAlertMessage(message);
//     setAlertSeverity(severity);
//     setAlertOpen(true);
//     setTimeout(() => setAlertOpen(false), 3000);
//   };

//   const handleAuthClick = () => {
//     if (user) {
//       logout()
//         .then(() => {
//           showAlert("Logged out successfully!", "success");
//           setTimeout(() => navigate("/login"), 1500);
//         })
//         .catch((err) => {
//           console.error("Logout error:", err);
//           showAlert("Logout failed. Try again.", "error");
//         });
//     } else {
//       navigate("/login");
//     }
//   };

//   const handleThemeToggle = () => {
//     setThemeSpinning(true);
//     toggleTheme();
//     setTimeout(() => setThemeSpinning(false), 500);
//   };

//   const isLoginOrSignupPage =
//     location.pathname === "/login" || location.pathname === "/signup";

//   const getInitials = (name) => {
//     if (!name) return "US";
//     const parts = name.split(" ");
//     return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
//   };

//   const isActivePage = (path) => location.pathname === path;

//   const navigationItems = [
//     { path: "/",               label: "Home",     icon: HomeIcon,    show: !isLoginOrSignupPage },
//     { path: "/add-task",       label: "Tasks",    icon: TaskIcon,    show: !!user },
//     { path: "/project",        label: "Projects", icon: ProjectIcon, show: !!user },
//     { path: "/team-selection", label: "Teams",    icon: GroupIcon,   show: !!user },
//     { path: "/about",          label: "About",    icon: AboutIcon,   show: !isLoginOrSignupPage },
//   ];

//   return (
//     <div className="nav">
//       <div className="navbar-starfield" />

//       {/* Alert Banner */}
//       <Collapse in={alertOpen}>
//         <Alert
//           severity={alertSeverity}
//           className="cosmic-alert"
//           action={
//             <IconButton aria-label="close" color="inherit" size="small"
//               onClick={() => setAlertOpen(false)} className="alert-close-btn">
//               <CloseIcon fontSize="inherit" />
//             </IconButton>
//           }
//         >
//           <div className="alert-content">
//             <span className="alert-text">{alertMessage}</span>
//           </div>
//         </Alert>
//       </Collapse>

//       <AppBar position="sticky" elevation={0} className="cosmic-navbar">
//         <div className="navbar-background-overlay" />

//         <Toolbar className="cosmic-toolbar">

//           {/* Logo */}
//           <div className="navbar-logo-section" onClick={() => navigate("/")}
//             role="button" tabIndex={0}
//             onKeyDown={(e) => e.key === "Enter" && navigate("/")}
//             aria-label="DoDesk Home">
//             <div className="logo-container">
//               <RocketIcon className="logo-icon" />
//               <Typography variant="h5" className="logo-text" component="span">
//                 <span className="logo-do">Do</span>
//                 <span className="logo-desk">Desk</span>
//               </Typography>
//             </div>
//           </div>

//           {/* Desktop Nav Links */}
//           <Box className="navbar-links-desktop">
//             {navigationItems.map(({ path, label, icon: Icon, show }) =>
//               show && (
//                 <Button key={path} color="inherit" onClick={() => navigate(path)}
//                   className={`nav-link ${isActivePage(path) ? "active" : ""}`}
//                   startIcon={<Icon className="nav-icon" />} disableRipple={false}>
//                   <span className="nav-text">{label}</span>
//                 </Button>
//               )
//             )}
//           </Box>

//           {/* Right Section */}
//           <Box className="navbar-user-section">
//             {/* ── Theme Toggle ── */}
//             <button
//               className={`theme-toggle-btn ${themeSpinning ? "spinning" : ""}`}
//               onClick={handleThemeToggle}
//               aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
//               data-tooltip={isDark ? "Light mode" : "Dark mode"}
//             >
//               <span className="theme-toggle-icon">
//                 {isDark
//                   ? <LightModeIcon style={{ fontSize: 18, color: "inherit" }} />
//                   : <DarkModeIcon  style={{ fontSize: 18, color: "inherit" }} />
//                 }
//               </span>
//             </button>

//             {/* User pill */}
//             {user && (
//               <>
//                 <div
//                   className="user-profile"
//                   onClick={(e) => setProfileAnchor(e.currentTarget)}
//                   role="button"
//                   tabIndex={0}
//                   onKeyDown={(e) => e.key === "Enter" && setProfileAnchor(e.currentTarget)}
//                   aria-label="View profile"
//                   style={{ cursor: "pointer" }}
//                 >
//                   <Avatar className="user-avatar">
//                     <PersonIcon style={{ fontSize: "1rem" }} />
//                   </Avatar>
//                   <Typography className="user-initials" component="span">
//                     {getInitials(user.name || user.email)}
//                   </Typography>
//                 </div>

//                 {/* Profile Popover */}
//                 <Popover
//                   open={Boolean(profileAnchor)}
//                   anchorEl={profileAnchor}
//                   onClose={() => setProfileAnchor(null)}
//                   anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
//                   transformOrigin={{ vertical: "top", horizontal: "center" }}
//                   PaperProps={{ className: "profile-popover" }}
//                   disableRestoreFocus
//                 >
//                   <div className="profile-popover-content">
//                     {/* Avatar */}
//                     <div className="profile-popover-avatar">
//                       {getInitials(user.name || user.email)}
//                     </div>
//                     {/* Name */}
//                     <Typography className="profile-popover-name">
//                       {user.name || "—"}
//                     </Typography>
//                     {/* Email */}
//                     <Typography className="profile-popover-email">
//                       {user.email || "—"}
//                     </Typography>
//                   </div>
//                 </Popover>
//               </>
//             )}

//             {/* Auth button */}
//             {!isLoginOrSignupPage && (
//               <Button variant="contained" onClick={handleAuthClick}
//                 className="cosmic-auth-btn"
//                 startIcon={user ? <LogoutIcon /> : <LoginIcon />}
//                 disableElevation>
//                 <span className="auth-btn-text">{user ? "Logout" : "Login"}</span>
//               </Button>
//             )}
//           </Box>

//           {/* Hamburger */}
//           <IconButton className="mobile-menu-toggle"
//             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//             aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
//             aria-expanded={mobileMenuOpen}>
//             <div className={`hamburger ${mobileMenuOpen ? "active" : ""}`}>
//               <span /><span /><span />
//             </div>
//           </IconButton>
//         </Toolbar>

//         {/* Mobile Dropdown */}
//         <Collapse in={mobileMenuOpen} className="mobile-nav-collapse">
//           <Box className="mobile-nav-menu">
//             {navigationItems.map(({ path, label, icon: Icon, show }) =>
//               show && (
//                 <Button key={path} color="inherit"
//                   onClick={() => { navigate(path); setMobileMenuOpen(false); }}
//                   className={`mobile-nav-link ${isActivePage(path) ? "active" : ""}`}
//                   startIcon={<Icon className="mobile-nav-icon" />} fullWidth>
//                   <span className="mobile-nav-text">{label}</span>
//                 </Button>
//               )
//             )}

//             {/* Mobile theme toggle row */}
//             <div className="mobile-theme-row">
//               <span className="mobile-theme-label">
//                 {isDark ? "Dark mode" : "Light mode"}
//               </span>
//               <button
//                 className={`theme-toggle-btn ${themeSpinning ? "spinning" : ""}`}
//                 onClick={handleThemeToggle}
//                 aria-label="Toggle theme"
//               >
//                 <span className="theme-toggle-icon">
//                   {isDark
//                     ? <LightModeIcon style={{ fontSize: 18, color: "inherit" }} />
//                     : <DarkModeIcon  style={{ fontSize: 18, color: "inherit" }} />
//                   }
//                 </span>
//               </button>
//             </div>

//             {!isLoginOrSignupPage && (
//               <Button variant="contained" disableElevation fullWidth
//                 onClick={() => { handleAuthClick(); setMobileMenuOpen(false); }}
//                 className="mobile-auth-btn"
//                 startIcon={user ? <LogoutIcon /> : <LoginIcon />}>
//                 <span className="mobile-auth-text">{user ? "Logout" : "Login"}</span>
//               </Button>
//             )}
//           </Box>
//         </Collapse>
//       </AppBar>
//     </div>
//   );
// };

// export default Navbar;



















































// // File: dodesk/src/Component/Navbar.js
// import React, { useState, useEffect } from "react";
// import {
//   AppBar,
//   Toolbar,
//   Typography,
//   Button,
//   Alert,
//   Collapse,
//   IconButton,
//   Box,
//   Avatar,
// } from "@mui/material";
// import {
//   Close as CloseIcon,
//   Rocket as RocketIcon,
//   Person as PersonIcon,
//   Home as HomeIcon,
//   Assignment as TaskIcon,
//   Work as ProjectIcon,
//   Info as AboutIcon,
//   Login as LoginIcon,
//   Logout as LogoutIcon,
//   Group as GroupIcon,
// } from "@mui/icons-material";
// import { useNavigate, useLocation } from "react-router-dom";
// import { useAuth } from "../Context/AuthContext";
// import "./Navbar.css";

// const Navbar = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { user, logout } = useAuth(); // Updated: added logout from context

//   const [alertOpen, setAlertOpen] = useState(false);
//   const [alertMessage, setAlertMessage] = useState("");
//   const [alertSeverity, setAlertSeverity] = useState("success");
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

//   useEffect(() => {
//     const createNavbarStarfield = () => {
//       const starfieldContainer = document.querySelector('.navbar-starfield');
//       if (!starfieldContainer) return;

//       starfieldContainer.innerHTML = '';

//       for (let i = 0; i < 50; i++) {
//         const star = document.createElement('div');
//         const size = Math.random();

//         if (size < 0.4) {
//           star.className = 'navbar-star navbar-star-small';
//         } else if (size < 0.7) {
//           star.className = 'navbar-star navbar-star-medium';
//         } else {
//           star.className = 'navbar-star navbar-star-large';
//         }

//         star.style.left = Math.random() * 100 + '%';
//         star.style.top = Math.random() * 100 + '%';
//         star.style.animationDelay = Math.random() * 3 + 's';
//         star.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
//         starfieldContainer.appendChild(star);
//       }
//     };

//     createNavbarStarfield();
//   }, []);

//   const showAlert = (message, severity = "success") => {
//     setAlertMessage(message);
//     setAlertSeverity(severity);
//     setAlertOpen(true);
//     setTimeout(() => setAlertOpen(false), 3000);
//   };

//   const handleAuthClick = () => {
//     if (user) {
//       // Use logout from AuthContext instead of Firebase
//       logout()
//         .then(() => {
//           showAlert("Logged out successfully!", "success");
//           setTimeout(() => navigate("/login"), 1500);
//         })
//         .catch((error) => {
//           console.error("Logout error:", error);
//           showAlert("Logout failed. Try again.", "error");
//         });
//     } else {
//       navigate("/login");
//     }
//   };

//   const isLoginOrSignupPage = location.pathname === "/login" || location.pathname === "/signup";

//   const getInitials = (name) => {
//     if (!name) return "US";
//     const parts = name.split(" ");
//     const first = parts[0]?.[0] || "";
//     const last = parts[1]?.[0] || "";
//     return `${first}${last}`.toUpperCase();
//   };

//   const isActivePage = (path) => location.pathname === path;

//   const navigationItems = [
//     { path: "/", label: "Home", icon: HomeIcon, show: !isLoginOrSignupPage },
//     { path: "/add-task", label: "Tasks", icon: TaskIcon, show: !!user },
//     { path: "/project", label: "Projects", icon: ProjectIcon, show: !!user },
//     { path: "/team-selection", label: "Teams", icon: GroupIcon, show: !!user },
//     { path: "/about", label: "About", icon: AboutIcon, show: !isLoginOrSignupPage },
//   ];

//   return (
//     <div className="nav">
//       <div className="navbar-starfield"></div>

//       <Collapse in={alertOpen}>
//         <Alert
//           severity={alertSeverity}
//           className="cosmic-alert"
//           action={
//             <IconButton
//               aria-label="close"
//               color="inherit"
//               size="small"
//               onClick={() => setAlertOpen(false)}
//               className="alert-close-btn"
//             >
//               <CloseIcon fontSize="inherit" />
//             </IconButton>
//           }
//         >
//           <div className="alert-content">
//             <span className="alert-text">{alertMessage}</span>
//             <div className="alert-glow"></div>
//           </div>
//         </Alert>
//       </Collapse>

//       <AppBar position="sticky" elevation={0} className="cosmic-navbar">
//         <div className="navbar-background-overlay"></div>
//         <Toolbar className="cosmic-toolbar">
//           <div className="navbar-logo-section" onClick={() => navigate("/")}>
//             <div className="logo-container">
//               <RocketIcon className="logo-icon" />
//               <Typography variant="h5" className="logo-text">
//                 <span className="logo-do">Do</span>
//                 <span className="logo-desk">Desk</span>
//               </Typography>
//               <div className="logo-glow"></div>
//             </div>
//           </div>

//           <Box className="navbar-links-desktop">
//             {navigationItems.map(({ path, label, icon: Icon, show }) =>
//               show && (
//                 <Button
//                   key={path}
//                   color="inherit"
//                   onClick={() => navigate(path)}
//                   className={`nav-link ${isActivePage(path) ? "active" : ""}`}
//                   startIcon={<Icon className="nav-icon" />}
//                 >
//                   <span className="nav-text">{label}</span>
//                   <div className="nav-link-glow"></div>
//                 </Button>
//               )
//             )}
//           </Box>

//           <Box className="navbar-user-section">
//             {user && (
//               <div className="user-profile">
//                 <Avatar className="user-avatar">
//                   <PersonIcon />
//                 </Avatar>
//                 <Typography className="user-initials">
//                   {getInitials(user.name || user.email)}
//                 </Typography>
//                 <div className="user-glow"></div>
//               </div>
//             )}

//             {!isLoginOrSignupPage && (
//               <Button
//                 variant="contained"
//                 onClick={handleAuthClick}
//                 className="cosmic-auth-btn"
//                 startIcon={user ? <LogoutIcon /> : <LoginIcon />}
//               >
//                 <span className="auth-btn-text">
//                   {user ? "Logout" : "Login"}
//                 </span>
//                 <div className="auth-btn-glow"></div>
//               </Button>
//             )}
//           </Box>

//           <IconButton
//             className="mobile-menu-toggle"
//             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//           >
//             <div className={`hamburger ${mobileMenuOpen ? "active" : ""}`}>
//               <span></span>
//               <span></span>
//               <span></span>
//             </div>
//           </IconButton>
//         </Toolbar>

//         <Collapse in={mobileMenuOpen} className="mobile-nav-collapse">
//           <Box className="mobile-nav-menu">
//             {navigationItems.map(({ path, label, icon: Icon, show }) =>
//               show && (
//                 <Button
//                   key={path}
//                   color="inherit"
//                   onClick={() => {
//                     navigate(path);
//                     setMobileMenuOpen(false);
//                   }}
//                   className={`mobile-nav-link ${isActivePage(path) ? "active" : ""}`}
//                   startIcon={<Icon className="mobile-nav-icon" />}
//                   fullWidth
//                 >
//                   <span className="mobile-nav-text">{label}</span>
//                   <div className="mobile-nav-glow"></div>
//                 </Button>
//               )
//             )}

//             {!isLoginOrSignupPage && (
//               <Button
//                 variant="contained"
//                 onClick={() => {
//                   handleAuthClick();
//                   setMobileMenuOpen(false);
//                 }}
//                 className="mobile-auth-btn"
//                 startIcon={user ? <LogoutIcon /> : <LoginIcon />}
//                 fullWidth
//               >
//                 <span className="mobile-auth-text">
//                   {user ? "Logout" : "Login"}
//                 </span>
//                 <div className="mobile-auth-glow"></div>
//               </Button>
//             )}
//           </Box>
//         </Collapse>
//       </AppBar>
//     </div>
//   );
// };

// export default Navbar;