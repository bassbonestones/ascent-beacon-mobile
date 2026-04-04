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

// Type SecureStore mocks
const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe("auth utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("saveTokens", () => {
    it("saves tokens to SecureStore on native", async () => {
      await saveTokens("test-access-token", "test-refresh-token");

      expect(mockedSecureStore.setItemAsync).toHaveBeenCalledTimes(2);
      expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(
        "access_token",
        "test-access-token",
      );
      expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(
        "refresh_token",
        "test-refresh-token",
      );
    });
  });

  describe("getAccessToken", () => {
    it("retrieves access token from SecureStore", async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce(
        "stored-access-token",
      );

      const token = await getAccessToken();

      expect(mockedSecureStore.getItemAsync).toHaveBeenCalledWith(
        "access_token",
      );
      expect(token).toBe("stored-access-token");
    });

    it("returns null when no token stored", async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce(null);

      const token = await getAccessToken();

      expect(token).toBeNull();
    });
  });

  describe("getRefreshToken", () => {
    it("retrieves refresh token from SecureStore", async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce(
        "stored-refresh-token",
      );

      const token = await getRefreshToken();

      expect(mockedSecureStore.getItemAsync).toHaveBeenCalledWith(
        "refresh_token",
      );
      expect(token).toBe("stored-refresh-token");
    });
  });

  describe("clearTokens", () => {
    it("deletes both tokens from SecureStore", async () => {
      await clearTokens();

      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith(
        "access_token",
      );
      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith(
        "refresh_token",
      );
    });
  });

  describe("isAuthenticated", () => {
    it("returns true when access token exists", async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce("some-token");

      const result = await isAuthenticated();

      expect(result).toBe(true);
    });

    it("returns false when no access token", async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce(null);

      const result = await isAuthenticated();

      expect(result).toBe(false);
    });

    it("returns false when access token is empty string", async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce("");

      const result = await isAuthenticated();

      expect(result).toBe(false);
    });
  });
});
