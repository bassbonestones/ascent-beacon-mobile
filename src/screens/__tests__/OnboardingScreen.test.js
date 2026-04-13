import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import OnboardingScreen from "../OnboardingScreen";

// Create mock with tracked state
const createMockOnboarding = (overrides = {}) => ({
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
  formatTime: (s) =>
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

describe("OnboardingScreen", () => {
  const mockNavigation = { navigate: jest.fn() };
  const mockUser = {
    id: "user-1",
    display_name: "",
    primary_email: "test@example.com",
  };
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
          "new@test.com",
        );
        expect(mockOb.setNewEmail).toHaveBeenCalledWith("new@test.com");
      });

      it("calls handleCancelNewEmail when Cancel is pressed", () => {
        const { getByText } = render(
          <OnboardingScreen
            navigation={mockNavigation}
            user={mockUser}
            onComplete={mockOnComplete}
          />,
        );
        fireEvent.press(getByText("Cancel"));
        expect(mockOb.handleCancelNewEmail).toHaveBeenCalled();
      });
    });
  });

  describe("verify-email step", () => {
    beforeEach(() => {
      mockOb = createMockOnboarding({ step: "verify-email" });
    });

    it("renders verification step title", () => {
      const { getByText } = render(
        <OnboardingScreen
          navigation={mockNavigation}
          user={mockUser}
          onComplete={mockOnComplete}
        />,
      );
      expect(getByText("Enter Verification Code")).toBeTruthy();
    });

    it("shows formatted timer", () => {
      const { getByText } = render(
        <OnboardingScreen
          navigation={mockNavigation}
          user={mockUser}
          onComplete={mockOnComplete}
        />,
      );
      expect(getByText("Code expires in: 5:00")).toBeTruthy();
    });

    it("renders verification code input", () => {
      const { getByPlaceholderText } = render(
        <OnboardingScreen
          navigation={mockNavigation}
          user={mockUser}
          onComplete={mockOnComplete}
        />,
      );
      expect(getByPlaceholderText("Enter verification code")).toBeTruthy();
    });

    it("calls setVerificationToken when input changes", () => {
      const { getByPlaceholderText } = render(
        <OnboardingScreen
          navigation={mockNavigation}
          user={mockUser}
          onComplete={mockOnComplete}
        />,
      );
      fireEvent.changeText(
        getByPlaceholderText("Enter verification code"),
        "123456",
      );
      expect(mockOb.setVerificationToken).toHaveBeenCalledWith("123456");
    });

    it("calls handleVerifyEmail when Verify is pressed", () => {
      const { getByLabelText } = render(
        <OnboardingScreen
          navigation={mockNavigation}
          user={mockUser}
          onComplete={mockOnComplete}
        />,
      );
      fireEvent.press(getByLabelText("Verify code"));
      expect(mockOb.handleVerifyEmail).toHaveBeenCalled();
    });

    it("calls handleResendCode when Resend Code is pressed", () => {
      const { getByText } = render(
        <OnboardingScreen
          navigation={mockNavigation}
          user={mockUser}
          onComplete={mockOnComplete}
        />,
      );
      fireEvent.press(getByText("Resend Code"));
      expect(mockOb.handleResendCode).toHaveBeenCalled();
    });
  });
});
