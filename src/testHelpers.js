/**
 * Test utilities and mock factories for React Native tests.
 */

import React from "react";
import { render } from "@testing-library/react-native";

// Mock API service
export const createMockApi = (overrides = {}) => ({
  // Auth methods
  sendLoginCode: jest.fn(() => Promise.resolve({ success: true })),
  verifyLoginCode: jest.fn(() => Promise.resolve({ access_token: "token", refresh_token: "refresh" })),
  verifyGoogleToken: jest.fn(() => Promise.resolve({ access_token: "token", refresh_token: "refresh" })),
  logout: jest.fn(() => Promise.resolve()),
  
  // Values methods
  getValues: jest.fn(() => Promise.resolve([])),
  getMyValues: jest.fn(() => Promise.resolve([])),
  createValue: jest.fn((statement) => Promise.resolve({ id: "value-1", statement })),
  deleteValue: jest.fn(() => Promise.resolve()),
  updateValue: jest.fn((id, statement) => Promise.resolve({ id, statement })),
  updateValueWeights: jest.fn(() => Promise.resolve()),
  acceptSimilarValue: jest.fn(() => Promise.resolve()),
  dismissSimilarValue: jest.fn(() => Promise.resolve()),
  
  // Priorities methods
  getPriorities: jest.fn(() => Promise.resolve([])),
  createPriority: jest.fn((data) => Promise.resolve({ id: "priority-1", ...data })),
  updatePriority: jest.fn((id, data) => Promise.resolve({ id, ...data })),
  deletePriority: jest.fn(() => Promise.resolve()),
  stashPriority: jest.fn(() => Promise.resolve()),
  unstashPriority: jest.fn(() => Promise.resolve()),
  
  // Links methods
  getValuePriorityLinks: jest.fn(() => Promise.resolve([])),
  createValuePriorityLink: jest.fn(() => Promise.resolve({ id: "link-1" })),
  deleteValuePriorityLink: jest.fn(() => Promise.resolve()),
  
  // Assistant methods
  createAssistantSession: jest.fn(() => Promise.resolve({ session_id: "session-1" })),
  sendAssistantMessage: jest.fn(() => Promise.resolve({ response: "Hello" })),
  
  // Discovery methods
  getRecommendedValues: jest.fn(() => Promise.resolve([])),
  acceptValueRecommendation: jest.fn(() => Promise.resolve()),
  rejectValueRecommendation: jest.fn(() => Promise.resolve()),
  
  ...overrides,
});

// Mock value factory
export const createMockValue = (overrides = {}) => ({
  id: "value-1",
  active_revision_id: "rev-1",
  revisions: [{
    id: "rev-1",
    statement: "Test value statement",
    weight_normalized: 50,
    created_at: "2024-01-01T00:00:00Z",
  }],
  similar_value_insight: null,
  ...overrides,
});

// Mock priority factory
export const createMockPriority = (overrides = {}) => ({
  id: "priority-1",
  active_revision_id: "rev-1",
  is_stashed: false,
  revisions: [{
    id: "rev-1",
    title: "Test Priority",
    description: "Test description",
    scope: "ongoing",
    importance_score: 4,
    urgency_score: 3,
    created_at: "2024-01-01T00:00:00Z",
  }],
  ...overrides,
});

// Mock link factory
export const createMockLink = (overrides = {}) => ({
  id: "link-1",
  value_id: "value-1",
  priority_id: "priority-1",
  relevance_score: 80,
  ...overrides,
});

// Mock user factory
export const createMockUser = (overrides = {}) => ({
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  ...overrides,
});

// Auth context wrapper
export const createAuthContextValue = (overrides = {}) => ({
  user: createMockUser(),
  isAuthenticated: true,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  refreshAuth: jest.fn(),
  ...overrides,
});

// Custom render with providers
export const renderWithProviders = (ui, { authContext = {}, ...renderOptions } = {}) => {
  const AuthContext = React.createContext(createAuthContextValue(authContext));
  
  const Wrapper = ({ children }) => (
    <AuthContext.Provider value={createAuthContextValue(authContext)}>
      {children}
    </AuthContext.Provider>
  );
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Wait utility for async operations
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

// Flush all promises
export const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

// Mock Alert
export const mockAlert = () => {
  const alertMock = jest.spyOn(require("react-native").Alert, "alert");
  return alertMock;
};

export default {
  createMockApi,
  createMockValue,
  createMockPriority,
  createMockLink,
  createMockUser,
  createAuthContextValue,
  renderWithProviders,
  waitForAsync,
  flushPromises,
  mockAlert,
};
