import type {
  Task,
  TaskListResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  CompleteTaskRequest,
  SkipTaskRequest,
  SkipChainTaskRequest,
  SkipTaskPreviewResponse,
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
  ReorderOccurrencesRequest,
  ReorderOccurrencesResponse,
  DayOrderResponse,
  DateRangeOrderResponse,
  PermanentOrderItem,
  BulkCompletionsRequest,
  BulkCompletionsResponse,
  DeleteMockCompletionsResponse,
  DependencyBlockedResponse,
  DependencyBlocker,
} from "../types";
import type ApiServiceBase from "./apiBase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;

/**
 * Custom error for dependency-blocked completions (409 response).
 * Contains the list of blockers that prevented completion.
 */
export class DependencyBlockedError extends Error {
  blockers: DependencyBlocker[];
  taskId: string;
  canOverride: boolean;

  constructor(response: DependencyBlockedResponse) {
    const blockerNames = response.blockers
      .map((b) => b.upstream_task?.title || "Unknown task")
      .join(", ");
    super(`Blocked by prerequisites: ${blockerNames}`);
    this.name = "DependencyBlockedError";
    this.blockers = response.blockers;
    this.taskId = response.task_id;
    this.canOverride = response.can_override;
  }
}

/**
 * Interface for tasks methods added by the mixin.
 */
export interface TasksMethods {
  // CRUD
  getTasks(params?: TasksListParams): Promise<TaskListResponse>;
  getTask(
    taskId: string,
    params?: GetTaskParams,
  ): Promise<Task>;
  createTask(data: CreateTaskRequest): Promise<Task>;
  updateTask(taskId: string, data: UpdateTaskRequest): Promise<Task>;
  deleteTask(taskId: string): Promise<void>;
  archiveTask(taskId: string): Promise<Task>;
  pauseTask(taskId: string): Promise<Task>;
  unpauseTask(taskId: string): Promise<Task>;

  // Status transitions
  completeTask(taskId: string, data?: CompleteTaskRequest): Promise<Task>;
  completeTaskChain(
    taskId: string,
    data?: CompleteTaskRequest,
  ): Promise<Task[]>;
  skipTask(
    taskId: string,
    data?: SkipTaskRequest,
  ): Promise<Task | SkipTaskPreviewResponse>;
  skipTaskChain(
    taskId: string,
    data: SkipChainTaskRequest,
  ): Promise<Task[]>;
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

  // Phase 4f: Occurrence ordering for Today/Upcoming
  reorderOccurrences(
    data: ReorderOccurrencesRequest,
  ): Promise<ReorderOccurrencesResponse>;
  getOccurrenceOrder(date: string): Promise<DayOrderResponse>;
  getOccurrenceOrderRange(
    startDate: string,
    endDate: string,
  ): Promise<DateRangeOrderResponse>;
  clearOccurrenceOrder(date: string): Promise<void>;
  clearOccurrenceOrderFrom(fromDate: string): Promise<void>;
  getPermanentOrder(): Promise<PermanentOrderItem[]>;

  // Phase 4h: Rhythm History Simulator
  createBulkCompletions(
    taskId: string,
    data: BulkCompletionsRequest,
  ): Promise<BulkCompletionsResponse>;
  deleteMockCompletions(taskId: string): Promise<DeleteMockCompletionsResponse>;
}

export interface TasksListParams {
  goal_id?: string;
  status?: string;
  include_completed?: boolean;
  client_today?: string; // Client's local date as YYYY-MM-DD
  days_ahead?: number; // How many days ahead to load completion data (default: 14)
  include_dependency_summary?: boolean;
  /** IANA timezone for intraday dependency summary anchors */
  client_timezone?: string;
  include_paused?: boolean;
  include_archived?: boolean;
  /** Server: only tasks with this record_state (e.g. archived browse). */
  task_record_state?: "archived";
}

export interface GetTaskParams {
  include_dependency_summary?: boolean;
  client_today?: string;
  client_timezone?: string;
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
      if (params.include_dependency_summary) {
        searchParams.append("include_dependency_summary", "true");
      }
      if (params.client_timezone) {
        searchParams.append("client_timezone", params.client_timezone);
      }
      if (params.include_paused !== undefined) {
        searchParams.append("include_paused", String(params.include_paused));
      }
      if (params.include_archived !== undefined) {
        searchParams.append("include_archived", String(params.include_archived));
      }
      if (params.task_record_state) {
        searchParams.append("task_record_state", params.task_record_state);
      }

