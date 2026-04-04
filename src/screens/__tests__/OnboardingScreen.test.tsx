import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import OnboardingScreen from "../OnboardingScreen";
import type { User, RootStackParamList } from "../../types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

interface MockOnboarding {
  displayName: string;
  setDisplayName: jest.Mock;
  email: string;
  newEmail: string;
  setNewEmail: jest.Mock;
  isAddingEmail: boolean;
  step: string;
  loading: boolean;
  verificationToken: string;
  setVerificationToken: jest.Mock;
  timeRemaining: number;
  handleDisplayName: jest.Mock;
  handleEmailSubmit: jest.Mock;
  handleSelectDifferentEmail: jest.Mock;
  handleCancelNewEmail: jest.Mock;
  handleSkipEmail: jest.Mock;
  handleVerifyEmail: jest.Mock;
  handleResendCode: jest.Mock;
  formatTime: (s: number) => string;
}

// Create mock with tracked state
const createMockOnboarding = (
  overrides: Partial<MockOnboarding> = {},
): MockOnboarding => ({
  displayName: "",
  setDisplayName: jest.fn(),
  email: "test@example.com",
  newEmail: "",
  setNewEmail: jest.fn(),
  isAddingEmail: false,
  step: "display-name",
  loading: false,
  verificationToken: "",
  setVerificationToken: jest.fn(),
  timeRemaining: 300,
  handleDisplayName: jest.fn(),
  handleEmailSubmit: jest.fn(),
  handleSelectDifferentEmail: jest.fn(),
  handleCancelNewEmail: jest.fn(),
  handleSkipEmail: jest.fn(),
  handleVerifyEmail: jest.fn(),
  handleResendCode: jest.fn(),
  formatTime: (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`,
  ...overrides,
});

let mockOb = createMockOnboarding();

jest.mock("../../hooks/useOnboarding", () => () => mockOb);

jest.mock("../styles/onboardingScreenStyles", () => ({
  styles: {
    container: {},
    stepContainer: {},
    title: {},
    subtitle: {},
    input: {},
    button: {},
    primaryButton: {},
    buttonDisabled: {},
    buttonText: {},
    secondaryButton: {},
    secondaryButtonText: {},
    emailDropdown: {},
    emailDropdownLabel: {},
    emailDropdownValue: {},
    buttonGroup: {},
    timerText: {},
  },
}));

// Create mock navigation with proper type casting for tests
const createMockNavigation =
  (): NativeStackNavigationProp<RootStackParamList> =>
    ({
      navigate: jest.fn(),
    }) as unknown as NativeStackNavigationProp<RootStackParamList>;

// Helper to create a proper mock user
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "user-1",
  display_name: null,
  primary_email: "test@example.com",
  is_email_verified: false,
  created_at: new Date().toISOString(),
  ...overrides,
});

describe("OnboardingScreen", () => {
  const mockNavigation = createMockNavigation();
  const mockUser = createMockUser();
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOb = createMockOnboarding();
  });

  describe("display-name step", () => {
    it("renders display name step title", () => {
      const { getByText } = render(
        <OnboardingScreen
          navigation={mockNavigation}
          user={mockUser}
          onComplete={mockOnComplete}
        />,
      );
      expect(getByText("Set Your Display Name")).toBeTruthy();
    });

    it("renders subtitle", () => {
      const { getByText } = render(
        <OnboardingScreen
          navigation={mockNavigation}
          user={mockUser}
          onComplete={mockOnComplete}
        />,
      );
      expect(
        getByText("This is how others will see you in the app"),
      ).toBeTruthy();
    });

    it("renders display name input", () => {
      const { getByPlaceholderText } = render(
        <OnboardingScreen
          navigation={mockNavigation}
          user={mockUser}
          onComplete={mockOnComplete}
        />,
      );
      expect(getByPlaceholderText("Enter your display name")).toBeTruthy();
    });

    it("calls setDisplayName when input changes", () => {
      const { getByPlaceholderText } = render(
        <OnboardingScreen
          navigation={mockNavigation}
          user={mockUser}
          onComplete={mockOnComplete}
        />,
      );
      fireEvent.changeText(
        getByPlaceholderText("Enter your display name"),
        "John",
      );
      expect(mockOb.setDisplayName).toHaveBeenCalledWith("John");
    });

    it("calls handleDisplayName when Continue is pressed", () => {
      const { getByText } = render(
        <OnboardingScreen
          navigation={mockNavigation}
          user={mockUser}
          onComplete={mockOnComplete}
        />,
      );
      fireEvent.press(getByText("Continue"));
      expect(mockOb.handleDisplayName).toHaveBeenCalled();
    });
  });

  describe("email step", () => {
    beforeEach(() => {
      mockOb = createMockOnboarding({ step: "email" });
    });

    it("renders email step title", () => {
      const { getByText } = render(
        <OnboardingScreen
          navigation={mockNavigation}
          user={mockUser}
          onComplete={mockOnComplete}
        />,
      );
      expect(getByText("Verify Your Email")).toBeTruthy();
    });

    it("displays current email", () => {
      const { getByText } = render(
        <OnboardingScreen
          navigation={mockNavigation}
          user={mockUser}
          onComplete={mockOnComplete}
        />,
      );
      expect(getByText("test@example.com")).toBeTruthy();
    });

    it("calls handleEmailSubmit when Continue is pressed", () => {
      const { getByLabelText } = render(
        <OnboardingScreen
          navigation={mockNavigation}
          user={mockUser}
          onComplete={mockOnComplete}
        />,
      );
      fireEvent.press(getByLabelText("Continue with this email"));
      expect(mockOb.handleEmailSubmit).toHaveBeenCalled();
    });

    it("calls handleSelectDifferentEmail when Different Email is pressed", () => {
      const { getByText } = render(
        <OnboardingScreen
          navigation={mockNavigation}
          user={mockUser}
          onComplete={mockOnComplete}
        />,
      );
      fireEvent.press(getByText("+ Different Email"));
      expect(mockOb.handleSelectDifferentEmail).toHaveBeenCalled();
    });

    describe("adding new email", () => {
      beforeEach(() => {
        mockOb = createMockOnboarding({ step: "email", isAddingEmail: true });
      });

      it("shows email input field", () => {
        const { getByPlaceholderText } = render(
          <OnboardingScreen
            navigation={mockNavigation}
            user={mockUser}
            onComplete={mockOnComplete}
          />,
        );
        expect(getByPlaceholderText("Enter email address")).toBeTruthy();
      });

      it("calls setNewEmail when input changes", () => {
        const { getByPlaceholderText } = render(
          <OnboardingScreen
            navigation={mockNavigation}
            user={mockUser}
            onComplete={mockOnComplete}
          />,
        );
        fireEvent.changeText(
          getByPlaceholderText("Enter email address"),
          "new@example.com",
        );
        expect(mockOb.setNewEmail).toHaveBeenCalledWith("new@example.com");
      });
    });
  });
});
