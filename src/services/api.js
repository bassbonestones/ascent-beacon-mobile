import ApiServiceBase from "./apiBase";
import { authMethods } from "./apiAuth";
import { valuesMethods } from "./apiValues";
import { prioritiesMethods } from "./apiPriorities";
import { assistantMethods, recommendationsMethods, discoveryMethods } from "./apiMixins";

/**
 * Complete API service with all domain methods.
 * Composed using mixins for better organization.
 */
class ApiService extends discoveryMethods(
  recommendationsMethods(
    assistantMethods(
      prioritiesMethods(
        valuesMethods(
          authMethods(ApiServiceBase)
        )
      )
    )
  )
) {}

export default new ApiService();
