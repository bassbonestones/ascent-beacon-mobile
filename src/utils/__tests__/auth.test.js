import * as SecureStore from "expo-secure-store";
import {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  isAuthenticated,
} from "../auth";

// Mock Platform to simulate native (non-web)
jest.mock("react-native", () => ({
  Platform: {
    OS: "ios",
  },
}));

describe("auth utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("saveTokens", () => {
    it("saves tokens to SecureStore on native", async () => {
      await saveTokens("test-access-token", "test-refresh-token");

      expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        "access_token",
        "test-access-token",
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        "refresh_token",
        "test-refresh-token",
      );
    });
  });

  describe("getAccessToken", () => {
    it("retrieves access token from SecureStore", async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce("stored-access-token");

      const token = await getAccessToken();

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith("access_token");
      expect(token).toBe("stored-access-token");
    });

    it("returns null when no token stored", async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce(null);

      const token = await getAccessToken();

      expect(token).toBeNull();
    });
  });

  describe("getRefreshToken", () => {
    it("retrieves refresh token from SecureStore", async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce("stored-refresh-token");

      const token = await getRefreshToken();

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith("refresh_token");
      expect(token).toBe("stored-refresh-token");
    });
  });

  describe("clearTokens", () => {
    it("deletes both tokens from SecureStore", async () => {
      await clearTokens();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("access_token");
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("refresh_token");
    });
  });

  describe("isAuthenticated", () => {
    it("returns true when access token exists", async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce("some-token");

      const result = await isAuthenticated();

      expect(result).toBe(true);
    });

    it("returns false when no access token", async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce(null);

      const result = await isAuthenticated();

      expect(result).toBe(false);
    });

    it("returns false when access token is empty string", async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce("");

      const result = await isAuthenticated();

      expect(result).toBe(false);
    });
  });
});
