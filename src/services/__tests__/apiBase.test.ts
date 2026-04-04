/**
 * Tests for API Base Service
 */

import ApiServiceBase from "../apiBase";
import * as auth from "../../utils/auth";
import { API_URL } from "../../config";

// Mock auth utilities
jest.mock("../../utils/auth", () => ({
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
  saveTokens: jest.fn(),
  clearTokens: jest.fn(),
}));

// Declare global fetch type for tests
declare const global: {
  fetch: jest.Mock;
};

// Mock fetch
global.fetch = jest.fn();

// Type assertions for mocked auth functions
const mockedAuth = auth as jest.Mocked<typeof auth>;

describe("ApiServiceBase", () => {
  let api: ApiServiceBase;

  beforeEach(() => {
    api = new ApiServiceBase();
    jest.clearAllMocks();
    mockedAuth.getAccessToken.mockResolvedValue("test-token");
    mockedAuth.getRefreshToken.mockResolvedValue("refresh-token");
  });

  describe("request", () => {
    it("should make successful GET request with auth header", async () => {
      const mockResponse = { data: "test" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      });

      const result = await api.request("/test");

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/test`,
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("should skip auth header when skipAuth is true", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("{}"),
      });

      await api.request("/test", { skipAuth: true });

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/test`,
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        }),
      );
    });

    it("should make POST request with body", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"success": true}'),
      });

      const body = { name: "test" };
      await api.request("/test", {
        method: "POST",
        body: JSON.stringify(body),
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/test`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(body),
        }),
      );
    });

    it("should throw error on non-ok response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('{"detail": "Bad request"}'),
      });

      await expect(api.request("/test")).rejects.toThrow("Bad request");
    });

    it("should handle error response with error field", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('{"error": "Server error"}'),
      });

      await expect(api.request("/test")).rejects.toThrow("Server error");
    });

    it("should handle validation errors with feedback fields", async () => {
      const validationError = {
        name_feedback: "Name too short",
        why_feedback: "Description required",
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify(validationError)),
      });

      try {
        await api.request("/test");
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(
          (error as Error & { validationData?: unknown }).validationData,
        ).toEqual(validationError);
      }
    });

    it("should attempt token refresh on 401 response", async () => {
      // First request returns 401
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: () => Promise.resolve("{}"),
        })
        // Refresh request succeeds
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(
              '{"access_token": "new-token", "refresh_token": "new-refresh"}',
            ),
        })
        // Retry request succeeds
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve('{"data": "success"}'),
        });

      mockedAuth.getAccessToken
        .mockResolvedValueOnce("old-token")
        .mockResolvedValueOnce("new-token");

      const result = await api.request("/test");

      expect(mockedAuth.saveTokens).toHaveBeenCalledWith(
        "new-token",
        "new-refresh",
      );
      expect(result).toEqual({ data: "success" });
    });

    it("should clear tokens and throw when refresh fails", async () => {
      // First request returns 401
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: () => Promise.resolve("{}"),
        })
        // Refresh fails
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: () => Promise.resolve('{"detail": "Invalid refresh token"}'),
        });

      await expect(api.request("/test")).rejects.toThrow("Session expired");
      expect(mockedAuth.clearTokens).toHaveBeenCalled();
    });

    it("should return null on auth error when suppressAuthErrors is true", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: () => Promise.resolve("{}"),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: () => Promise.resolve("{}"),
        });

      const result = await api.request("/test", { suppressAuthErrors: true });

      expect(result).toBeNull();
    });

    it("should handle empty response body", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: () => Promise.resolve(""),
      });

      const result = await api.request("/test");

      expect(result).toEqual({});
    });

    it("should throw on invalid JSON response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("not json"),
      });

      await expect(api.request("/test")).rejects.toThrow(
        "Invalid response from server",
      );
    });
  });

  describe("refreshAccessToken", () => {
    it("should return false when no refresh token available", async () => {
      mockedAuth.getRefreshToken.mockResolvedValueOnce(null);

      const result = await api.refreshAccessToken();

      expect(result).toBe(false);
    });

    it("should return true and save tokens on successful refresh", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            '{"access_token": "new", "refresh_token": "new-refresh"}',
          ),
      });

      const result = await api.refreshAccessToken();

      expect(result).toBe(true);
      expect(mockedAuth.saveTokens).toHaveBeenCalledWith("new", "new-refresh");
    });

    it("should return false on refresh error", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );

      const result = await api.refreshAccessToken();

      expect(result).toBe(false);
    });
  });
});
