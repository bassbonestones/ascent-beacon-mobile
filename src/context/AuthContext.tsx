import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import api from "../services/api";
import { isAuthenticated, clearTokens } from "../utils/auth";
import { logError } from "../utils/logger";
import type { User } from "../types";

/**
 * Auth context value interface.
 */
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  checkAuth: () => Promise<User | null>;
  needsOnboarding: boolean;
  isAuthenticated: boolean;
}

/**
 * Props for AuthProvider component.
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Context - provides user state and auth actions to the app.
 */
const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Hook to access auth context.
 * @returns Auth context value with user state and auth actions
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Provider component for authentication state.
 */
export function AuthProvider({
  children,
}: AuthProviderProps): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Check if user is authenticated and load user data.
   */
  const checkAuth = useCallback(async (): Promise<User | null> => {
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
      logError("Auth check failed:", (error as Error).message);
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
   * @param userData - User data from login response
   */
  const login = useCallback((userData: User): void => {
    setUser(userData);
  }, []);

  /**
   * Handle logout.
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.logout();
    } catch (error) {
      logError("Logout failed:", error);
    } finally {
      setUser(null);
    }
  }, []);

  /**
   * Update user data (e.g., after onboarding).
   * @param userData - Partial user data to merge with existing
   */
  const updateUser = useCallback((userData: Partial<User>): void => {
    setUser((prevUser) => (prevUser ? { ...prevUser, ...userData } : null));
  }, []);

  /**
   * Check if user needs onboarding.
   */
  const needsOnboarding = Boolean(
    user && (!user.display_name || !user.is_email_verified),
  );

  const value: AuthContextValue = {
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

export default AuthContext;
