import { useState, useCallback, type MutableRefObject } from "react";
import type { Task, SkipTaskPreviewResponse } from "../types";
import { isSkipTaskPreviewResponse } from "../types";
import api from "../services/api";
import { buildOccurrenceParams } from "./taskOccurrenceParams";
import type { UseTaskDependencyActionsParams } from "./useTaskDependencyActionsTypes";

export interface SkipCascadeState {
  visible: boolean;
  preview: SkipTaskPreviewResponse | null;
  task: Task | null;
  reason?: string;
  scheduledFor?: string;
  localDate?: string;
}

export function useTaskDependencySkipActions(
  paramsRef: MutableRefObject<UseTaskDependencyActionsParams>,
  onCascadeSuccess: (titles: string[], skipReason?: string) => void,
): {
  skipCascade: SkipCascadeState;
  processSkipAfterReason: (task: Task, reason?: string) => Promise<void>;
  dismissSkipCascade: () => void;
  onSkipKeepPending: () => Promise<void>;
  onSkipCascadeConfirm: () => Promise<void>;
} {
  const [skipCascade, setSkipCascade] = useState<SkipCascadeState>({
    visible: false,
    preview: null,
    task: null,
  });

  const dismissSkipCascade = useCallback(() => {
    setSkipCascade({
      visible: false,
      preview: null,
      task: null,
    });
  }, []);

  const processSkipAfterReason = useCallback(
    async (task: Task, reason?: string) => {
      const taskId = task.originalTaskId || task.id;
      const { scheduledFor, localDate } = buildOccurrenceParams(
        task,
        paramsRef.current.getCurrentDate,
      );
      const result = await paramsRef.current.skipTask(
        taskId,
        reason,
        scheduledFor,
        localDate,
      );
      if (isSkipTaskPreviewResponse(result)) {
        setSkipCascade({
          visible: true,
          preview: result,
          task,
          reason,
          scheduledFor,
          localDate,
        });
        return;
      }
      paramsRef.current.onFlowFinished?.();
    },
    [],
  );

  const onSkipKeepPending = useCallback(async () => {
    const t = skipCascade.task;
    if (!t) return;
    const taskId = t.originalTaskId || t.id;
    await paramsRef.current.skipTask(
      taskId,
      skipCascade.reason,
      skipCascade.scheduledFor,
      skipCascade.localDate,
      true,
    );
    dismissSkipCascade();
    await paramsRef.current.fetchTasks();
    paramsRef.current.onFlowFinished?.();
  }, [skipCascade, dismissSkipCascade]);

  const onSkipCascadeConfirm = useCallback(async () => {
    const t = skipCascade.task;
    if (!t) return;
    const taskId = t.originalTaskId || t.id;
    const skipped = await api.skipTaskChain(taskId, {
      reason: skipCascade.reason,
      scheduled_for: skipCascade.scheduledFor,
      local_date: skipCascade.localDate,
      cascade_skip: true,
    });
    dismissSkipCascade();
    onCascadeSuccess(
      skipped.map((x) => x.title),
      skipCascade.reason,
    );
    await paramsRef.current.fetchTasks();
    paramsRef.current.onFlowFinished?.();
  }, [skipCascade, dismissSkipCascade, onCascadeSuccess]);

  return {
    skipCascade,
    processSkipAfterReason,
    dismissSkipCascade,
    onSkipKeepPending,
    onSkipCascadeConfirm,
  };
}
