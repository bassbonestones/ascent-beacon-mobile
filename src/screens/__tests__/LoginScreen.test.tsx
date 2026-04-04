import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import LoginScreen from "../LoginScreen";

// Mock the hooks
jest.mock("../../hooks/useKiteAnimation", () => () => ({
  kiteSprite: "vertical",
  kitePos: { getTranslateTransform: () => [] },
  handleTouchStart: jest.fn(),
  handleTopZoneTouch: jest.fn(),
  handleTouchEnd: jest.fn(),
}));

interface MockAuth {
  email: string;
  setEmail: jest.Mock;
  loading: boolean;
  showVerifyScreen: boolean;
  countdown: number;
  verificationCode: string;
  setVerificationCode: jest.Mock;
  showEmailInput: boolean;
  showTermsModal: boolean;
  setShowTermsModal: jest.Mock;
  request: Record<string, unknown>;
  promptAsync: jest.Mock;
  handleEmailRequest: jest.Mock;
  handleResendMagicLink: jest.Mock;
  handleCancelVerify: jest.Mock;
  handleVerifyCode: jest.Mock;
  formatTime: (s: number) => string;
  handleTitleTap: jest.Mock;
}

const mockAuth: MockAuth = {
  email: "",
  setEmail: jest.fn(),
  loading: false,
  showVerifyScreen: false,
  countdown: 300,
  verificationCode: "",
  setVerificationCode: jest.fn(),
  showEmailInput: false,
  showTermsModal: false,
  setShowTermsModal: jest.fn(),
  request: {},
  promptAsync: jest.fn(),
  handleEmailRequest: jest.fn(),
  handleResendMagicLink: jest.fn(),
  handleCancelVerify: jest.fn(),
  handleVerifyCode: jest.fn(),
  formatTime: (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`,
  handleTitleTap: jest.fn(),
};

jest.mock("../../hooks/useLoginAuth", () => () => mockAuth);

// Mock components
jest.mock("../../components/TermsModal", () => {
  const { View, Text } = require("react-native");
  return function MockTermsModal({ visible }: { visible: boolean }) {
    if (!visible) return null;
    return (
      <View testID="terms-modal">
        <Text>Terms Modal</Text>
      </View>
    );
  };
});

jest.mock("../../components/login/AuthOptions", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return function MockAuthOptions({
    onGooglePress,
    onEmailRequest,
  }: {
    onGooglePress: () => void;
    onEmailRequest: () => void;
  }) {
    return (
      <View testID="auth-options">
        <Text>Auth Options</Text>
        <TouchableOpacity testID="google-btn" onPress={onGooglePress}>
          <Text>Google</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="email-btn" onPress={onEmailRequest}>
          <Text>Email</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock("../../components/login/VerifyCodeScreen", () => {
  const { View, Text } = require("react-native");
  return function MockVerifyCodeScreen() {
    return (
      <View testID="verify-screen">
        <Text>Verify Code Screen</Text>
      </View>
    );
  };
});

// Mock styles
jest.mock("../styles/loginScreenStyles", () => ({
  styles: {
    background: {},
    overlay: {},
    topZone: {},
    kiteImage: {},
    container: {},
    content: {},
    header: {},
    title: {},
    subtitle: {},
  },
}));

// Mock images
jest.mock("../../../assets/login-background.png", () => "background.png");
jest.mock("../../../assets/kite_vertical.png", () => "kite_v.png");
jest.mock("../../../assets/kite_slight_left.png", () => "kite_sl.png");
jest.mock("../../../assets/kite_full_left.png", () => "kite_fl.png");
jest.mock("../../../assets/kite_slight_right.png", () => "kite_sr.png");
jest.mock("../../../assets/kite_full_right.png", () => "kite_fr.png");

describe("LoginScreen", () => {
  const mockOnLoginSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.showVerifyScreen = false;
    mockAuth.showTermsModal = false;
  });

  it("renders title and subtitle", () => {
    const { getByText } = render(
      <LoginScreen onLoginSuccess={mockOnLoginSuccess} />,
    );
    expect(getByText("Ascent Beacon")).toBeTruthy();
    expect(getByText("Find your path. Lock your priorities.")).toBeTruthy();
  });

  it("renders AuthOptions when not verifying", () => {
    const { getByTestId } = render(
      <LoginScreen onLoginSuccess={mockOnLoginSuccess} />,
    );
    expect(getByTestId("auth-options")).toBeTruthy();
  });

  it("renders VerifyCodeScreen when showVerifyScreen is true", () => {
    mockAuth.showVerifyScreen = true;
    const { getByTestId, queryByTestId } = render(
      <LoginScreen onLoginSuccess={mockOnLoginSuccess} />,
    );
    expect(getByTestId("verify-screen")).toBeTruthy();
    expect(queryByTestId("auth-options")).toBeNull();
  });

  it("calls promptAsync when Google button is pressed", () => {
    const { getByTestId } = render(
      <LoginScreen onLoginSuccess={mockOnLoginSuccess} />,
    );
    fireEvent.press(getByTestId("google-btn"));
    expect(mockAuth.promptAsync).toHaveBeenCalled();
  });

  it("calls handleEmailRequest when email button is pressed", () => {
    const { getByTestId } = render(
      <LoginScreen onLoginSuccess={mockOnLoginSuccess} />,
    );
    fireEvent.press(getByTestId("email-btn"));
    expect(mockAuth.handleEmailRequest).toHaveBeenCalled();
  });

  it("calls handleTitleTap when title is pressed", () => {
    const { getByText } = render(
      <LoginScreen onLoginSuccess={mockOnLoginSuccess} />,
    );
    fireEvent.press(getByText("Ascent Beacon"));
    expect(mockAuth.handleTitleTap).toHaveBeenCalled();
  });

  it("does not show TermsModal when showTermsModal is false", () => {
    const { queryByTestId } = render(
      <LoginScreen onLoginSuccess={mockOnLoginSuccess} />,
    );
    expect(queryByTestId("terms-modal")).toBeNull();
  });

  it("shows TermsModal when showTermsModal is true", () => {
    mockAuth.showTermsModal = true;
    const { getByTestId } = render(
      <LoginScreen onLoginSuccess={mockOnLoginSuccess} />,
    );
    expect(getByTestId("terms-modal")).toBeTruthy();
  });
});
