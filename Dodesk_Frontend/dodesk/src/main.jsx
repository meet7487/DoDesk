// main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";
import App from "./App.jsx";

// --- React Root Initialization ---
// Finds the <div> with id="root" in your index.html and prepares it to show React content.
createRoot(document.getElementById("root")).render(
  /**
   * StrictMode: A development-only tool that helps catch common bugs early 
   * by highlighting potential problems in the application.
   */
  <StrictMode>
   
    <GoogleOAuthProvider clientId="562963169205-haeonhriusihrj5307s10b4204pasjln.apps.googleusercontent.com">
      
      {/* The main App component where all your routes and pages live */}
      <App />
      
    </GoogleOAuthProvider>
  </StrictMode>
);