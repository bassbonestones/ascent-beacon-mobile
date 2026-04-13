import { Alert } from "react-native";
import api from "../../services/api";
import type { PriorityCheckResponse } from "../../types";
import { checkOrphanedPriorities } from "../priorityOrphanCheck";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    getPriorities: jest.fn(),
    checkPriorityStatus: jest.fn(),
    stashPriority: jest.fn(),
    deletePriority: jest.fn(),
  },
}));

const apiMock = api as jest.Mocked<typeof api>;

describe("checkOrphanedPriorities", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("completes when there are no priorities", async () => {
    apiMock.getPriorities.mockResolvedValue({ priorities: [] });
    const done = checkOrphanedPriorities();
    await jest.runAllTimersAsync();
    await done;
    expect(apiMock.getPriorities).toHaveBeenCalled();
  });

  it("handles orphaned priority via Cancel and runs onComplete", async () => {
    apiMock.getPriorities.mockResolvedValue({
      priorities: [
        {
          id: "p1",
          active_revision: { title: "Orphan title" },
        },
      ],
    } as Awaited<ReturnType<typeof apiMock.getPriorities>>);
    const orphanStatus: PriorityCheckResponse = {
      priority_id: "p1",
      has_linked_values: false,
      linked_value_count: 0,
      linked_values: [],
      is_anchored: false,
      status: "incomplete",
    };
    apiMock.checkPriorityStatus.mockResolvedValue(orphanStatus);

    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons) => {
        const cancel = buttons?.find((b) => b.text === "Cancel");
        cancel?.onPress?.();
      });

    const onComplete = jest.fn().mockResolvedValue(undefined);
    const done = checkOrphanedPriorities(onComplete);
    await jest.runAllTimersAsync();
    await done;

    expect(onComplete).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenLastCalledWith(
      "Updated",
      "Orphaned priorities handled.",
    );
    alertSpy.mockRestore();
  });

  it("handles orphaned priority via Stash action", async () => {
    apiMock.getPriorities.mockResolvedValue({
      priorities: [
        {
          id: "p2",
          active_revision: { title: "Stash me" },
        },
      ],
    } as Awaited<ReturnType<typeof apiMock.getPriorities>>);
    const orphanStatus: PriorityCheckResponse = {
      priority_id: "p2",
      has_linked_values: false,
      linked_value_count: 0,
      linked_values: [],
      is_anchored: false,
      status: "incomplete",
    };
    apiMock.checkPriorityStatus.mockResolvedValue(orphanStatus);
    apiMock.stashPriority.mockResolvedValue(
      { id: "p2" } as Awaited<ReturnType<typeof apiMock.stashPriority>>,
    );

    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons) => {
        const stash = buttons?.find((b) => b.text === "Stash");
        stash?.onPress?.();
      });

    const done = checkOrphanedPriorities();
    await jest.runAllTimersAsync();
    await done;

    expect(apiMock.stashPriority).toHaveBeenCalledWith("p2", true);
    alertSpy.mockRestore();
  });

  it("shows error alert when delete action fails", async () => {
    apiMock.getPriorities.mockResolvedValue({
      priorities: [
        {
          id: "p3",
          active_revision: { title: "Delete me" },
        },
      ],
    } as Awaited<ReturnType<typeof apiMock.getPriorities>>);
    const orphanStatus: PriorityCheckResponse = {
      priority_id: "p3",
      has_linked_values: false,
      linked_value_count: 0,
      linked_values: [],
      is_anchored: false,
      status: "incomplete",
    };
    apiMock.checkPriorityStatus.mockResolvedValue(orphanStatus);
    apiMock.deletePriority.mockRejectedValue(new Error("boom"));

    const calls: Array<{ title: string; message?: string }> = [];
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((title, message, buttons) => {
        calls.push({ title, message });
        if (title.startsWith("No Values Linked")) {
          const del = buttons?.find((b) => b.text === "Delete");
          del?.onPress?.();
        }
      });

    const done = checkOrphanedPriorities();
    await jest.runAllTimersAsync();
    await done;

    expect(calls.some((c) => c.title === "Error")).toBe(true);
    expect(calls.some((c) => c.title === "Updated")).toBe(true);
    alertSpy.mockRestore();
  });

  it("retries status check and shows error when stash fails", async () => {
    apiMock.getPriorities.mockResolvedValue({
      priorities: [
        {
          id: "p4",
          active_revision: { title: "Retry me" },
        },
      ],
    } as Awaited<ReturnType<typeof apiMock.getPriorities>>);
    const orphanStatus: PriorityCheckResponse = {
      priority_id: "p4",
      has_linked_values: false,
      linked_value_count: 0,
      linked_values: [],
      is_anchored: false,
      status: "incomplete",
    };
    apiMock.checkPriorityStatus
      .mockRejectedValueOnce(new Error("temporary"))
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValue(orphanStatus);
    apiMock.stashPriority.mockRejectedValue(new Error("stash failed"));

    const calls: Array<{ title: string; message?: string }> = [];
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((title, message, buttons) => {
        calls.push({ title, message });
        if (title.startsWith("No Values Linked")) {
          const stash = buttons?.find((b) => b.text === "Stash");
          stash?.onPress?.();
        }
      });

    const done = checkOrphanedPriorities();
    await jest.runAllTimersAsync();
    await done;

    expect(apiMock.checkPriorityStatus).toHaveBeenCalledTimes(3);
    expect(calls.some((c) => c.title === "Error")).toBe(true);
    alertSpy.mockRestore();
  });
});
