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
  ReorderTasks: { date: string; dateDisplay: string; items: ReorderItem[] };
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

// 'floating' = time-of-day (adjusts with timezone)
// 'fixed' = fixed time (timezone-locked)
// 'date_only' = only date is set, no specific time
// 'anytime' = no schedule, backlog task with manual ordering (Phase 4e)
export type SchedulingMode = "floating" | "fixed" | "date_only" | "anytime";

// Phase 4g: Recurrence behavior for recurring tasks
// 'habitual' = auto-skip missed occurrences on app open
// 'essential' = stays overdue until manually actioned
export type RecurrenceBehavior = "habitual" | "essential";

export interface TaskGoalInfo {
  id: string;
  title: string;
  status: GoalStatus;
}

/** Phase 4i-5: embedded on Task when API includes dependency summary */
export interface TaskDependencySummary {
  readiness_state: "ready" | "blocked" | "partial" | "advisory";
  has_unmet_hard: boolean;
  has_unmet_soft: boolean;
  advisory_text?: string | null;
}

export interface Task {
  id: string;
  user_id: string;
  goal_id: string | null;
  title: string;
  description: string | null;
  duration_minutes: number;
  status: TaskStatus;
  // Scheduling: scheduled_date for date-only, scheduled_at for timed
  scheduled_date: string | null; // YYYY-MM-DD, for date-only tasks
  scheduled_at: string | null; // ISO datetime string, for timed tasks
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
  // Phase 4g: Recurrence behavior for recurring tasks
  recurrence_behavior: RecurrenceBehavior | null;
  // Phase 4e: Sort order for anytime tasks (lower = higher in list)
  sort_order: number | null;
  // For recurring tasks, indicates if completed for today
  completed_for_today?: boolean;
  // For recurring tasks with multiple daily occurrences, count of completions today
  completions_today?: number;
  // For interval/specific_times modes, the actual ISO datetime strings of completions today
  completed_times_today?: string[];
  // For recurring tasks, completions indexed by date (YYYY-MM-DD) -> list of completion timestamps
  // Used for Upcoming view to track which future occurrences are completed
  completions_by_date?: Record<string, string[]>;
  // For recurring tasks, indicates if skipped for today
  skipped_for_today?: boolean;
  // For recurring tasks, count of skips today
  skips_today?: number;
  // For recurring tasks, the actual ISO datetime strings of skips today
  skipped_times_today?: string[];
  // For recurring tasks, skips indexed by date (YYYY-MM-DD) -> list of skip timestamps
  skips_by_date?: Record<string, string[]>;
  // For recurring tasks, the skip reason for today
  skip_reason_today?: string | null;
  // For recurring tasks, skip reasons indexed by date (YYYY-MM-DD)
  skip_reasons_by_date?: Record<string, string | null>;
  // For virtual occurrences generated in Upcoming view
  isVirtualOccurrence?: boolean;
  virtualOccurrenceDate?: string; // YYYY-MM-DD format
  originalTaskId?: string; // The real task ID for API calls
  // For past missed occurrences that are overdue
  isOverdue?: boolean;
  // For multi-per-day recurring tasks: occurrence index (0-based) and label
  occurrenceIndex?: number;
  occurrenceLabel?: string; // e.g., "(1 of 4)"
  /** Key for ``dependency_summaries_by_local_date`` slot map ("" or "0730", "occ1", …) */
  occurrenceSlotKey?: string;
  /** Phase 4i-5: from GET /tasks when include_dependency_summary=true */
  dependency_summary?: TaskDependencySummary | null;
  /** Per local day → per intraday slot for list badges (YYYY-MM-DD → slotKey → summary) */
  dependency_summaries_by_local_date?: Record<
    string,
    Record<string, TaskDependencySummary> | TaskDependencySummary
  > | null;
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
  // Scheduling: Use scheduled_date for date-only, scheduled_at for timed
  scheduled_date?: string | null; // YYYY-MM-DD, for date-only tasks
  scheduled_at?: string | null; // ISO datetime, for timed tasks
  notify_before_minutes?: number | null;
  // Phase 4b fields
  is_recurring?: boolean;
  recurrence_rule?: string | null;
  scheduling_mode?: SchedulingMode | null;
  // Phase 4g: Required for recurring tasks
  recurrence_behavior?: RecurrenceBehavior | null;
}

export interface UpdateTaskRequest {
  goal_id?: string;
  title?: string;
  description?: string | null;
  duration_minutes?: number;
  // Scheduling: Use scheduled_date for date-only, scheduled_at for timed
  scheduled_date?: string | null; // YYYY-MM-DD, for date-only tasks
  scheduled_at?: string | null; // ISO datetime, for timed tasks
  notify_before_minutes?: number | null;
  // Phase 4b fields
  is_recurring?: boolean;
  recurrence_rule?: string | null;
  scheduling_mode?: SchedulingMode | null;
  // Phase 4g: Recurrence behavior
  recurrence_behavior?: RecurrenceBehavior | null;
}

