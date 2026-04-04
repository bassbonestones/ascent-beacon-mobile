import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import api from "../services/api";
import { isAuthenticated, clearTokens } from "../utils/auth";

/**
 * Authentication Context - provides user state and auth actions to the app.
 */
const AuthContext = createContext(null);

/**
 * Hook to access auth context.
 * @returns {Object} { user, loading, login, logout, updateUser, checkAuth }
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Provider component for authentication state.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Check if user is authenticated and load user data.
   */
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const authed = await isAuthenticated();

      if (authed) {
        try {
          const currentUser = await api.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            return currentUser;
          } else {
            setUser(null);
            return null;
          }
        } catch (error) {
          // Token may have expired, clear it
          await clearTokens();
          setUser(null);
          return null;
        }
      } else {
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error("Auth check failed:", error.message);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Handle successful login.
   * @param {Object} userData - User data from login response
   */
  const login = useCallback((userData) => {
    setUser(userData);
  }, []);

  /**
   * Handle logout.
   */
  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
    }
  }, []);

  /**
   * Update user data (e.g., after onboarding).
   * @param {Object} userData - Updated user data
   */
  const updateUser = useCallback((userData) => {
    setUser(userData);
  }, []);

  /**
   * Check if user needs onboarding.
   */
  const needsOnboarding =
    user && (!user.display_name || !user.is_email_verified);

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    checkAuth,
    needsOnboarding,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;
