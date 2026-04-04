import { API_URL } from "../config";
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
} from "../utils/auth";

/**
 * Base API service with request handling and token refresh.
 */
class ApiServiceBase {
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const accessToken = await getAccessToken();
    const headers = { "Content-Type": "application/json", ...options.headers };

    if (accessToken && !options.skipAuth)
      headers["Authorization"] = `Bearer ${accessToken}`;

    try {
      let response = await fetch(url, { ...options, headers });

      if (response.status === 401 && !options.skipAuth) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          const newToken = await getAccessToken();
          headers["Authorization"] = `Bearer ${newToken}`;
          response = await fetch(url, { ...options, headers });
        } else {
          await clearTokens();
          if (options.suppressAuthErrors) return null;
          throw new Error("Session expired");
        }
      }

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        let errorMessage = "Request failed";
        if (data.detail)
          errorMessage =
            typeof data.detail === "string"
              ? data.detail
              : JSON.stringify(data.detail);
        else if (data.error) errorMessage = data.error;
        if (data.name_feedback || data.why_feedback) {
          const error = new Error(JSON.stringify(data));
          error.validationData = data;
          throw error;
        }
        throw new Error(errorMessage);
      }
      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  async refreshAccessToken() {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return false;
      const data = await this.request("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
        skipAuth: true,
      });
      await saveTokens(data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    }
  }
}

export default ApiServiceBase;
