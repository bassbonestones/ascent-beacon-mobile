import { API_URL } from "../config";
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
} from "../utils/auth";
import { logError } from "../utils/logger";
import type { RefreshResponse } from "../types";

/**
 * Extended request options with custom properties.
 */
export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: string | FormData;
  skipAuth?: boolean;
  suppressAuthErrors?: boolean;
}

/**
 * API error with optional validation data.
 */
export interface ApiErrorWithValidation extends Error {
  validationData?: Record<string, unknown>;
}

/**
 * Base API service with request handling and token refresh.
 */
class ApiServiceBase {
  async request<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {},
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const accessToken = await getAccessToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (accessToken && !options.skipAuth) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

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
          if (options.suppressAuthErrors) return null as T;
          throw new Error("Session expired");
        }
      }

      let data: T;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : ({} as T);
      } catch {
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        let errorMessage = "Request failed";
        const dataAsAny = data as Record<string, unknown>;

        // Check for dependency blocked response (409 with blockers)
        if (response.status === 409 && Array.isArray(dataAsAny.blockers)) {
          // Include blockers in error for downstream handling
          const error = new Error(
            JSON.stringify(data),
          ) as ApiErrorWithValidation;
          error.validationData = dataAsAny;
          (error as Error & { isDependencyBlocked: boolean }).isDependencyBlocked = true;
          throw error;
        }

        if (dataAsAny.detail) {
          errorMessage =
            typeof dataAsAny.detail === "string"
              ? dataAsAny.detail
              : JSON.stringify(dataAsAny.detail);
        } else if (dataAsAny.message) {
          errorMessage = dataAsAny.message as string;
        } else if (dataAsAny.error) {
          errorMessage = dataAsAny.error as string;
        }

        if (dataAsAny.name_feedback || dataAsAny.why_feedback) {
          const error = new Error(
            JSON.stringify(data),
          ) as ApiErrorWithValidation;
          error.validationData = dataAsAny;
          throw error;
        }
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      logError("API Error:", error);
      throw error;
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return false;

      const data = await this.request<RefreshResponse>("/auth/refresh", {
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
