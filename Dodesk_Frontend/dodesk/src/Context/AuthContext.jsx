// AuthContext.jsx - Central Hub for User Authentication
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Stores the logged-in user's profile info
  const [authChecked, setAuthChecked] = useState(false); // Flag to check if initial auth-check is done

  // Backend URL from environment variables or default to localhost
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // --- Axios Configuration with Interceptors ---
  // We use useMemo so the 'api' instance isn't recreated on every render
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: API_URL,
      headers: { "Content-Type": "application/json" },
    });

    /**
     * REQUEST INTERCEPTOR:
     * Before every API call, this function runs. 
     * It checks localStorage for a token and attaches it to the 'Authorization' header.
     * This way, you don't have to manually send the token in every component.
     */
    instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return instance;
  }, [API_URL]);

  // --- Initial Auth Check ---
  // Runs once when the app starts/refreshes to see if a valid session exists.
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setAuthChecked(true);
        return;
      }
      try {
        // Verify the token with the backend '/me' endpoint
        const response = await api.get("/api/auth/me");
        if (response?.data) {
          setUser(response.data); // Set user globally if token is valid
        } else {
          throw new Error("Invalid User");
        }
      } catch (error) {
        // If token is expired or invalid, clear it and log out the user
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setAuthChecked(true); // Stop the loading state regardless of outcome
      }
    };
    checkAuthStatus();
  }, [api]);

  // --- Standard Login Function ---
  const login = async (email, password) => {
    try {
      const response = await api.post("/api/auth/login", { email, password });
      if (response.data?.access_token) {
        localStorage.setItem("token", response.data.access_token);
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: "Invalid credentials" };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || "Login failed" };
    }
  };

  // --- Signup Function ---
  const signup = async (name, username, email, address, gender, password) => {
    try {
      const response = await api.post("/api/auth/signup", { name, username, email, address, gender, password });
      if (response.data?.access_token) {
        localStorage.setItem("token", response.data.access_token);
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: response.data?.error || "Signup failed" };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || "Signup failed" };
    }
  };

  // --- Google OAuth Integration ---
  const loginWithGoogle = async (googleCredential) => {
    try {
      // Send Google's token to our custom backend endpoint
      const response = await api.post("/api/auth/google", { token: googleCredential });
      if (response.data?.access_token) {
        localStorage.setItem("token", response.data.access_token);
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: "Google login failed" };
    } catch (error) {
      return { success: false, error: "Google login error" };
    }
  };

  // --- Logout Function ---
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    return { success: true };
  };

  return (
    // Providing all auth states and methods to the rest of the app
    <AuthContext.Provider value={{ user, authChecked, login, signup, loginWithGoogle, logout, api }}>
      {/* Show children only after the auth check is complete */}
      {authChecked ? children : <div style={{display:'flex', justifyContent:'center', marginTop:'20%'}}>Loading Systems...</div>}
    </AuthContext.Provider>
  );
};

// Custom Hook to easily use the Auth context in any component
export const useAuth = () => useContext(AuthContext);

































































// import React, { createContext, useContext, useEffect, useState } from "react";
// import axios from "axios";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [authChecked, setAuthChecked] = useState(false);

//   const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

//   const api = axios.create({
//     baseURL: API_URL,
//   });

//   api.interceptors.request.use((config) => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   });

//   useEffect(() => {
//     const checkAuthStatus = async () => {
//       const token = localStorage.getItem("token");

//       if (!token) {
//         setAuthChecked(true);
//         return;
//       }

//       try {
//         const response = await api.get("/api/auth/me");
//         setUser(response.data);
//       } catch (error) {
//         localStorage.removeItem("token");
//         setUser(null);
//       } finally {
//         setAuthChecked(true);
//       }
//     };

//     checkAuthStatus();
//   }, []);

//   const login = async (email, password) => {
//     try {
//       const response = await api.post("/api/auth/login", {
//         email,
//         password,
//       });

//       localStorage.setItem("token", response.data.access_token);
//       setUser(response.data.user);

//       return { success: true };
//     } catch (error) {
//       return {
//         success: false,
//         error: error.response?.data?.error || "Login failed",
//       };
//     }
//   };

//   const signup = async (
//     name,
//     username,
//     email,
//     address,
//     gender,
//     password
//   ) => {
//     try {
//       const response = await api.post("/api/auth/signup", {
//         name,
//         username,
//         email,
//         address,
//         gender,
//         password,
//       });

//       localStorage.setItem("token", response.data.access_token);
//       setUser(response.data.user);

//       return { success: true };
//     } catch (error) {
//       return {
//         success: false,
//         error: error.response?.data?.error || "Signup failed",
//       };
//     }
//   };

//   const loginWithGoogle = async (googleCredential) => {
//     try {
//       const response = await api.post("/api/auth/google", {
//         token: googleCredential,
//       });

//       localStorage.setItem("token", response.data.access_token);
//       setUser(response.data.user);

//       return { success: true };
//     } catch (error) {
//       return {
//         success: false,
//         error: error.response?.data?.error || "Google login failed",
//       };
//     }
//   };

//   const logout = () => {
//     localStorage.removeItem("token");
//     setUser(null);
//     return { success: true };
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         authChecked,
//         login,
//         signup,
//         loginWithGoogle,
//         logout,
//       }}
//     >
//       {authChecked ? children : <div>Loading...</div>}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);