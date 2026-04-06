/**
 * Priorities-related API methods mixin.
 */
export const prioritiesMethods = (Base) =>
  class extends Base {
    async getPriorities() {
      return await this.request("/priorities");
    }

    async createPriority(priorityData) {
      return await this.request("/priorities", {
        method: "POST",
        body: JSON.stringify(priorityData),
      });
    }

    async validatePriority(data) {
      return await this.request("/priorities/validate", {
        method: "POST",
        body: JSON.stringify(data),
      });
    }

    async getPriorityHistory(priorityId) {
      return await this.request(`/priorities/${priorityId}/history`);
    }

    async createPriorityRevision(priorityId, revisionData) {
      return await this.request(`/priorities/${priorityId}/revisions`, {
        method: "POST",
        body: JSON.stringify(revisionData),
      });
    }

    async anchorPriority(priorityId) {
      return await this.request(`/priorities/${priorityId}/anchor`, {
        method: "POST",
        body: JSON.stringify({}),
      });
    }

    async unanchorPriority(priorityId) {
      return await this.request(`/priorities/${priorityId}/unanchor`, {
        method: "POST",
        body: JSON.stringify({}),
      });
    }

    async checkPriorityStatus(priorityId) {
      return await this.request(`/priorities/${priorityId}/check-status`);
    }

    async deletePriority(priorityId) {
      return await this.request(`/priorities/${priorityId}`, {
        method: "DELETE",
      });
    }

    async getPriorityValueLinks(priorityRevisionId) {
      return await this.request(
        `/priority-revisions/${priorityRevisionId}/links`,
      );
    }

    async stashPriority(priorityId, isStashed) {
      return await this.request(`/priorities/${priorityId}/stash`, {
        method: "POST",
        body: JSON.stringify({ is_stashed: isStashed }),
      });
    }

    async getStashedPriorities() {
      return await this.request("/priorities/stashed");
    }
  };
