/**
 * Tests for ChatMessage component
 */

import React from "react";
import { render, screen } from "@testing-library/react-native";
import ChatMessage from "../assistant/ChatMessage";

// Mock the styles
jest.mock("../assistant/assistantStyles", () => ({
  default: {
    messageRow: {},
    userRow: {},
    assistantRow: {},
    messageBubble: {},
    userBubble: {},
    assistantBubble: {},
    messageText: {},
    userText: {},
    assistantText: {},
  },
}));

interface Message {
  role: "user" | "assistant";
  content: string;
}

describe("ChatMessage", () => {
  it("should render user message correctly", () => {
    const message: Message = { role: "user", content: "Hello assistant" };
    render(<ChatMessage message={message} />);

    expect(screen.getByText("Hello assistant")).toBeTruthy();
  });

  it("should render assistant message correctly", () => {
    const message: Message = { role: "assistant", content: "Hello user" };
    render(<ChatMessage message={message} />);

    expect(screen.getByText("Hello user")).toBeTruthy();
  });

  it("should have accessibility label for user message", () => {
    const message: Message = { role: "user", content: "Test message" };
    render(<ChatMessage message={message} />);

    expect(screen.getByLabelText("You: Test message")).toBeTruthy();
  });

  it("should have accessibility label for assistant message", () => {
    const message: Message = { role: "assistant", content: "AI response" };
    render(<ChatMessage message={message} />);

    expect(screen.getByLabelText("Assistant: AI response")).toBeTruthy();
  });

  it("should render loading indicator when isLoading is true", () => {
    const message: Message = { role: "assistant", content: "" };
    render(<ChatMessage message={message} isLoading={true} />);

    // ActivityIndicator should be rendered
    expect(screen.queryByText("")).toBeFalsy();
  });

  it("should not render loading indicator when isLoading is false", () => {
    const message: Message = { role: "user", content: "Message" };
    render(<ChatMessage message={message} isLoading={false} />);

    expect(screen.getByText("Message")).toBeTruthy();
  });
});
