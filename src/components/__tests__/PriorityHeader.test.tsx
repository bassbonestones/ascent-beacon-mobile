import React from "react";
import { render } from "@testing-library/react-native";
import PriorityHeader from "../priorities/PriorityHeader";

// Mock styles
jest.mock("../../screens/styles/prioritiesScreenStyles", () => ({
  styles: {
    header: {},
    stepNumber: {},
    title: {},
    subtitle: {},
    headerMainRow: {},
    headerIconContainer: {},
    headerMainIcon: {},
    headerTextBlock: {},
  },
}));

interface PriorityHeaderProps {
  title?: string;
  subtitle?: string;
  stepNumber?: string;
}

describe("PriorityHeader", () => {
  it("renders default title", () => {
    const { getByText } = render(<PriorityHeader />);
    expect(getByText("Priorities")).toBeTruthy();
  });

  it("renders default subtitle", () => {
    const { getByText } = render(<PriorityHeader />);
    expect(getByText("Anchor what's important")).toBeTruthy();
  });

  it("renders custom title", () => {
    const { getByText } = render(<PriorityHeader title="My Title" />);
    expect(getByText("My Title")).toBeTruthy();
  });

  it("renders custom subtitle", () => {
    const { getByText } = render(<PriorityHeader subtitle="My Subtitle" />);
    expect(getByText("My Subtitle")).toBeTruthy();
  });

  it("renders step number when provided", () => {
    const { getByText } = render(<PriorityHeader stepNumber="Step 1 of 4" />);
    expect(getByText("Step 1 of 4")).toBeTruthy();
  });

  it("renders icon image when no step number", () => {
    const { UNSAFE_getByType } = render(<PriorityHeader />);
    const { Image } = require("react-native");
    expect(UNSAFE_getByType(Image)).toBeTruthy();
  });

  it("does not render icon when step number present", () => {
    const { UNSAFE_queryByType } = render(
      <PriorityHeader stepNumber="Step 1" />,
    );
    const { Image } = require("react-native");
    expect(UNSAFE_queryByType(Image)).toBeNull();
  });

  it("renders all props together", () => {
    const { getByText } = render(
      <PriorityHeader
        title="Create Priority"
        subtitle="Define what matters"
        stepNumber="Step 2 of 4"
      />,
    );
    expect(getByText("Create Priority")).toBeTruthy();
    expect(getByText("Define what matters")).toBeTruthy();
    expect(getByText("Step 2 of 4")).toBeTruthy();
  });
});
