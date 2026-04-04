import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

const isWeb = Platform.OS === "web";

/**
 * Save authentication tokens to secure storage.
 */
export const saveTokens = async (
  accessToken: string,
  refreshToken: string,
): Promise<void> => {
  if (isWeb) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }
};

/**
 * Get the access token from secure storage.
 */
export const getAccessToken = async (): Promise<string | null> => {
  if (isWeb) {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
};

/**
 * Get the refresh token from secure storage.
 */
export const getRefreshToken = async (): Promise<string | null> => {
  if (isWeb) {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
};

/**
 * Clear all authentication tokens from secure storage.
 */
export const clearTokens = async (): Promise<void> => {
  if (isWeb) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }
};

/**
 * Check if the user is authenticated (has an access token).
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const accessToken = await getAccessToken();
  return !!accessToken;
};
