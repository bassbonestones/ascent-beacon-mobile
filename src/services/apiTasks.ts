import type {
  Task,
  TaskListResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  CompleteTaskRequest,
  SkipTaskRequest,
  ReopenTaskRequest,
  TodayTasksResponse,
  TaskRangeRequest,
  TaskRangeResponse,
  TaskCompletionListResponse,
  TaskStatsResponse,
  CompletionHistoryResponse,
  DeleteFutureCompletionsResponse,
  FutureCompletionsCountResponse,
  AnytimeTasksResponse,
  ReorderTaskRequest,
  ReorderTaskResponse,
} from "../types";
import type ApiServiceBase from "./apiBase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;

/**
 * Interface for tasks methods added by the mixin.
 */
export interface TasksMethods {
  // CRUD
  getTasks(params?: TasksListParams): Promise<TaskListResponse>;
  getTask(taskId: string): Promise<Task>;
  createTask(data: CreateTaskRequest): Promise<Task>;
  updateTask(taskId: string, data: UpdateTaskRequest): Promise<Task>;
  deleteTask(taskId: string): Promise<void>;

  // Status transitions
  completeTask(taskId: string, data?: CompleteTaskRequest): Promise<Task>;
  skipTask(taskId: string, data?: SkipTaskRequest): Promise<Task>;
  reopenTask(taskId: string, data?: ReopenTaskRequest): Promise<Task>;

  // Phase 4b: Views
  getTodayTasks(
    timezone?: string,
    includeCompleted?: boolean,
  ): Promise<TodayTasksResponse>;
  getTasksInRange(request: TaskRangeRequest): Promise<TaskRangeResponse>;
  getTaskCompletions(
    taskId: string,
    limit?: number,
    offset?: number,
  ): Promise<TaskCompletionListResponse>;

  // Phase 4c: Stats
  getTaskStats(
    taskId: string,
    start: string,
    end: string,
  ): Promise<TaskStatsResponse>;
  getCompletionHistory(
    taskId: string,
    start: string,
    end: string,
  ): Promise<CompletionHistoryResponse>;

  // Time Machine
  deleteFutureCompletions(
    afterDate?: string,
  ): Promise<DeleteFutureCompletionsResponse>;
  getFutureCompletionsCount(
    afterDate?: string,
  ): Promise<FutureCompletionsCountResponse>;

  // Phase 4e: Anytime tasks
  getAnytimeTasks(includeCompleted?: boolean): Promise<AnytimeTasksResponse>;
  reorderTask(
    taskId: string,
    data: ReorderTaskRequest,
  ): Promise<ReorderTaskResponse>;
}

export interface TasksListParams {
  goal_id?: string;
  status?: string;
  include_completed?: boolean;
  client_today?: string; // Client's local date as YYYY-MM-DD
  days_ahead?: number; // How many days ahead to load completion data (default: 14)
}

/**
 * Tasks-related API methods mixin.
 */
