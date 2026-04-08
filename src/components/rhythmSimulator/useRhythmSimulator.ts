import { useState, useCallback, useMemo, useEffect } from "react";

import api from "../../services/api";
import type {
  Task,
  TaskListResponse,
  TaskCompletionListResponse,
} from "../../types";
import { showAlert } from "../../utils/alert";
import { toLocalDateString } from "../../utils/taskSorting";
import { parseRRule } from "../tasks/rruleUtils";

import {
  OccurrenceState,
  OccurrenceStates,
  cycleState,
  getWeekKey,
} from "./rhythmSimulatorConstants";
import { buildHierarchyData } from "./buildHierarchy";
import { saveBulkCompletions, clearMockCompletions } from "./simulatorActions";
import type { WeekData, MonthData } from "./HierarchyView";

interface UseRhythmSimulatorResult {
  // State
  tasks: Task[];
  loadingTasks: boolean;
  loadingCompletions: boolean;
  selectedTaskId: string;
  setSelectedTaskId: (id: string) => void;
  startDate: string | null;
  setStartDate: (date: string | null) => void;
  occurrenceStates: OccurrenceStates;
  setOccurrenceStates: React.Dispatch<React.SetStateAction<OccurrenceStates>>;
  saving: boolean;
  clearing: boolean;
  expandedMonths: Set<string>;
  expandedWeeks: Set<string>;

  // Computed
  recurringTasks: Task[];
  selectedTask: Task | undefined;
  occurrencesPerDay: number;
  today: string;
  hierarchyData: { months: MonthData[] };
  statsPreview: {
    completed: number;
    skipped: number;
    total: number;
    rate: number;
  };

  // Callbacks
  getOccState: (date: string, occIdx: number) => OccurrenceState;
  getDayState: (date: string) => OccurrenceState;
  getWeekState: (days: { date: string }[]) => OccurrenceState;
  getMonthState: (weeks: WeekData[]) => OccurrenceState;
  toggleOccurrence: (date: string, occIdx: number) => void;
  toggleDay: (date: string) => void;
  toggleWeek: (days: { date: string }[]) => void;
  toggleMonth: (weeks: WeekData[]) => void;
  toggleMonthExpanded: (yearMonth: string) => void;
  toggleWeekExpanded: (weekStart: string) => void;
  handleSave: () => Promise<void>;
  handleClear: () => Promise<void>;
  resetState: () => void;
}

