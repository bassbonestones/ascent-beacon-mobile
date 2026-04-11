import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { TaskDependenciesSection } from "../TaskDependenciesSection";
import api from "../../../services/api";

// Mock the API
jest.mock("../../../services/api", () => ({
  __esModule: true,
  default: {
    getDependencyRules: jest.fn(),
  },
}));

const mockedApi = jest.mocked(api);

describe("TaskDependenciesSection", () => {
  const taskId = "task-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows Prerequisites section when upstream dependencies exist", async () => {
    mockedApi.getDependencyRules.mockResolvedValue({
      rules: [
        {
          id: "dep-1",
          upstream_task_id: "upstream-task-1",
          downstream_task_id: taskId,
          strength: "hard",
          scope: "all_occurrences",
          required_occurrence_count: 1,
          upstream_task: {
            id: "upstream-task-1",
            title: "Upstream Task",
          },
        },
      ],
    } as any);

    render(<TaskDependenciesSection taskId={taskId} />);

    await waitFor(() => {
      expect(screen.getByText("Prerequisites")).toBeTruthy();
      expect(screen.getByText("Upstream Task")).toBeTruthy();
    });
  });

  it("shows Unlocks section when downstream dependencies exist", async () => {
    mockedApi.getDependencyRules.mockResolvedValue({
      rules: [
        {
          id: "dep-2",
          upstream_task_id: taskId,
          downstream_task_id: "downstream-task-1",
          strength: "hard",
          scope: "all_occurrences",
          required_occurrence_count: 1,
          downstream_task: {
            id: "downstream-task-1",
            title: "Downstream Task",
          },
        },
      ],
    } as any);

    render(<TaskDependenciesSection taskId={taskId} />);

    await waitFor(() => {
      expect(screen.getByText("Unlocks")).toBeTruthy();
      expect(screen.getByText("Downstream Task")).toBeTruthy();
    });
  });

  it("shows Required badge for hard dependencies", async () => {
    mockedApi.getDependencyRules.mockResolvedValue({
      rules: [
        {
          id: "dep-1",
          upstream_task_id: "upstream-task-1",
          downstream_task_id: taskId,
          strength: "hard",
          scope: "all_occurrences",
          required_occurrence_count: 1,
          upstream_task: { id: "upstream-task-1", title: "Upstream Task" },
        },
      ],
    } as any);

    render(<TaskDependenciesSection taskId={taskId} />);

    await waitFor(() => {
      expect(screen.getByText("Required")).toBeTruthy();
    });
  });

  it("shows Recommended badge for soft dependencies", async () => {
    mockedApi.getDependencyRules.mockResolvedValue({
      rules: [
        {
          id: "dep-1",
          upstream_task_id: "upstream-task-1",
          downstream_task_id: taskId,
          strength: "soft",
          scope: "all_occurrences",
          required_occurrence_count: 1,
          upstream_task: { id: "upstream-task-1", title: "Upstream Task" },
        },
      ],
    } as any);

    render(<TaskDependenciesSection taskId={taskId} />);

    await waitFor(() => {
      expect(screen.getByText("Recommended")).toBeTruthy();
    });
  });

  it("shows nothing when no dependencies", async () => {
    mockedApi.getDependencyRules.mockResolvedValue({ rules: [] } as any);

    render(<TaskDependenciesSection taskId={taskId} />);

    await waitFor(() => {
      expect(mockedApi.getDependencyRules).toHaveBeenCalled();
    });

    // Component returns null when no dependencies
    expect(screen.queryByText("Prerequisites")).toBeNull();
    expect(screen.queryByText("Unlocks")).toBeNull();
  });

  it("handles API error gracefully", async () => {
    mockedApi.getDependencyRules.mockRejectedValue(new Error("API Error"));

    render(<TaskDependenciesSection taskId={taskId} />);

    await waitFor(() => {
      expect(mockedApi.getDependencyRules).toHaveBeenCalled();
    });

    // Should not crash - just show nothing
    expect(screen.queryByText("Prerequisites")).toBeNull();
  });

  it("fetches rules for the given taskId", async () => {
    mockedApi.getDependencyRules.mockResolvedValue({ rules: [] } as any);

    render(<TaskDependenciesSection taskId={taskId} />);

    await waitFor(() => {
      expect(mockedApi.getDependencyRules).toHaveBeenCalledWith({
        task_id: taskId,
      });
    });
  });
});
