// File: dodesk/src/Pages/Signup.jsx
import React, { useState, useEffect } from "react";
import {
  Box, Button, TextField, Typography,
  Paper, Divider, Stack, Alert,
  Collapse, IconButton, CircularProgress, MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import "./Signup.css";

const Signup = () => {
  const navigate = useNavigate();
  const { signup, loginWithGoogle } = useAuth();

  // --- Form Input States ---
  const [name,            setName]            = useState("");
  const [username,        setUsername]        = useState("");
  const [email,           setEmail]           = useState("");
  const [address,         setAddress]         = useState("");
  const [gender,          setGender]          = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- UI & Feedback States ---
  const [alertOpen,     setAlertOpen]     = useState(false);
  const [alertMessage,  setAlertMessage]  = useState("");
  const [alertSeverity, setAlertSeverity] = useState("error");
  const [isLoading,     setIsLoading]     = useState(false);

  useEffect(() => { document.title = "Sign Up — DoDesk"; }, []);

  const showAlert = (message, severity = "error") => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  // --- Client-side validation ---
  const validateForm = () => {
    if (!name.trim() || name.trim().length < 2)
      return showAlert("Name must be at least 2 characters long"), false;
    if (!username.trim() || username.trim().length < 3)
      return showAlert("Username must be at least 3 characters long"), false;
    if (!email.includes("@"))
      return showAlert("Please enter a valid email"), false;
    if (!address.trim())
      return showAlert("Address is required"), false;
    if (!gender)
      return showAlert("Please select your gender"), false;
    if (password.length < 6)
      return showAlert("Password must be at least 6 characters"), false;
    if (password !== confirmPassword)
      return showAlert("Passwords do not match"), false;
    return true;
  };

  // --- Email/Password Signup ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setAlertOpen(false);

    const result = await signup(
      name.trim(), username.trim(), email.trim(),
      address.trim(), gender, password
    );

    if (result.success) {
      showAlert("Account created! Redirecting…", "success");
      setTimeout(() => navigate("/"), 1500);
    } else {
      showAlert(result.error || "Signup failed");
      setIsLoading(false);
    }
  };

  // --- Google OAuth Signup ---
  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    const result = await loginWithGoogle(credentialResponse.credential);
    if (result.success) {
      navigate("/");
    } else {
      showAlert(result.error || "Google signup failed");
      setIsLoading(false);
    }
  };

  return (
    <Box className="signup-container">
      <Paper elevation={0} className="signup-paper">

        {/* ── Header ── */}
        <div className="signup-title-box">
          <div className="signup-logo">🚀</div>
          <Typography variant="h4" className="signup-title">
            Create your account
          </Typography>
          <Typography variant="body2" className="signup-subtitle">
            Join thousands of teams managing projects with DoDesk
          </Typography>
        </div>

        {/* ── Alert ── */}
        <Collapse in={alertOpen}>
          <div className="signup-alert-wrap">
            <Alert
              severity={alertSeverity}
              className="signup-alert"
              action={
                <IconButton size="small" aria-label="close" color="inherit"
                  onClick={() => setAlertOpen(false)}>
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              {alertMessage}
            </Alert>
          </div>
        </Collapse>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="signup-form">
          <Stack spacing={2}>

            {/* Name + Username — 2 col on desktop */}
            <div className="signup-fields-grid">
              <TextField
                label="Full Name"
                fullWidth required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="signup-input"
                disabled={isLoading}
                autoComplete="name"
              />
              <TextField
                label="Username"
                fullWidth required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="signup-input"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <TextField
              label="Email"
              type="email"
              fullWidth required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="signup-input"
              disabled={isLoading}
              autoComplete="email"
            />

            <TextField
              label="Address"
              fullWidth required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="signup-input"
              disabled={isLoading}
              autoComplete="street-address"
            />

            {/* Gender */}
            <TextField
              select
              label="Gender"
              fullWidth required
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="signup-input"
              disabled={isLoading}
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>

            {/* Password + Confirm — 2 col on desktop */}
            <div className="signup-fields-grid">
              <TextField
                label="Password"
                type="password"
                fullWidth required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="signup-input"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <TextField
                label="Confirm Password"
                type="password"
                fullWidth required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="signup-input"
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              className="signup-button"
              disabled={isLoading}
              disableElevation
            >
              {isLoading
                ? <CircularProgress size={22} color="inherit" />
                : "Create Account"
              }
            </Button>

            <Divider className="signup-divider">or</Divider>

            {/* Google */}
            <Box className="google-btn-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => showAlert("Google signup failed")}
              />
            </Box>

            {/* Login link */}
            <Typography variant="body2" className="signup-footer-text">
              Already have an account?
              <Button
                onClick={() => navigate("/login")}
                className="login-link"
                disabled={isLoading}
                disableRipple
              >
                Sign In
              </Button>
            </Typography>

          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default Signup;






























































































// // File: dodesk/src/Pages/Signup.jsx
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
//   MenuItem,
// } from "@mui/material";
// import CloseIcon from "@mui/icons-material/Close";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../Context/AuthContext";
// import { GoogleLogin } from "@react-oauth/google";
// import "./Signup.css";

// const Signup = () => {
//   const navigate = useNavigate();
//   // Get signup and Google login functions from the Auth Context
//   const { signup, loginWithGoogle } = useAuth();

//   // --- Form Input States ---
//   const [name, setName] = useState("");
//   const [username, setUsername] = useState("");
//   const [email, setEmail] = useState("");
//   const [address, setAddress] = useState("");
//   const [gender, setGender] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");

//   // --- UI & Feedback States ---
//   const [alertOpen, setAlertOpen] = useState(false);
//   const [alertMessage, setAlertMessage] = useState("");
//   const [alertSeverity, setAlertSeverity] = useState("error");
//   const [isLoading, setIsLoading] = useState(false);

//   // Set the browser tab title when the component loads
//   useEffect(() => {
//     document.title = "Sign Up - DoDesk";
//   }, []);

//   // Helper function to trigger the notification alert
//   const showAlert = (message, severity = "error") => {
//     setAlertMessage(message);
//     setAlertSeverity(severity);
//     setAlertOpen(true);
//   };

//   /**
//    * Performs client-side validation before sending data to the server.
//    * Checks for empty fields, password length, and matching passwords.
//    */
//   const validateForm = () => {
//     if (!name.trim() || name.trim().length < 2) {
//       showAlert("Name must be at least 2 characters long");
//       return false;
//     }

//     if (!username.trim() || username.trim().length < 3) {
//       showAlert("Username must be at least 3 characters long");
//       return false;
//     }

//     if (!email.includes("@")) {
//       showAlert("Please enter a valid email");
//       return false;
//     }

//     if (!address.trim()) {
//       showAlert("Address is required");
//       return false;
//     }

//     if (!gender) {
//       showAlert("Please select your gender");
//       return false;
//     }

//     if (password.length < 6) {
//       showAlert("Password must be at least 6 characters");
//       return false;
//     }

//     if (password !== confirmPassword) {
//       showAlert("Passwords do not match");
//       return false;
//     }

//     return true;
//   };

//   /**
//    * Handles the standard email/password registration flow.
//    */
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validateForm()) return; // Stop if validation fails

//     setIsLoading(true);
//     setAlertOpen(false);

//     // Call the signup API through AuthContext
//     const result = await signup(
//       name.trim(),
//       username.trim(),
//       email.trim(),
//       address.trim(),
//       gender,
//       password
//     );

//     if (result.success) {
//       showAlert("Signup successful! Redirecting...", "success");
//       // Redirect to home after a brief delay
//       setTimeout(() => {
//         navigate("/");
//       }, 1500);
//     } else {
//       showAlert(result.error || "Signup failed");
//       setIsLoading(false);
//     }
//   };

//   /**
//    * Handles authentication via Google OAuth.
//    */
//   const handleGoogleSuccess = async (credentialResponse) => {
//     setIsLoading(true);
//     const result = await loginWithGoogle(credentialResponse.credential);

//     if (result.success) {
//       navigate("/");
//     } else {
//       showAlert(result.error || "Google signup failed");
//       setIsLoading(false);
//     }
//   };

//   return (
//     <Box className="signup-container">
//       <Paper className="signup-paper" elevation={6}>
        
//         {/* Animated Alert for Errors/Success */}
//         <Collapse in={alertOpen}>
//           <Alert
//             severity={alertSeverity}
//             className="signup-alert"
//             sx={{ mb: 2 }}
//             action={
//               <IconButton
//                 size="small"
//                 aria-label="close"
//                 color="inherit"
//                 onClick={() => setAlertOpen(false)}
//               >
//                 <CloseIcon fontSize="inherit" />
//               </IconButton>
//             }
//           >
//             {alertMessage}
//           </Alert>
//         </Collapse>

//         {/* Header Section */}
//         <Box className="signup-title-box">
//           <Typography variant="h4" className="signup-title">
//             Create your DoDesk account
//           </Typography>
//           <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
//             Join thousands of teams managing projects with DoDesk
//           </Typography>
//         </Box>

//         <form onSubmit={handleSubmit} className="signup-form">
//           <Stack spacing={2.5}>
            
//             {/* Input Fields - Automatically disabled when isLoading is true */}
//             <TextField
//               label="Full Name"
//               fullWidth
//               required
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               className="signup-input"
//               disabled={isLoading}
//             />

//             <TextField
//               label="Username"
//               fullWidth
//               required
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               className="signup-input"
//               disabled={isLoading}
//             />

//             <TextField
//               label="Email"
//               type="email"
//               fullWidth
//               required
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="signup-input"
//               disabled={isLoading}
//             />

//             <TextField
//               label="Address"
//               fullWidth
//               required
//               value={address}
//               onChange={(e) => setAddress(e.target.value)}
//               className="signup-input"
//               disabled={isLoading}
//             />

//             {/* Gender Selection Dropdown */}
//             <TextField
//               select
//               label="Gender"
//               fullWidth
//               required
//               value={gender}
//               onChange={(e) => setGender(e.target.value)}
//               className="signup-input"
//               disabled={isLoading}
//             >
//               <MenuItem value="Male">Male</MenuItem>
//               <MenuItem value="Female">Female</MenuItem>
//               <MenuItem value="Other">Other</MenuItem>
//             </TextField>

//             <TextField
//               label="Password"
//               type="password"
//               fullWidth
//               required
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="signup-input"
//               disabled={isLoading}
//             />

//             <TextField
//               label="Confirm Password"
//               type="password"
//               fullWidth
//               required
//               value={confirmPassword}
//               onChange={(e) => setConfirmPassword(e.target.value)}
//               className="signup-input"
//               disabled={isLoading}
//             />

//             {/* Submit Button with Progress Spinner */}
//             <Button
//               type="submit"
//               variant="contained"
//               fullWidth
//               size="large"
//               className="signup-button"
//               disabled={isLoading}
//             >
//               {isLoading ? (
//                 <CircularProgress size={24} color="inherit" />
//               ) : (
//                 "Sign Up"
//               )}
//             </Button>

//             <Divider className="signup-divider">OR</Divider>

//             {/* Google OAuth Login Integration */}
//             <Box sx={{ display: "flex", justifyContent: "center" }}>
//               <GoogleLogin
//                 onSuccess={handleGoogleSuccess}
//                 onError={() => showAlert("Google signup failed")}
//               />
//             </Box>

//             {/* Footer Navigation */}
//             <Typography
//               variant="body2"
//               className="signup-footer-text"
//               align="center"
//             >
//               Already have an account?{" "}
//               <Button
//                 onClick={() => navigate("/login")}
//                 className="login-link"
//                 disabled={isLoading}
//               >
//                 Login
//               </Button>
//             </Typography>
//           </Stack>
//         </form>
//       </Paper>
//     </Box>
//   );
// };

// export default Signup;