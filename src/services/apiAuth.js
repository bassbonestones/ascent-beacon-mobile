import { saveTokens, getRefreshToken, clearTokens } from "../utils/auth";

/**
 * Auth-related API methods mixin.
 */
export const authMethods = (Base) =>
  class extends Base {
    async loginWithGoogle(idToken, deviceId = null, deviceName = null) {
      const data = await this.request("/auth/google", {
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

    async devLogin() {
      const data = await this.request("/auth/dev-login", {
        method: "POST",
        body: JSON.stringify({}),
        skipAuth: true,
      });
      await saveTokens(data.access_token, data.refresh_token);
      return data.user;
    }

    async requestMagicLink(email) {
      return await this.request("/auth/email/request", {
        method: "POST",
        body: JSON.stringify({ email }),
        skipAuth: true,
      });
    }

    async verifyMagicLink(email, code, deviceId = null, deviceName = null) {
      const data = await this.request("/auth/email/verify", {
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

    async logout() {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        try {
          await this.request("/auth/logout", {
            method: "POST",
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
        } catch (e) {
          console.error("Logout error:", e);
        }
      }
      await clearTokens();
    }

    async getCurrentUser() {
      return await this.request("/me", { suppressAuthErrors: true });
    }
  };
