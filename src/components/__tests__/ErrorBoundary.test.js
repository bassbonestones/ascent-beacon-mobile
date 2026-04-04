import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { Text, View } from "react-native";
import ErrorBoundary from "../ErrorBoundary";

// Component that throws an error
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <Text>Child rendered successfully</Text>;
};

// Suppress console.error for expected errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalError;
});

describe("ErrorBoundary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <Text>Test content</Text>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Test content")).toBeTruthy();
  });

  it("renders fallback UI when child throws an error", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(screen.getByText("Try Again")).toBeTruthy();
  });

  it("renders custom fallback when provided", () => {
    const customFallback = <Text>Custom error message</Text>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Custom error message")).toBeTruthy();
  });

  it("calls onError callback when error occurs", () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
  });

  it("resets error state when retry button is pressed", () => {
    // Use a controllable component that can switch between throwing and not throwing
    let shouldThrow = true;
    const ControlledChild = () => {
      if (shouldThrow) {
        throw new Error("Test error");
      }
      return <Text>Child rendered successfully</Text>;
    };

    render(
      <ErrorBoundary>
        <ControlledChild />
      </ErrorBoundary>,
    );

    // Should show error UI
    expect(screen.getByText("Something went wrong")).toBeTruthy();

    // Fix the child before pressing retry
    shouldThrow = false;

    // Press retry button - this should attempt to re-render children
    fireEvent.press(screen.getByText("Try Again"));

    // Should show child content again
    expect(screen.getByText("Child rendered successfully")).toBeTruthy();
  });
});
