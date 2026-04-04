import { saveTokens, getRefreshToken, clearTokens } from "../utils/auth";
import { logError } from "../utils/logger";
import type { User, AuthResponse } from "../types";
import type ApiServiceBase from "./apiBase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;

/**
 * Interface for auth methods added by the mixin.
 */
export interface AuthMethods {
  loginWithGoogle(
    idToken: string,
    deviceId?: string | null,
    deviceName?: string | null,
  ): Promise<User>;
  devLogin(): Promise<User>;
  requestMagicLink(email: string): Promise<{ message: string }>;
  verifyMagicLink(
    email: string,
    code: string,
    deviceId?: string | null,
    deviceName?: string | null,
  ): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}

/**
 * Auth-related API methods mixin.
 */
export const authMethods = <TBase extends Constructor<ApiServiceBase>>(
  Base: TBase,
) =>
  class extends Base implements AuthMethods {
    async loginWithGoogle(
      idToken: string,
      deviceId: string | null = null,
      deviceName: string | null = null,
    ): Promise<User> {
      const data = await this.request<AuthResponse>("/auth/google", {
        method: "POST",
        body: JSON.stringify({
          id_token: idToken,
          device_id: deviceId,
          device_name: deviceName,
        }),
        skipAuth: true,
      });
      await saveTokens(data.access_token, data.refresh_token);
      return data.user;
    }

    async devLogin(): Promise<User> {
      const data = await this.request<AuthResponse>("/auth/dev-login", {
        method: "POST",
        body: JSON.stringify({}),
        skipAuth: true,
      });
      await saveTokens(data.access_token, data.refresh_token);
      return data.user;
    }

    async requestMagicLink(email: string): Promise<{ message: string }> {
      return await this.request<{ message: string }>("/auth/email/request", {
        method: "POST",
        body: JSON.stringify({ email }),
        skipAuth: true,
      });
    }

    async verifyMagicLink(
      email: string,
      code: string,
      deviceId: string | null = null,
      deviceName: string | null = null,
    ): Promise<User> {
      const data = await this.request<AuthResponse>("/auth/email/verify", {
        method: "POST",
        body: JSON.stringify({
          email,
          token: code,
          device_id: deviceId,
          device_name: deviceName,
        }),
        skipAuth: true,
      });
      await saveTokens(data.access_token, data.refresh_token);
      return data.user;
    }

    async logout(): Promise<void> {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        try {
          await this.request("/auth/logout", {
            method: "POST",
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
        } catch (e) {
          logError("Logout error:", e);
        }
      }
      await clearTokens();
    }

    async getCurrentUser(): Promise<User | null> {
      return await this.request<User | null>("/me", {
        suppressAuthErrors: true,
      });
    }
  };
