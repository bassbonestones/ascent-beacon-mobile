import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { RhythmSimulatorModal } from "../RhythmSimulatorModal";
import api from "../../services/api";
import { showAlert, showConfirm } from "../../utils/alert";

jest.mock("../../services/api");
jest.mock("../../utils/alert");
jest.mock("../tasks/DatePicker", () => ({
  DatePicker: ({
    label,
    onChange,
    value,
  }: {
    label: string;
    onChange: (d: string | null) => void;
    value: string | null;
  }) => {
    const { Text, TouchableOpacity } = require("react-native");
    return (
      <TouchableOpacity
        onPress={() => onChange("2026-01-01")}
        testID="date-picker"
      >
        <Text>
          {label}: {value || "Select"}
        </Text>
      </TouchableOpacity>
    );
  },
}));

// Mock the Picker to allow selecting tasks in tests
jest.mock("@react-native-picker/picker", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");
  return {
    Picker: ({
      selectedValue,
      onValueChange,
      children,
    }: {
      selectedValue: string;
      onValueChange: (v: string) => void;
      children: React.ReactNode;
    }) => {
      // Extract task options from children
      const items = React.Children.toArray(children) as Array<{
        props?: { value?: string; label?: string };
      }>;
      return (
        <View testID="picker">
          <Text>Selected: {selectedValue || "none"}</Text>
          {items.map((item, idx: number) => {
            if (!item?.props?.value) return null;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => onValueChange(item.props!.value!)}
                testID={`picker-item-${item.props.value}`}
              >
                <Text>{item.props.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Item: (props: any) => props,
  };
});

const mockedApi = jest.mocked(api);
const mockedShowAlert = jest.mocked(showAlert);
const mockedShowConfirm = jest.mocked(showConfirm);

// Helper to get today's date in YYYY-MM-DD format
const today = new Date();
const todayStr = today.toISOString().split("T")[0];

// Start date from beginning of current month
const startDate = new Date();
startDate.setDate(1);
const startDateStr = startDate.toISOString().split("T")[0];

const mockRecurringTask = {
  id: "task-1",
  user_id: "user-1",
  goal_id: null,
  goal: null,
  title: "Daily Meditation",
  description: null,
  duration_minutes: 15,
  status: "pending" as const,
  scheduled_date: startDateStr,
  scheduled_at: null,
  is_recurring: true,
  is_lightning: false,
  recurrence_rule: "FREQ=DAILY;X-DAILYOCC=3", // 3 occurrences per day
  recurrence_behavior: "habitual" as const,
  notify_before_minutes: null,
  completed_at: null,
  skip_reason: null,
  scheduling_mode: "floating" as const,
  sort_order: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockNonRecurringTask = {
  ...mockRecurringTask,
  id: "task-2",
  title: "One-time Task",
  is_recurring: false,
  recurrence_rule: null,
  recurrence_behavior: null,
};

describe("RhythmSimulatorModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.getTasks.mockResolvedValue({
      tasks: [mockRecurringTask, mockNonRecurringTask],
      total: 2,
      pending_count: 1,
      completed_count: 0,
    });
    mockedApi.getTaskCompletions.mockResolvedValue({
      completions: [],
      total: 0,
      completed_count: 0,
      skipped_count: 0,
    });
    mockedShowConfirm.mockResolvedValue(true);
    mockedApi.createBulkCompletions.mockResolvedValue({
      task_id: "task-1",
      created_count: 5,
      start_date_updated: false,
    });
    mockedApi.deleteMockCompletions.mockResolvedValue({
      task_id: "task-1",
      deleted_count: 3,
    });
  });

  it("renders modal when visible", () => {
    render(<RhythmSimulatorModal visible={true} onClose={jest.fn()} />);
    expect(screen.getByText("📊 Rhythm Simulator")).toBeTruthy();
  });

  it("does not render when not visible", () => {
    render(<RhythmSimulatorModal visible={false} onClose={jest.fn()} />);
    expect(screen.queryByText("📊 Rhythm Simulator")).toBeNull();
  });

  it("calls onClose when close button pressed", () => {
    const onClose = jest.fn();
    render(<RhythmSimulatorModal visible={true} onClose={onClose} />);
    fireEvent.press(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("loads tasks when modal becomes visible", async () => {
    render(<RhythmSimulatorModal visible={true} onClose={jest.fn()} />);
    await waitFor(() => {
      expect(mockedApi.getTasks).toHaveBeenCalledWith({
        include_completed: true,
      });
    });
  });

  it("shows task selector with label", async () => {
    render(<RhythmSimulatorModal visible={true} onClose={jest.fn()} />);
    await waitFor(() => {
      expect(mockedApi.getTasks).toHaveBeenCalled();
    });
    expect(screen.getByText("Select Rhythm")).toBeTruthy();
  });

  it("shows error alert when task loading fails", async () => {
    mockedApi.getTasks.mockRejectedValue(new Error("Network error"));
    render(<RhythmSimulatorModal visible={true} onClose={jest.fn()} />);
    await waitFor(() => {
      expect(mockedShowAlert).toHaveBeenCalledWith(
        "Error",
        "Failed to load tasks",
      );
    });
  });

  it("does not show hierarchy when no task selected", async () => {
    render(<RhythmSimulatorModal visible={true} onClose={jest.fn()} />);
    await waitFor(() => {
      expect(mockedApi.getTasks).toHaveBeenCalled();
    });
    expect(screen.queryByText("Preview")).toBeNull();
    expect(screen.queryByText("State Legend (tap to cycle):")).toBeNull();
  });

  it("shows empty state when no recurring tasks exist", async () => {
    mockedApi.getTasks.mockResolvedValue({
      tasks: [mockNonRecurringTask],
      total: 1,
      pending_count: 1,
      completed_count: 0,
    });
    render(<RhythmSimulatorModal visible={true} onClose={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("No recurring tasks found")).toBeTruthy();
    });
  });

  it("shows loading state while fetching tasks", async () => {
    mockedApi.getTasks.mockImplementation(() => new Promise(() => {}));
    render(<RhythmSimulatorModal visible={true} onClose={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("Loading tasks...")).toBeTruthy();
    });
  });

  describe("when task is selected", () => {
    it("shows legend and hierarchy after selecting task", async () => {
      render(<RhythmSimulatorModal visible={true} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(mockedApi.getTasks).toHaveBeenCalled();
      });

      // Select the task
      fireEvent.press(screen.getByTestId("picker-item-task-1"));

      // Should now show legend
      await waitFor(() => {
        expect(screen.getByText("State Legend (tap to cycle):")).toBeTruthy();
      });
    });

    it("shows occurrence info for multi-occurrence tasks", async () => {
      render(<RhythmSimulatorModal visible={true} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(mockedApi.getTasks).toHaveBeenCalled();
      });

      // Select the task (has X-DAILYOCC=3)
      fireEvent.press(screen.getByTestId("picker-item-task-1"));

      await waitFor(() => {
        expect(screen.getByText("📌 3 occurrences per day")).toBeTruthy();
      });
    });

    it("shows stats preview section", async () => {
      render(<RhythmSimulatorModal visible={true} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(mockedApi.getTasks).toHaveBeenCalled();
      });

      fireEvent.press(screen.getByTestId("picker-item-task-1"));

      await waitFor(() => {
        expect(screen.getByText("Preview")).toBeTruthy();
      });
    });

    it("shows save and clear buttons", async () => {
      render(<RhythmSimulatorModal visible={true} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(mockedApi.getTasks).toHaveBeenCalled();
      });

      fireEvent.press(screen.getByTestId("picker-item-task-1"));

      await waitFor(() => {
        expect(screen.getByText("Save History")).toBeTruthy();
        expect(screen.getByText("Clear Mock Data")).toBeTruthy();
      });
    });

    it("shows alignment note", async () => {
      render(<RhythmSimulatorModal visible={true} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(mockedApi.getTasks).toHaveBeenCalled();
      });

      fireEvent.press(screen.getByTestId("picker-item-task-1"));

      await waitFor(() => {
        expect(
          screen.getByText("💡 Alignment interpretation coming in Phase 5"),
        ).toBeTruthy();
      });
    });

    it("shows date picker for start date", async () => {
      render(<RhythmSimulatorModal visible={true} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(mockedApi.getTasks).toHaveBeenCalled();
      });

      fireEvent.press(screen.getByTestId("picker-item-task-1"));

      await waitFor(() => {
        expect(screen.getByTestId("date-picker")).toBeTruthy();
      });
    });
  });

  describe("save functionality", () => {
    it("shows error when no dates selected", async () => {
      render(<RhythmSimulatorModal visible={true} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(mockedApi.getTasks).toHaveBeenCalled();
      });

      fireEvent.press(screen.getByTestId("picker-item-task-1"));

      await waitFor(() => {
        expect(screen.getByText("Save History")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Save History"));

      await waitFor(() => {
        expect(mockedShowAlert).toHaveBeenCalledWith(
          "Error",
          "No dates selected. Toggle states to mark them.",
        );
      });
    });
  });

  describe("clear mock data", () => {
    it("shows confirmation and calls API", async () => {
      render(<RhythmSimulatorModal visible={true} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(mockedApi.getTasks).toHaveBeenCalled();
      });

      fireEvent.press(screen.getByTestId("picker-item-task-1"));

      await waitFor(() => {
        expect(screen.getByText("Clear Mock Data")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Clear Mock Data"));

      await waitFor(() => {
        expect(mockedShowConfirm).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockedApi.deleteMockCompletions).toHaveBeenCalledWith("task-1");
      });
    });

    it("does not call API when user cancels", async () => {
      mockedShowConfirm.mockResolvedValue(false);

      render(<RhythmSimulatorModal visible={true} onClose={jest.fn()} />);

      await waitFor(() => {
        expect(mockedApi.getTasks).toHaveBeenCalled();
      });

      fireEvent.press(screen.getByTestId("picker-item-task-1"));

      await waitFor(() => {
        expect(screen.getByText("Clear Mock Data")).toBeTruthy();
      });

      fireEvent.press(screen.getByText("Clear Mock Data"));

      await waitFor(() => {
        expect(mockedShowConfirm).toHaveBeenCalled();
      });

      expect(mockedApi.deleteMockCompletions).not.toHaveBeenCalled();
    });
  });

  describe("modal lifecycle", () => {
    it("resets state when modal closes and reopens", async () => {
      const { rerender } = render(
        <RhythmSimulatorModal visible={true} onClose={jest.fn()} />,
      );

      await waitFor(() => {
        expect(mockedApi.getTasks).toHaveBeenCalledTimes(1);
      });

      // Close modal
      rerender(<RhythmSimulatorModal visible={false} onClose={jest.fn()} />);

      // Reopen
      rerender(<RhythmSimulatorModal visible={true} onClose={jest.fn()} />);

      // Tasks were already loaded
      expect(mockedApi.getTasks).toHaveBeenCalledTimes(1);
    });
  });
});
