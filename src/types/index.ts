/**
 * Shared TypeScript type definitions for Ascent Beacon Mobile
 *
 * These types mirror the backend Pydantic schemas from:
 * - ascent-beacon-service/app/schemas/auth.py
 * - ascent-beacon-service/app/schemas/values.py
 * - ascent-beacon-service/app/schemas/priorities.py
 */

// ============================================================================
// User & Auth Types
// ============================================================================

export interface User {
  id: string;
  display_name: string | null;
  primary_email: string | null;
  is_email_verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

export interface OnboardingStatus {
  user: User;
  needs_display_name: boolean;
  needs_email_verification: boolean;
}

// Auth Request Types
export interface GoogleAuthRequest {
  id_token: string;
  device_id?: string;
  device_name?: string;
}

export interface AppleAuthRequest {
  id_token: string;
  device_id?: string;
  device_name?: string;
}

export interface EmailAuthRequest {
  email: string;
}

export interface EmailVerifyRequest {
  token: string;
  email?: string;
  device_id?: string;
  device_name?: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface SetDisplayNameRequest {
  display_name: string;
}

export interface UpdatePrimaryEmailRequest {
  primary_email: string;
  force_verification?: boolean;
}

// ============================================================================
// Value Types
// ============================================================================

export type ValueOrigin =
  | "declared"
  | "discovered"
  | "refined"
  | "ai_suggested";

export interface ValueRevision {
  id: string;
  value_id: string;
  statement: string;
  weight_raw: number;
  weight_normalized: number | null;
  is_active: boolean;
  origin: ValueOrigin;
  source_prompt_id?: string | null;
  created_at: string;
}

export interface ValueInsight {
  type: string;
  message: string;
  similar_value_id?: string;
  similar_value_revision_id?: string;
  similarity_score?: number;
}

export interface Value {
  id: string;
  user_id: string;
  active_revision_id: string | null;
  created_at: string;
  updated_at: string;
  revisions: ValueRevision[];
  insights: ValueInsight[];
  active_revision?: ValueRevision | null;
}

export interface ValuesListResponse {
  values: Value[];
}

export interface CreateValueRequest {
  statement: string;
  weight_raw: number;
  origin?: ValueOrigin;
  source_prompt_id?: string;
}

export interface CreateValueRevisionRequest {
  statement: string;
  weight_raw: number;
  origin?: ValueOrigin;
  source_prompt_id?: string;
}

export interface AcknowledgeValueInsightRequest {
  revision_id?: string;
}

export interface AffectedPriorityInfo {
  priority_id: string;
  title: string;
  is_anchored: boolean;
}

export interface ValueDeleteConflict {
  message: string;
  affected_priorities: AffectedPriorityInfo[];
}

export interface ValueEditImpactInfo {
  affected_priorities_count: number;
  affected_priorities: AffectedPriorityInfo[];
  similarity_changed: boolean;
  new_similar_value_id?: string;
  weight_verification_recommended: boolean;
}

export interface ValueEditResponse extends Value {
  impact_info?: ValueEditImpactInfo;
}

export interface ValueMatchRequest {
  query: string;
}

export interface ValueMatchResponse {
  value_id?: string;
}

// ============================================================================
// Priority Types
// ============================================================================

export type PriorityScope = "ongoing" | "in_progress" | "habitual" | "seasonal";

export interface PriorityValueLinkInfo {
  value_id: string;
  value_revision_id: string;
  link_weight: number;
}

export interface PriorityRevision {
  id: string;
  priority_id: string;
  title: string;
  why_matters: string;
  score: number; // 1-5
  scope: PriorityScope;
  cadence: string | null;
  constraints: string | null;
  is_anchored: boolean;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  value_links: PriorityValueLinkInfo[];
}

export interface Priority {
  id: string;
  user_id: string;
  active_revision_id: string | null;
  active_revision: PriorityRevision | null;
  created_at: string;
  updated_at: string;
  is_stashed?: boolean;
}

export interface PrioritiesListResponse {
  priorities: Priority[];
}

export interface CreatePriorityRequest {
  title: string;
  why_matters: string;
  score?: number;
  scope?: PriorityScope;
  cadence?: string;
  constraints?: string;
  notes?: string;
  value_ids?: string[];
}

export interface CreatePriorityRevisionRequest {
  title: string;
  why_matters: string;
  score?: number;
  scope?: PriorityScope;
  cadence?: string;
  constraints?: string;
  notes?: string;
  value_ids?: string[];
}

export interface LinkedValueInfo {
  value_id: string;
  value_statement: string;
  link_weight: number;
}

export interface PriorityCheckResponse {
  priority_id: string;
  has_linked_values: boolean;
  linked_value_count: number;
  linked_values: LinkedValueInfo[];
  is_anchored: boolean;
  status: "complete" | "incomplete";
}

export interface RuleExample {
  rule_name: string;
  rule_title: string;
  good_examples: string[];
  bad_examples: string[];
}

export interface ValidatePriorityRequest {
  name: string;
  why_statement: string;
}

export interface ValidatePriorityResponse {
  name_valid: boolean;
  why_valid: boolean;
  name_feedback: string[];
  why_feedback: string[];
  why_passed_rules: Record<string, boolean>;
  rule_examples?: Record<string, RuleExample>;
  overall_valid: boolean;
}

export interface StashPriorityRequest {
  is_stashed: boolean;
}

// ============================================================================
// Link Types
// ============================================================================

export interface PriorityValueLink {
  id: string;
  priority_id: string;
  priority_revision_id: string;
  value_id: string;
  value_revision_id: string;
  link_weight: number;
  created_at: string;
}

export interface CreateLinkRequest {
  priority_id: string;
  value_id: string;
  link_weight?: number;
}

export interface DeleteLinkRequest {
  priority_id: string;
  value_id: string;
}

// ============================================================================
// Discovery Types
// ============================================================================

export type SelectionBucket = "core" | "important" | "not_now";

export interface DiscoveryPrompt {
  id: string;
  prompt_text: string;
  primary_lens: string;
  display_order: number;
  active: boolean;
}

export interface ValueSelection {
  id: string;
  user_id: string;
  prompt_id: string;
  bucket: SelectionBucket;
  display_order: number;
  custom_text: string | null;
  prompt: DiscoveryPrompt;
}

export interface SaveSelectionRequest {
  prompt_id: string;
  bucket: SelectionBucket;
  display_order?: number;
  custom_text?: string | null;
}

export interface BulkSelectionUpdate {
  prompt_id: string;
  bucket: SelectionBucket;
  display_order: number;
  custom_text?: string | null;
}

export interface DiscoveryPromptsResponse {
  prompts: DiscoveryPrompt[];
}

export interface UserSelectionsResponse {
  selections: ValueSelection[];
}

export interface DiscoveryStateResponse {
  prompts: DiscoveryPrompt[];
  selections: ValueSelection[];
  is_complete: boolean;
}

export interface FinalizeDiscoveryResponse {
  created_values: Value[];
  message: string;
}

// ============================================================================
// Assistant Types
// ============================================================================

export interface AssistantSession {
  id: string;
  user_id: string;
  status: "active" | "completed" | "abandoned";
  created_at: string;
  updated_at: string;
}

export interface AssistantTurn {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantChatRequest {
  message: string;
  session_id?: string;
}

export interface AssistantChatResponse {
  session_id: string;
  response: string;
  recommendations?: AssistantRecommendation[];
}

export interface AssistantRecommendation {
  id: string;
  session_id: string;
  recommendation_type: "value" | "priority" | "goal" | "task";
  title: string;
  description: string;
  status: "pending" | "accepted" | "rejected";
  payload: Record<string, unknown>;
  created_at: string;
}

// ============================================================================
// Alignment Types
// ============================================================================

export interface AlignmentScore {
  overall_score: number;
  value_coverage: number;
  priority_balance: number;
  recommendations: string[];
}

// ============================================================================
// API Types
// ============================================================================

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export interface ApiError {
  detail: string;
  status?: number;
  validationData?: Record<string, unknown>;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ValidationErrorResponse {
  detail: ValidationError[];
}

// ============================================================================
// Navigation Types
// ============================================================================

export type RootStackParamList = {
  Login: undefined;
  Onboarding: undefined;
  Home: undefined;
  Dashboard: undefined;
  Values: undefined;
  ValuesDiscovery: undefined;
  ValuesManagement: undefined;
  Priorities: undefined;
  Goals: undefined;
  Tasks: undefined;
  HabitTracker: undefined;
  HabitMetrics: { taskId: string; taskTitle: string };
  ValuePriorityLinks: { valueId: string; valueStatement: string };
  Assistant: { contextMode?: string };
  Alignment: undefined;
};

// ============================================================================
// Context Types
// ============================================================================

export interface AuthContextState {
  user: User | null;
  loading: boolean;
  isInitializing: boolean;
}

export interface AuthContextActions {
  login: (tokens: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
}

export type AuthContextValue = AuthContextState & AuthContextActions;

// ============================================================================
// Component Props Types
// ============================================================================

export interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
}

export interface WeightAdjustmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (weight: number) => void;
  initialWeight?: number;
  valueName?: string;
}

export interface AffectedPrioritiesModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  affectedPriorities: AffectedPriorityInfo[];
  action: "edit" | "delete";
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseValuesReturn {
  values: Value[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createValue: (data: CreateValueRequest) => Promise<Value>;
  updateValue: (id: string, data: CreateValueRevisionRequest) => Promise<Value>;
  deleteValue: (id: string) => Promise<void>;
}

export interface UsePrioritiesReturn {
  priorities: Priority[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createPriority: (data: CreatePriorityRequest) => Promise<Priority>;
  updatePriority: (
    id: string,
    data: CreatePriorityRevisionRequest,
  ) => Promise<Priority>;
  deletePriority: (id: string) => Promise<void>;
  stashPriority: (id: string, stashed: boolean) => Promise<Priority>;
}

export interface UseLinksReturn {
  links: PriorityValueLink[];
  loading: boolean;
  error: Error | null;
  createLink: (data: CreateLinkRequest) => Promise<PriorityValueLink>;
  deleteLink: (priorityId: string, valueId: string) => Promise<void>;
}

// ============================================================================
// Goal Types
// ============================================================================

export type GoalStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "abandoned";

export interface GoalPriorityInfo {
  id: string;
  title: string;
  score: number | null;
}

export interface Goal {
  id: string;
  user_id: string;
  parent_goal_id: string | null;
  title: string;
  description: string | null;
  target_date: string | null; // ISO date string
  status: GoalStatus;
  progress_cached: number;
  total_time_minutes: number;
  completed_time_minutes: number;
  has_incomplete_breakdown: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  priorities: GoalPriorityInfo[];
}

export interface GoalWithSubGoals extends Goal {
  sub_goals: GoalWithSubGoals[];
}

export interface GoalListResponse {
  goals: Goal[];
  reschedule_count: number;
}

export interface CreateGoalRequest {
  title: string;
  description?: string | null;
  target_date?: string | null; // ISO date string
  priority_ids?: string[];
  parent_goal_id?: string | null;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string | null;
  target_date?: string | null;
  status?: GoalStatus;
  parent_goal_id?: string | null;
}

export interface UpdateGoalStatusRequest {
  status: GoalStatus;
}

export interface SetPriorityLinksRequest {
  priority_ids: string[];
}

export interface GoalRescheduleItem {
  goal_id: string;
  new_target_date: string; // ISO date string
}

export interface RescheduleGoalsRequest {
  goal_updates: GoalRescheduleItem[];
}

export interface UseGoalsReturn {
  goals: Goal[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createGoal: (data: CreateGoalRequest) => Promise<Goal>;
  updateGoal: (id: string, data: UpdateGoalRequest) => Promise<Goal>;
  updateGoalStatus: (id: string, status: GoalStatus) => Promise<Goal>;
  deleteGoal: (id: string) => Promise<void>;
}

// ============================================================================
// Task Types
// ============================================================================

export type TaskStatus = "pending" | "completed" | "skipped";

export type SchedulingMode = "floating" | "fixed";

export interface TaskGoalInfo {
  id: string;
  title: string;
  status: GoalStatus;
}

export interface Task {
  id: string;
  user_id: string;
  goal_id: string | null;
  title: string;
  description: string | null;
  duration_minutes: number;
  status: TaskStatus;
  scheduled_at: string | null; // ISO datetime string
  is_recurring: boolean;
  recurrence_rule: string | null; // RRULE string
  notify_before_minutes: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  is_lightning: boolean;
  goal: TaskGoalInfo | null;
  // Phase 4b fields
  scheduling_mode: SchedulingMode | null;
  skip_reason: string | null;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  pending_count: number;
  completed_count: number;
}

export interface CreateTaskRequest {
  goal_id?: string | null;
  title: string;
  description?: string | null;
  duration_minutes: number;
  scheduled_at?: string | null;
  notify_before_minutes?: number | null;
  // Phase 4b fields
  is_recurring?: boolean;
  recurrence_rule?: string | null;
  scheduling_mode?: SchedulingMode | null;
}

export interface UpdateTaskRequest {
  goal_id?: string;
  title?: string;
  description?: string | null;
  duration_minutes?: number;
  scheduled_at?: string | null;
  notify_before_minutes?: number | null;
  // Phase 4b fields
  is_recurring?: boolean;
  recurrence_rule?: string | null;
  scheduling_mode?: SchedulingMode | null;
}

export interface CompleteTaskRequest {
  completed_at?: string | null;
  scheduled_for?: string | null; // For recurring tasks: which occurrence was completed
}

export interface SkipTaskRequest {
  reason?: string | null;
  scheduled_for?: string | null; // For recurring tasks: which occurrence was skipped
}

// Phase 4b: Task completion history (for recurring tasks)
export interface TaskCompletion {
  id: string;
  task_id: string;
  status: "completed" | "skipped";
  skip_reason: string | null;
  scheduled_for: string | null;
  completed_at: string;
}

export interface TaskCompletionListResponse {
  completions: TaskCompletion[];
  total: number;
  completed_count: number;
  skipped_count: number;
}

// Phase 4c: Stats types
export interface TaskStatsPeriod {
  start: string; // ISO datetime
  end: string; // ISO datetime
}

export interface TaskStatsResponse {
  task_id: string;
  period: TaskStatsPeriod;
  total_expected: number;
  total_completed: number;
  total_skipped: number;
  total_missed: number;
  completion_rate: number; // 0.0 - 1.0
  current_streak: number;
  longest_streak: number;
  last_completed_at: string | null;
}

export interface DailyCompletionStatus {
  date: string; // YYYY-MM-DD
  status: "completed" | "skipped" | "missed" | "partial";
  expected: number;
  completed: number;
  skipped: number;
}

export interface CompletionHistoryResponse {
  task_id: string;
  period: TaskStatsPeriod;
  days: DailyCompletionStatus[];
  summary: TaskStatsResponse;
}

// Phase 4b: Today view
export interface TodayTasksResponse {
  tasks: Task[];
  pending_count: number;
  completed_today_count: number;
  overdue_count: number;
}

// Phase 4b: Range view
export interface TaskRangeRequest {
  start_date: string; // ISO datetime
  end_date: string; // ISO datetime
  include_completed?: boolean;
  offset?: number;
  limit?: number;
}

export interface TaskRangeResponse {
  tasks: Task[];
  total: number;
  has_more: boolean;
  start_date: string;
  end_date: string;
}

export interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: Error | null;
  pendingCount: number;
  completedCount: number;
  refetch: () => Promise<void>;
  createTask: (data: CreateTaskRequest) => Promise<Task>;
  updateTask: (id: string, data: UpdateTaskRequest) => Promise<Task>;
  completeTask: (id: string, scheduledFor?: string) => Promise<Task>;
  skipTask: (
    id: string,
    reason?: string,
    scheduledFor?: string,
  ) => Promise<Task>;
  reopenTask: (id: string) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
}

// ============================================================================
// Utility Types
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncFunction<T = void> = () => Promise<T>;
export type AsyncFunctionWithArgs<A extends unknown[], T = void> = (
  ...args: A
) => Promise<T>;
