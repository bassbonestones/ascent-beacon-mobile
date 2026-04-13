import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import DashboardScreen from "../DashboardScreen";

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

describe("DashboardScreen", () => {
  const mockUser = { display_name: "John Doe", email: "john@example.com" };
  const mockOnLogout = jest.fn();
  const mockNavigation = { navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders welcome message", () => {
    const { getByText } = render(
      <DashboardScreen
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("Welcome back")).toBeTruthy();
  });

  it("displays user display name", () => {
    const { getByText } = render(
      <DashboardScreen
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("John Doe")).toBeTruthy();
  });

  it("displays user email when no display name", () => {
    const userNoName = { email: "test@example.com" };
    const { getByText } = render(
      <DashboardScreen
        user={userNoName}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("test@example.com")).toBeTruthy();
  });

  it("displays User when no name or email", () => {
    const { getByText } = render(
      <DashboardScreen
        user={{}}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("User")).toBeTruthy();
  });

  it("renders logout button", () => {
    const { getByText } = render(
      <DashboardScreen
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("Logout")).toBeTruthy();
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
    expect(getByText("Ascent Beacon")).toBeTruthy();
    expect(getByText("Navigate your climb")).toBeTruthy();
  });

  it("renders Values module", () => {
    const { getByText } = render(
      <DashboardScreen
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("Values")).toBeTruthy();
    expect(getByText("Discover what matters")).toBeTruthy();
  });

  it("renders Priorities module", () => {
    const { getByText } = render(
      <DashboardScreen
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("Priorities")).toBeTruthy();
    expect(getByText("Anchor what's important")).toBeTruthy();
  });

  it("renders Alignment module as coming soon", () => {
    const { getByText, getAllByText } = render(
      <DashboardScreen
        user={mockUser}
        onLogout={mockOnLogout}
        navigation={mockNavigation}
      />,
    );
    expect(getByText("Alignment")).toBeTruthy();
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
    expect(mockNavigation.navigate).toHaveBeenCalledWith("Values", {});
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
    expect(mockNavigation.navigate).toHaveBeenCalledWith("Priorities", {});
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
    expect(getByText(/Most stress isn't from doing too much/)).toBeTruthy();
  });
});
