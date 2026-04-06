/**
 * Values-related API methods mixin.
 */
export const valuesMethods = (Base) =>
  class extends Base {
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
      return await this.request(`/values/${valueId}`, { method: "DELETE" });
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

    async getLinkedPriorities(valueId) {
      return await this.request(`/values/${valueId}/linked-priorities`);
    }
  };
