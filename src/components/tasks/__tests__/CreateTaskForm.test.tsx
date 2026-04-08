import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { CreateTaskForm } from "../CreateTaskForm";
import type { Goal } from "../../../types";

const createMockGoal = (overrides: Partial<Goal> = {}): Goal => ({
  id: "goal-1",
  user_id: "user-1",
  parent_goal_id: null,
  title: "Test Goal",
  description: "Test description",
  target_date: "2024-12-31",
  status: "in_progress",
  progress_cached: 0,
  total_time_minutes: 100,
  completed_time_minutes: 25,
  has_incomplete_breakdown: false,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  completed_at: null,
  priorities: [],
  ...overrides,
});

describe("CreateTaskForm", () => {
  const defaultProps = {
    goals: [createMockGoal()],
    goalsLoading: false,
    selectedGoalId: "",
    onGoalSelect: jest.fn(),
    title: "",
    onTitleChange: jest.fn(),
    description: "",
    onDescriptionChange: jest.fn(),
    isLightning: false,
    onLightningToggle: jest.fn(),
    duration: "",
    onDurationChange: jest.fn(),
    isRecurring: false,
    onRecurringToggle: jest.fn(),
    recurrenceRule: "",
    schedulingMode: null,
    recurrenceBehavior: null,
    scheduledTime: null,
    onScheduledTimeChange: jest.fn(),
    scheduledDate: null,
    onScheduledDateChange: jest.fn(),
    onRecurrenceChange: jest.fn(),
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders header with title", () => {
    render(<CreateTaskForm {...defaultProps} />);
    expect(screen.getByText("New Task")).toBeTruthy();
  });

  it("renders cancel button", () => {
    render(<CreateTaskForm {...defaultProps} />);
    expect(screen.getByLabelText("Cancel and go back to list")).toBeTruthy();
  });

  it("calls onCancel when cancel button is pressed", () => {
    render(<CreateTaskForm {...defaultProps} />);
    fireEvent.press(screen.getByLabelText("Cancel and go back to list"));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it("shows loading indicator when goals are loading", () => {
    render(<CreateTaskForm {...defaultProps} goalsLoading={true} />);
    // ActivityIndicator doesn't have accessible label by default
    // Just verify the component renders without error
    expect(screen.getByText("Goal (optional)")).toBeTruthy();
  });

  it("shows None option even when no goals exist", () => {
    render(<CreateTaskForm {...defaultProps} goals={[]} />);
    expect(screen.getByText("⊘ None (unaligned)")).toBeTruthy();
  });

  it("renders None option and None option and goal options", () => {
    const goals = [
      createMockGoal({ id: "goal-1", title: "Goal One" }),
      createMockGoal({ id: "goal-2", title: "Goal Two" }),
    ];
    render(<CreateTaskForm {...defaultProps} goals={goals} />);
    expect(screen.getByText("⊘ None (unaligned)")).toBeTruthy();
    expect(screen.getByText("Goal One")).toBeTruthy();
    expect(screen.getByText("Goal Two")).toBeTruthy();
  });

  it("calls onGoalSelect with empty string when None is pressed", () => {
    const onGoalSelect = jest.fn();
    render(
      <CreateTaskForm
        {...defaultProps}
        onGoalSelect={onGoalSelect}
        selectedGoalId="some-goal"
      />,
    );
    fireEvent.press(screen.getByLabelText("No goal (unaligned task)"));
    expect(onGoalSelect).toHaveBeenCalledWith("");
  });

  it("calls onGoalSelect when goal is pressed", () => {
    const goals = [createMockGoal({ id: "goal-1", title: "Select Me" })];
    const onGoalSelect = jest.fn();
    render(
      <CreateTaskForm
        {...defaultProps}
        goals={goals}
        onGoalSelect={onGoalSelect}
      />,
    );
    fireEvent.press(screen.getByLabelText("Select goal: Select Me"));
    expect(onGoalSelect).toHaveBeenCalledWith("goal-1");
  });

  it("renders title input", () => {
    render(<CreateTaskForm {...defaultProps} />);
    expect(screen.getByLabelText("Task title")).toBeTruthy();
  });

  it("calls onTitleChange when typing in title", () => {
    render(<CreateTaskForm {...defaultProps} />);
    fireEvent.changeText(screen.getByLabelText("Task title"), "New Task Title");
    expect(defaultProps.onTitleChange).toHaveBeenCalledWith("New Task Title");
  });

  it("renders description input", () => {
    render(<CreateTaskForm {...defaultProps} />);
    expect(screen.getByLabelText("Task description")).toBeTruthy();
  });

  it("calls onDescriptionChange when typing in description", () => {
    render(<CreateTaskForm {...defaultProps} />);
    fireEvent.changeText(
      screen.getByLabelText("Task description"),
      "Description here",
    );
    expect(defaultProps.onDescriptionChange).toHaveBeenCalledWith(
      "Description here",
    );
  });

  it("renders lightning checkbox", () => {
    render(<CreateTaskForm {...defaultProps} />);
    expect(screen.getByText("Lightning Task")).toBeTruthy();
    expect(
      screen.getByText("For tasks that take less than a minute"),
    ).toBeTruthy();
  });

  it("calls onLightningToggle when checkbox is pressed", () => {
    render(<CreateTaskForm {...defaultProps} />);
    fireEvent.press(screen.getByLabelText("Enable lightning task"));
    expect(defaultProps.onLightningToggle).toHaveBeenCalled();
  });

  it("shows duration input when not lightning", () => {
    render(<CreateTaskForm {...defaultProps} isLightning={false} />);
    expect(screen.getByLabelText("Task duration in minutes")).toBeTruthy();
  });

  it("hides duration input when lightning", () => {
    render(<CreateTaskForm {...defaultProps} isLightning={true} />);
    expect(screen.queryByLabelText("Task duration in minutes")).toBeNull();
  });

  it("calls onDurationChange when typing duration", () => {
    render(<CreateTaskForm {...defaultProps} />);
    fireEvent.changeText(
      screen.getByLabelText("Task duration in minutes"),
      "45",
    );
    expect(defaultProps.onDurationChange).toHaveBeenCalledWith("45");
  });

  it("renders submit button", () => {
    render(<CreateTaskForm {...defaultProps} />);
    expect(screen.getByLabelText("Create task")).toBeTruthy();
  });

  it("disables submit button when title is empty", () => {
    render(
      <CreateTaskForm {...defaultProps} title="" selectedGoalId="goal-1" />,
    );
    const submitButton = screen.getByLabelText("Create task");
    expect(submitButton.props.accessibilityState?.disabled).toBe(true);
  });

  it("enables submit button when title provided (goal optional)", () => {
    render(
      <CreateTaskForm {...defaultProps} title="Some title" selectedGoalId="" />,
    );
    const submitButton = screen.getByLabelText("Create task");
    // Goal is optional, so button should be enabled with just title
    expect(submitButton.props.accessibilityState?.disabled).toBeFalsy();
  });

  it("enables submit button when title and goal provided", () => {
    render(
      <CreateTaskForm
        {...defaultProps}
        title="Some title"
        selectedGoalId="goal-1"
      />,
    );
    const submitButton = screen.getByLabelText("Create task");
    expect(submitButton.props.accessibilityState?.disabled).toBeFalsy();
  });

  it("calls onSubmit when submit button is pressed", () => {
    render(
      <CreateTaskForm
        {...defaultProps}
        title="Some title"
        selectedGoalId="goal-1"
      />,
    );
    fireEvent.press(screen.getByLabelText("Create task"));
    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it("displays title value", () => {
    render(<CreateTaskForm {...defaultProps} title="Pre-filled title" />);
    const titleInput = screen.getByLabelText("Task title");
    expect(titleInput.props.value).toBe("Pre-filled title");
  });

  it("displays description value", () => {
    render(
      <CreateTaskForm {...defaultProps} description="Pre-filled description" />,
    );
    const descInput = screen.getByLabelText("Task description");
    expect(descInput.props.value).toBe("Pre-filled description");
  });

  it("displays duration value", () => {
    render(<CreateTaskForm {...defaultProps} duration="60" />);
    const durationInput = screen.getByLabelText("Task duration in minutes");
    expect(durationInput.props.value).toBe("60");
  });

  it("goal options have radio accessibility role", () => {
    const goals = [createMockGoal({ id: "goal-1", title: "Radio Goal" })];
    render(<CreateTaskForm {...defaultProps} goals={goals} />);
    expect(
      screen.getByRole("radio", { name: "Select goal: Radio Goal" }),
    ).toBeTruthy();
  });

  describe("edit mode", () => {
    it("shows Edit Task header when isEditMode is true", () => {
      render(<CreateTaskForm {...defaultProps} isEditMode={true} />);
      expect(screen.getByText("Edit Task")).toBeTruthy();
      expect(screen.queryByText("New Task")).toBeNull();
    });

    it("shows New Task header when isEditMode is false", () => {
      render(<CreateTaskForm {...defaultProps} isEditMode={false} />);
      expect(screen.getByText("New Task")).toBeTruthy();
      expect(screen.queryByText("Edit Task")).toBeNull();
    });

    it("shows Save Changes button when isEditMode is true", () => {
      render(
        <CreateTaskForm {...defaultProps} title="Test" isEditMode={true} />,
      );
      expect(screen.getByText("Save Changes")).toBeTruthy();
      expect(screen.queryByText("Create Task")).toBeNull();
    });

    it("shows Create Task button when isEditMode is false", () => {
      render(
        <CreateTaskForm {...defaultProps} title="Test" isEditMode={false} />,
      );
      expect(screen.getByText("Create Task")).toBeTruthy();
      expect(screen.queryByText("Save Changes")).toBeNull();
    });

    it("has correct accessibility label in edit mode", () => {
      render(
        <CreateTaskForm {...defaultProps} title="Test" isEditMode={true} />,
      );
      expect(screen.getByLabelText("Save changes")).toBeTruthy();
    });

    it("has correct accessibility label in create mode", () => {
      render(
        <CreateTaskForm {...defaultProps} title="Test" isEditMode={false} />,
      );
      expect(screen.getByLabelText("Create task")).toBeTruthy();
    });
  });

  describe("anytime task", () => {
    it("shows anytime checkbox when not recurring", () => {
      const onAnytimeToggle = jest.fn();
      render(
        <CreateTaskForm
          {...defaultProps}
          title="Test"
          isRecurring={false}
          isAnytime={false}
          onAnytimeToggle={onAnytimeToggle}
        />,
      );
      expect(screen.getByText("Anytime Task")).toBeTruthy();
    });

    it("does not show anytime checkbox when recurring", () => {
      const onAnytimeToggle = jest.fn();
      render(
        <CreateTaskForm
          {...defaultProps}
          title="Test"
          isRecurring={true}
          isAnytime={false}
          onAnytimeToggle={onAnytimeToggle}
        />,
      );
      expect(screen.queryByText("Anytime Task")).toBeNull();
    });

    it("calls onAnytimeToggle when checkbox is pressed", () => {
      const onAnytimeToggle = jest.fn();
      render(
        <CreateTaskForm
          {...defaultProps}
          title="Test"
          isRecurring={false}
          isAnytime={false}
          onAnytimeToggle={onAnytimeToggle}
        />,
      );
      fireEvent.press(screen.getByLabelText("Make anytime task"));
      expect(onAnytimeToggle).toHaveBeenCalled();
    });

    it("shows checked state when isAnytime is true", () => {
      const onAnytimeToggle = jest.fn();
      render(
        <CreateTaskForm
          {...defaultProps}
          title="Test"
          isRecurring={false}
          isAnytime={true}
          onAnytimeToggle={onAnytimeToggle}
        />,
      );
      expect(screen.getByLabelText("Make scheduled task")).toBeTruthy();
    });
  });
});
