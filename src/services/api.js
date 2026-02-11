import { API_URL } from "../config";
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
} from "../utils/auth";

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const accessToken = await getAccessToken();

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (accessToken && !options.skipAuth) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    try {
      let response = await fetch(url, {
        ...options,
        headers,
      });

      // If unauthorized, try refreshing token
      if (response.status === 401 && !options.skipAuth) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry with new token
          const newAccessToken = await getAccessToken();
          headers["Authorization"] = `Bearer ${newAccessToken}`;
          response = await fetch(url, {
            ...options,
            headers,
          });
        } else {
          await clearTokens();
          if (options.suppressAuthErrors) {
            return null;
          }
          throw new Error("Session expired");
        }
      }

      // Parse JSON response
      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(data.detail || "Request failed");
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
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  }

  // Auth endpoints
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
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    await clearTokens();
  }

  async getCurrentUser() {
    return await this.request("/me", { suppressAuthErrors: true });
  }

  // Values endpoints
  async getValues() {
    return await this.request("/values");
  }

  async createValue(valueData) {
    return await this.request("/values", {
      method: "POST",
      body: JSON.stringify(valueData),
    });
  }

  async updateValue(valueId, valueData) {
    return await this.request(`/values/${valueId}`, {
      method: "PUT",
      body: JSON.stringify(valueData),
    });
  }

  async deleteValue(valueId) {
    return await this.request(`/values/${valueId}`, {
      method: "DELETE",
    });
  }

  async getValueHistory(valueId) {
    return await this.request(`/values/${valueId}/history`);
  }

  async matchValue(query) {
    return await this.request("/values/match", {
      method: "POST",
      body: JSON.stringify({ query }),
    });
  }

  async acknowledgeValueInsight(valueId, revisionId = null) {
    return await this.request(`/values/${valueId}/insights/acknowledge`, {
      method: "POST",
      body: JSON.stringify({ revision_id: revisionId }),
    });
  }

  // Assistant endpoints
  async createAssistantSession(contextMode = null) {
    return await this.request("/assistant/sessions", {
      method: "POST",
      body: JSON.stringify({ context_mode: contextMode }),
    });
  }

  async getAssistantSession(sessionId) {
    return await this.request(`/assistant/sessions/${sessionId}`);
  }

  async sendMessage(sessionId, content, inputModality = "text") {
    return await this.request(`/assistant/sessions/${sessionId}/message`, {
      method: "POST",
      body: JSON.stringify({ content, input_modality: inputModality }),
    });
  }

  async transcribeAudio(audioBlob, filename = "audio.m4a") {
    const formData = new FormData();
    formData.append("audio", audioBlob, filename);

    return await this.request("/voice/stt", {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  // Recommendation endpoints
  async getPendingRecommendations() {
    return await this.request("/recommendations/pending");
  }

  async getSessionRecommendations(sessionId) {
    return await this.request(`/recommendations/session/${sessionId}`);
  }

  async acceptRecommendation(recommendationId) {
    return await this.request(`/recommendations/${recommendationId}/accept`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  async rejectRecommendation(recommendationId, reason = null) {
    return await this.request(`/recommendations/${recommendationId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  // Discovery endpoints
  async getDiscoveryPrompts() {
    return await this.request("/discovery/prompts");
  }

  async getUserSelections() {
    return await this.request("/discovery/selections");
  }

  async createSelection(
    promptId,
    bucket = "important",
    displayOrder = 0,
    customText = null,
  ) {
    return await this.request("/discovery/selections", {
      method: "POST",
      body: JSON.stringify({
        prompt_id: promptId,
        bucket,
        display_order: displayOrder,
        custom_text: customText,
      }),
    });
  }

  async updateSelection(selectionId, bucket, displayOrder) {
    return await this.request(`/discovery/selections/${selectionId}`, {
      method: "PUT",
      body: JSON.stringify({ bucket, display_order: displayOrder }),
    });
  }

  async deleteSelection(selectionId) {
    return await this.request(`/discovery/selections/${selectionId}`, {
      method: "DELETE",
    });
  }

  async bulkUpdateSelections(selections) {
    return await this.request("/discovery/selections/bulk", {
      method: "POST",
      body: JSON.stringify({ selections }),
    });
  }
}

export default new ApiService();
