import { useState, useCallback, useRef } from "react";
import type { Task, DependencyBlocker } from "../types";
import api from "../services/api";
import { buildOccurrenceParams } from "./taskOccurrenceParams";
import {
  useTaskDependencySkipActions,
  type SkipCascadeState,
} from "./useTaskDependencySkipActions";
import type {
  UseTaskDependencyActionsParams,
  HardModalState,
  SoftModalState,
  OverrideModalState,
  SuccessListState,
} from "./useTaskDependencyActionsTypes";

export type {
  UseTaskDependencyActionsParams,
  HardModalState,
  SoftModalState,
  OverrideModalState,
  SuccessListState,
} from "./useTaskDependencyActionsTypes";

export type { SkipCascadeState } from "./useTaskDependencySkipActions";

function sortUnmetBlockers(blockers: DependencyBlocker[]): DependencyBlocker[] {
  return [...blockers]
    .filter((b) => !b.is_met)
    .sort((a, b) => {
      if (a.strength === "hard" && b.strength !== "hard") return -1;
      if (b.strength === "hard" && a.strength !== "hard") return 1;
      return 0;
    });
}

/** Prefer API topo chain for hard modals; else direct unmet hard edges. */
function hardBlockersForModal(status: {
  transitive_unmet_hard_prerequisites?: DependencyBlocker[];
  dependencies: DependencyBlocker[];
}): DependencyBlocker[] {
  const t = status.transitive_unmet_hard_prerequisites;
  if (t && t.length > 0) {
    return t;
  }
  return sortUnmetBlockers(status.dependencies).filter((b) => b.strength === "hard");
}

