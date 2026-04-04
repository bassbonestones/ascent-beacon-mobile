import type {
  Value,
  ValuesListResponse,
  CreateValueRequest,
  CreateValueRevisionRequest,
  ValueEditResponse,
  ValueMatchResponse,
  AffectedPriorityInfo,
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
  deleteValue(valueId: string, cascade?: boolean): Promise<void>;
  getValueHistory(valueId: string): Promise<Value>;
  matchValue(query: string): Promise<ValueMatchResponse>;
  acknowledgeValueInsight(
    valueId: string,
    revisionId?: string | null,
  ): Promise<Value>;
  getLinkedPriorities(valueId: string): Promise<AffectedPriorityInfo[]>;
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

    async deleteValue(valueId: string, cascade = false): Promise<void> {
      const url = cascade
        ? `/values/${valueId}?cascade=true`
        : `/values/${valueId}`;
      await this.request(url, { method: "DELETE" });
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

    async getLinkedPriorities(
      valueId: string,
    ): Promise<AffectedPriorityInfo[]> {
      return await this.request<AffectedPriorityInfo[]>(
        `/values/${valueId}/linked-priorities`,
      );
    }
  };
