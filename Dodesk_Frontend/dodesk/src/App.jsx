// src/App.jsx  — Updated with all new feature routes
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./Context/ThemeContext";
import { AuthProvider, useAuth } from "./Context/AuthContext";
import { NotificationProvider } from "./Context/NotificationContext";   // Feature 1
import Navbar   from "./Component/Navbar";
import Footer   from "./Component/Footer";
import { CircularProgress, Box } from "@mui/material";

// ── Chatbot — lazy so missing file never crashes the app ────────
const Chatbot = React.lazy(() => import("./Component/Chatbot").catch(() => ({ default: () => null })));

// ── Lazy-load pages for faster initial load ──────────────────
const Home          = lazy(() => import("./Pages/Home"));
const Login         = lazy(() => import("./Pages/Login"));
const Signup        = lazy(() => import("./Pages/Signup"));
const Task          = lazy(() => import("./Pages/Task"));
const Project       = lazy(() => import("./Pages/Project"));
const TeamSelection = lazy(() => import("./Pages/TeamSelection"));
const AboutUs       = lazy(() => import("./Pages/AboutUs"));
const Dashboard     = lazy(() => import("./Pages/Dashboard"));        // Feature 2
const CalendarView  = lazy(() => import("./Pages/CalendarView"));     // Feature 6/8
const SearchPage    = lazy(() => import("./Pages/SearchPage"));       // Feature 7

// Loading spinner shown during lazy load
const PageLoader = () => (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
    <CircularProgress sx={{ color: "var(--accent-primary)" }} />
  </Box>
);

// ── Protected route wrapper ───────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

