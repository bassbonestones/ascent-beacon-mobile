import { renderHook, act } from "@testing-library/react-native";
import { useTaskForm } from "../useTaskForm";
import type { Task } from "../../types";

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: "task-1",
  user_id: "user-1",
  goal_id: "goal-1",
  title: "Test Task",
  description: "Test description",
  duration_minutes: 45,
  status: "pending",
  scheduled_date: null,
  scheduled_at: "2026-04-05T14:30:00.000Z",
  is_recurring: true,
  recurrence_rule: "FREQ=DAILY;INTERVAL=1",
  notify_before_minutes: null,
  completed_at: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  is_lightning: false,
  goal: { id: "goal-1", title: "Test Goal", status: "in_progress" },
  scheduling_mode: "floating",
  skip_reason: null,
  sort_order: null,
  ...overrides,
});

describe("useTaskForm", () => {
  describe("initial state", () => {
    it("starts with empty form values", () => {
      const { result } = renderHook(() => useTaskForm());

      expect(result.current.title).toBe("");
      expect(result.current.description).toBe("");
      expect(result.current.goalId).toBe("");
      expect(result.current.duration).toBe("30");
      expect(result.current.isLightning).toBe(false);
      expect(result.current.isRecurring).toBe(false);
      expect(result.current.recurrenceRule).toBe("");
      expect(result.current.schedulingMode).toBeNull();
      expect(result.current.scheduledTime).toBeNull();
      expect(result.current.scheduledDate).toBeNull();
    });
  });

  describe("resetForm", () => {
    it("resets all values to defaults", () => {
      const { result } = renderHook(() => useTaskForm());

      // Set some values
      act(() => {
        result.current.setTitle("Test");
        result.current.setDescription("Desc");
        result.current.setGoalId("goal-1");
        result.current.setIsRecurring(true);
      });

      // Reset
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.title).toBe("");
      expect(result.current.description).toBe("");
      expect(result.current.goalId).toBe("");
      expect(result.current.isRecurring).toBe(false);
    });
  });

  describe("populateForm", () => {
    it("populates form with task values", () => {
      const { result } = renderHook(() => useTaskForm());
      const task = createMockTask();

      act(() => {
        result.current.populateForm(task);
      });

      expect(result.current.title).toBe("Test Task");
      expect(result.current.description).toBe("Test description");
      expect(result.current.goalId).toBe("goal-1");
      expect(result.current.duration).toBe("45");
      expect(result.current.isRecurring).toBe(true);
      expect(result.current.recurrenceRule).toBe("FREQ=DAILY;INTERVAL=1");
      expect(result.current.schedulingMode).toBe("floating");
    });

    it("extracts date and time from scheduled_at", () => {
      const { result } = renderHook(() => useTaskForm());
      const task = createMockTask({
        scheduled_at: "2026-04-05T14:30:00.000Z",
      });

      act(() => {
        result.current.populateForm(task);
      });

      // Note: The exact values depend on the local timezone
      expect(result.current.scheduledDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.current.scheduledTime).toMatch(/^\d{2}:\d{2}$/);
    });

    it("handles task without scheduled_at", () => {
      const { result } = renderHook(() => useTaskForm());
      const task = createMockTask({ scheduled_at: null });

      act(() => {
        result.current.populateForm(task);
      });

      expect(result.current.scheduledDate).toBeNull();
      expect(result.current.scheduledTime).toBeNull();
    });

    it("handles task with scheduled_date (date-only task)", () => {
      const { result } = renderHook(() => useTaskForm());
      const task = createMockTask({
        scheduled_date: "2026-04-15",
        scheduled_at: null,
        scheduling_mode: "date_only",
      });

      act(() => {
        result.current.populateForm(task);
      });

      expect(result.current.scheduledDate).toBe("2026-04-15");
      expect(result.current.scheduledTime).toBeNull();
    });

    it("handles lightning tasks", () => {
      const { result } = renderHook(() => useTaskForm());
      const task = createMockTask({ duration_minutes: 0 });

      act(() => {
        result.current.populateForm(task);
      });

      expect(result.current.isLightning).toBe(true);
      expect(result.current.duration).toBe("0");
    });

    it("handles task without goal", () => {
      const { result } = renderHook(() => useTaskForm());
      const task = createMockTask({ goal_id: null, goal: undefined });

      act(() => {
        result.current.populateForm(task);
      });

      expect(result.current.goalId).toBe("");
    });

    it("handles task without description", () => {
      const { result } = renderHook(() => useTaskForm());
      const task = createMockTask({ description: null });

      act(() => {
        result.current.populateForm(task);
      });

      expect(result.current.description).toBe("");
    });
  });

  describe("toggleLightning", () => {
    it("toggles lightning state", () => {
      const { result } = renderHook(() => useTaskForm());

      expect(result.current.isLightning).toBe(false);

      act(() => {
        result.current.toggleLightning();
      });

      expect(result.current.isLightning).toBe(true);

      act(() => {
        result.current.toggleLightning();
      });

      expect(result.current.isLightning).toBe(false);
    });
  });

  describe("toggleRecurring", () => {
    it("toggles recurring state", () => {
      const { result } = renderHook(() => useTaskForm());

      expect(result.current.isRecurring).toBe(false);

      act(() => {
        result.current.toggleRecurring();
      });

      expect(result.current.isRecurring).toBe(true);

      act(() => {
        result.current.toggleRecurring();
      });

      expect(result.current.isRecurring).toBe(false);
    });
  });

  describe("toggleAnytime", () => {
    it("toggles anytime state", () => {
      const { result } = renderHook(() => useTaskForm());

      expect(result.current.isAnytime).toBe(false);

      act(() => {
        result.current.toggleAnytime();
      });

      expect(result.current.isAnytime).toBe(true);

      act(() => {
        result.current.toggleAnytime();
      });

      expect(result.current.isAnytime).toBe(false);
    });
  });

  describe("handleRecurrenceChange", () => {
    it("updates recurrence values", () => {
      const { result } = renderHook(() => useTaskForm());

      act(() => {
        result.current.handleRecurrenceChange(
          "FREQ=WEEKLY;BYDAY=MO,WE,FR",
          "fixed",
          "2026-04-05",
          "09:00",
        );
      });

      expect(result.current.recurrenceRule).toBe("FREQ=WEEKLY;BYDAY=MO,WE,FR");
      expect(result.current.schedulingMode).toBe("fixed");
      expect(result.current.scheduledDate).toBe("2026-04-05");
      expect(result.current.scheduledTime).toBe("09:00");
    });
  });

  describe("dateTimeToIso", () => {
    it("returns undefined when both date and time are null", () => {
      const { result } = renderHook(() => useTaskForm());

      const iso = result.current.dateTimeToIso(null, null);

      expect(iso).toBeUndefined();
    });

    it("returns undefined when date is provided but time is null", () => {
      const { result } = renderHook(() => useTaskForm());

      const iso = result.current.dateTimeToIso("2026-04-05", null);

      // dateTimeToIso only returns ISO when BOTH date and time are set
      // For date-only tasks, use getSchedulingFields instead
      expect(iso).toBeUndefined();
    });

    it("returns ISO string when date and time are provided", () => {
      const { result } = renderHook(() => useTaskForm());

      const iso = result.current.dateTimeToIso("2026-04-05", "14:30");

      expect(iso).toBeDefined();
      expect(iso).toContain("T");
    });

    it("returns undefined when date is null but time is provided", () => {
      const { result } = renderHook(() => useTaskForm());

      const iso = result.current.dateTimeToIso(null, "14:30");

      // dateTimeToIso requires BOTH date and time
      expect(iso).toBeUndefined();
    });
  });

  describe("getSchedulingFields", () => {
    it("returns scheduled_at when both date and time are provided", () => {
      const { result } = renderHook(() => useTaskForm());

      const fields = result.current.getSchedulingFields("2026-04-05", "14:30");

      expect(fields.scheduled_date).toBeNull();
      expect(fields.scheduled_at).toBeDefined();
      expect(fields.scheduled_at).toContain("T");
    });

    it("returns scheduled_date when only date is provided", () => {
      const { result } = renderHook(() => useTaskForm());

      const fields = result.current.getSchedulingFields("2026-04-05", null);

      expect(fields.scheduled_date).toBe("2026-04-05");
      expect(fields.scheduled_at).toBeNull();
    });

    it("returns both null when neither date nor time is provided", () => {
      const { result } = renderHook(() => useTaskForm());

      const fields = result.current.getSchedulingFields(null, null);

      expect(fields.scheduled_date).toBeNull();
      expect(fields.scheduled_at).toBeNull();
    });

    it("returns both null when only time is provided (no date)", () => {
      const { result } = renderHook(() => useTaskForm());

      // Edge case: time without date - treated as unscheduled
      const fields = result.current.getSchedulingFields(null, "14:30");

      expect(fields.scheduled_date).toBeNull();
      expect(fields.scheduled_at).toBeNull();
    });
  });
});
