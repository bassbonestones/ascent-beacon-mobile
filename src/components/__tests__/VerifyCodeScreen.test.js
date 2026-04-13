import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import VerifyCodeScreen from "../login/VerifyCodeScreen";

// Mock styles
jest.mock("../../screens/styles/loginScreenStyles", () => ({
  styles: {
    authContainer: {},
    verifyTitle: {},
    verifySubtitle: {},
    verifyEmail: {},
    verifyInstructions: {},
    countdown: {},
    codeInput: {},
    button: {},
    emailButton: {},
    emailButtonText: {},
    resendButton: {},
    resendButtonText: {},
    cancelButton: {},
    cancelButtonText: {},
  },
}));

describe("VerifyCodeScreen", () => {
  const defaultProps = {
    email: "test@example.com",
    countdown: 300,
    verificationCode: "",
    onChangeCode: jest.fn(),
    onVerify: jest.fn(),
    onResend: jest.fn(),
    onCancel: jest.fn(),
    loading: false,
    formatTime: (seconds) =>
      `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders check your email title", () => {
    const { getByText } = render(<VerifyCodeScreen {...defaultProps} />);
    expect(getByText("Check Your Email")).toBeTruthy();
  });

  it("displays the email address", () => {
    const { getByText } = render(<VerifyCodeScreen {...defaultProps} />);
    expect(getByText("test@example.com")).toBeTruthy();
  });

  it("displays formatted countdown", () => {
    const { getByText } = render(
      <VerifyCodeScreen {...defaultProps} countdown={300} />,
    );
    expect(getByText("5:00")).toBeTruthy();
  });

  it("renders code input", () => {
    const { getByPlaceholderText } = render(
      <VerifyCodeScreen {...defaultProps} />,
    );
    expect(getByPlaceholderText("000000")).toBeTruthy();
  });

  it("calls onChangeCode when code input changes", () => {
    const { getByPlaceholderText } = render(
      <VerifyCodeScreen {...defaultProps} />,
    );
    fireEvent.changeText(getByPlaceholderText("000000"), "123456");
    expect(defaultProps.onChangeCode).toHaveBeenCalledWith("123456");
  });

  it("renders Verify Code button", () => {
    const { getByText } = render(<VerifyCodeScreen {...defaultProps} />);
    expect(getByText("Verify Code")).toBeTruthy();
  });

  it("disables Verify button when code is incomplete", () => {
    const { getByLabelText } = render(
      <VerifyCodeScreen {...defaultProps} verificationCode="123" />,
    );
    const verifyButton = getByLabelText("Verify code");
    expect(verifyButton.props.accessibilityState?.disabled).toBe(true);
  });

  it("enables Verify button when code is complete", () => {
    const { getByLabelText } = render(
      <VerifyCodeScreen {...defaultProps} verificationCode="123456" />,
    );
    const verifyButton = getByLabelText("Verify code");
    expect(verifyButton.props.accessibilityState?.disabled).toBe(false);
  });

  it("calls onVerify when Verify button is pressed", () => {
    const { getByText } = render(
      <VerifyCodeScreen {...defaultProps} verificationCode="123456" />,
    );
    fireEvent.press(getByText("Verify Code"));
    expect(defaultProps.onVerify).toHaveBeenCalled();
  });

  it("renders Resend Code button", () => {
    const { getByText } = render(
      <VerifyCodeScreen {...defaultProps} countdown={260} />,
    );
    expect(getByText("Resend Code")).toBeTruthy();
  });

  it("shows countdown for resend when too soon", () => {
    const { getByText } = render(
      <VerifyCodeScreen {...defaultProps} countdown={280} />,
    );
    expect(getByText("Resend Code (in 10s)")).toBeTruthy();
  });

  it("calls onResend when Resend button is pressed", () => {
    const { getByLabelText } = render(
      <VerifyCodeScreen {...defaultProps} countdown={260} />,
    );
    fireEvent.press(getByLabelText("Resend verification code"));
    expect(defaultProps.onResend).toHaveBeenCalled();
  });

  it("disables Resend button when countdown > 270", () => {
    const { getByLabelText } = render(
      <VerifyCodeScreen {...defaultProps} countdown={280} />,
    );
    const resendButton = getByLabelText("Resend verification code");
    expect(resendButton.props.accessibilityState?.disabled).toBe(true);
  });

  it("renders Back to Login button", () => {
    const { getByText } = render(<VerifyCodeScreen {...defaultProps} />);
    expect(getByText("Back to Login")).toBeTruthy();
  });

  it("calls onCancel when Back to Login is pressed", () => {
    const { getByText } = render(<VerifyCodeScreen {...defaultProps} />);
    fireEvent.press(getByText("Back to Login"));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it("disables buttons when loading", () => {
    const { getByLabelText } = render(
      <VerifyCodeScreen
        {...defaultProps}
        loading={true}
        verificationCode="123456"
      />,
    );
    const verifyButton = getByLabelText("Verify code");
    expect(verifyButton.props.accessibilityState?.disabled).toBe(true);
  });

  it("displays input with current verification code value", () => {
    const { getByPlaceholderText } = render(
      <VerifyCodeScreen {...defaultProps} verificationCode="12345" />,
    );
    const input = getByPlaceholderText("000000");
    expect(input.props.value).toBe("12345");
  });
});