export interface CompleteTaskOverrides {
  override_confirm?: boolean;
  override_reason?: string | null;
}

export interface CompleteTaskRequest {
  completed_at?: string | null;
  scheduled_for?: string | null; // For recurring tasks: which occurrence was completed
  local_date?: string | null; // Client's local date (YYYY-MM-DD) for this occurrence
  override_confirm?: boolean;
  override_reason?: string | null;
}

export interface SkipTaskRequest {
  reason?: string | null;
  scheduled_for?: string | null; // For recurring tasks: which occurrence was skipped
  local_date?: string | null; // Client's local date (YYYY-MM-DD) for this occurrence
  confirm_proceed?: boolean;
}

/** Phase 4i-4: cascade skip root request */
export interface SkipChainTaskRequest {
  reason?: string | null;
  scheduled_for?: string | null;
  local_date?: string | null;
  cascade_skip: boolean;
}

export interface AffectedDownstreamEntry {
  task_id: string;
  task_title: string;
  rule_id: string;
  strength: string;
  affected_occurrences: number;
}

export interface TransitiveHardDependentPreviewEntry {
  task_id: string;
  task_title: string;
  affected_occurrences: number;
}

export interface SkipTaskPreviewResponse {
  status: "has_dependents";
  affected_downstream: AffectedDownstreamEntry[];
  /** Hard downstream cascade order (matches skip-chain); prefer for modal list. */
  transitive_hard_dependents_toposort?: TransitiveHardDependentPreviewEntry[];
}

/** Rows for skip cascade modal: full topo chain when API provides it. */
export function rowsForSkipCascadeModal(
  preview: SkipTaskPreviewResponse | null | undefined,
): AffectedDownstreamEntry[] {
  if (!preview) {
    return [];
  }
  const topo = preview.transitive_hard_dependents_toposort;
  if (topo && topo.length > 0) {
    return topo.map((r) => ({
      task_id: r.task_id,
      task_title: r.task_title,
      rule_id: r.task_id,
      strength: "hard",
      affected_occurrences: r.affected_occurrences,
    }));
  }
  return preview.affected_downstream;
}

export function isSkipTaskPreviewResponse(
  value: Task | SkipTaskPreviewResponse,
): value is SkipTaskPreviewResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    (value as SkipTaskPreviewResponse).status === "has_dependents"
  );
}

export interface ReopenTaskRequest {
  scheduled_for?: string | null; // For recurring tasks: which occurrence to undo
  local_date?: string | null; // Client's local date (YYYY-MM-DD) for this occurrence
}

// Phase 4e: Anytime tasks (backlog)
export interface AnytimeTasksResponse {
  tasks: Task[];
  total: number;
}

export interface ReorderTaskRequest {
  new_position: number; // 1-indexed (1 = top of list)
}

export interface ReorderTaskResponse {
  task: Task;
}

