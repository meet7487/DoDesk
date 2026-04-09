import axios from "axios";

// --- Configuration ---
// Get the Backend API URL from environment variables (.env) 
// or fallback to localhost if not defined.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Create a custom Axios instance.
 * This helps us avoid repeating the base URL and default headers 
 * in every single API call across the app.
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * --- REQUEST INTERCEPTOR ---
 * This function runs automatically every time you send a request using 'api'.
 * It intercepts the request before it leaves the browser to check for a security token.
 */
api.interceptors.request.use((config) => {
  // Retrieve the JWT (JSON Web Token) from the browser's local storage
  const token = localStorage.getItem("token");

  // If a token exists, attach it to the 'Authorization' header.
  // This allows the Backend (FastAPI) to know who is making the request.
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Return the modified configuration to proceed with the request
  return config;
}, (error) => {
  // Handle any request errors here
  return Promise.reject(error);
});

// Export this 'api' instance to use it in Projects, Tasks, and Auth pages.
export default api;