export function useTaskDependencyActions(params: UseTaskDependencyActionsParams) {
  const [hardModal, setHardModal] = useState<HardModalState>({
    visible: false,
    task: null,
    blockers: [],
  });
  const [softModal, setSoftModal] = useState<SoftModalState>({
    visible: false,
    task: null,
    blockers: [],
  });
  const [overrideModal, setOverrideModal] = useState<OverrideModalState>({
    visible: false,
    task: null,
    blockers: [],
    reason: "",
  });
  const [successModal, setSuccessModal] = useState<SuccessListState>({
    visible: false,
    titles: [],
    kind: "complete_chain",
  });

  const paramsRef = useRef(params);
  paramsRef.current = params;

  const showCascadeSuccess = useCallback(
    (titles: string[], skipReason?: string) => {
      setSuccessModal({
        visible: true,
        titles,
        kind: "cascade_skip",
        skipReason,
      });
    },
    [],
  );

  const {
    skipCascade,
    processSkipAfterReason,
    dismissSkipCascade,
    onSkipKeepPending,
    onSkipCascadeConfirm,
  } = useTaskDependencySkipActions(paramsRef, showCascadeSuccess);

  const requestComplete = useCallback(async (task: Task) => {
    const taskId = task.originalTaskId || task.id;
    const { scheduledFor, localDate } = buildOccurrenceParams(
      task,
      paramsRef.current.getCurrentDate,
    );
    // Always preflight with dependency-status. The tasksWithPrerequisites Set is only
    // refreshed when task *count* changes, so it stays stale after editing a task to add
    // prerequisites — skipping preflight then hits POST /complete → 409 → generic alert
    // instead of the dependency modals.
    const status = await api.getDependencyStatus(taskId, scheduledFor, localDate);
    if (status.all_met) {
      await paramsRef.current.completeTask(taskId, scheduledFor, localDate);
      paramsRef.current.onFlowFinished?.();
      return;
    }
    if (status.has_unmet_hard) {
      setHardModal({
        visible: true,
        task,
        blockers: hardBlockersForModal(status),
        scheduledFor,
        localDate,
      });
      return;
    }
    if (status.has_unmet_soft) {
      setSoftModal({
        visible: true,
        task,
        blockers: sortUnmetBlockers(status.dependencies),
        scheduledFor,
        localDate,
      });
      return;
    }
  }, []);

  const dismissHardModal = useCallback(() => {
    setHardModal({ visible: false, task: null, blockers: [] });
  }, []);

  const dismissSoftModal = useCallback(() => {
    setSoftModal({ visible: false, task: null, blockers: [] });
  }, []);

  const onHardCompletePrereqs = useCallback(async () => {
    const t = hardModal.task;
    if (!t) return;
    const taskId = t.originalTaskId || t.id;
    const completed = await api.completeTaskChain(taskId, {
      scheduled_for: hardModal.scheduledFor,
      local_date: hardModal.localDate,
    });
    dismissHardModal();
    setSuccessModal({
      visible: true,
      titles: completed.map((x) => x.title),
      kind: "complete_chain",
    });
    await paramsRef.current.fetchTasks();
    paramsRef.current.onFlowFinished?.();
  }, [hardModal, dismissHardModal]);

  const onHardRequestOverride = useCallback(() => {
    if (!hardModal.task) return;
    setOverrideModal({
      visible: true,
      task: hardModal.task,
      blockers: hardModal.blockers,
      scheduledFor: hardModal.scheduledFor,
      localDate: hardModal.localDate,
      reason: "",
    });
    setHardModal((s) => ({ ...s, visible: false }));
  }, [hardModal]);

  const onSoftCompleteAnyway = useCallback(async () => {
    const t = softModal.task;
    if (!t) return;
    const taskId = t.originalTaskId || t.id;
    await paramsRef.current.completeTask(
      taskId,
      softModal.scheduledFor,
      softModal.localDate,
    );
    dismissSoftModal();
    await paramsRef.current.fetchTasks();
    paramsRef.current.onFlowFinished?.();
  }, [softModal, dismissSoftModal]);

  const onSoftCompletePrereqs = useCallback(async () => {
    const t = softModal.task;
    if (!t) return;
    const taskId = t.originalTaskId || t.id;
    const completed = await api.completeTaskChain(taskId, {
      scheduled_for: softModal.scheduledFor,
      local_date: softModal.localDate,
    });
    dismissSoftModal();
    setSuccessModal({
      visible: true,
      titles: completed.map((x) => x.title),
      kind: "complete_chain",
    });
    await paramsRef.current.fetchTasks();
    paramsRef.current.onFlowFinished?.();
  }, [softModal, dismissSoftModal]);

  const dismissOverrideModal = useCallback(() => {
    setOverrideModal({
      visible: false,
      task: null,
      blockers: [],
      reason: "",
    });
    setHardModal((s) =>
      s.task ? { ...s, visible: true } : { visible: false, task: null, blockers: [] },
    );
  }, []);

  const setOverrideReason = useCallback((reason: string) => {
    setOverrideModal((s) => ({ ...s, reason }));
  }, []);

  const onOverrideConfirm = useCallback(async () => {
    const t = overrideModal.task;
    if (!t) return;
    const taskId = t.originalTaskId || t.id;
    await paramsRef.current.completeTask(
      taskId,
      overrideModal.scheduledFor,
      overrideModal.localDate,
      {
        override_confirm: true,
        override_reason: overrideModal.reason.trim() || "Override",
      },
    );
    setOverrideModal({
      visible: false,
      task: null,
      blockers: [],
      reason: "",
    });
    setHardModal({ visible: false, task: null, blockers: [] });
    await paramsRef.current.fetchTasks();
    paramsRef.current.onFlowFinished?.();
  }, [overrideModal]);

  const dismissSuccessModal = useCallback(() => {
    setSuccessModal((s) => ({ ...s, visible: false, titles: [] }));
  }, []);

  return {
    hardModal,
    softModal,
    overrideModal,
    skipCascade,
    successModal,
    requestComplete,
    dismissHardModal,
    onHardCompletePrereqs,
    onHardRequestOverride,
    dismissSoftModal,
    onSoftCompleteAnyway,
    onSoftCompletePrereqs,
    dismissOverrideModal,
    onOverrideConfirm,
    setOverrideReason,
    dismissSkipCascade,
    onSkipKeepPending,
    onSkipCascadeConfirm,
    dismissSuccessModal,
    processSkipAfterReason,
  };
}
