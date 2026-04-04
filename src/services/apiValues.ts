import type {
  Value,
  ValuesListResponse,
  CreateValueRequest,
  CreateValueRevisionRequest,
  ValueEditResponse,
  ValueMatchResponse,
  Priority,
} from "../types";
import type ApiServiceBase from "./apiBase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;

/**
 * Interface for value methods added by the mixin.
 */
export interface ValuesMethods {
  getValues(): Promise<ValuesListResponse>;
  createValue(valueData: CreateValueRequest): Promise<Value>;
  updateValue(
    valueId: string,
    valueData: CreateValueRevisionRequest,
  ): Promise<ValueEditResponse>;
  deleteValue(valueId: string): Promise<void>;
  getValueHistory(valueId: string): Promise<Value>;
  matchValue(query: string): Promise<ValueMatchResponse>;
  acknowledgeValueInsight(
    valueId: string,
    revisionId?: string | null,
  ): Promise<Value>;
  getLinkedPriorities(valueId: string): Promise<Priority[]>;
}

/**
 * Values-related API methods mixin.
 */
export const valuesMethods = <TBase extends Constructor<ApiServiceBase>>(
  Base: TBase,
) =>
  class extends Base implements ValuesMethods {
    async getValues(): Promise<ValuesListResponse> {
      return await this.request<ValuesListResponse>("/values");
    }

    async createValue(valueData: CreateValueRequest): Promise<Value> {
      return await this.request<Value>("/values", {
        method: "POST",
        body: JSON.stringify(valueData),
      });
    }

    async updateValue(
      valueId: string,
      valueData: CreateValueRevisionRequest,
    ): Promise<ValueEditResponse> {
      return await this.request<ValueEditResponse>(`/values/${valueId}`, {
        method: "PUT",
        body: JSON.stringify(valueData),
      });
    }

    async deleteValue(valueId: string): Promise<void> {
      await this.request(`/values/${valueId}`, { method: "DELETE" });
    }

    async getValueHistory(valueId: string): Promise<Value> {
      return await this.request<Value>(`/values/${valueId}/history`);
    }

    async matchValue(query: string): Promise<ValueMatchResponse> {
      return await this.request<ValueMatchResponse>("/values/match", {
        method: "POST",
        body: JSON.stringify({ query }),
      });
    }

    async acknowledgeValueInsight(
      valueId: string,
      revisionId: string | null = null,
    ): Promise<Value> {
      return await this.request<Value>(
        `/values/${valueId}/insights/acknowledge`,
        {
          method: "POST",
          body: JSON.stringify({ revision_id: revisionId }),
        },
      );
    }

    async getLinkedPriorities(valueId: string): Promise<Priority[]> {
      return await this.request<Priority[]>(
        `/values/${valueId}/linked-priorities`,
      );
    }
  };
