import React from "react";
import { render } from "@testing-library/react-native";
import { TaskDependencyAdvisory } from "../TaskDependencyAdvisory";
import type { Task } from "../../../types";

describe("TaskDependencyAdvisory", () => {
  it("renders nothing without summary", () => {
    const { toJSON } = render(<TaskDependencyAdvisory task={{ id: "1" } as Task} />);
    expect(toJSON()).toBeNull();
  });

  it("renders advisory text", () => {
    const task = {
      id: "1",
      dependency_summary: {
        readiness_state: "advisory" as const,
        has_unmet_hard: false,
        has_unmet_soft: true,
        advisory_text: "Usually follows: A · Not completed yet",
      },
    } as Task;
    const { getByText } = render(<TaskDependencyAdvisory task={task} />);
    expect(getByText(/Usually follows/)).toBeTruthy();
  });
});
