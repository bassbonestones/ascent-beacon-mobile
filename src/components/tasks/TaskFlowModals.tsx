import React from "react";
import type { Task, DependencyBlocker, AffectedDownstreamEntry } from "../../types";
import { SkipReasonModal } from "./SkipReasonModal";
import { TaskDependencyHardModal } from "./TaskDependencyHardModal";
import { TaskDependencySoftModal } from "./TaskDependencySoftModal";
import { TaskDependencyOverrideModal } from "./TaskDependencyOverrideModal";
import { TaskSkipCascadeModal } from "./TaskSkipCascadeModal";
import { TaskDependencySuccessModal } from "./TaskDependencySuccessModal";
import type { SkipCascadeState } from "../../hooks/useTaskDependencySkipActions";
import type { HardModalState, SoftModalState, OverrideModalState, SuccessListState } from "../../hooks/useTaskDependencyActionsTypes";

export interface TaskFlowModalsProps {
  skipModalTask: Task | null;
  skipModalTitle: string;
  onSkipReasonClose: () => void;
  onSkipWithReason: (reason?: string) => void;
  hardModal: HardModalState;
  softModal: SoftModalState;
  overrideModal: OverrideModalState;
  skipCascade: SkipCascadeState;
  successModal: SuccessListState;
  affectedSkipRows: AffectedDownstreamEntry[];
  dismissHardModal: () => void;
  onHardCompletePrereqs: () => void;
  onHardRequestOverride: () => void;
  dismissSoftModal: () => void;
  onSoftCompleteAnyway: () => void;
  onSoftCompletePrereqs: () => void;
  dismissOverrideModal: () => void;
  onOverrideConfirm: () => void;
  setOverrideReason: (reason: string) => void;
  dismissSkipCascade: () => void;
  onSkipKeepPending: () => void;
  onSkipCascadeConfirm: () => void;
  dismissSuccessModal: () => void;
}

/**
 * Dependency + skip cascade + success toasts for Tasks.
 * Mounted once per screen so list/detail/create/edit all share the same modal layer.
 */
export function TaskFlowModals({
  skipModalTask,
  skipModalTitle,
  onSkipReasonClose,
  onSkipWithReason,
  hardModal,
  softModal,
  overrideModal,
  skipCascade,
  successModal,
  affectedSkipRows,
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
}: TaskFlowModalsProps): React.ReactElement {
  return (
    <>
      <SkipReasonModal
        visible={skipModalTask !== null}
        taskTitle={skipModalTitle}
        onClose={onSkipReasonClose}
        onSkip={onSkipWithReason}
      />
      <TaskDependencyHardModal
        visible={hardModal.visible}
        taskTitle={hardModal.task?.title || ""}
        blockers={hardModal.blockers}
        onCompletePrereqs={onHardCompletePrereqs}
        onOverride={onHardRequestOverride}
        onCancel={dismissHardModal}
      />
      <TaskDependencyOverrideModal
        visible={overrideModal.visible}
        taskTitle={overrideModal.task?.title || ""}
        blockers={overrideModal.blockers}
        reason={overrideModal.reason}
        onReasonChange={setOverrideReason}
        onConfirm={onOverrideConfirm}
        onBack={dismissOverrideModal}
      />
      <TaskDependencySoftModal
        visible={softModal.visible}
        taskTitle={softModal.task?.title || ""}
        blockers={softModal.blockers}
        onCompletePrereqs={onSoftCompletePrereqs}
        onCompleteAnyway={onSoftCompleteAnyway}
        onCancel={dismissSoftModal}
      />
      <TaskSkipCascadeModal
        visible={skipCascade.visible}
        taskTitle={skipCascade.task?.title || ""}
        affected={affectedSkipRows}
        onKeepPending={onSkipKeepPending}
        onCascadeSkip={onSkipCascadeConfirm}
        onCancel={dismissSkipCascade}
      />
      <TaskDependencySuccessModal
        visible={successModal.visible}
        titles={successModal.titles}
        kind={successModal.kind}
        skipReason={successModal.skipReason}
        onDismiss={dismissSuccessModal}
      />
    </>
  );
}