export const tasksMethods = <TBase extends Constructor<ApiServiceBase>>(
  Base: TBase,
) =>
  class extends Base implements TasksMethods {
    async getTasks(params: TasksListParams = {}): Promise<TaskListResponse> {
      const searchParams = new URLSearchParams();

      if (params.goal_id) {
        searchParams.append("goal_id", params.goal_id);
      }
      if (params.status) {
        searchParams.append("status", params.status);
      }
      if (params.include_completed) {
        searchParams.append("include_completed", "true");
      }
      if (params.client_today) {
        searchParams.append("client_today", params.client_today);
      }
      if (params.days_ahead !== undefined) {
        searchParams.append("days_ahead", String(params.days_ahead));
      }

      const queryString = searchParams.toString();
      const url = queryString ? `/tasks?${queryString}` : "/tasks";
      return await this.request<TaskListResponse>(url);
    }

    async getTask(taskId: string): Promise<Task> {
      return await this.request<Task>(`/tasks/${taskId}`);
    }

    async createTask(data: CreateTaskRequest): Promise<Task> {
      return await this.request<Task>("/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      });
    }

    async updateTask(taskId: string, data: UpdateTaskRequest): Promise<Task> {
      return await this.request<Task>(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    }

    async deleteTask(taskId: string): Promise<void> {
      await this.request<void>(`/tasks/${taskId}`, {
        method: "DELETE",
      });
    }

    async completeTask(
      taskId: string,
      data: CompleteTaskRequest = {},
    ): Promise<Task> {
      return await this.request<Task>(`/tasks/${taskId}/complete`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    }

    async skipTask(taskId: string, data: SkipTaskRequest = {}): Promise<Task> {
      return await this.request<Task>(`/tasks/${taskId}/skip`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    }

    async reopenTask(
      taskId: string,
      data: ReopenTaskRequest = {},
    ): Promise<Task> {
      return await this.request<Task>(`/tasks/${taskId}/reopen`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    }

    // Phase 4b: Views

    async getTodayTasks(
      timezone: string = "UTC",
      includeCompleted: boolean = false,
    ): Promise<TodayTasksResponse> {
      const params = new URLSearchParams();
      params.append("timezone", timezone);
      if (includeCompleted) {
        params.append("include_completed", "true");
      }
      return await this.request<TodayTasksResponse>(
        `/tasks/view/today?${params}`,
      );
    }

    async getTasksInRange(
      request: TaskRangeRequest,
    ): Promise<TaskRangeResponse> {
      return await this.request<TaskRangeResponse>("/tasks/view/range", {
        method: "POST",
        body: JSON.stringify(request),
      });
    }

    async getTaskCompletions(
      taskId: string,
      limit: number = 50,
      offset: number = 0,
    ): Promise<TaskCompletionListResponse> {
      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      params.append("offset", offset.toString());
      return await this.request<TaskCompletionListResponse>(
        `/tasks/${taskId}/completions?${params}`,
      );
    }

    async getTaskStats(
      taskId: string,
      start: string,
      end: string,
    ): Promise<TaskStatsResponse> {
      const params = new URLSearchParams();
      params.append("start", start);
      params.append("end", end);
      return await this.request<TaskStatsResponse>(
        `/tasks/${taskId}/stats?${params}`,
      );
    }

    async getCompletionHistory(
      taskId: string,
      start: string,
      end: string,
    ): Promise<CompletionHistoryResponse> {
      const params = new URLSearchParams();
      params.append("start", start);
      params.append("end", end);
      return await this.request<CompletionHistoryResponse>(
        `/tasks/${taskId}/history?${params}`,
      );
    }

    // Time Machine

    async deleteFutureCompletions(
      afterDate?: string,
    ): Promise<DeleteFutureCompletionsResponse> {
      const url = afterDate
        ? `/tasks/completions/future?after_date=${afterDate}`
        : "/tasks/completions/future";
      return await this.request<DeleteFutureCompletionsResponse>(url, {
        method: "DELETE",
      });
    }

    async getFutureCompletionsCount(
      afterDate?: string,
    ): Promise<FutureCompletionsCountResponse> {
      const url = afterDate
        ? `/tasks/completions/future/count?after_date=${afterDate}`
        : "/tasks/completions/future/count";
      return await this.request<FutureCompletionsCountResponse>(url);
    }

    // Phase 4e: Anytime tasks

    async getAnytimeTasks(
      includeCompleted: boolean = false,
    ): Promise<AnytimeTasksResponse> {
      const params = new URLSearchParams();
      if (includeCompleted) {
        params.append("include_completed", "true");
      }
      const queryString = params.toString();
      const url = queryString
        ? `/tasks/view/anytime?${queryString}`
        : "/tasks/view/anytime";
      return await this.request<AnytimeTasksResponse>(url);
    }

    async reorderTask(
      taskId: string,
      data: ReorderTaskRequest,
    ): Promise<ReorderTaskResponse> {
      return await this.request<ReorderTaskResponse>(
        `/tasks/${taskId}/reorder`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        },
      );
    }
  };