export function useRhythmSimulator(
  visible: boolean,
  onDataChanged?: () => void,
): UseRhythmSimulatorResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingCompletions, setLoadingCompletions] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [occurrenceStates, setOccurrenceStates] = useState<OccurrenceStates>(
    {},
  );
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  const today = toLocalDateString(new Date());

  // Fetch tasks when modal opens
  useEffect(() => {
    if (visible && tasks.length === 0) {
      setLoadingTasks(true);
      api
        .getTasks({ include_completed: true })
        .then((response: TaskListResponse) => setTasks(response.tasks))
        .catch(() => showAlert("Error", "Failed to load tasks"))
        .finally(() => setLoadingTasks(false));
    }
  }, [visible, tasks.length]);

  // Load completions for a task
  const loadCompletions = useCallback(async (taskId: string) => {
    setLoadingCompletions(true);

    const fetchAll = async (): Promise<
      TaskCompletionListResponse["completions"]
    > => {
      const all: TaskCompletionListResponse["completions"] = [];
      let offset = 0;
      const limit = 200;
      let hasMore = true;

      while (hasMore) {
        const response = await api.getTaskCompletions(taskId, limit, offset);
        all.push(...response.completions);
        offset += limit;
        hasMore = response.completions.length === limit;
      }
      return all;
    };

    try {
      const completions = await fetchAll();
      const newStates: OccurrenceStates = {};
      const byDate = new Map<string, { completed: number; skipped: number }>();

      for (const c of completions) {
        if (!c.scheduled_for) continue;
        const date = c.scheduled_for.split("T")[0];
        if (!byDate.has(date)) byDate.set(date, { completed: 0, skipped: 0 });
        const counts = byDate.get(date)!;
        if (c.status === "completed") counts.completed++;
        else if (c.status === "skipped") counts.skipped++;
      }

      byDate.forEach((counts, date) => {
        let idx = 0;
        for (let i = 0; i < counts.completed; i++)
          newStates[`${date}:${idx++}`] = "completed";
        for (let i = 0; i < counts.skipped; i++)
          newStates[`${date}:${idx++}`] = "skipped";
      });

      setOccurrenceStates(newStates);
    } catch {
      setOccurrenceStates({});
    } finally {
      setLoadingCompletions(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTaskId) loadCompletions(selectedTaskId);
  }, [selectedTaskId, loadCompletions]);

  const resetState = useCallback(() => {
    setSelectedTaskId("");
    setStartDate(null);
    setOccurrenceStates({});
    setExpandedMonths(new Set());
    setExpandedWeeks(new Set());
  }, []);

  // Computed values
  const recurringTasks = useMemo(
    () => tasks.filter((t) => t.is_recurring),
    [tasks],
  );
  const selectedTask = useMemo(
    () => recurringTasks.find((t) => t.id === selectedTaskId),
    [recurringTasks, selectedTaskId],
  );

  const occurrencesPerDay = useMemo(() => {
    if (!selectedTask?.recurrence_rule) return 1;
    return parseRRule(selectedTask.recurrence_rule).dailyOccurrences || 1;
  }, [selectedTask]);

  const effectiveStartDate = startDate || selectedTask?.scheduled_date || today;

  const hierarchyData = useMemo(() => {
    if (!selectedTask || !effectiveStartDate) return { months: [] };
    return buildHierarchyData(effectiveStartDate, today);
  }, [selectedTask, effectiveStartDate, today]);

  // State accessors
  const getOccState = useCallback(
    (date: string, occIdx: number): OccurrenceState =>
      occurrenceStates[`${date}:${occIdx}`] || "none",
    [occurrenceStates],
  );

  const setOccState = useCallback(
    (date: string, occIdx: number, state: OccurrenceState) => {
      const key = `${date}:${occIdx}`;
      setOccurrenceStates((prev) => {
        if (state === "none") {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        }
        return { ...prev, [key]: state };
      });
    },
    [],
  );

  const toggleOccurrence = useCallback(
    (date: string, occIdx: number) =>
      setOccState(date, occIdx, cycleState(getOccState(date, occIdx))),
    [getOccState, setOccState],
  );

  const getDayState = useCallback(
    (date: string): OccurrenceState => {
      const states = Array.from({ length: occurrencesPerDay }, (_, i) =>
        getOccState(date, i),
      );
      if (states.every((s) => s === "none")) return "none";
      if (states.every((s) => s === "completed")) return "completed";
      if (states.every((s) => s === "skipped")) return "skipped";
      return "mixed";
    },
    [getOccState, occurrencesPerDay],
  );

  const toggleDay = useCallback(
    (date: string) => {
      const next = cycleState(getDayState(date));
      for (let i = 0; i < occurrencesPerDay; i++) setOccState(date, i, next);
    },
    [getDayState, occurrencesPerDay, setOccState],
  );

  const getWeekState = useCallback(
    (days: { date: string }[]): OccurrenceState => {
      const dayStates = days.map((d) => getDayState(d.date));
      if (dayStates.every((s) => s === "none")) return "none";
      if (dayStates.every((s) => s === "completed")) return "completed";
      if (dayStates.every((s) => s === "skipped")) return "skipped";
      return "mixed";
    },
    [getDayState],
  );

  const toggleWeek = useCallback(
    (days: { date: string }[]) => {
      const next = cycleState(getWeekState(days));
      for (const day of days) {
        for (let i = 0; i < occurrencesPerDay; i++)
          setOccState(day.date, i, next);
      }
    },
    [getWeekState, occurrencesPerDay, setOccState],
  );

  const getMonthState = useCallback(
    (weeks: WeekData[]): OccurrenceState => {
      const dayStates = weeks
        .flatMap((w) => w.days)
        .map((d) => getDayState(d.date));
      if (dayStates.every((s) => s === "none")) return "none";
      if (dayStates.every((s) => s === "completed")) return "completed";
      if (dayStates.every((s) => s === "skipped")) return "skipped";
      return "mixed";
    },
    [getDayState],
  );

  const toggleMonth = useCallback(
    (weeks: WeekData[]) => {
      const next = cycleState(getMonthState(weeks));
      for (const week of weeks) {
        for (const day of week.days) {
          for (let i = 0; i < occurrencesPerDay; i++)
            setOccState(day.date, i, next);
        }
      }
    },
    [getMonthState, occurrencesPerDay, setOccState],
  );

  const toggleMonthExpanded = useCallback((yearMonth: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      next.has(yearMonth) ? next.delete(yearMonth) : next.add(yearMonth);
      return next;
    });
  }, []);

  const toggleWeekExpanded = useCallback((weekStart: string) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      next.has(weekStart) ? next.delete(weekStart) : next.add(weekStart);
      return next;
    });
  }, []);

  const statsPreview = useMemo(() => {
    let completed = 0;
    let skipped = 0;
    Object.values(occurrenceStates).forEach((state) => {
      if (state === "completed") completed++;
      else if (state === "skipped") skipped++;
    });
    const total = completed + skipped;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, skipped, total, rate };
  }, [occurrenceStates]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveBulkCompletions(
        selectedTaskId,
        occurrenceStates,
        startDate,
        loadCompletions,
        onDataChanged,
      );
    } finally {
      setSaving(false);
    }
  }, [
    selectedTaskId,
    occurrenceStates,
    startDate,
    onDataChanged,
    loadCompletions,
  ]);

  const handleClear = useCallback(async () => {
    setClearing(true);
    try {
      await clearMockCompletions(
        selectedTaskId,
        loadCompletions,
        onDataChanged,
      );
    } finally {
      setClearing(false);
    }
  }, [selectedTaskId, onDataChanged, loadCompletions]);

  // Auto-expand current month/week
  useEffect(() => {
    if (hierarchyData.months.length > 0) {
      setExpandedMonths(new Set([today.substring(0, 7)]));
      setExpandedWeeks(new Set([getWeekKey(new Date(today + "T00:00:00"))]));
    }
  }, [hierarchyData.months.length, today]);

  return {
    tasks,
    loadingTasks,
    loadingCompletions,
    selectedTaskId,
    setSelectedTaskId,
    startDate,
    setStartDate,
    occurrenceStates,
    setOccurrenceStates,
    saving,
    clearing,
    expandedMonths,
    expandedWeeks,
    recurringTasks,
    selectedTask,
    occurrencesPerDay,
    today,
    hierarchyData,
    statsPreview,
    getOccState,
    getDayState,
    getWeekState,
    getMonthState,
    toggleOccurrence,
    toggleDay,
    toggleWeek,
    toggleMonth,
    toggleMonthExpanded,
    toggleWeekExpanded,
    handleSave,
    handleClear,
    resetState,
  };
}
