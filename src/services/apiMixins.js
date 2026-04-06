/**
 * Assistant-related API methods mixin.
 */
export const assistantMethods = (Base) =>
  class extends Base {
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
        headers: {},
      });
    }
  };

/**
 * Recommendations-related API methods mixin.
 */
export const recommendationsMethods = (Base) =>
  class extends Base {
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
  };

/**
 * Discovery-related API methods mixin.
 */
export const discoveryMethods = (Base) =>
  class extends Base {
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
  };
