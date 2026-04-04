import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import AffectedPrioritiesModal from "../AffectedPrioritiesModal";
import type { AffectedPriorityInfo } from "../../types";

interface TestProps {
  visible: boolean;
  priorities: AffectedPriorityInfo[] | null;
  onReviewLinks: () => void;
  onContinue: () => void;
  onClose: () => void;
}

describe("AffectedPrioritiesModal", () => {
  const defaultProps: TestProps = {
    visible: true,
    priorities: [
      { priority_id: "p1", title: "Priority One", is_anchored: false },
      { priority_id: "p2", title: "Priority Two", is_anchored: true },
    ],
    onReviewLinks: jest.fn(),
    onContinue: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to render with proper type casting for edge case tests
  const renderModal = (props: TestProps) => {
    // @ts-expect-error - Testing runtime behavior with invalid prop values
    return render(<AffectedPrioritiesModal {...props} />);
  };

  it("renders modal header", () => {
    const { getByText } = renderModal(defaultProps);
    expect(getByText("Connected Priorities")).toBeTruthy();
  });

  it("displays description with priority count", () => {
    const { getByText } = renderModal(defaultProps);
    expect(getByText(/This value is linked to 2 priority/)).toBeTruthy();
  });

  it("displays all priority titles", () => {
    const { getByText } = renderModal(defaultProps);
    expect(getByText("Priority One")).toBeTruthy();
    expect(getByText("Priority Two")).toBeTruthy();
  });

  it("shows anchored badge for anchored priorities", () => {
    const { getByText } = renderModal(defaultProps);
    expect(getByText("🔗 ANCHORED")).toBeTruthy();
  });

  it("renders They Still Fit button", () => {
    const { getByText } = renderModal(defaultProps);
    expect(getByText("They Still Fit")).toBeTruthy();
  });

  it("renders Review Links button", () => {
    const { getByText } = renderModal(defaultProps);
    expect(getByText("Review Links")).toBeTruthy();
  });

  it("calls onContinue when They Still Fit is pressed", () => {
    const { getByText } = renderModal(defaultProps);
    fireEvent.press(getByText("They Still Fit"));
    expect(defaultProps.onContinue).toHaveBeenCalled();
  });

  it("calls onReviewLinks when Review Links is pressed", () => {
    const { getByText } = renderModal(defaultProps);
    fireEvent.press(getByText("Review Links"));
    expect(defaultProps.onReviewLinks).toHaveBeenCalled();
  });

  it("calls onClose when close button is pressed", () => {
    const { getByText } = renderModal(defaultProps);
    fireEvent.press(getByText("✕"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("returns null when not visible", () => {
    const { queryByText } = renderModal({ ...defaultProps, visible: false });
    expect(queryByText("Connected Priorities")).toBeNull();
  });

  it("returns null when priorities is empty", () => {
    const { queryByText } = renderModal({ ...defaultProps, priorities: [] });
    expect(queryByText("Connected Priorities")).toBeNull();
  });

  it("returns null when priorities is null", () => {
    const { queryByText } = renderModal({ ...defaultProps, priorities: null });
    expect(queryByText("Connected Priorities")).toBeNull();
  });

  it("handles priorities without priority_id by using index as key", () => {
    const prioritiesWithoutId = [
      { title: "No ID Priority", is_anchored: false },
    ] as AffectedPriorityInfo[];
    const { getByText } = renderModal({
      ...defaultProps,
      priorities: prioritiesWithoutId,
    });
    expect(getByText("No ID Priority")).toBeTruthy();
  });
});
