import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import {
  PrerequisiteSelector,
  SelectedPrerequisite,
} from "../PrerequisiteSelector";

// Mock the TaskSearchModal with a functional implementation
jest.mock("../TaskSearchModal", () => ({
  TaskSearchModal: ({
    visible,
    onSelect,
    onClose,
  }: {
    visible: boolean;
    onSelect: (task: any) => void;
    onClose: () => void;
  }) => {
    if (!visible) return null;
    // Use View/Text from react-native would need imports, use simpler approach
    const React = require("react");
    const { View, TouchableOpacity, Text } =
      require("react-native") as typeof import("react-native");
    return (
      <View testID="task-search-modal">
        <TouchableOpacity
          testID="select-recurring-task"
          onPress={() =>
            onSelect({
              id: "recurring-task-1",
              title: "Recurring Task",
              is_recurring: true,
            })
          }
        >
          <Text>Select Recurring Task</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="select-one-time-task"
          onPress={() =>
            onSelect({
              id: "one-time-task-1",
              title: "One Time Task",
              is_recurring: false,
            })
          }
        >
          <Text>Select One Time Task</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="close-modal" onPress={onClose}>
          <Text>Close</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

describe("PrerequisiteSelector", () => {
  const mockOnChange = jest.fn();

  const mockTask = {
    id: "task-1",
    title: "First Task",
    is_recurring: false,
  };

  const defaultProps = {
    prerequisites: [] as SelectedPrerequisite[],
    onPrerequisitesChange: mockOnChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders section header", () => {
    render(<PrerequisiteSelector {...defaultProps} />);
    expect(screen.getByText("Prerequisites")).toBeTruthy();
  });

  it("renders help text", () => {
    render(<PrerequisiteSelector {...defaultProps} />);
    expect(
      screen.getByText("Tasks that must be completed before this one"),
    ).toBeTruthy();
  });

  it("shows add button when no prerequisites selected", () => {
    render(<PrerequisiteSelector {...defaultProps} />);
    expect(screen.getByText("+ Add Prerequisite")).toBeTruthy();
  });

  it("displays selected prerequisites", () => {
    const prerequisites: SelectedPrerequisite[] = [
      {
        task: mockTask as any,
        strength: "hard",
        scope: "all_occurrences",
        requiredCount: 1,
        validityWindowMinutes: null,
      },
    ];

    render(
      <PrerequisiteSelector {...defaultProps} prerequisites={prerequisites} />,
    );

    expect(screen.getByText("First Task")).toBeTruthy();
  });

  it("shows Required strength badge for hard dependencies", () => {
    const prerequisites: SelectedPrerequisite[] = [
      {
        task: mockTask as any,
        strength: "hard",
        scope: "all_occurrences",
        requiredCount: 1,
        validityWindowMinutes: null,
      },
    ];

    render(
      <PrerequisiteSelector {...defaultProps} prerequisites={prerequisites} />,
    );

    expect(screen.getByText("Required")).toBeTruthy();
  });

  it("calls onChange when strength badge is pressed", () => {
    const prerequisites: SelectedPrerequisite[] = [
      {
        task: mockTask as any,
        strength: "hard",
        scope: "all_occurrences",
        requiredCount: 1,
        validityWindowMinutes: null,
      },
    ];

    render(
      <PrerequisiteSelector {...defaultProps} prerequisites={prerequisites} />,
    );

    // Press the Required badge to toggle to Recommended
    fireEvent.press(screen.getByText("Required"));

    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({
        strength: "soft",
      }),
    ]);
  });

  it("shows More options toggle", () => {
    const prerequisites: SelectedPrerequisite[] = [
      {
        task: mockTask as any,
        strength: "hard",
        scope: "all_occurrences",
        requiredCount: 1,
        validityWindowMinutes: null,
      },
    ];

    render(
      <PrerequisiteSelector {...defaultProps} prerequisites={prerequisites} />,
    );

    expect(screen.getByText("▼ More options")).toBeTruthy();
  });

  it("expands to show Order help for single-instance pair when More options is pressed", () => {
    const prerequisites: SelectedPrerequisite[] = [
      {
        task: mockTask as any,
        strength: "hard",
        scope: "all_occurrences",
        requiredCount: 1,
        validityWindowMinutes: null,
      },
    ];

    render(
      <PrerequisiteSelector {...defaultProps} prerequisites={prerequisites} />,
    );

    fireEvent.press(screen.getByText("▼ More options"));

    expect(screen.getByText("▲ Less options")).toBeTruthy();
    expect(screen.getByText("Order")).toBeTruthy();
    expect(screen.getByTestId("single-instance-scope-help")).toBeTruthy();
    expect(screen.getByTestId("upstream-one-time-count-help")).toBeTruthy();
    expect(
      screen.queryByLabelText("Required completion count"),
    ).toBeNull();
  });

  it("shows remove button for each prerequisite", () => {
    const prerequisites: SelectedPrerequisite[] = [
      {
        task: mockTask as any,
        strength: "hard",
        scope: "all_occurrences",
        requiredCount: 1,
        validityWindowMinutes: null,
      },
    ];

    render(
      <PrerequisiteSelector {...defaultProps} prerequisites={prerequisites} />,
    );

    expect(screen.getByText("✕")).toBeTruthy();
  });

  it("calls onChange when prerequisite is removed", () => {
    const prerequisites: SelectedPrerequisite[] = [
      {
        task: mockTask as any,
        strength: "hard",
        scope: "all_occurrences",
        requiredCount: 1,
        validityWindowMinutes: null,
      },
    ];

    render(
      <PrerequisiteSelector {...defaultProps} prerequisites={prerequisites} />,
    );

    fireEvent.press(screen.getByText("✕"));

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it("opens modal when add button is pressed", () => {
    render(<PrerequisiteSelector {...defaultProps} />);

    fireEvent.press(screen.getByText("+ Add Prerequisite"));

    expect(screen.getByTestId("task-search-modal")).toBeTruthy();
  });

  it("adds task when selected from modal", () => {
    render(
      <PrerequisiteSelector {...defaultProps} currentTaskIsRecurring={false} />,
    );

    fireEvent.press(screen.getByText("+ Add Prerequisite"));
    fireEvent.press(screen.getByTestId("select-recurring-task"));

    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({
        task: expect.objectContaining({ id: "recurring-task-1" }),
        strength: "hard",
      }),
    ]);
  });

  it("shows all three scope options when both tasks are recurring", () => {
    const recurringPrereq: SelectedPrerequisite[] = [
      {
        task: {
          id: "recurring-up",
          title: "Recurring Up",
          is_recurring: true,
        } as any,
        strength: "hard",
        scope: "next_occurrence",
        requiredCount: 1,
        validityWindowMinutes: null,
      },
    ];

    render(
      <PrerequisiteSelector
        {...defaultProps}
        prerequisites={recurringPrereq}
        currentTaskIsRecurring={true}
      />,
    );

    fireEvent.press(screen.getByText("▼ More options"));

    expect(screen.getByText("How occurrences relate")).toBeTruthy();
    expect(screen.getByText("Always required first")).toBeTruthy();
    expect(screen.getByText("One-for-one")).toBeTruthy();
    expect(screen.getByText("Within time window")).toBeTruthy();
  });

  it("calls onChange when scope is changed (recurring pair)", () => {
    const prerequisites: SelectedPrerequisite[] = [
      {
        task: {
          id: "recurring-up",
          title: "Recurring Up",
          is_recurring: true,
        } as any,
        strength: "hard",
        scope: "all_occurrences",
        requiredCount: 1,
        validityWindowMinutes: null,
      },
    ];

    render(
      <PrerequisiteSelector
        {...defaultProps}
        prerequisites={prerequisites}
        currentTaskIsRecurring={true}
      />,
    );

    fireEvent.press(screen.getByText("▼ More options"));
    fireEvent.press(screen.getByText("One-for-one"));

    expect(mockOnChange).toHaveBeenCalledWith([
      expect.objectContaining({
        scope: "next_occurrence",
      }),
    ]);
  });

  it("shows window input when within_window scope is selected", () => {
    const prerequisites: SelectedPrerequisite[] = [
      {
        task: {
          id: "recurring-up",
          title: "Recurring Up",
          is_recurring: true,
        } as any,
        strength: "hard",
        scope: "within_window",
        requiredCount: 1,
        validityWindowMinutes: 60,
      },
    ];

    render(
      <PrerequisiteSelector
        {...defaultProps}
        prerequisites={prerequisites}
        currentTaskIsRecurring={true}
      />,
    );

    fireEvent.press(screen.getByText("▼ More options"));

    expect(screen.getByText("Time window (minutes)")).toBeTruthy();
  });

  it("shows recurring indicator for recurring tasks", () => {
    const recurringTask = {
      id: "recurring-1",
      title: "Recurring Prereq",
      is_recurring: true,
    };

    const prerequisites: SelectedPrerequisite[] = [
      {
        task: recurringTask as any,
        strength: "hard",
        scope: "next_occurrence",
        requiredCount: 1,
        validityWindowMinutes: null,
      },
    ];

    render(
      <PrerequisiteSelector {...defaultProps} prerequisites={prerequisites} />,
    );

    expect(screen.getByText("🔄")).toBeTruthy();
  });

  it("collapses expanded options when toggle is pressed again", () => {
    const prerequisites: SelectedPrerequisite[] = [
      {
        task: mockTask as any,
        strength: "hard",
        scope: "all_occurrences",
        requiredCount: 1,
        validityWindowMinutes: null,
      },
    ];

    render(
      <PrerequisiteSelector {...defaultProps} prerequisites={prerequisites} />,
    );

    // Expand
    fireEvent.press(screen.getByText("▼ More options"));
    expect(screen.getByText("▲ Less options")).toBeTruthy();

    // Collapse
    fireEvent.press(screen.getByText("▲ Less options"));
    expect(screen.getByText("▼ More options")).toBeTruthy();
    expect(screen.queryByText("Order")).toBeNull();
    expect(screen.queryByTestId("single-instance-scope-help")).toBeNull();
  });

  it("shows two scope options for mixed recurrence (no Always required first)", () => {
    const prerequisites: SelectedPrerequisite[] = [
      {
        task: {
          id: "one-time-up",
          title: "One-time",
          is_recurring: false,
        } as any,
        strength: "hard",
        scope: "within_window",
        requiredCount: 1,
        validityWindowMinutes: null,
      },
    ];

    render(
      <PrerequisiteSelector
        {...defaultProps}
        prerequisites={prerequisites}
        currentTaskIsRecurring={true}
      />,
    );

    fireEvent.press(screen.getByText("▼ More options"));

    expect(screen.getByText("One-for-one")).toBeTruthy();
    expect(screen.getByText("Within time window")).toBeTruthy();
    expect(screen.queryByText("Always required first")).toBeNull();
  });

  describe("inferred scope based on recurrence", () => {
    it("uses next_occurrence when both tasks are recurring", () => {
      render(
        <PrerequisiteSelector
          {...defaultProps}
          currentTaskIsRecurring={true}
        />,
      );

      // Open modal and select recurring task
      fireEvent.press(screen.getByText("+ Add Prerequisite"));
      fireEvent.press(screen.getByTestId("select-recurring-task"));

      // Should call onChange with next_occurrence scope
      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          scope: "next_occurrence",
        }),
      ]);
    });

    it("uses within_window when one task is recurring and other is not", () => {
      render(
        <PrerequisiteSelector
          {...defaultProps}
          currentTaskIsRecurring={true}
        />,
      );

      // Open modal and select one-time task (upstream) with recurring downstream
      fireEvent.press(screen.getByText("+ Add Prerequisite"));
      fireEvent.press(screen.getByTestId("select-one-time-task"));

      // Should call onChange with within_window scope (mixed case)
      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          scope: "within_window",
        }),
      ]);
    });
  });

  describe("remove handling", () => {
    it("collapses expanded options when removing expanded item", () => {
      const prerequisites: SelectedPrerequisite[] = [
        {
          task: mockTask as any,
          strength: "hard",
          scope: "all_occurrences",
          requiredCount: 1,
          validityWindowMinutes: null,
        },
      ];

      render(
        <PrerequisiteSelector {...defaultProps} prerequisites={prerequisites} />,
      );

      // Expand
      fireEvent.press(screen.getByText("▼ More options"));
      expect(screen.getByText("▲ Less options")).toBeTruthy();

      // Remove
      fireEvent.press(screen.getByLabelText("Remove First Task"));

      // Should call onChange with empty array
      expect(mockOnChange).toHaveBeenCalledWith([]);
    });
  });

  describe("scope changes", () => {
    it("changes scope when relationship option is selected (recurring pair)", () => {
      const prerequisites: SelectedPrerequisite[] = [
        {
          task: {
            id: "recurring-up",
            title: "Recurring Up",
            is_recurring: true,
          } as any,
          strength: "hard",
          scope: "all_occurrences",
          requiredCount: 1,
          validityWindowMinutes: null,
        },
      ];

      render(
        <PrerequisiteSelector
          {...defaultProps}
          prerequisites={prerequisites}
          currentTaskIsRecurring={true}
        />,
      );

      fireEvent.press(screen.getByText("▼ More options"));
      fireEvent.press(screen.getByText("One-for-one"));

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          scope: "next_occurrence",
        }),
      ]);
    });
  });

  describe("count and window changes", () => {
    it("handles invalid count input by defaulting to 1", () => {
      const prerequisites: SelectedPrerequisite[] = [
        {
          task: {
            id: "recurring-up",
            title: "Recurring Up",
            is_recurring: true,
          } as any,
          strength: "hard",
          scope: "next_occurrence",
          requiredCount: 3,
          validityWindowMinutes: null,
        },
      ];

      render(
        <PrerequisiteSelector
          {...defaultProps}
          prerequisites={prerequisites}
          currentTaskIsRecurring={true}
        />,
      );

      // Expand to see count input
      fireEvent.press(screen.getByText("▼ More options"));

      // Change count to invalid value
      const countInput = screen.getByDisplayValue("3");
      fireEvent.changeText(countInput, "abc");

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          requiredCount: 1, // Invalid input defaults to 1
        }),
      ]);
    });

    it("handles window change with invalid input", () => {
      const prerequisites: SelectedPrerequisite[] = [
        {
          task: {
            id: "recurring-up",
            title: "Recurring Up",
            is_recurring: true,
          } as any,
          strength: "hard",
          scope: "within_window",
          requiredCount: 1,
          validityWindowMinutes: 60,
        },
      ];

      render(
        <PrerequisiteSelector
          {...defaultProps}
          prerequisites={prerequisites}
          currentTaskIsRecurring={true}
        />,
      );

      // Expand to see window input
      fireEvent.press(screen.getByText("▼ More options"));

      // Change window to invalid value
      const windowInput = screen.getByDisplayValue("60");
      fireEvent.changeText(windowInput, "invalid");

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          validityWindowMinutes: null, // Invalid input defaults to null
        }),
      ]);
    });
  });
});
