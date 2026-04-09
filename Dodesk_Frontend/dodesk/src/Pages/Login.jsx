// File: dodesk/src/Pages/Login.jsx
import React, { useState, useEffect } from "react";
import {
  Box, Button, TextField, Typography,
  Paper, Divider, Stack, Alert,
  Collapse, IconButton, CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../Context/AuthContext";
import "../Pages/Login.css";

const Login = () => {
  // --- Navigation and Context ---
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  // --- Local State ---
  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [alertOpen,     setAlertOpen]     = useState(false);
  const [alertMessage,  setAlertMessage]  = useState("");
  const [alertSeverity, setAlertSeverity] = useState("error");
  const [isLoading,     setIsLoading]     = useState(false);

  useEffect(() => { document.title = "Login — DoDesk"; }, []);

  const showAlert = (message, severity = "error") => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  // --- Email/Password Login ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return showAlert("Please fill in all fields.");

    setIsLoading(true);
    setAlertOpen(false);

    const result = await login(email.trim(), password);
    if (result.success) {
      showAlert("Success! Entering Command Center…", "success");
      setTimeout(() => navigate("/"), 1000);
    } else {
      showAlert(result.error);
      setIsLoading(false);
    }
  };

  // --- Google OAuth Login ---
  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    const result = await loginWithGoogle(credentialResponse.credential);
    if (result.success) {
      navigate("/");
    } else {
      showAlert("Google authentication failed.");
      setIsLoading(false);
    }
  };

  return (
    <Box className="login-container" role="main">
      {/* Decorative SVG particles */}
      <svg className="background-particles" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
        <circle cx="80"  cy="50"  r="6" fill="var(--accent-primary)"   opacity="0.25" />
        <circle cx="560" cy="60"  r="9" fill="var(--accent-secondary)" opacity="0.2"  />
        <circle cx="300" cy="350" r="5" fill="var(--accent-cyan)"      opacity="0.2"  />
        <circle cx="520" cy="300" r="7" fill="var(--accent-primary)"   opacity="0.15" />
        <circle cx="60"  cy="320" r="4" fill="var(--accent-secondary)" opacity="0.2"  />
      </svg>

      <Paper elevation={0} className="login-paper">

        {/* ── Header ── */}
        <div className="login-header">
          <div className="login-logo">⚡</div>
          <Typography variant="h4" className="login-title">
            Welcome back
          </Typography>
          <Typography variant="body2" className="login-subtitle">
            Sign in to your DoDesk workspace
          </Typography>
        </div>

        {/* ── Alert ── */}
        <Collapse in={alertOpen}>
          <div className="login-alert-wrap">
            <Alert
              severity={alertSeverity}
              action={
                <IconButton size="small" onClick={() => setAlertOpen(false)}>
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              {alertMessage}
            </Alert>
          </div>
        </Collapse>

        {/* ── Form ── */}
        <form onSubmit={handleLogin}>
          <Stack spacing={2.5}>

            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="login-input"
              autoComplete="email"
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="login-input"
              autoComplete="current-password"
            />

            <Button
              type="submit"
              fullWidth
              size="large"
              variant="contained"
              className="login-button"
              disabled={isLoading}
              disableElevation
            >
              {isLoading
                ? <CircularProgress size={22} color="inherit" />
                : "Sign In"
              }
            </Button>

            <Divider className="login-divider">or</Divider>

            {/* Google Login */}
            <Box className="google-btn-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => showAlert("Google login failed.")}
              />
            </Box>

            {/* Signup link */}
            <Typography variant="body2" className="signup-text">
              Don&apos;t have an account?
              <Button
                onClick={() => navigate("/signup")}
                size="small"
                className="signup-link"
                disableRipple
              >
                Sign Up
              </Button>
            </Typography>

          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;




































































































// import React, { useState, useEffect } from "react";
// import { Box, Button, TextField, Typography, Paper, Divider, Stack, Alert, Collapse, IconButton, CircularProgress } from "@mui/material";
// import CloseIcon from "@mui/icons-material/Close";
// import { useNavigate } from "react-router-dom";
// import { GoogleLogin } from "@react-oauth/google";
// import { useAuth } from "../Context/AuthContext";
// import "../Pages/Login.css";

// const Login = () => {
//   // --- Navigation and Context ---
//   const navigate = useNavigate();
//   // Fetching login methods from AuthContext
//   const { login, loginWithGoogle } = useAuth();

//   // --- Local Component States ---
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [alertOpen, setAlertOpen] = useState(false); // Manages visibility of the feedback alert
//   const [alertMessage, setAlertMessage] = useState("");
//   const [alertSeverity, setAlertSeverity] = useState("error"); // 'error' for failed, 'success' for passed
//   const [isLoading, setIsLoading] = useState(false); // Disables buttons/inputs during API calls

//   // Change browser tab title on component mount
//   useEffect(() => { document.title = "Login - DoDesk"; }, []);

//   // Helper function to display custom messages to the user
//   const showAlert = (message, severity = "error") => {
//     setAlertMessage(message);
//     setAlertSeverity(severity);
//     setAlertOpen(true);
//   };

//   /**
//    * HANDLER: Email/Password Login
//    * Runs when the user submits the manual login form.
//    */
//   const handleLogin = async (e) => {
//     e.preventDefault();
//     // Prevent submission if fields are empty
//     if (!email.trim() || !password) return showAlert("Please fill in all fields");

//     setIsLoading(true);
//     setAlertOpen(false);

//     // Call the custom login method from Context
//     const result = await login(email.trim(), password);
    
//     if (result.success) {
//       showAlert("Success! Entering Command Center...", "success");
//       // Short delay so user can see the success message before redirecting
//       setTimeout(() => navigate("/"), 1000);
//     } else {
//       // Re-enable form and show specific backend error
//       showAlert(result.error);
//       setIsLoading(false);
//     }
//   };

//   /**
//    * HANDLER: Google OAuth Success
//    * Runs after a successful response from the Google Login popup.
//    */
//   const handleGoogleSuccess = async (credentialResponse) => {
//     setIsLoading(true);
//     // Send the Google credential token to our backend for verification
//     const result = await loginWithGoogle(credentialResponse.credential);
//     if (result.success) {
//       navigate("/");
//     } else {
//       showAlert("Google authentication failed");
//       setIsLoading(false);
//     }
//   };

//   return (
//     <Box className="login-container" role="main">
//       {/* Decorative SVG background elements */}
//       <svg className="background-particles" width="100%" height="100%" viewBox="0 0 600 400">
//         <circle cx="80" cy="50" r="6" fill="#7a74ffcc" />
//         <circle cx="560" cy="60" r="9" fill="#958cffbb" />
//       </svg>

//       <Paper elevation={6} className="login-paper">
//         {/* Animated Alert Banner using MUI Collapse */}
//         <Collapse in={alertOpen}>
//           <Alert 
//             severity={alertSeverity} 
//             sx={{ mb: 2 }} 
//             action={
//               <IconButton size="small" onClick={() => setAlertOpen(false)}>
//                 <CloseIcon fontSize="inherit" />
//               </IconButton>
//             }
//           >
//             {alertMessage}
//           </Alert>
//         </Collapse>

//         <Typography variant="h4" className="login-title">
//           Welcome back to DoDesk Login
//         </Typography>

//         <form onSubmit={handleLogin}>
//           <Stack spacing={3} mt={3}>
//             {/* Input fields - disabled during loading for security */}
//             <TextField 
//               label="Email" 
//               type="email" 
//               fullWidth 
//               required 
//               value={email} 
//               onChange={(e) => setEmail(e.target.value)} 
//               disabled={isLoading} 
//               className="login-input" 
//             />
            
//             <TextField 
//               label="Password" 
//               type="password" 
//               fullWidth 
//               required 
//               value={password} 
//               onChange={(e) => setPassword(e.target.value)} 
//               disabled={isLoading} 
//               className="login-input" 
//             />

//             {/* Login button - shows CircularProgress while processing */}
//             <Button 
//               type="submit" 
//               fullWidth 
//               size="large" 
//               variant="contained" 
//               className="login-button" 
//               disabled={isLoading}
//             >
//               {isLoading ? <CircularProgress size={24} color="inherit" /> : "Login"}
//             </Button>

//             <Divider className="login-divider">OR</Divider>

//             {/* Google Authentication Component */}
//             <Box sx={{ display: "flex", justifyContent: "center" }}>
//               <GoogleLogin 
//                 onSuccess={handleGoogleSuccess} 
//                 onError={() => showAlert("Google login failed")} 
//               />
//             </Box>

//             {/* Signup navigation link */}
//             <Typography variant="body2" className="signup-text">
//               Don&apos;t have an account? 
//               <Button onClick={() => navigate("/signup")} size="small" className="signup-link">
//                 Sign Up
//               </Button>
//             </Typography>
//           </Stack>
//         </form>
//       </Paper>
//     </Box>
//   );
// };

// export default Login;




























// // File: dodesk/src/Pages/Login.jsx
// import React, { useState, useEffect } from "react";
// import {
//   Box,
//   Button,
//   TextField,
//   Typography,
//   Paper,
//   Divider,
//   Stack,
//   Alert,
//   Collapse,
//   IconButton,
//   CircularProgress,
// } from "@mui/material";
// import CloseIcon from "@mui/icons-material/Close";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../Context/AuthContext";
// import { GoogleLogin } from "@react-oauth/google";
// import "../Pages/Login.css";

// const Login = () => {
//   const navigate = useNavigate();
//   const { login, loginWithGoogle } = useAuth();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [alertOpen, setAlertOpen] = useState(false);
//   const [alertMessage, setAlertMessage] = useState("");
//   const [alertSeverity, setAlertSeverity] = useState("error");
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     document.title = "Login - DoDesk";
//   }, []);

//   const showAlert = (message, severity = "error") => {
//     setAlertMessage(message);
//     setAlertSeverity(severity);
//     setAlertOpen(true);
//   };

//   const handleLogin = async (e) => {
//     e.preventDefault();

//     if (!email.trim() || !password) {
//       showAlert("Please fill in all fields");
//       return;
//     }

//     setIsLoading(true);
//     setAlertOpen(false);

//     const result = await login(email.trim(), password);

//     if (result.success) {
//       showAlert("Login successful! Redirecting...", "success");
//       setTimeout(() => {
//         navigate("/");
//       }, 1200);
//     } else {
//       showAlert(result.error || "Invalid email or password");
//       setIsLoading(false);
//     }
//   };

//   const handleGoogleSuccess = async (credentialResponse) => {
//     setIsLoading(true);
//     setAlertOpen(false);

//     const result = await loginWithGoogle(credentialResponse.credential);

//     if (result.success) {
//       showAlert("Google login successful! Redirecting...", "success");
//       setTimeout(() => {
//         navigate("/");
//       }, 1200);
//     } else {
//       showAlert(result.error || "Google login failed");
//       setIsLoading(false);
//     }
//   };

//   const handleSignupRedirect = () => {
//     navigate("/signup");
//   };

//   return (
//     <Box className="login-container" role="main" aria-label="Login form container">
//       <svg
//         className="background-particles"
//         aria-hidden="true"
//         width="100%"
//         height="100%"
//         viewBox="0 0 600 400"
//         preserveAspectRatio="xMidYMid meet"
//       >
//         <circle cx="80" cy="50" r="6" fill="#7a74ffcc" />
//         <circle cx="130" cy="110" r="9" fill="#5a4fffaa" />
//         <circle cx="220" cy="80" r="4" fill="#8a7cffbb" />
//         <circle cx="280" cy="120" r="7" fill="#A496FFcc" />
//         <circle cx="340" cy="35" r="5" fill="#6d67ffdd" />
//         <circle cx="400" cy="90" r="6" fill="#867fffaa" />
//         <circle cx="480" cy="100" r="8" fill="#b9baffcc" />
//         <circle cx="530" cy="150" r="7" fill="#c0b8ff88" />
//         <circle cx="560" cy="60" r="9" fill="#958cffbb" />
//       </svg>

//       <Paper elevation={6} className="login-paper">
//         <Collapse in={alertOpen}>
//           <Alert
//             severity={alertSeverity}
//             className="login-alert"
//             sx={{ mb: 2 }}
//             action={
//               <IconButton
//                 aria-label="close"
//                 color="inherit"
//                 size="small"
//                 onClick={() => setAlertOpen(false)}
//               >
//                 <CloseIcon fontSize="inherit" />
//               </IconButton>
//             }
//           >
//             {alertMessage}
//           </Alert>
//         </Collapse>

//         <Typography variant="h4" className="login-title">
//           Welcome back to DoDesk Login
//         </Typography>

//         <form onSubmit={handleLogin}>
//           <Stack spacing={3} mt={3}>
//             <TextField
//               label="Email"
//               type="email"
//               fullWidth
//               required
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="login-input"
//               disabled={isLoading}
//             />

//             <TextField
//               label="Password"
//               type="password"
//               fullWidth
//               required
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="login-input"
//               disabled={isLoading}
//             />

//             <Button
//               type="submit"
//               fullWidth
//               size="large"
//               variant="contained"
//               className="login-button"
//               disabled={isLoading}
//             >
//               {isLoading ? (
//                 <CircularProgress size={24} color="inherit" />
//               ) : (
//                 "Login"
//               )}
//             </Button>

//             <Divider className="login-divider">OR</Divider>

//             <Box sx={{ display: "flex", justifyContent: "center" }}>
//               <GoogleLogin
//                 onSuccess={handleGoogleSuccess}
//                 onError={() => showAlert("Google login failed")}
//               />
//             </Box>

//             <Typography variant="body2" className="signup-text">
//               Don&apos;t have an account?{" "}
//               <Button
//                 onClick={handleSignupRedirect}
//                 size="small"
//                 className="signup-link"
//               >
//                 Sign Up
//               </Button>
//             </Typography>
//           </Stack>
//         </form>
//       </Paper>
//     </Box>
//   );
// };

// export default Login;