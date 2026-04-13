import type {
  Goal,
  GoalListResponse,
  GoalWithSubGoals,
  CreateGoalRequest,
  UpdateGoalRequest,
  UpdateGoalStatusRequest,
  SetPriorityLinksRequest,
  RescheduleGoalsRequest,
  GoalArchivePreviewResponse,
  ArchiveGoalRequest,
} from "../types";
import type ApiServiceBase from "./apiBase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;

/**
 * Interface for goals methods added by the mixin.
 */
export interface GoalsMethods {
  // CRUD
  getGoals(params?: GoalsListParams): Promise<GoalListResponse>;
  getGoal(goalId: string): Promise<Goal>;
  getGoalTree(goalId: string): Promise<GoalWithSubGoals>;
  createGoal(data: CreateGoalRequest): Promise<Goal>;
  updateGoal(goalId: string, data: UpdateGoalRequest): Promise<Goal>;
  updateGoalStatus(goalId: string, status: string): Promise<Goal>;
  deleteGoal(goalId: string): Promise<void>;

  // Priority links
  setGoalPriorities(goalId: string, priorityIds: string[]): Promise<Goal>;
  addGoalPriority(goalId: string, priorityId: string): Promise<Goal>;
  removeGoalPriority(goalId: string, priorityId: string): Promise<Goal>;

  // Bulk operations
  rescheduleGoals(request: RescheduleGoalsRequest): Promise<GoalListResponse>;
  previewArchive(goalId: string): Promise<GoalArchivePreviewResponse>;
  archiveGoal(goalId: string, request: ArchiveGoalRequest): Promise<Goal>;
  pauseGoal(goalId: string): Promise<Goal>;
  unpauseGoal(goalId: string): Promise<Goal>;
}

export interface GoalsListParams {
  priority_id?: string;
  status?: string;
  include_completed?: boolean;
  parent_only?: boolean;
  past_target_date?: boolean;
  include_paused?: boolean;
  include_archived?: boolean;
}

/**
 * Goals-related API methods mixin.
 */
export const goalsMethods = <TBase extends Constructor<ApiServiceBase>>(
  Base: TBase,
) =>
  class extends Base implements GoalsMethods {
    async getGoals(params: GoalsListParams = {}): Promise<GoalListResponse> {
      const searchParams = new URLSearchParams();

      if (params.priority_id) {
        searchParams.append("priority_id", params.priority_id);
      }
      if (params.status) {
        searchParams.append("status", params.status);
      }
      if (params.include_completed !== undefined) {
        searchParams.append(
          "include_completed",
          String(params.include_completed),
        );
      }
      if (params.parent_only !== undefined) {
        searchParams.append("parent_only", String(params.parent_only));
      }
      if (params.past_target_date !== undefined) {
        searchParams.append(
          "past_target_date",
          String(params.past_target_date),
        );
      }
      if (params.include_paused !== undefined) {
        searchParams.append("include_paused", String(params.include_paused));
      }
      if (params.include_archived !== undefined) {
        searchParams.append(
          "include_archived",
          String(params.include_archived),
        );
      }

      const queryString = searchParams.toString();
      const url = queryString ? `/goals?${queryString}` : "/goals";
      return await this.request<GoalListResponse>(url);
    }

    async getGoal(goalId: string): Promise<Goal> {
      return await this.request<Goal>(`/goals/${goalId}`);
    }

    async getGoalTree(goalId: string): Promise<GoalWithSubGoals> {
      return await this.request<GoalWithSubGoals>(`/goals/${goalId}/tree`);
    }

    async createGoal(data: CreateGoalRequest): Promise<Goal> {
      return await this.request<Goal>("/goals", {
        method: "POST",
        body: JSON.stringify(data),
      });
    }

    async updateGoal(goalId: string, data: UpdateGoalRequest): Promise<Goal> {
      return await this.request<Goal>(`/goals/${goalId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    }

    async updateGoalStatus(goalId: string, status: string): Promise<Goal> {
      const data: UpdateGoalStatusRequest = {
        status: status as Goal["status"],
      };
      return await this.request<Goal>(`/goals/${goalId}/status`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    }

    async deleteGoal(goalId: string): Promise<void> {
      await this.request<void>(`/goals/${goalId}`, {
        method: "DELETE",
      });
    }

    async setGoalPriorities(
      goalId: string,
      priorityIds: string[],
    ): Promise<Goal> {
      const data: SetPriorityLinksRequest = { priority_ids: priorityIds };
      return await this.request<Goal>(`/goals/${goalId}/priorities`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    }

    async addGoalPriority(goalId: string, priorityId: string): Promise<Goal> {
      return await this.request<Goal>(
        `/goals/${goalId}/priorities/${priorityId}`,
        {
          method: "POST",
        },
      );
    }

    async removeGoalPriority(
      goalId: string,
      priorityId: string,
    ): Promise<Goal> {
      return await this.request<Goal>(
        `/goals/${goalId}/priorities/${priorityId}`,
        {
          method: "DELETE",
        },
      );
    }

    async rescheduleGoals(
      request: RescheduleGoalsRequest,
    ): Promise<GoalListResponse> {
      return await this.request<GoalListResponse>("/goals/reschedule", {
        method: "POST",
        body: JSON.stringify(request),
      });
    }

    async previewArchive(goalId: string): Promise<GoalArchivePreviewResponse> {
      return await this.request<GoalArchivePreviewResponse>(
        `/goals/${goalId}/archive-preview`,
      );
    }

    async archiveGoal(goalId: string, request: ArchiveGoalRequest): Promise<Goal> {
      return await this.request<Goal>(`/goals/${goalId}/archive`, {
        method: "POST",
        body: JSON.stringify(request),
      });
    }

    async pauseGoal(goalId: string): Promise<Goal> {
      return await this.request<Goal>(`/goals/${goalId}/pause`, {
        method: "POST",
      });
    }

    async unpauseGoal(goalId: string): Promise<Goal> {
      return await this.request<Goal>(`/goals/${goalId}/unpause`, {
        method: "POST",
      });
    }
  };
