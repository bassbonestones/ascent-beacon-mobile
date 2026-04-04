/**
 * Tests for API Auth methods
 */

import ApiServiceBase from "../apiBase";
import { authMethods } from "../apiAuth";
import * as auth from "../../utils/auth";

// Mock auth utilities
jest.mock("../../utils/auth", () => ({
  saveTokens: jest.fn(),
  getRefreshToken: jest.fn(),
  clearTokens: jest.fn(),
  getAccessToken: jest.fn(),
}));

// Declare global fetch type for tests
declare const global: {
  fetch: jest.Mock;
};

// Mock fetch
global.fetch = jest.fn();

// Type assertions for mocked auth functions
const mockedAuth = auth as jest.Mocked<typeof auth>;

// Create test class with auth methods
const ApiWithAuth = authMethods(ApiServiceBase);

describe("apiAuth methods", () => {
  let api: InstanceType<typeof ApiWithAuth>;

  beforeEach(() => {
    api = new ApiWithAuth();
    jest.clearAllMocks();
    mockedAuth.getAccessToken.mockResolvedValue("test-token");
    mockedAuth.getRefreshToken.mockResolvedValue("refresh-token");
  });

  describe("loginWithGoogle", () => {
    it("should login with Google ID token and save tokens", async () => {
      const mockUser = { id: "u1", email: "test@example.com" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              access_token: "new-access",
              refresh_token: "new-refresh",
              user: mockUser,
            }),
          ),
      });

      const result = await api.loginWithGoogle("google-id-token");

      expect(mockedAuth.saveTokens).toHaveBeenCalledWith(
        "new-access",
        "new-refresh",
      );
      expect(result).toEqual(mockUser);
    });

    it("should pass device info when provided", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              access_token: "token",
              refresh_token: "refresh",
              user: {},
            }),
          ),
      });

      await api.loginWithGoogle("token", "device-123", "iPhone");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining("device-123"),
        }),
      );
    });
  });

  describe("devLogin", () => {
    it("should perform dev login and save tokens", async () => {
      const mockUser = { id: "u1", email: "dev@test.com" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              access_token: "dev-access",
              refresh_token: "dev-refresh",
              user: mockUser,
            }),
          ),
      });

      const result = await api.devLogin();

      expect(mockedAuth.saveTokens).toHaveBeenCalledWith(
        "dev-access",
        "dev-refresh",
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe("requestMagicLink", () => {
    it("should request magic link for email", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"success": true}'),
      });

      const result = await api.requestMagicLink("test@example.com");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/email/request"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("test@example.com"),
        }),
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe("verifyMagicLink", () => {
    it("should verify magic link code and save tokens", async () => {
      const mockUser = { id: "u1", email: "test@example.com" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              access_token: "magic-access",
              refresh_token: "magic-refresh",
              user: mockUser,
            }),
          ),
      });

      const result = await api.verifyMagicLink("test@example.com", "123456");

      expect(mockedAuth.saveTokens).toHaveBeenCalledWith(
        "magic-access",
        "magic-refresh",
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe("logout", () => {
    it("should call logout endpoint and clear tokens", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("{}"),
      });

      await api.logout();

      expect(mockedAuth.clearTokens).toHaveBeenCalled();
    });

    it("should clear tokens even if logout request fails", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );

      await api.logout();

      expect(mockedAuth.clearTokens).toHaveBeenCalled();
    });

    it("should skip logout request if no refresh token", async () => {
      mockedAuth.getRefreshToken.mockResolvedValueOnce(null);

      await api.logout();

      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockedAuth.clearTokens).toHaveBeenCalled();
    });
  });

  describe("getCurrentUser", () => {
    it("should get current user", async () => {
      const mockUser = { id: "u1", email: "test@example.com" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockUser)),
      });

      const result = await api.getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it("should return null on auth error when suppressAuthErrors is used", async () => {
      mockedAuth.getRefreshToken.mockResolvedValue(null);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("{}"),
      });

      const result = await api.getCurrentUser();

      expect(result).toBeNull();
    });
  });
});
