/**
 * Test utilities and mock factories for React Native tests.
 */

import React from "react";
import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react-native";
import type { ReactElement } from "react";
import type {
  Value,
  Priority,
  ValueRevision,
  PriorityRevision,
  Task,
} from "./types";

// Mock API interface
export interface MockApi {
  // Auth methods
  sendLoginCode: jest.Mock;
  verifyLoginCode: jest.Mock;
  verifyGoogleToken: jest.Mock;
  logout: jest.Mock;

  // Values methods
  getValues: jest.Mock;
  getMyValues: jest.Mock;
  createValue: jest.Mock;
  deleteValue: jest.Mock;
  updateValue: jest.Mock;
  updateValueWeights: jest.Mock;
  acceptSimilarValue: jest.Mock;
  dismissSimilarValue: jest.Mock;

  // Priorities methods
  getPriorities: jest.Mock;
  createPriority: jest.Mock;
  updatePriority: jest.Mock;
  deletePriority: jest.Mock;
  stashPriority: jest.Mock;
  unstashPriority: jest.Mock;

  // Links methods
  getValuePriorityLinks: jest.Mock;
  createValuePriorityLink: jest.Mock;
  deleteValuePriorityLink: jest.Mock;

  // Assistant methods
  createAssistantSession: jest.Mock;
  sendAssistantMessage: jest.Mock;

  // Discovery methods
  getRecommendedValues: jest.Mock;
  acceptValueRecommendation: jest.Mock;
  rejectValueRecommendation: jest.Mock;
}

// Mock API service
export const createMockApi = (overrides: Partial<MockApi> = {}): MockApi => ({
  // Auth methods
  sendLoginCode: jest.fn(() => Promise.resolve({ success: true })),
  verifyLoginCode: jest.fn(() =>
    Promise.resolve({ access_token: "token", refresh_token: "refresh" }),
  ),
  verifyGoogleToken: jest.fn(() =>
    Promise.resolve({ access_token: "token", refresh_token: "refresh" }),
  ),
  logout: jest.fn(() => Promise.resolve()),

  // Values methods
  getValues: jest.fn(() => Promise.resolve([])),
  getMyValues: jest.fn(() => Promise.resolve([])),
  createValue: jest.fn((statement: string) =>
    Promise.resolve({ id: "value-1", statement }),
  ),
  deleteValue: jest.fn(() => Promise.resolve()),
  updateValue: jest.fn((id: string, statement: string) =>
    Promise.resolve({ id, statement }),
  ),
  updateValueWeights: jest.fn(() => Promise.resolve()),
  acceptSimilarValue: jest.fn(() => Promise.resolve()),
  dismissSimilarValue: jest.fn(() => Promise.resolve()),

  // Priorities methods
  getPriorities: jest.fn(() => Promise.resolve([])),
  createPriority: jest.fn((data: Partial<Priority>) =>
    Promise.resolve({ id: "priority-1", ...data }),
  ),
  updatePriority: jest.fn((id: string, data: Partial<Priority>) =>
    Promise.resolve({ id, ...data }),
  ),
  deletePriority: jest.fn(() => Promise.resolve()),
  stashPriority: jest.fn(() => Promise.resolve()),
  unstashPriority: jest.fn(() => Promise.resolve()),

  // Links methods
  getValuePriorityLinks: jest.fn(() => Promise.resolve([])),
  createValuePriorityLink: jest.fn(() => Promise.resolve({ id: "link-1" })),
  deleteValuePriorityLink: jest.fn(() => Promise.resolve()),

  // Assistant methods
  createAssistantSession: jest.fn(() =>
    Promise.resolve({ session_id: "session-1" }),
  ),
  sendAssistantMessage: jest.fn(() => Promise.resolve({ response: "Hello" })),

  // Discovery methods
  getRecommendedValues: jest.fn(() => Promise.resolve([])),
  acceptValueRecommendation: jest.fn(() => Promise.resolve()),
  rejectValueRecommendation: jest.fn(() => Promise.resolve()),

  ...overrides,
});

// Mock value factory
export const createMockValue = (overrides: Partial<Value> = {}): Value => ({
  id: "value-1",
  user_id: "user-1",
  active_revision_id: "rev-1",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  revisions: [
    {
      id: "rev-1",
      value_id: "value-1",
      statement: "Test value statement",
      weight_raw: 50,
      weight_normalized: 50,
      is_active: true,
      origin: "declared",
      created_at: "2024-01-01T00:00:00Z",
    },
  ],
  insights: [],
  ...overrides,
});

// Mock priority factory
export const createMockPriority = (
  overrides: Partial<Priority> = {},
): Priority => ({
  id: "priority-1",
  user_id: "user-1",
  active_revision_id: "rev-1",
  active_revision: {
    id: "rev-1",
    priority_id: "priority-1",
    title: "Test Priority",
    why_matters: "Test description that is long enough",
    scope: "ongoing",
    score: 4,
    cadence: null,
    constraints: null,
    is_anchored: false,
    is_active: true,
    notes: null,
    created_at: "2024-01-01T00:00:00Z",
    value_links: [],
  },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  is_stashed: false,
  ...overrides,
});

// Mock task factory
export const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: "task-1",
  user_id: "user-1",
  goal_id: "goal-1",
  title: "Test Task",
  description: null,
  duration_minutes: 30,
  status: "pending",
  scheduled_date: null,
  scheduled_at: null,
  is_recurring: false,
  recurrence_rule: null,
  notify_before_minutes: null,
  completed_at: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  is_lightning: false,
  goal: null,
  scheduling_mode: null,
  skip_reason: null,
  recurrence_behavior: null,
  sort_order: null,
  completed_for_today: false,
  completions_today: 0,
  completed_times_today: [],
  completions_by_date: {},
  skipped_for_today: false,
  skips_today: 0,
  skipped_times_today: [],
  skips_by_date: {},
  skip_reason_today: null,
  skip_reasons_by_date: {},
  ...overrides,
});

// Custom render function with providers
export const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
): RenderResult => {
  return render(ui, options);
};

// Mock TimeContext value interface
export interface MockTimeContextValue {
  isTimeMachineEnabled: boolean;
  isTimeTravelActive: boolean;
  travelDate: Date | null;
  overrideTimezone: string | null;
  enableTimeMachine: jest.Mock;
  disableTimeMachine: jest.Mock;
  setTravelDate: jest.Mock;
  setTimezone: jest.Mock;
  getTimezone: jest.Mock;
  resetToToday: jest.Mock;
  fullReset: jest.Mock;
  revertToDate: jest.Mock;
  getFutureCompletionsCount: jest.Mock;
  getCurrentDate: () => Date;
  loading: boolean;
}

// Mock TimeContext factory
export const createMockTimeContext = (
  overrides: Partial<MockTimeContextValue> = {},
): MockTimeContextValue => ({
  isTimeMachineEnabled: false,
  isTimeTravelActive: false,
  travelDate: null,
  overrideTimezone: null,
  enableTimeMachine: jest.fn(),
  disableTimeMachine: jest.fn(),
  setTravelDate: jest.fn(),
  setTimezone: jest.fn(),
  getTimezone: jest.fn().mockReturnValue("America/New_York"),
  resetToToday: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  fullReset: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  revertToDate: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  getFutureCompletionsCount: jest.fn().mockResolvedValue(0),
  getCurrentDate: () => new Date(),
  loading: false,
  ...overrides,
});

export * from "@testing-library/react-native";
export { customRender as render };
