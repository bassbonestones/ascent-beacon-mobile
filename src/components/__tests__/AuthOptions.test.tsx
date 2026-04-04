import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import AuthOptions from "../login/AuthOptions";

// Mock styles
jest.mock("../../screens/styles/loginScreenStyles", () => ({
  styles: {
    authContainer: {},
    button: {},
    googleButton: {},
    googleButtonText: {},
    divider: {},
    dividerLine: {},
    dividerText: {},
    emailContainer: {},
    input: {},
    emailButton: {},
    emailButtonText: {},
    disclaimerContainer: {},
    disclaimerText: {},
    disclaimerLink: {},
  },
}));

interface AuthOptionsProps {
  email: string;
  onChangeEmail: (email: string) => void;
  showEmailInput: boolean;
  onEmailRequest: () => void;
  onGooglePress: () => void;
  onShowTerms: () => void;
  loading: boolean;
  googleRequestReady: boolean;
}

describe("AuthOptions", () => {
  const defaultProps: AuthOptionsProps = {
    email: "",
    onChangeEmail: jest.fn(),
    showEmailInput: false,
    onEmailRequest: jest.fn(),
    onGooglePress: jest.fn(),
    onShowTerms: jest.fn(),
    loading: false,
    googleRequestReady: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Google sign-in button", () => {
    const { getByText } = render(<AuthOptions {...defaultProps} />);
    expect(getByText("Continue with Google")).toBeTruthy();
  });

  it("renders divider with 'or' text", () => {
    const { getByText } = render(<AuthOptions {...defaultProps} />);
    expect(getByText("or")).toBeTruthy();
  });

  it("renders 'Log In with Code' button when email input is hidden", () => {
    const { getByText } = render(
      <AuthOptions {...defaultProps} showEmailInput={false} />,
    );
    expect(getByText("Log In with Code")).toBeTruthy();
  });

  it("renders 'Send Code' button when email input is shown", () => {
    const { getByText } = render(
      <AuthOptions {...defaultProps} showEmailInput={true} />,
    );
    expect(getByText("Send Code")).toBeTruthy();
  });

  it("shows email input when showEmailInput is true", () => {
    const { getByPlaceholderText } = render(
      <AuthOptions {...defaultProps} showEmailInput={true} />,
    );
    expect(getByPlaceholderText("Enter your email")).toBeTruthy();
  });

  it("does not show email input when showEmailInput is false", () => {
    const { queryByPlaceholderText } = render(
      <AuthOptions {...defaultProps} showEmailInput={false} />,
    );
    expect(queryByPlaceholderText("Enter your email")).toBeNull();
  });

  it("calls onGooglePress when Google button is pressed", () => {
    const { getByText } = render(<AuthOptions {...defaultProps} />);
    fireEvent.press(getByText("Continue with Google"));
    expect(defaultProps.onGooglePress).toHaveBeenCalled();
  });

  it("calls onEmailRequest when email button is pressed", () => {
    const { getByText } = render(<AuthOptions {...defaultProps} />);
    fireEvent.press(getByText("Log In with Code"));
    expect(defaultProps.onEmailRequest).toHaveBeenCalled();
  });

  it("calls onChangeEmail when email input changes", () => {
    const { getByPlaceholderText } = render(
      <AuthOptions {...defaultProps} showEmailInput={true} />,
    );
    fireEvent.changeText(
      getByPlaceholderText("Enter your email"),
      "test@example.com",
    );
    expect(defaultProps.onChangeEmail).toHaveBeenCalledWith("test@example.com");
  });

  it("calls onShowTerms when terms link is pressed", () => {
    const { getByText } = render(<AuthOptions {...defaultProps} />);
    fireEvent.press(getByText("Terms & Conditions"));
    expect(defaultProps.onShowTerms).toHaveBeenCalled();
  });

  it("disables Google button when googleRequestReady is false", () => {
    const { getByLabelText } = render(
      <AuthOptions {...defaultProps} googleRequestReady={false} />,
    );
    const googleButton = getByLabelText("Continue with Google");
    expect(googleButton.props.accessibilityState?.disabled).toBe(true);
  });

  it("disables buttons when loading is true", () => {
    const { getByLabelText } = render(
      <AuthOptions {...defaultProps} loading={true} />,
    );
    const googleButton = getByLabelText("Continue with Google");
    expect(googleButton.props.accessibilityState?.disabled).toBe(true);
  });

  it("shows loading indicator on Google button when loading", () => {
    const { queryByText } = render(
      <AuthOptions {...defaultProps} loading={true} />,
    );
    // Button text should not be present when loading
    expect(queryByText("Continue with Google")).toBeNull();
  });

  it("displays terms disclaimer", () => {
    const { getByText } = render(<AuthOptions {...defaultProps} />);
    expect(getByText(/By logging in, you agree to our/)).toBeTruthy();
  });

  it("displays current email value in input", () => {
    const { getByPlaceholderText } = render(
      <AuthOptions
        {...defaultProps}
        showEmailInput={true}
        email="user@test.com"
      />,
    );
    const input = getByPlaceholderText("Enter your email");
    expect(input.props.value).toBe("user@test.com");
  });
});
