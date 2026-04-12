import type {
  DependencyRule,
  DependencyRuleListResponse,
  CreateDependencyRuleRequest,
  UpdateDependencyRuleRequest,
  CycleValidationRequest,
  CycleValidationResponse,
  DependencyStatusResponse,
} from "../types";
import type ApiServiceBase from "./apiBase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;

/**
 * Interface for dependencies methods added by the mixin.
 */
export interface DependenciesMethods {
  // CRUD
  getDependencyRules(
    params?: DependencyRulesListParams,
  ): Promise<DependencyRuleListResponse>;
  getDependencyRule(ruleId: string): Promise<DependencyRule>;
  createDependencyRule(
    data: CreateDependencyRuleRequest,
  ): Promise<DependencyRule>;
  updateDependencyRule(
    ruleId: string,
    data: UpdateDependencyRuleRequest,
  ): Promise<DependencyRule>;
  deleteDependencyRule(ruleId: string): Promise<void>;

  // Validation
  validateDependency(
    data: CycleValidationRequest,
  ): Promise<CycleValidationResponse>;

  // Status
  getDependencyStatus(
    taskId: string,
    scheduledFor?: string,
    localDate?: string,
  ): Promise<DependencyStatusResponse>;
}

export interface DependencyRulesListParams {
  upstream_task_id?: string;
  downstream_task_id?: string;
  task_id?: string;
}

/**
 * Dependencies-related API methods mixin.
 */
export const dependenciesMethods = <TBase extends Constructor<ApiServiceBase>>(
  Base: TBase,
) =>
  class extends Base implements DependenciesMethods {
    async getDependencyRules(
      params: DependencyRulesListParams = {},
    ): Promise<DependencyRuleListResponse> {
      const searchParams = new URLSearchParams();

      if (params.upstream_task_id) {
        searchParams.append("upstream_task_id", params.upstream_task_id);
      }
      if (params.downstream_task_id) {
        searchParams.append("downstream_task_id", params.downstream_task_id);
      }
      if (params.task_id) {
        searchParams.append("task_id", params.task_id);
      }

      const queryString = searchParams.toString();
      const url = queryString
        ? `/dependencies?${queryString}`
        : "/dependencies";
      return await this.request<DependencyRuleListResponse>(url);
    }

    async getDependencyRule(ruleId: string): Promise<DependencyRule> {
      return await this.request<DependencyRule>(`/dependencies/${ruleId}`);
    }

    async createDependencyRule(
      data: CreateDependencyRuleRequest,
    ): Promise<DependencyRule> {
      return await this.request<DependencyRule>("/dependencies", {
        method: "POST",
        body: JSON.stringify(data),
      });
    }

    async updateDependencyRule(
      ruleId: string,
      data: UpdateDependencyRuleRequest,
    ): Promise<DependencyRule> {
      return await this.request<DependencyRule>(`/dependencies/${ruleId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    }

    async deleteDependencyRule(ruleId: string): Promise<void> {
      await this.request<void>(`/dependencies/${ruleId}`, {
        method: "DELETE",
      });
    }

    async validateDependency(
      data: CycleValidationRequest,
    ): Promise<CycleValidationResponse> {
      return await this.request<CycleValidationResponse>(
        "/dependencies/validate",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
    }

    async getDependencyStatus(
      taskId: string,
      scheduledFor?: string,
      localDate?: string,
    ): Promise<DependencyStatusResponse> {
      const searchParams = new URLSearchParams();
      if (scheduledFor) {
        searchParams.append("scheduled_for", scheduledFor);
      }
      if (localDate) {
        searchParams.append("local_date", localDate);
      }
      const queryString = searchParams.toString();
      const url = queryString
        ? `/tasks/${taskId}/dependency-status?${queryString}`
        : `/tasks/${taskId}/dependency-status`;
      return await this.request<DependencyStatusResponse>(url);
    }
  };
