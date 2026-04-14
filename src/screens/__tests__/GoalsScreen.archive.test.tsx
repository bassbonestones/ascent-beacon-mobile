import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import GoalsScreen from "../GoalsScreen";
import type { Goal, User, RootStackParamList } from "../../types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

const mockArchiveGoal = jest.fn();
const mockPreviewArchive = jest.fn();
const mockPauseGoal = jest.fn();
const mockUnpauseGoal = jest.fn();
const mockShowConfirm = jest.fn();
const mockShowAlert = jest.fn();
const mockGetGoals = jest.fn();
const mockGetGoal = jest.fn();

jest.mock("../../hooks/useGoals", () => ({
  useGoals: jest.fn(),
}));

jest.mock("../../utils/alert", () => ({
  showAlert: (...args: unknown[]) => mockShowAlert(...args),
  showConfirm: (...args: unknown[]) => mockShowConfirm(...args),
}));
jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    getGoals: (...args: unknown[]) => mockGetGoals(...args),
    getGoal: (...args: unknown[]) => mockGetGoal(...args),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useGoals } = require("../../hooks/useGoals");

const user: User = {
  id: "u1",
  display_name: "Tester",
  primary_email: "test@example.com",
  is_email_verified: true,
  created_at: "2024-01-01T00:00:00Z",
};

const navigation = {
  goBack: jest.fn(),
} as unknown as NativeStackNavigationProp<RootStackParamList>;

const baseGoal = (overrides: Partial<Goal> = {}): Goal => ({
  id: "g1",
  user_id: "u1",
  parent_goal_id: null,
  title: "Archive Me",
  description: null,
  target_date: null,
  status: "in_progress",
  progress_cached: 0,
  total_time_minutes: 0,
  completed_time_minutes: 0,
  has_incomplete_breakdown: false,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  completed_at: null,
  priorities: [],
  ...overrides,
});

describe("GoalsScreen archive and unpause", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPreviewArchive.mockResolvedValue({
      goal_id: "g1",
      subtree_goal_ids: ["g1"],
      tasks_requiring_resolution: [{ task_id: "t1", title: "Task A", goal_id: "g1" }],
    });
    mockGetGoals.mockResolvedValue({
      goals: [baseGoal({ id: "g2", title: "Reassign Target" })],
      reschedule_count: 0,
    });
    mockArchiveGoal.mockResolvedValue(baseGoal({ record_state: "archived" }));
    mockPauseGoal.mockResolvedValue(baseGoal({ record_state: "paused" }));
    mockUnpauseGoal.mockResolvedValue(baseGoal({ record_state: "active" }));
    mockGetGoal.mockImplementation(async () => baseGoal());
  });

  it("archives from detail view using per-task resolution flow", async () => {
    mockShowConfirm.mockResolvedValueOnce(true);
    mockGetGoal.mockResolvedValue(baseGoal());

    useGoals.mockReturnValue({
      goals: [baseGoal()],
      loading: false,
      error: null,
      refetch: jest.fn(),
      createGoal: jest.fn(),
      updateGoal: jest.fn(),
      deleteGoal: jest.fn(),
      previewArchive: mockPreviewArchive,
      archiveGoal: mockArchiveGoal,
      pauseGoal: mockPauseGoal,
      unpauseGoal: mockUnpauseGoal,
    });

    render(<GoalsScreen user={user} navigation={navigation} />);
    fireEvent.press(screen.getByLabelText("Goal: Archive Me"));
    await waitFor(() => {
      expect(screen.getByLabelText("Archive goal")).toBeTruthy();
    });
    fireEvent.press(screen.getByLabelText("Archive goal"));
    await screen.findByText("Resolve linked tasks");
    fireEvent.press(screen.getByText("Reassign"));
    fireEvent.press(screen.getByText("Reassign Target"));
    fireEvent.press(screen.getByLabelText("Confirm archive goal"));

    await waitFor(() => {
      expect(mockPreviewArchive).toHaveBeenCalledWith("g1");
      expect(mockArchiveGoal).toHaveBeenCalledWith(
        "g1",
        expect.objectContaining({
          tracking_mode: "ignored",
          task_resolutions: [
            {
              task_id: "t1",
              action: "reassign",
              goal_id: "g2",
            },
          ],
        }),
      );
      expect(mockShowAlert).toHaveBeenCalledWith(
        "Goal archived",
        "Tracking stops for this goal. Historical data remains available.",
      );
    });
  });

  it("unpauses paused goals from detail actions", async () => {
    const paused = baseGoal({ title: "Paused Goal", record_state: "paused" });
    mockGetGoal.mockResolvedValue(paused);
    useGoals.mockReturnValue({
      goals: [paused],
      loading: false,
      error: null,
      refetch: jest.fn(),
      createGoal: jest.fn(),
      updateGoal: jest.fn(),
      deleteGoal: jest.fn(),
      previewArchive: mockPreviewArchive,
      archiveGoal: mockArchiveGoal,
      pauseGoal: mockPauseGoal,
      unpauseGoal: mockUnpauseGoal,
    });

    render(<GoalsScreen user={user} navigation={navigation} />);
    fireEvent.press(screen.getByLabelText("Show paused goals"));
    fireEvent.press(screen.getByLabelText("Goal: Paused Goal"));
    await waitFor(() => {
      expect(screen.getByLabelText("Unpause goal")).toBeTruthy();
    });
    fireEvent.press(screen.getByLabelText("Unpause goal"));

    await waitFor(() => {
      expect(mockUnpauseGoal).toHaveBeenCalledWith("g1");
    });
  });

  it("pauses active goals from detail actions", async () => {
    mockShowConfirm.mockResolvedValueOnce(true);
    const active = baseGoal({ title: "Active Goal", record_state: "active" });
    mockGetGoal.mockResolvedValue(active);
    useGoals.mockReturnValue({
      goals: [active],
      loading: false,
      error: null,
      refetch: jest.fn(),
      createGoal: jest.fn(),
      updateGoal: jest.fn(),
      deleteGoal: jest.fn(),
      previewArchive: mockPreviewArchive,
      archiveGoal: mockArchiveGoal,
      pauseGoal: mockPauseGoal,
      unpauseGoal: mockUnpauseGoal,
    });

    render(<GoalsScreen user={user} navigation={navigation} />);
    fireEvent.press(screen.getByLabelText("Goal: Active Goal"));
    await waitFor(() => {
      expect(screen.getByLabelText("Pause goal")).toBeTruthy();
    });
    fireEvent.press(screen.getByLabelText("Pause goal"));

    await waitFor(() => {
      expect(mockPauseGoal).toHaveBeenCalledWith("g1");
    });
  });
});
