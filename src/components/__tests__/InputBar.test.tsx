import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import InputBar from "../assistant/InputBar";

// Mock styles
jest.mock("../assistant/assistantStyles", () => ({
  __esModule: true,
  default: {
    inputContainer: {},
    voiceButton: {},
    voiceButtonText: {},
    input: {},
    sendButton: {},
    sendButtonDisabled: {},
    sendButtonText: {},
  },
}));

interface InputBarProps {
  inputText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onVoiceRecord: () => void;
  isSending: boolean;
  isRecording: boolean;
}

describe("InputBar", () => {
  const defaultProps: InputBarProps = {
    inputText: "",
    onChangeText: jest.fn(),
    onSend: jest.fn(),
    onVoiceRecord: jest.fn(),
    isSending: false,
    isRecording: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders voice recording button", () => {
    const { getByText } = render(<InputBar {...defaultProps} />);
    expect(getByText("🎤")).toBeTruthy();
  });

  it("renders text input", () => {
    const { getByPlaceholderText } = render(<InputBar {...defaultProps} />);
    expect(getByPlaceholderText("Type your response...")).toBeTruthy();
  });

  it("renders send button", () => {
    const { getByText } = render(<InputBar {...defaultProps} />);
    expect(getByText("→")).toBeTruthy();
  });

  it("displays current input text value", () => {
    const { getByLabelText } = render(
      <InputBar {...defaultProps} inputText="Hello" />,
    );
    const input = getByLabelText("Message input");
    expect(input.props.value).toBe("Hello");
  });

  it("calls onChangeText when input changes", () => {
    const { getByLabelText } = render(<InputBar {...defaultProps} />);
    fireEvent.changeText(getByLabelText("Message input"), "New message");
    expect(defaultProps.onChangeText).toHaveBeenCalledWith("New message");
  });

  it("calls onVoiceRecord when voice button is pressed", () => {
    const { getByLabelText } = render(<InputBar {...defaultProps} />);
    fireEvent.press(getByLabelText("Record voice message"));
    expect(defaultProps.onVoiceRecord).toHaveBeenCalled();
  });

  it("disables voice button when recording", () => {
    const { getByLabelText } = render(
      <InputBar {...defaultProps} isRecording={true} />,
    );
    const voiceBtn = getByLabelText("Record voice message");
    expect(voiceBtn.props.accessibilityState?.disabled).toBe(true);
  });

  it("disables voice button when sending", () => {
    const { getByLabelText } = render(
      <InputBar {...defaultProps} isSending={true} />,
    );
    const voiceBtn = getByLabelText("Record voice message");
    expect(voiceBtn.props.accessibilityState?.disabled).toBe(true);
  });

  it("disables send button when text is empty", () => {
    const { getByLabelText } = render(
      <InputBar {...defaultProps} inputText="" />,
    );
    const sendBtn = getByLabelText("Send message");
    expect(sendBtn.props.accessibilityState?.disabled).toBe(true);
  });

  it("disables send button when sending", () => {
    const { getByLabelText } = render(
      <InputBar {...defaultProps} inputText="Hello" isSending={true} />,
    );
    const sendBtn = getByLabelText("Send message");
    expect(sendBtn.props.accessibilityState?.disabled).toBe(true);
  });

  it("enables send button when text is present and not sending", () => {
    const { getByLabelText } = render(
      <InputBar {...defaultProps} inputText="Hello" />,
    );
    const sendBtn = getByLabelText("Send message");
    expect(sendBtn.props.accessibilityState?.disabled).toBe(false);
  });
});
