import type {
  AssistantSession,
  AssistantChatResponse,
  AssistantRecommendation,
  DiscoveryPrompt,
  ValueSelection,
  SelectionBucket,
  BulkSelectionUpdate,
  DiscoveryPromptsResponse,
  UserSelectionsResponse,
} from "../types";
import type ApiServiceBase from "./apiBase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;

// ============================================================================
// Assistant Methods
// ============================================================================

/**
 * Interface for assistant methods added by the mixin.
 */
export interface AssistantMethods {
  createAssistantSession(
    contextMode?: string | null,
  ): Promise<AssistantSession>;
  getAssistantSession(sessionId: string): Promise<AssistantSession>;
  sendMessage(
    sessionId: string,
    content: string,
    inputModality?: string,
  ): Promise<AssistantChatResponse>;
  transcribeAudio(
    audioBlob: Blob,
    filename?: string,
  ): Promise<{ text: string }>;
}

/**
 * Assistant-related API methods mixin.
 */
export const assistantMethods = <TBase extends Constructor<ApiServiceBase>>(
  Base: TBase,
) =>
  class extends Base implements AssistantMethods {
    async createAssistantSession(
      contextMode: string | null = null,
    ): Promise<AssistantSession> {
      return await this.request<AssistantSession>("/assistant/sessions", {
        method: "POST",
        body: JSON.stringify({ context_mode: contextMode }),
      });
    }

    async getAssistantSession(sessionId: string): Promise<AssistantSession> {
      return await this.request<AssistantSession>(
        `/assistant/sessions/${sessionId}`,
      );
    }

    async sendMessage(
      sessionId: string,
      content: string,
      inputModality: string = "text",
    ): Promise<AssistantChatResponse> {
      return await this.request<AssistantChatResponse>(
        `/assistant/sessions/${sessionId}/message`,
        {
          method: "POST",
          body: JSON.stringify({ content, input_modality: inputModality }),
        },
      );
    }

    async transcribeAudio(
      audioBlob: Blob,
      filename: string = "audio.m4a",
    ): Promise<{ text: string }> {
      const formData = new FormData();
      formData.append("audio", audioBlob, filename);
      return await this.request<{ text: string }>("/voice/stt", {
        method: "POST",
        body: formData,
        headers: {},
      });
    }
  };

// ============================================================================
// Recommendations Methods
// ============================================================================

/**
 * Interface for recommendations methods added by the mixin.
 */
export interface RecommendationsMethods {
  getPendingRecommendations(): Promise<AssistantRecommendation[]>;
  getSessionRecommendations(
    sessionId: string,
  ): Promise<AssistantRecommendation[]>;
  acceptRecommendation(
    recommendationId: string,
  ): Promise<AssistantRecommendation>;
  rejectRecommendation(
    recommendationId: string,
    reason?: string | null,
  ): Promise<AssistantRecommendation>;
}

/**
 * Recommendations-related API methods mixin.
 */
export const recommendationsMethods = <
  TBase extends Constructor<ApiServiceBase>,
>(
  Base: TBase,
) =>
  class extends Base implements RecommendationsMethods {
    async getPendingRecommendations(): Promise<AssistantRecommendation[]> {
      return await this.request<AssistantRecommendation[]>(
        "/recommendations/pending",
      );
    }

    async getSessionRecommendations(
      sessionId: string,
    ): Promise<AssistantRecommendation[]> {
      return await this.request<AssistantRecommendation[]>(
        `/recommendations/session/${sessionId}`,
      );
    }

    async acceptRecommendation(
      recommendationId: string,
    ): Promise<AssistantRecommendation> {
      return await this.request<AssistantRecommendation>(
        `/recommendations/${recommendationId}/accept`,
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      );
    }

    async rejectRecommendation(
      recommendationId: string,
      reason: string | null = null,
    ): Promise<AssistantRecommendation> {
      return await this.request<AssistantRecommendation>(
        `/recommendations/${recommendationId}/reject`,
        {
          method: "POST",
          body: JSON.stringify({ reason }),
        },
      );
    }
  };

// ============================================================================
// Discovery Methods
// ============================================================================

/**
 * Discovery state response.
 */
export interface DiscoveryStateResponse {
  prompts: DiscoveryPrompt[];
  selections: ValueSelection[];
  is_complete: boolean;
}

/**
 * Interface for discovery methods added by the mixin.
 */
export interface DiscoveryMethods {
  getDiscoveryPrompts(): Promise<DiscoveryPrompt[]>;
  getUserSelections(): Promise<ValueSelection[]>;
  createSelection(
    promptId: string,
    bucket?: SelectionBucket,
    displayOrder?: number,
    customText?: string | null,
  ): Promise<ValueSelection>;
  updateSelection(
    selectionId: string,
    bucket: SelectionBucket,
    displayOrder: number,
  ): Promise<ValueSelection>;
  deleteSelection(selectionId: string): Promise<void>;
  bulkUpdateSelections(
    selections: BulkSelectionUpdate[],
  ): Promise<ValueSelection[]>;
}

/**
 * Discovery-related API methods mixin.
 */
export const discoveryMethods = <TBase extends Constructor<ApiServiceBase>>(
  Base: TBase,
) =>
  class extends Base implements DiscoveryMethods {
    async getDiscoveryPrompts(): Promise<DiscoveryPrompt[]> {
      const response =
        await this.request<DiscoveryPromptsResponse>("/discovery/prompts");
      return response.prompts;
    }

    async getUserSelections(): Promise<ValueSelection[]> {
      const response = await this.request<UserSelectionsResponse>(
        "/discovery/selections",
      );
      return response.selections;
    }

    async createSelection(
      promptId: string,
      bucket: SelectionBucket = "important",
      displayOrder: number = 0,
      customText: string | null = null,
    ): Promise<ValueSelection> {
      return await this.request<ValueSelection>("/discovery/selections", {
        method: "POST",
        body: JSON.stringify({
          prompt_id: promptId,
          bucket,
          display_order: displayOrder,
          custom_text: customText,
        }),
      });
    }

    async updateSelection(
      selectionId: string,
      bucket: SelectionBucket,
      displayOrder: number,
    ): Promise<ValueSelection> {
      return await this.request<ValueSelection>(
        `/discovery/selections/${selectionId}`,
        {
          method: "PUT",
          body: JSON.stringify({ bucket, display_order: displayOrder }),
        },
      );
    }

    async deleteSelection(selectionId: string): Promise<void> {
      await this.request(`/discovery/selections/${selectionId}`, {
        method: "DELETE",
      });
    }

    async bulkUpdateSelections(
      selections: BulkSelectionUpdate[],
    ): Promise<ValueSelection[]> {
      return await this.request<ValueSelection[]>(
        "/discovery/selections/bulk",
        {
          method: "POST",
          body: JSON.stringify({ selections }),
        },
      );
    }
  };