// ── App shell ────────────────────────────────────────────────
function AppShell() {
  const { user } = useAuth();
  return (
    <Router>
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/"       element={<Home />} />
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/about"  element={<AboutUs />} />

          {/* Protected routes */}
          <Route path="/tasks"     element={<ProtectedRoute><Task /></ProtectedRoute>} />
          <Route path="/projects"  element={<ProtectedRoute><Project /></ProtectedRoute>} />
          <Route path="/teams"     element={<ProtectedRoute><TeamSelection /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />      {/* Feature 2 */}
          <Route path="/calendar"  element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />   {/* Feature 6 */}
          <Route path="/search"    element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />     {/* Feature 7 */}

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Footer />
      {/* ── Chatbot — only shown to authenticated users ── */}
      {user && (
        <React.Suspense fallback={null}>
          <Chatbot />
        </React.Suspense>
      )}
    </Router>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>     {/* Feature 1 — wraps everything for WS access */}
          <AppShell />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}






























// // src/App.jsx
// import React, { Suspense, lazy } from "react";
// import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
// import { AnimatePresence } from "framer-motion";
// import { ThemeProvider } from "./Context/ThemeContext";
// import { AuthProvider, useAuth } from "./Context/AuthContext";
// import { NotificationProvider } from "./Context/NotificationContext";   // Feature 1
// import Navbar   from "./Component/Navbar";
// import Footer   from "./Component/Footer";
// import { CircularProgress, Box } from "@mui/material";

// // Lazy-load pages for faster initial load 
// const Login         = lazy(() => import("./Pages/Login"));
// const Signup        = lazy(() => import("./Pages/Signup"));
// const Task          = lazy(() => import("./Pages/Task"));
// const Project       = lazy(() => import("./Pages/Project"));
// const TeamSelection = lazy(() => import("./Pages/TeamSelection"));
// const AboutUs       = lazy(() => import("./Pages/AboutUs"));
// const Dashboard     = lazy(() => import("./Pages/Dashboard"));   
// const CalendarView  = lazy(() => import("./Pages/CalendarView")); 
// const SearchPage    = lazy(() => import("./Pages/SearchPage"));  

// // Loading spinner shown during lazy load
// const PageLoader = () => (
//   <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
//     <CircularProgress sx={{ color: "var(--accent-primary)" }} />
//   </Box>
// );

// // Protected route wrapper
// const ProtectedRoute = ({ children }) => {
//   const { user } = useAuth();
//   return user ? children : <Navigate to="/login" replace />;
// };

// // App shell inner 
// function AppShellInner() {
//   const location = useLocation();

//   return (
//     <>
//       <Navbar />
//       <Suspense fallback={<PageLoader />}>
//         <AnimatePresence mode="wait">
//           <Routes location={location} key={location.pathname}>
//             {/* Public routes */}
//             <Route path="/"       element={<Home />} />
//             <Route path="/login"  element={<Login />} />
//             <Route path="/signup" element={<Signup />} />
//             <Route path="/about"  element={<AboutUs />} />

//             {/* Protected routes */}
//             <Route path="/tasks"     element={<ProtectedRoute><Task /></ProtectedRoute>} />
//             <Route path="/projects"  element={<ProtectedRoute><Project /></ProtectedRoute>} />
//             <Route path="/teams"     element={<ProtectedRoute><TeamSelection /></ProtectedRoute>} />
//             <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />      {/* Feature 2 */}
//             <Route path="/calendar"  element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />   {/* Feature 6 */}
//             <Route path="/search"    element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />     {/* Feature 7 */}

//             {/* Fallback */}
//             <Route path="*" element={<Navigate to="/" replace />} />
//           </Routes>
//         </AnimatePresence>
//       </Suspense>
//       <Footer />
//     </>
//   );
// }

// // App shell
// function AppShell() {
//   return (
//     <Router>
//       <AppShellInner />
//     </Router>
//   );
// }

// export default function App() {
//   return (
//     <ThemeProvider>
//       <AuthProvider>
//         <NotificationProvider>
//           <AppShell />
//         </NotificationProvider>
//       </AuthProvider>
//     </ThemeProvider>
//   );
// }


















































































// // App.jsx
// import React from "react";
// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import { GoogleOAuthProvider } from "@react-oauth/google";

// // Importing the global Authentication context
// import { AuthProvider, useAuth } from "./Context/AuthContext";

// // Page Components
// import Login from "./Pages/Login";
// import Signup from "./Pages/Signup";
// import Home from "./Pages/Home";
// import Task from "./Pages/Task";
// import Project from "./Pages/Project";
// import AboutUs from "./Pages/AboutUs";
// import TeamSelection from "./Pages/TeamSelection";

// // Layout Components
// import Navbar from "./Component/Navbar";
// import Footer from "./Component/Footer";

// /**
//  * AppRoutes handles the conditional rendering of pages 
//  * based on whether the user is logged in or not.
//  */
// const AppRoutes = () => {
//   const { user, authChecked } = useAuth();

//   // Boolean flag to quickly check if a user object exists
//   const isAuthenticated = !!user;

//   /**
//    * INITIAL LOADING SCREEN
//    * While the AuthContext is verifying the token from localStorage, 
//    * we show this spinner to prevent flickering or wrong redirects.
//    */
//   if (!authChecked) {
//     return (
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           height: "100vh",
//           background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//         }}
//       >
//         <div
//           style={{
//             textAlign: "center",
//             padding: "2rem",
//             background: "rgba(255,255,255,0.1)",
//             borderRadius: "16px",
//             backdropFilter: "blur(10px)",
//             border: "1px solid rgba(255,255,255,0.2)",
//           }}
//         >
//           {/* Spinner element */}
//           <div
//             style={{
//               width: "50px",
//               height: "50px",
//               border: "5px solid #f3f3f3",
//               borderTop: "5px solid #667eea",
//               borderRadius: "50%",
//               animation: "spin 1s linear infinite",
//               margin: "0 auto 1rem",
//             }}
//           ></div>

//           <p style={{ color: "white", fontSize: "1.2rem", margin: 0 }}>
//             Loading DoDesk...
//           </p>
//         </div>

//         <style>
//           {`
//             @keyframes spin {
//               0% { transform: rotate(0deg); }
//               100% { transform: rotate(360deg); }
//             }
//           `}
//         </style>
//       </div>
//     );
//   }

//   return (
//     <>
//       {/* Navigation bar is visible globally across all routes */}
//       <Navbar />

//       <Routes>

//         {/* --- Home Route --- 
//             Redirects to login if the user is not authenticated. */}
//         <Route
//           path="/"
//           element={isAuthenticated ? <Home /> : <Navigate to="/login" replace />}
//         />

//         {/* --- Auth Routes (Login/Signup) --- 
//             If the user is ALREADY logged in, they are redirected back to Home. */}
//         <Route
//           path="/login"
//           element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />}
//         />

//         <Route
//           path="/signup"
//           element={!isAuthenticated ? <Signup /> : <Navigate to="/" replace />}
//         />

//         {/* --- Private Protected Routes --- 
//             These pages are only accessible to logged-in users. */}
//         <Route
//           path="/add-task"
//           element={isAuthenticated ? <Task /> : <Navigate to="/login" replace />}
//         />

//         <Route
//           path="/project"
//           element={isAuthenticated ? <Project /> : <Navigate to="/login" replace />}
//         />

//         <Route
//           path="/team-selection"
//           element={isAuthenticated ? <TeamSelection /> : <Navigate to="/login" replace />}
//         />

//         {/* --- Public Routes --- 
//             Everyone can access the About Us page. */}
//         <Route path="/about" element={<AboutUs />} />

//         {/* --- Fallback Route --- 
//             If the user enters a non-existing URL, redirect them to Home. */}
//         <Route path="*" element={<Navigate to="/" replace />} />

//       </Routes>

//       {/* Footer is visible globally */}
//       <Footer />
//     </>
//   );
// };

// const App = () => {
//   // Use Google Client ID from environment variables or hardcoded fallback
//   const googleClientId =
//     import.meta.env.VITE_GOOGLE_CLIENT_ID ||
//     "562963169205-haeonhriusihrj5307s10b4204pasjln.apps.googleusercontent.com";

//   return (
//     /**
//      * Providers must wrap the entire app.
//      * Google Provider -> AuthContext -> React Router
//      */
//     <GoogleOAuthProvider clientId={googleClientId}>
//       <AuthProvider>
//         <Router>
//           <AppRoutes />
//         </Router>
//       </AuthProvider>
//     </GoogleOAuthProvider>
//   );
// };

// export default App;













































// import React from "react";
// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import { GoogleOAuthProvider } from "@react-oauth/google";

// // Auth Context (using FastAPI backend)
// import { AuthProvider, useAuth } from "./Context/AuthContext";

// // Pages
// import Login from "./Pages/Login";
// import Signup from "./Pages/Signup";
// import Home from "./Pages/Home";
// import Task from "./Pages/Task";
// import Project from "./Pages/Project";
// import AboutUs from "./Pages/AboutUs";
// import TeamSelection from "./Pages/TeamSelection";

// // Shared UI Components
// import Navbar from "./Component/Navbar";
// import Footer from "./Component/Footer";

// const AppRoutes = () => {
//   const { user, authChecked } = useAuth();

//   if (!authChecked) {
//     return (
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           height: "100vh",
//           background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//         }}
//       >
//         <div
//           style={{
//             textAlign: "center",
//             padding: "2rem",
//             background: "rgba(255, 255, 255, 0.1)",
//             borderRadius: "16px",
//             backdropFilter: "blur(10px)",
//             border: "1px solid rgba(255, 255, 255, 0.2)",
//           }}
//         >
//           <div
//             style={{
//               width: "50px",
//               height: "50px",
//               border: "5px solid #f3f3f3",
//               borderTop: "5px solid #667eea",
//               borderRadius: "50%",
//               animation: "spin 1s linear infinite",
//               margin: "0 auto 1rem",
//             }}
//           ></div>
//           <p style={{ color: "white", fontSize: "1.2rem", margin: 0 }}>
//             Loading DoDesk...
//           </p>
//         </div>
//         <style>
//           {`
//             @keyframes spin {
//               0% { transform: rotate(0deg); }
//               100% { transform: rotate(360deg); }
//             }
//           `}
//         </style>
//       </div>
//     );
//   }

//   return (
//     <>
//       <Navbar />
//       <Routes>
//         {/* Home route */}
//         <Route path="/" element={user ? <Home /> : <Navigate to="/login" replace />} />

//         {/* Login */}
//         <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />

//         {/* Signup */}
//         <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" replace />} />

//         {/* Protected Pages */}
//         <Route path="/add-task" element={user ? <Task /> : <Navigate to="/login" replace />} />
//         <Route path="/project" element={user ? <Project /> : <Navigate to="/login" replace />} />
//         <Route
//           path="/team-selection"
//           element={user ? <TeamSelection /> : <Navigate to="/login" replace />}
//         />

//         {/* Public Page */}
//         <Route path="/about" element={<AboutUs />} />

//         {/* Catch-all route */}
//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>
//       <Footer />
//     </>
//   );
// };

// const App = () => {
//   const googleClientId =
//     import.meta.env.VITE_GOOGLE_CLIENT_ID ||
//     "562963169205-haeonhriusihrj5307s10b4204pasjln.apps.googleusercontent.com";

//   return (
//     <GoogleOAuthProvider clientId={googleClientId}>
//       <AuthProvider>
//         <Router>
//           <AppRoutes />
//         </Router>
//       </AuthProvider>
//     </GoogleOAuthProvider>
//   );
// };

// export default App;