// Phase 4b: Task completion history (for recurring tasks)
export interface TaskCompletion {
  id: string;
  task_id: string;
  status: "completed" | "skipped";
  skip_reason: string | null;
  scheduled_for: string | null;
  completed_at: string;
  source?: "REAL" | "MOCK" | null;
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

// Time Machine types
export interface DeleteFutureCompletionsResponse {
  deletedCount: number;
}

export interface FutureCompletionsCountResponse {
  count: number;
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
  completeTask: (
    id: string,
    scheduledFor?: string,
    localDate?: string,
    overrides?: CompleteTaskOverrides,
  ) => Promise<Task>;
  skipTask: (
    id: string,
    reason?: string,
    scheduledFor?: string,
    localDate?: string,
  ) => Promise<Task | SkipTaskPreviewResponse>;
  reopenTask: (
    id: string,
    scheduledFor?: string,
    localDate?: string,
  ) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  // Phase 4e: Anytime tasks
  reorderTask: (id: string, newPosition: number) => Promise<Task>;
}

// ============================================================================
// Occurrence Ordering Types (Phase 4f)
// ============================================================================

export type SaveMode = "today" | "permanent";

export interface OccurrenceItem {
  task_id: string;
  occurrence_index: number;
}

export interface ReorderOccurrencesRequest {
  date: string; // YYYY-MM-DD
  occurrences: OccurrenceItem[];
  save_mode: SaveMode;
}

export interface ReorderOccurrencesResponse {
  message: string;
  save_mode: SaveMode;
  date: string;
  count: number;
}

export interface DayOrderItem {
  task_id: string;
  occurrence_index: number;
  sort_value: number;
  is_override: boolean;
}

export interface DayOrderResponse {
  date: string;
  items: DayOrderItem[];
  has_overrides: boolean;
}

// Range order types for efficient bulk loading
export interface PermanentOrderItem {
  task_id: string;
  occurrence_index: number;
  sequence_number: number;
}

export interface DateOverrideItem {
  task_id: string;
  occurrence_index: number;
  sort_position: number;
}

export interface DateRangeOrderResponse {
  start_date: string;
  end_date: string;
  permanent_order: PermanentOrderItem[];
  daily_overrides: Record<string, DateOverrideItem[]>;
}

// Item for reorder screen
export interface ReorderItem {
  task: Task;
  occurrenceIndex: number;
  occurrenceLabel?: string; // e.g., "(1 of 4)"
  key: string;
}

// ============================================================================
// Rhythm History Simulator Types (Phase 4h)
// ============================================================================

export interface BulkCompletionEntry {
  date: string; // YYYY-MM-DD
  status: "completed" | "skipped";
  skip_reason?: string;
  occurrences?: number;
}

export interface BulkCompletionsRequest {
  entries: BulkCompletionEntry[];
  update_start_date?: string; // YYYY-MM-DD
}

export interface BulkCompletionsResponse {
  created_count: number;
  task_id: string;
  start_date_updated: boolean;
}

export interface DeleteMockCompletionsResponse {
  deleted_count: number;
  task_id: string;
}

// ============================================================================
// Dependency Types (Phase 4i)
// ============================================================================

// Strength: how strict is this dependency?
export type DependencyStrength = "hard" | "soft";

// Scope: how do occurrences relate?
export type DependencyScope =
  | "all_occurrences"
  | "next_occurrence"
  | "within_window";

// Resolution source: how was this resolution created?
export type ResolutionSource = "manual" | "chain" | "override" | "system";

// Readiness state for dependency cache
export type ReadinessState = "ready" | "blocked" | "partial" | "advisory";

// Brief info about a task (for dependency display)
export interface DependencyTaskInfo {
  id: string;
  title: string;
  is_recurring: boolean;
  recurrence_rule: string | null;
}

// A dependency rule between two tasks
export interface DependencyRule {
  id: string;
  user_id: string;
  upstream_task_id: string;
  downstream_task_id: string;
  strength: DependencyStrength;
  scope: DependencyScope;
  required_occurrence_count: number;
  validity_window_minutes: number | null;
  created_at: string;
  updated_at: string;
  upstream_task: DependencyTaskInfo | null;
  downstream_task: DependencyTaskInfo | null;
}

export interface DependencyRuleListResponse {
  rules: DependencyRule[];
  total: number;
}

export interface CreateDependencyRuleRequest {
  upstream_task_id: string;
  downstream_task_id: string;
  strength?: DependencyStrength;
  scope?: DependencyScope;
  required_occurrence_count?: number;
  validity_window_minutes?: number;
}

export interface UpdateDependencyRuleRequest {
  strength?: DependencyStrength;
  scope?: DependencyScope;
  required_occurrence_count?: number;
  validity_window_minutes?: number;
}

export interface CycleValidationRequest {
  upstream_task_id: string;
  downstream_task_id: string;
}

export interface CycleValidationResponse {
  valid: boolean;
  reason: string | null;
  cycle_path: string[] | null;
}

// Info about an unmet dependency blocking completion
export interface DependencyBlocker {
  rule_id: string;
  upstream_task: DependencyTaskInfo;
  strength: DependencyStrength;
  scope: DependencyScope;
  required_count: number;
  completed_count: number;
  is_met: boolean;
  /** For within_window: resolved lookback in minutes (same value used for counting). */
  validity_window_minutes?: number | null;
}

// Info about a downstream task that depends on this task
export interface DependencyDependent {
  rule_id: string;
  downstream_task: DependencyTaskInfo;
  strength: DependencyStrength;
}

// Response for checking dependency status of a task occurrence
export interface DependencyStatusResponse {
  task_id: string;
  scheduled_for: string | null;
  dependencies: DependencyBlocker[];
  /** Topo-ordered unmet hard prerequisites (full chain) for completion modals */
  transitive_unmet_hard_prerequisites?: DependencyBlocker[];
  has_unmet_hard: boolean;
  has_unmet_soft: boolean;
  all_met: boolean;
  dependents: DependencyDependent[];
  readiness_state: ReadinessState;
}

// Response when completion is blocked by dependencies (409)
export interface DependencyBlockedResponse {
  message: string;
  task_id: string;
  scheduled_for: string | null;
  blockers: DependencyBlocker[];
  can_override: boolean;
  hint: string;
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
