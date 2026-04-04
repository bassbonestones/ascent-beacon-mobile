/**
 * Tests for AuthContext
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react-native";
import { Text } from "react-native";
import { AuthProvider, useAuth } from "../AuthContext";
import type { User } from "../../types";

// Mock api module
jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    getCurrentUser: jest.fn(),
    logout: jest.fn(),
  },
}));

// Mock auth utils
jest.mock("../../utils/auth", () => ({
  isAuthenticated: jest.fn(),
  clearTokens: jest.fn(),
}));

import api from "../../services/api";
import { isAuthenticated, clearTokens } from "../../utils/auth";

// Type assertions for mocked functions
const mockedApi = api as jest.Mocked<typeof api>;
const mockedIsAuthenticated = isAuthenticated as jest.MockedFunction<
  typeof isAuthenticated
>;
const mockedClearTokens = clearTokens as jest.MockedFunction<
  typeof clearTokens
>;

// Test component that uses auth
const AuthConsumer: React.FC = () => {
  const {
    user,
    loading,
    isAuthenticated: authIsAuthenticated,
    needsOnboarding,
  } = useAuth();
  return (
    <>
      <Text testID="loading">{loading ? "loading" : "ready"}</Text>
      <Text testID="authenticated">{authIsAuthenticated ? "yes" : "no"}</Text>
      <Text testID="user">{user?.primary_email || "none"}</Text>
      <Text testID="onboarding">{needsOnboarding ? "yes" : "no"}</Text>
    </>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useAuth hook", () => {
    it("should throw error when used outside AuthProvider", () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<AuthConsumer />);
      }).toThrow("useAuth must be used within an AuthProvider");

      consoleError.mockRestore();
    });
  });

  describe("AuthProvider", () => {
    it("should provide loading state initially", async () => {
      mockedIsAuthenticated.mockResolvedValueOnce(false);

      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>,
      );

      // Initially loading
      expect(screen.getByTestId("loading").props.children).toBe("loading");

      await waitFor(() => {
        expect(screen.getByTestId("loading").props.children).toBe("ready");
      });
    });

    it("should set user when authenticated", async () => {
      const mockUser: User = {
        id: "u1",
        primary_email: "test@example.com",
        display_name: "Test User",
        is_email_verified: true,
        created_at: new Date().toISOString(),
      };
      mockedIsAuthenticated.mockResolvedValueOnce(true);
      mockedApi.getCurrentUser.mockResolvedValueOnce(mockUser);

      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("user").props.children).toBe(
          "test@example.com",
        );
        expect(screen.getByTestId("authenticated").props.children).toBe("yes");
      });
    });

    it("should clear user when not authenticated", async () => {
      mockedIsAuthenticated.mockResolvedValueOnce(false);

      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated").props.children).toBe("no");
        expect(screen.getByTestId("user").props.children).toBe("none");
      });
    });

    it("should clear tokens when getCurrentUser fails", async () => {
      mockedIsAuthenticated.mockResolvedValueOnce(true);
      mockedApi.getCurrentUser.mockRejectedValueOnce(new Error("Unauthorized"));

      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(mockedClearTokens).toHaveBeenCalled();
        expect(screen.getByTestId("authenticated").props.children).toBe("no");
      });
    });

    it("should detect when user needs onboarding (no display_name)", async () => {
      const mockUser: User = {
        id: "u1",
        primary_email: "test@example.com",
        display_name: null,
        is_email_verified: true,
        created_at: new Date().toISOString(),
      };
      mockedIsAuthenticated.mockResolvedValueOnce(true);
      mockedApi.getCurrentUser.mockResolvedValueOnce(mockUser);

      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("onboarding").props.children).toBe("yes");
      });
    });

    it("should detect when user needs onboarding (unverified email)", async () => {
      const mockUser: User = {
        id: "u1",
        primary_email: "test@example.com",
        display_name: "Test",
        is_email_verified: false,
        created_at: new Date().toISOString(),
      };
      mockedIsAuthenticated.mockResolvedValueOnce(true);
      mockedApi.getCurrentUser.mockResolvedValueOnce(mockUser);

      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("onboarding").props.children).toBe("yes");
      });
    });
  });

  describe("login function", () => {
    it("should set user on login", async () => {
      mockedIsAuthenticated.mockResolvedValueOnce(false);

      const LoginButton: React.FC = () => {
        const { login, user } = useAuth();
        return (
          <>
            <Text testID="email">{user?.primary_email || "none"}</Text>
            <Text
              testID="loginBtn"
              onPress={() =>
                login({
                  id: "u1",
                  primary_email: "new@example.com",
                  display_name: null,
                  is_email_verified: false,
                  created_at: new Date().toISOString(),
                })
              }
            >
              Login
            </Text>
          </>
        );
      };

      render(
        <AuthProvider>
          <LoginButton />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("email").props.children).toBe("none");
      });

      await act(async () => {
        screen.getByTestId("loginBtn").props.onPress();
      });

      expect(screen.getByTestId("email").props.children).toBe(
        "new@example.com",
      );
    });
  });

  describe("logout function", () => {
    it("should clear user on logout", async () => {
      const mockUser: User = {
        id: "u1",
        primary_email: "test@example.com",
        display_name: null,
        is_email_verified: false,
        created_at: new Date().toISOString(),
      };
      mockedIsAuthenticated.mockResolvedValueOnce(true);
      mockedApi.getCurrentUser.mockResolvedValueOnce(mockUser);
      mockedApi.logout.mockResolvedValueOnce(undefined);

      const LogoutButton: React.FC = () => {
        const { logout, user } = useAuth();
        return (
          <>
            <Text testID="email">{user?.primary_email || "none"}</Text>
            <Text testID="logoutBtn" onPress={logout}>
              Logout
            </Text>
          </>
        );
      };

      render(
        <AuthProvider>
          <LogoutButton />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("email").props.children).toBe(
          "test@example.com",
        );
      });

      await act(async () => {
        screen.getByTestId("logoutBtn").props.onPress();
      });

      await waitFor(() => {
        expect(screen.getByTestId("email").props.children).toBe("none");
      });

      expect(mockedApi.logout).toHaveBeenCalled();
    });

    it("should clear user even if api.logout fails", async () => {
      const mockUser: User = {
        id: "u1",
        primary_email: "test@example.com",
        display_name: null,
        is_email_verified: false,
        created_at: new Date().toISOString(),
      };
      mockedIsAuthenticated.mockResolvedValueOnce(true);
      mockedApi.getCurrentUser.mockResolvedValueOnce(mockUser);
      mockedApi.logout.mockRejectedValueOnce(new Error("Network error"));

      const LogoutButton: React.FC = () => {
        const { logout, user } = useAuth();
        return (
          <>
            <Text testID="email">{user?.primary_email || "none"}</Text>
            <Text testID="logoutBtn" onPress={logout}>
              Logout
            </Text>
          </>
        );
      };

      render(
        <AuthProvider>
          <LogoutButton />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("email").props.children).toBe(
          "test@example.com",
        );
      });

      await act(async () => {
        screen.getByTestId("logoutBtn").props.onPress();
      });

      await waitFor(() => {
        expect(screen.getByTestId("email").props.children).toBe("none");
      });
    });
  });

  describe("updateUser function", () => {
    it("should update user data", async () => {
      const mockUser: User = {
        id: "u1",
        primary_email: "test@example.com",
        display_name: "Original Name",
        is_email_verified: true,
        created_at: new Date().toISOString(),
      };
      mockedIsAuthenticated.mockResolvedValueOnce(true);
      mockedApi.getCurrentUser.mockResolvedValueOnce(mockUser);

      const UpdateButton: React.FC = () => {
        const { updateUser, user } = useAuth();
        return (
          <>
            <Text testID="name">{user?.display_name || "none"}</Text>
            <Text
              testID="updateBtn"
              onPress={() => updateUser({ display_name: "Updated Name" })}
            >
              Update
            </Text>
          </>
        );
      };

      render(
        <AuthProvider>
          <UpdateButton />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("name").props.children).toBe("Original Name");
      });

      await act(async () => {
        screen.getByTestId("updateBtn").props.onPress();
      });

      expect(screen.getByTestId("name").props.children).toBe("Updated Name");
    });
  });
});
