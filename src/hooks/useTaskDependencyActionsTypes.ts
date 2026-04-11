import type { Task, DependencyBlocker, CompleteTaskOverrides, SkipTaskPreviewResponse } from "../types";

export interface UseTaskDependencyActionsParams {
  tasksWithPrerequisites: Set<string>;
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
    confirmProceed?: boolean,
  ) => Promise<Task | SkipTaskPreviewResponse>;
  fetchTasks: () => Promise<void>;
  getCurrentDate: () => Date;
  onFlowFinished?: () => void;
}

export interface HardModalState {
  visible: boolean;
  task: Task | null;
  blockers: DependencyBlocker[];
  scheduledFor?: string;
  localDate?: string;
}

export interface SoftModalState {
  visible: boolean;
  task: Task | null;
  blockers: DependencyBlocker[];
  scheduledFor?: string;
  localDate?: string;
}

export interface OverrideModalState {
  visible: boolean;
  task: Task | null;
  blockers: DependencyBlocker[];
  scheduledFor?: string;
  localDate?: string;
  reason: string;
}

export interface SuccessListState {
  visible: boolean;
  titles: string[];
  kind: "complete_chain" | "cascade_skip";
  skipReason?: string;
}
