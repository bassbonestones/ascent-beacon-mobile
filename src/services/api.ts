import ApiServiceBase from "./apiBase";
import { authMethods, type AuthMethods } from "./apiAuth";
import { valuesMethods, type ValuesMethods } from "./apiValues";
import { prioritiesMethods, type PrioritiesMethods } from "./apiPriorities";
import { goalsMethods, type GoalsMethods } from "./apiGoals";
import { tasksMethods, type TasksMethods } from "./apiTasks";
import {
  dependenciesMethods,
  type DependenciesMethods,
} from "./apiDependencies";
import {
  assistantMethods,
  recommendationsMethods,
  discoveryMethods,
  type AssistantMethods,
  type RecommendationsMethods,
  type DiscoveryMethods,
} from "./apiMixins";

/**
 * Combined API service interface with all domain methods.
 */
export interface ApiServiceInterface
  extends
    ApiServiceBase,
    AuthMethods,
    ValuesMethods,
    PrioritiesMethods,
    GoalsMethods,
    TasksMethods,
    DependenciesMethods,
    AssistantMethods,
    RecommendationsMethods,
    DiscoveryMethods {}

/**
 * Complete API service with all domain methods.
 * Composed using mixins for better organization.
 */
class ApiService extends discoveryMethods(
  recommendationsMethods(
    assistantMethods(
      dependenciesMethods(
        tasksMethods(
          goalsMethods(
            prioritiesMethods(valuesMethods(authMethods(ApiServiceBase))),
          ),
        ),
      ),
    ),
  ),
) {}

const apiService = new ApiService() as ApiServiceInterface;

export default apiService;
