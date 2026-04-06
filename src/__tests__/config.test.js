/**
 * Tests for config module
 */

import { Platform } from "react-native";

// Save original __DEV__ value
const originalDev = global.__DEV__;

describe("config", () => {
  beforeEach(() => {
    // Reset module cache before each test
    jest.resetModules();
  });

  afterEach(() => {
    // Restore __DEV__
    global.__DEV__ = originalDev;
  });

  describe("API_URL", () => {
    it("should export API_URL", () => {
      const { API_URL } = require("../config");
      expect(API_URL).toBeDefined();
      expect(typeof API_URL).toBe("string");
    });

    it("should use localhost for web platform in dev", () => {
      global.__DEV__ = true;
      jest.doMock("react-native", () => ({
        Platform: { OS: "web" },
      }));
      jest.resetModules();

      const { API_URL } = require("../config");
      // In dev mode with web platform, should use localhost
      expect(API_URL).toContain("localhost");
    });
  });

  describe("GOOGLE_CLIENT_ID", () => {
    it("should export GOOGLE_CLIENT_ID", () => {
      const { GOOGLE_CLIENT_ID } = require("../config");
      expect(GOOGLE_CLIENT_ID).toBeDefined();
      expect(typeof GOOGLE_CLIENT_ID).toBe("string");
      expect(GOOGLE_CLIENT_ID).toContain(".apps.googleusercontent.com");
    });
  });
});