      const queryString = searchParams.toString();
      const url = queryString ? `/tasks?${queryString}` : "/tasks";
      return await this.request<TaskListResponse>(url);
    }

    async getTask(taskId: string, params: GetTaskParams = {}): Promise<Task> {
      const searchParams = new URLSearchParams();
      if (params.include_dependency_summary) {
        searchParams.append("include_dependency_summary", "true");
      }
      if (params.client_today) {
        searchParams.append("client_today", params.client_today);
      }
      if (params.client_timezone) {
        searchParams.append("client_timezone", params.client_timezone);
      }
      const qs = searchParams.toString();
      const url = qs ? `/tasks/${taskId}?${qs}` : `/tasks/${taskId}`;
      return await this.request<Task>(url);
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

    async archiveTask(taskId: string): Promise<Task> {
      return await this.request<Task>(`/tasks/${taskId}/archive`, {
        method: "POST",
      });
    }

    async pauseTask(taskId: string): Promise<Task> {
      return await this.request<Task>(`/tasks/${taskId}/pause`, {
        method: "POST",
      });
    }

    async unpauseTask(taskId: string): Promise<Task> {
      return await this.request<Task>(`/tasks/${taskId}/unpause`, {
        method: "POST",
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

    async completeTaskChain(
      taskId: string,
      data: CompleteTaskRequest = {},
    ): Promise<Task[]> {
      return await this.request<Task[]>(`/tasks/${taskId}/complete-chain`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    }

    async skipTask(
      taskId: string,
      data: SkipTaskRequest = {},
    ): Promise<Task | SkipTaskPreviewResponse> {
      return await this.request<Task | SkipTaskPreviewResponse>(
        `/tasks/${taskId}/skip`,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
    }

    async skipTaskChain(
      taskId: string,
      data: SkipChainTaskRequest,
    ): Promise<Task[]> {
      return await this.request<Task[]>(`/tasks/${taskId}/skip-chain`, {
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

    // Phase 4f: Occurrence ordering for Today/Upcoming
    async reorderOccurrences(
      data: ReorderOccurrencesRequest,
    ): Promise<ReorderOccurrencesResponse> {
      return await this.request<ReorderOccurrencesResponse>(
        "/tasks/reorder-occurrences",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
    }

    async getOccurrenceOrder(date: string): Promise<DayOrderResponse> {
      return await this.request<DayOrderResponse>(
        `/tasks/occurrence-order?date=${date}`,
      );
    }

    async getOccurrenceOrderRange(
      startDate: string,
      endDate: string,
    ): Promise<DateRangeOrderResponse> {
      return await this.request<DateRangeOrderResponse>(
        `/tasks/occurrence-order/range?start_date=${startDate}&end_date=${endDate}`,
      );
    }

    async clearOccurrenceOrder(date: string): Promise<void> {
      await this.request(`/tasks/occurrence-order/${date}`, {
        method: "DELETE",
      });
    }

    async clearOccurrenceOrderFrom(fromDate: string): Promise<void> {
      await this.request(`/tasks/occurrence-order/from/${fromDate}`, {
        method: "DELETE",
      });
    }

    async getPermanentOrder(): Promise<PermanentOrderItem[]> {
      // Use range API with a single day - we just need permanent_order field
      const today = new Date().toISOString().split("T")[0];
      const response = await this.getOccurrenceOrderRange(today, today);
      return response.permanent_order;
    }

    // Phase 4h: Rhythm History Simulator
    async createBulkCompletions(
      taskId: string,
      data: BulkCompletionsRequest,
    ): Promise<BulkCompletionsResponse> {
      return await this.request<BulkCompletionsResponse>(
        `/tasks/${taskId}/completions/bulk`,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
    }

    async deleteMockCompletions(
      taskId: string,
    ): Promise<DeleteMockCompletionsResponse> {
      return await this.request<DeleteMockCompletionsResponse>(
        `/tasks/${taskId}/completions/mock`,
        {
          method: "DELETE",
        },
      );
    }
  };
