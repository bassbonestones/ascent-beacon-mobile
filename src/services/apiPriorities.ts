import type {
  Priority,
  PrioritiesListResponse,
  CreatePriorityRequest,
  CreatePriorityRevisionRequest,
  PriorityCheckResponse,
  ValidatePriorityRequest,
  ValidatePriorityResponse,
  PriorityValueLink,
} from "../types";
import type ApiServiceBase from "./apiBase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;

/**
 * Interface for priorities methods added by the mixin.
 */
export interface PrioritiesMethods {
  getPriorities(): Promise<PrioritiesListResponse>;
  createPriority(priorityData: CreatePriorityRequest): Promise<Priority>;
  validatePriority(
    data: ValidatePriorityRequest,
  ): Promise<ValidatePriorityResponse>;
  getPriorityHistory(priorityId: string): Promise<Priority>;
  createPriorityRevision(
    priorityId: string,
    revisionData: CreatePriorityRevisionRequest,
  ): Promise<Priority>;
  anchorPriority(priorityId: string): Promise<Priority>;
  unanchorPriority(priorityId: string): Promise<Priority>;
  checkPriorityStatus(priorityId: string): Promise<PriorityCheckResponse>;
  deletePriority(priorityId: string): Promise<void>;
  getPriorityValueLinks(
    priorityRevisionId: string,
  ): Promise<PriorityValueLink[]>;
  stashPriority(priorityId: string, isStashed: boolean): Promise<Priority>;
  getStashedPriorities(): Promise<PrioritiesListResponse>;
}

/**
 * Priorities-related API methods mixin.
 */
export const prioritiesMethods = <TBase extends Constructor<ApiServiceBase>>(
  Base: TBase,
) =>
  class extends Base implements PrioritiesMethods {
    async getPriorities(): Promise<PrioritiesListResponse> {
      return await this.request<PrioritiesListResponse>("/priorities");
    }

    async createPriority(
      priorityData: CreatePriorityRequest,
    ): Promise<Priority> {
      return await this.request<Priority>("/priorities", {
        method: "POST",
        body: JSON.stringify(priorityData),
      });
    }

    async validatePriority(
      data: ValidatePriorityRequest,
    ): Promise<ValidatePriorityResponse> {
      return await this.request<ValidatePriorityResponse>(
        "/priorities/validate",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
    }

    async getPriorityHistory(priorityId: string): Promise<Priority> {
      return await this.request<Priority>(`/priorities/${priorityId}/history`);
    }

    async createPriorityRevision(
      priorityId: string,
      revisionData: CreatePriorityRevisionRequest,
    ): Promise<Priority> {
      return await this.request<Priority>(
        `/priorities/${priorityId}/revisions`,
        {
          method: "POST",
          body: JSON.stringify(revisionData),
        },
      );
    }

    async anchorPriority(priorityId: string): Promise<Priority> {
      return await this.request<Priority>(`/priorities/${priorityId}/anchor`, {
        method: "POST",
        body: JSON.stringify({}),
      });
    }

    async unanchorPriority(priorityId: string): Promise<Priority> {
      return await this.request<Priority>(
        `/priorities/${priorityId}/unanchor`,
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      );
    }

    async checkPriorityStatus(
      priorityId: string,
    ): Promise<PriorityCheckResponse> {
      return await this.request<PriorityCheckResponse>(
        `/priorities/${priorityId}/check-status`,
      );
    }

    async deletePriority(priorityId: string): Promise<void> {
      await this.request(`/priorities/${priorityId}`, {
        method: "DELETE",
      });
    }

    async getPriorityValueLinks(
      priorityRevisionId: string,
    ): Promise<PriorityValueLink[]> {
      return await this.request<PriorityValueLink[]>(
        `/priority-revisions/${priorityRevisionId}/links`,
      );
    }

    async stashPriority(
      priorityId: string,
      isStashed: boolean,
    ): Promise<Priority> {
      return await this.request<Priority>(`/priorities/${priorityId}/stash`, {
        method: "POST",
        body: JSON.stringify({ is_stashed: isStashed }),
      });
    }

    async getStashedPriorities(): Promise<PrioritiesListResponse> {
      return await this.request<PrioritiesListResponse>("/priorities/stashed");
    }
  };
