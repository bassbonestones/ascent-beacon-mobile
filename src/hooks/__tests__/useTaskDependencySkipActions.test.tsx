import React, { useRef } from "react";
import { renderHook, act } from "@testing-library/react-native";
import { useTaskDependencySkipActions } from "../useTaskDependencySkipActions";
import type { UseTaskDependencyActionsParams } from "../useTaskDependencyActionsTypes";
import type { Task } from "../../types";

describe("useTaskDependencySkipActions", () => {
  const baseParams: UseTaskDependencyActionsParams = {
    tasksWithPrerequisites: new Set(),
    completeTask: jest.fn(),
    skipTask: jest.fn(),
    fetchTasks: jest.fn(),
    getCurrentDate: () => new Date(2026, 3, 10),
  };

  it("opens cascade on preview response", async () => {
    const skipTask = jest.fn().mockResolvedValue({
      status: "has_dependents",
      affected_downstream: [],
    });
    const { result } = renderHook(() => {
      const paramsRef = useRef({ ...baseParams, skipTask });
      paramsRef.current = { ...baseParams, skipTask };
      return useTaskDependencySkipActions(paramsRef, jest.fn());
    });
    const task = { id: "t1", is_recurring: false } as Task;
    await act(async () => {
      await result.current.processSkipAfterReason(task, "r");
    });
    expect(skipTask).toHaveBeenCalled();
    expect(result.current.skipCascade.visible).toBe(true);
  });
});
