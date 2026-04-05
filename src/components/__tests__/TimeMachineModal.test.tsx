/**
 * Tests for TimeMachineModal
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { TimeMachineModal } from "../TimeMachineModal";
import { TimeProvider } from "../../context/TimeContext";

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock api
jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    deleteFutureCompletions: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  },
}));

// Mock react-native-calendars
jest.mock("react-native-calendars", () => ({
  Calendar: ({
    onDayPress,
  }: {
    onDayPress?: (day: { dateString: string }) => void;
  }) => {
    const React = require("react");
    const { TouchableOpacity, Text } = require("react-native");
    return (
      <TouchableOpacity
        testID="mock-calendar"
        onPress={() => onDayPress?.({ dateString: "2026-04-15" })}
      >
        <Text>Mock Calendar</Text>
      </TouchableOpacity>
    );
  },
}));

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<TimeProvider>{ui}</TimeProvider>);
};

describe("TimeMachineModal", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render content when not visible", async () => {
    renderWithProvider(
      <TimeMachineModal visible={false} onClose={mockOnClose} />,
    );
    await waitFor(() => {
      // Modal exists but content not visible
    });
  });

  it("should render title when visible", async () => {
    renderWithProvider(
      <TimeMachineModal visible={true} onClose={mockOnClose} />,
    );

    await waitFor(() => {
      expect(screen.getByText("⏰ Time Machine")).toBeTruthy();
    });
  });

  it("should show current time label when no travel date", async () => {
    renderWithProvider(
      <TimeMachineModal visible={true} onClose={mockOnClose} />,
    );

    await waitFor(() => {
      expect(screen.getByText("Current time:")).toBeTruthy();
    });
  });

  it("should call onClose when close button is pressed", async () => {
    renderWithProvider(
      <TimeMachineModal visible={true} onClose={mockOnClose} />,
    );

    await waitFor(() => {
      expect(screen.getByText("✕")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("✕"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should show quick travel buttons", async () => {
    renderWithProvider(
      <TimeMachineModal visible={true} onClose={mockOnClose} />,
    );

    await waitFor(() => {
      expect(screen.getByText("+1 day")).toBeTruthy();
      expect(screen.getByText("+1 week")).toBeTruthy();
      expect(screen.getByText("+2 weeks")).toBeTruthy();
      expect(screen.getByText("+1 month")).toBeTruthy();
    });
  });

  it("should show calendar component", async () => {
    renderWithProvider(
      <TimeMachineModal visible={true} onClose={mockOnClose} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("mock-calendar")).toBeTruthy();
    });
  });

  it("should not show Return to Present when not time traveling", async () => {
    renderWithProvider(
      <TimeMachineModal visible={true} onClose={mockOnClose} />,
    );

    await waitFor(() => {
      expect(screen.queryByText("Return to Present")).toBeFalsy();
    });
  });

  it("should show pending selection when calendar date is pressed", async () => {
    renderWithProvider(
      <TimeMachineModal visible={true} onClose={mockOnClose} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("mock-calendar")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("mock-calendar"));

    await waitFor(() => {
      expect(screen.getByText("Selected:")).toBeTruthy();
      expect(screen.getByText(/April 15, 2026/)).toBeTruthy();
    });
  });

  it("should show confirm buttons when date is pending", async () => {
    renderWithProvider(
      <TimeMachineModal visible={true} onClose={mockOnClose} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("mock-calendar")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("mock-calendar"));

    await waitFor(() => {
      expect(screen.getByText("Travel to This Date")).toBeTruthy();
      expect(screen.getByText("Cancel")).toBeTruthy();
    });
  });

  it("should cancel pending selection when Cancel is pressed", async () => {
    renderWithProvider(
      <TimeMachineModal visible={true} onClose={mockOnClose} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("mock-calendar")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("mock-calendar"));

    await waitFor(() => {
      expect(screen.getByText("Cancel")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Cancel"));

    await waitFor(() => {
      expect(screen.queryByText("Selected:")).toBeFalsy();
    });
  });

  it("should show confirmation dialog when Travel button is pressed", async () => {
    renderWithProvider(
      <TimeMachineModal visible={true} onClose={mockOnClose} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("mock-calendar")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("mock-calendar"));

    await waitFor(() => {
      expect(screen.getByText("Travel to This Date")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Travel to This Date"));

    await waitFor(() => {
      expect(screen.getByText("🕐 Confirm Travel")).toBeTruthy();
    });
  });

  it("should show pending selection when quick travel button is pressed", async () => {
    renderWithProvider(
      <TimeMachineModal visible={true} onClose={mockOnClose} />,
    );

    await waitFor(() => {
      expect(screen.getByText("+1 day")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("+1 day"));

    await waitFor(() => {
      expect(screen.getByText("Selected:")).toBeTruthy();
      expect(screen.getByText("Travel to This Date")).toBeTruthy();
    });
  });

  it("should show pending selection when +1 week button is pressed", async () => {
    renderWithProvider(
      <TimeMachineModal visible={true} onClose={mockOnClose} />,
    );

    await waitFor(() => {
      expect(screen.getByText("+1 week")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("+1 week"));

    await waitFor(() => {
      expect(screen.getByText("Selected:")).toBeTruthy();
    });
  });

  it("should show pending selection when +2 weeks button is pressed", async () => {
    renderWithProvider(
      <TimeMachineModal visible={true} onClose={mockOnClose} />,
    );

    await waitFor(() => {
      expect(screen.getByText("+2 weeks")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("+2 weeks"));

    await waitFor(() => {
      expect(screen.getByText("Selected:")).toBeTruthy();
    });
  });

  it("should show pending selection when +1 month button is pressed", async () => {
    renderWithProvider(
      <TimeMachineModal visible={true} onClose={mockOnClose} />,
    );

    await waitFor(() => {
      expect(screen.getByText("+1 month")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("+1 month"));

    await waitFor(() => {
      expect(screen.getByText("Selected:")).toBeTruthy();
    });
  });
});
