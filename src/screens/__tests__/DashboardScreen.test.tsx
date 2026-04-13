import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import DashboardScreen from "../DashboardScreen";
import { useTime } from "../../context/TimeContext";
import type { User, RootStackParamList } from "../../types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { createMockTimeContext } from "../../testHelpers";

jest.mock("../../context/TimeContext");

const mockedUseTime = jest.mocked(useTime);

// Mock the images
jest.mock("../../../assets/NorthStarIcon_values.png", () => "values-icon.png");
jest.mock(
  "../../../assets/AnchorIcon_Priorities.png",
  () => "priorities-icon.png",
);
jest.mock(
  "../../../assets/TwoCirclesIcon_Alignment.png",
  () => "alignment-icon.png",
);
jest.mock("../../../assets/knot.png", () => "knot-icon.png");

// Helper to create a proper mock user
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "user-1",
  display_name: "John Doe",
  primary_email: "john@example.com",
  is_email_verified: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

// Create mock navigation with proper type casting for tests
const createMockNavigation =
  (): NativeStackNavigationProp<RootStackParamList> =>
    ({
      navigate: jest.fn(),
    }) as unknown as NativeStackNavigationProp<RootStackParamList>;

describe("DashboardScreen", () => {
  const mockUser = createMockUser();
  const mockOnLogout = jest.fn();
  const mockNavigation = createMockNavigation();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTime.mockReturnValue(createMockTimeContext());
  });

  it("renders welcome message", () => {
    const { getByText } = render(
      <DashboardScreen
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("Welcome back")).toBeOnTheScreen();
  });

  it("displays user display name", () => {
    const { getByText } = render(
      <DashboardScreen
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("John Doe")).toBeOnTheScreen();
  });

  it("displays fallback to email when no display name", () => {
    const userNoName = createMockUser({
      display_name: null,
      primary_email: "test@example.com",
    });
    const { getByText } = render(
      <DashboardScreen
        user={userNoName}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    // Component shows email as fallback when display_name is not set
    expect(getByText("test@example.com")).toBeOnTheScreen();
  });

  it("displays User when no name or email", () => {
    const userEmpty = createMockUser({
      display_name: null,
      primary_email: null,
    });
    const { getByText } = render(
      <DashboardScreen
        user={userEmpty}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("User")).toBeOnTheScreen();
  });

  it("renders logout button", () => {
    const { getByText } = render(
      <DashboardScreen
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("Logout")).toBeOnTheScreen();
  });

  it("calls onLogout when logout button is pressed", () => {
    const { getByText } = render(
      <DashboardScreen
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    fireEvent.press(getByText("Logout"));
    expect(mockOnLogout).toHaveBeenCalled();
  });

  it("renders app title", () => {
    const { getByText } = render(
      <DashboardScreen
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("Ascent Beacon")).toBeOnTheScreen();
    expect(getByText("Navigate your climb")).toBeOnTheScreen();
  });

  it("renders Values module", () => {
    const { getByText } = render(
      <DashboardScreen
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("Values")).toBeOnTheScreen();
    expect(getByText("Discover what matters")).toBeOnTheScreen();
  });

  it("renders Priorities module", () => {
    const { getByText } = render(
      <DashboardScreen
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("Priorities")).toBeOnTheScreen();
    expect(getByText("Anchor what's important")).toBeOnTheScreen();
  });

  it("renders Alignment module as coming soon", () => {
    const { getByText, getAllByText } = render(
      <DashboardScreen
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("Alignment")).toBeOnTheScreen();
    expect(getAllByText("Coming soon").length).toBeGreaterThan(0);
  });

  it("navigates to Values when Values module is pressed", () => {
    const { getByLabelText } = render(
      <DashboardScreen
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    fireEvent.press(getByLabelText("Navigate to Values"));
    expect(mockNavigation.navigate).toHaveBeenCalledWith("Values");
  });

  it("navigates to Priorities when Priorities module is pressed", () => {
    const { getByLabelText } = render(
      <DashboardScreen
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    fireEvent.press(getByLabelText("Navigate to Priorities"));
    expect(mockNavigation.navigate).toHaveBeenCalledWith("Priorities");
  });

  it("does not navigate when Alignment module is pressed", () => {
    const { getByLabelText } = render(
      <DashboardScreen
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    fireEvent.press(getByLabelText("Alignment, coming soon"));
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });

  it("renders motivational quote", () => {
    const { getByText } = render(
      <DashboardScreen
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText(/Most stress isn't from doing too much/)).toBeOnTheScreen();
  });

  it("does not show gear icon when time machine is disabled", () => {
    const { queryByLabelText } = render(
      <DashboardScreen
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(queryByLabelText("Open Time Machine")).toBeFalsy();
  });

  it("shows gear icon when time machine is enabled", () => {
    mockedUseTime.mockReturnValue(
      createMockTimeContext({ isTimeMachineEnabled: true }),
    );

    const { getByLabelText } = render(
      <DashboardScreen
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByLabelText("Open Time Machine")).toBeOnTheScreen();
  });

  it("enables time machine on triple tap of title", () => {
    const mockEnableTimeMachine = jest.fn();
    mockedUseTime.mockReturnValue(
      createMockTimeContext({ enableTimeMachine: mockEnableTimeMachine }),
    );

    const { getByLabelText } = render(
      <DashboardScreen
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );

    const title = getByLabelText("Ascent Beacon");

    // Triple tap
    fireEvent.press(title);
    fireEvent.press(title);
    fireEvent.press(title);

    expect(mockEnableTimeMachine).toHaveBeenCalled();
  });
});
