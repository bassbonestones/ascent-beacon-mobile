/**
 * Tests for HomeScreen
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import HomeScreen from "../HomeScreen";

describe("HomeScreen", () => {
  const mockOnLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render welcome title", () => {
    render(<HomeScreen user={null} onLogout={mockOnLogout} />);

    expect(screen.getByText("Welcome to Ascent Beacon!")).toBeTruthy();
  });

  it("should display user display_name when available", () => {
    const user = {
      display_name: "John Doe",
      primary_email: "john@example.com",
    };
    render(<HomeScreen user={user} onLogout={mockOnLogout} />);

    expect(screen.getByText("Hello, John Doe")).toBeTruthy();
  });

  it("should fall back to primary_email when display_name not available", () => {
    const user = { primary_email: "john@example.com" };
    render(<HomeScreen user={user} onLogout={mockOnLogout} />);

    expect(screen.getByText("Hello, john@example.com")).toBeTruthy();
  });

  it("should fall back to 'User' when no user info available", () => {
    render(<HomeScreen user={null} onLogout={mockOnLogout} />);

    expect(screen.getByText("Hello, User")).toBeTruthy();
  });

  it("should render logout button", () => {
    render(<HomeScreen user={null} onLogout={mockOnLogout} />);

    expect(screen.getByText("Logout")).toBeTruthy();
  });

  it("should call onLogout when logout button is pressed", () => {
    render(<HomeScreen user={null} onLogout={mockOnLogout} />);

    fireEvent.press(screen.getByText("Logout"));

    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });
});
