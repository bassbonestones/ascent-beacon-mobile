import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { TaskSearchModal } from "../TaskSearchModal";
import api from "../../../services/api";

// Mock the API
jest.mock("../../../services/api", () => ({
  __esModule: true,
  default: {
    getTasks: jest.fn(),
  },
}));

const mockedApi = jest.mocked(api);

describe("TaskSearchModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSelect = jest.fn();

  const mockTasks = [
    {
      id: "task-1",
      title: "Task One",
      is_recurring: false,
    },
    {
      id: "task-2",
      title: "Task Two",
      is_recurring: true,
    },
    {
      id: "task-3",
      title: "Another Task",
      is_recurring: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.getTasks.mockResolvedValue({
      tasks: mockTasks as any,
      total: 3,
      pending_count: 3,
      completed_count: 0,
    });
  });

  it("renders header and search input when visible", async () => {
    render(
      <TaskSearchModal
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        excludeTaskIds={[]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Add Prerequisite")).toBeTruthy();
      expect(screen.getByPlaceholderText("Search tasks...")).toBeTruthy();
    });
  });

  it("loads and displays tasks", async () => {
    render(
      <TaskSearchModal
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        excludeTaskIds={[]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Task One")).toBeTruthy();
      expect(screen.getByText("Task Two")).toBeTruthy();
    });
  });

  it("filters tasks by search query", async () => {
    render(
      <TaskSearchModal
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        excludeTaskIds={[]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Task One")).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText("Search tasks...");
    fireEvent.changeText(searchInput, "Another");

    await waitFor(() => {
      expect(screen.getByText("Another Task")).toBeTruthy();
      expect(screen.queryByText("Task One")).toBeNull();
    });
  });

  it("excludes specified task IDs from list", async () => {
    render(
      <TaskSearchModal
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        excludeTaskIds={["task-1"]}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText("Task One")).toBeNull();
      expect(screen.getByText("Task Two")).toBeTruthy();
    });
  });

  it("calls onSelect and onClose when task is selected", async () => {
    render(
      <TaskSearchModal
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        excludeTaskIds={[]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Task One")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Task One"));

    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "task-1", title: "Task One" }),
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows recurring badge for recurring tasks", async () => {
    render(
      <TaskSearchModal
        visible={true}
        onClose={mockOnClose}
        onSelect={mockOnSelect}
        excludeTaskIds={[]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("🔄 Recurring")).toBeTruthy();
    });
  });
});
