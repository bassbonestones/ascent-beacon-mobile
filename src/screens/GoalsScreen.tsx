import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type {
  Goal,
  User,
  RootStackParamList,
  GoalStatus,
  GoalArchiveResolutionAction,
  GoalArchivePreviewResponse,
  GoalArchiveTaskResolution,
} from "../types";
import { useGoals } from "../hooks/useGoals";
import { styles } from "./styles/goalsScreenStyles";
import { GoalCard, GoalDetailView } from "../components/goals";
import { showAlert, showConfirm } from "../utils/alert";
import api from "../services/api";

interface GoalsScreenProps {
  user: User;
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

type ViewMode = "list" | "create" | "detail" | "archive";

type ArchiveResolutionChoice = {
  action: GoalArchiveResolutionAction;
  goal_id?: string;
};

export default function GoalsScreen({
  user,
  navigation,
}: GoalsScreenProps): React.ReactElement {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDescription, setNewGoalDescription] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [includePaused, setIncludePaused] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [archiveGoalTarget, setArchiveGoalTarget] = useState<Goal | null>(null);
  const [archivePreview, setArchivePreview] =
    useState<GoalArchivePreviewResponse | null>(null);
  const [archiveTargets, setArchiveTargets] = useState<Goal[]>([]);
  const [archiveResolutions, setArchiveResolutions] = useState<
    Record<string, ArchiveResolutionChoice>
  >({});

  const {
    goals,
    loading,
    error,
    refetch,
    createGoal,
    updateGoalStatus,
    deleteGoal,
    previewArchive,
    archiveGoal,
    pauseGoal,
    unpauseGoal,
  } = useGoals({
    includeCompleted: showCompleted,
    parentOnly: true,
    includePaused,
    includeArchived,
  });

  const handleCreateGoal = useCallback(async () => {
    if (!newGoalTitle.trim()) {
      showAlert("Error", "Please enter a goal title");
      return;
    }

    try {
      await createGoal({
        title: newGoalTitle.trim(),
        description: newGoalDescription.trim() || undefined,
      });
      setNewGoalTitle("");
      setNewGoalDescription("");
      setViewMode("list");
    } catch {
      // Error already handled in hook
    }
  }, [newGoalTitle, newGoalDescription, createGoal]);

  const handleStatusChange = useCallback(
    async (goal: Goal, newStatus: GoalStatus) => {
      try {
        await updateGoalStatus(goal.id, newStatus);
        if (selectedGoal?.id === goal.id) {
          setSelectedGoal({ ...goal, status: newStatus });
        }
        if (newStatus === "completed" && !showCompleted) {
          // Goal will disappear from list since we're not showing completed
        }
      } catch {
        // Error already handled in hook
      }
    },
    [updateGoalStatus, showCompleted, selectedGoal],
  );

  const handleArchiveGoal = useCallback(
    async (goal: Goal) => {
      if (goal.record_state === "archived") {
        showAlert("Already archived", "Archived goals cannot be reactivated.");
        return;
      }

      const confirmed = await showConfirm(
        "Archive Goal",
        `Archive "${goal.title}"? This is terminal and cannot be undone.`,
      );
      if (!confirmed) return;

      try {
        const preview = await previewArchive(goal.id);
        const activeGoalsResponse = await api.getGoals({ parent_only: false });
        const blockedGoalIds = new Set(preview.subtree_goal_ids);
        const validTargets = activeGoalsResponse.goals.filter(
          (candidate) =>
            candidate.id !== goal.id && !blockedGoalIds.has(candidate.id),
        );
        const defaultResolutions: Record<string, ArchiveResolutionChoice> = {};
        for (const task of preview.tasks_requiring_resolution) {
          defaultResolutions[task.task_id] = { action: "pause_task" };
        }
        setArchiveGoalTarget(goal);
        setArchivePreview(preview);
        setArchiveTargets(validTargets);
        setArchiveResolutions(defaultResolutions);
        setViewMode("archive");
      } catch (error) {
        showAlert(
          "Archive failed",
          error instanceof Error ? error.message : "Unable to archive goal.",
        );
      }
    },
    [previewArchive],
  );

  const handlePauseGoal = useCallback(
    async (goal: Goal) => {
      const confirmed = await showConfirm(
        "Pause Goal",
        `Pause "${goal.title}"? It will be hidden from active execution until unpaused.`,
      );
      if (!confirmed) {
        return;
      }
      try {
        const updated = await pauseGoal(goal.id);
        setSelectedGoal(updated);
      } catch (error) {
        showAlert(
          "Pause failed",
          error instanceof Error ? error.message : "Unable to pause goal.",
        );
      }
    },
    [pauseGoal],
  );

  const handleUnpauseGoal = useCallback(
    async (goal: Goal) => {
      try {
        const updated = await unpauseGoal(goal.id);
        setSelectedGoal(updated);
      } catch (error) {
        showAlert(
          "Unpause failed",
          error instanceof Error ? error.message : "Unable to unpause goal.",
        );
      }
    },
    [unpauseGoal],
  );

  const handleDeleteGoal = useCallback(
    async (goal: Goal) => {
      const confirmed = await showConfirm(
        "Delete Goal",
        `Are you sure you want to delete "${goal.title}"?`,
      );
      if (confirmed) {
        try {
          await deleteGoal(goal.id);
          setSelectedGoal(null);
          setViewMode("list");
        } catch {
          // Error already handled in hook
        }
      }
    },
    [deleteGoal],
  );

  const handleGoalPress = useCallback((goal: Goal) => {
    setSelectedGoal(goal);
    setViewMode("detail");
  }, []);

  const handleDetailBack = useCallback(() => {
    setViewMode("list");
    setSelectedGoal(null);
  }, []);

  const blurActiveElement = (): void => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      (document.activeElement as HTMLElement | null)?.blur?.();
    }
  };

  const renderGoalItem = ({ item }: { item: Goal }) => (
    <GoalCard goal={item} onPress={handleGoalPress} />
  );

  const renderListView = () => (
    <View style={styles.container}>
      <View style={styles.backButtonRow}>
        <TouchableOpacity
          onPress={() => {
            blurActiveElement();
            navigation.goBack();
          }}
          accessibilityLabel="Back to Dashboard"
          accessibilityRole="button"
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Goals</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setViewMode("create")}
          accessibilityLabel="Create new goal"
          accessibilityRole="button"
        >
          <Text style={styles.addButtonText}>+ New Goal</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterToggle,
            showCompleted && styles.filterToggleActive,
          ]}
          onPress={() => setShowCompleted(!showCompleted)}
          accessibilityLabel={
            showCompleted ? "Hide completed goals" : "Show completed goals"
          }
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.filterToggleText,
              showCompleted && styles.filterToggleTextActive,
            ]}
          >
            {showCompleted ? "✓ Showing Completed" : "Show Completed"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterToggle,
            includePaused && styles.filterToggleActive,
          ]}
          onPress={() => setIncludePaused(!includePaused)}
          accessibilityLabel={
            includePaused ? "Hide paused goals" : "Include paused goals"
          }
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.filterToggleText,
              includePaused && styles.filterToggleTextActive,
            ]}
          >
            {includePaused ? "✓ Paused Included" : "Include Paused"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterToggle,
            includeArchived && styles.filterToggleActive,
          ]}
          onPress={() => setIncludeArchived(!includeArchived)}
          accessibilityLabel={
            includeArchived ? "Hide archived goals" : "Include archived goals"
          }
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.filterToggleText,
              includeArchived && styles.filterToggleTextActive,
            ]}
          >
            {includeArchived ? "✓ Archived Included" : "Include Archived"}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : goals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No goals yet</Text>
          <Text style={styles.emptyStateText}>
            Create your first goal to start tracking your progress
          </Text>
        </View>
      ) : (
        <FlatList
          data={goals}
          renderItem={renderGoalItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={refetch}
        />
      )}
    </View>
  );

  const renderCreateView = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setViewMode("list");
            setNewGoalTitle("");
            setNewGoalDescription("");
          }}
          accessibilityLabel="Cancel and go back to list"
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Goal</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.formContainer}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={newGoalTitle}
          onChangeText={setNewGoalTitle}
          placeholder="What do you want to achieve?"
          placeholderTextColor="#9CA3AF"
          accessibilityLabel="Goal title"
        />

        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={newGoalDescription}
          onChangeText={setNewGoalDescription}
          placeholder="Add more details about this goal..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          accessibilityLabel="Goal description"
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            !newGoalTitle.trim() && styles.submitButtonDisabled,
          ]}
          onPress={handleCreateGoal}
          disabled={!newGoalTitle.trim()}
          accessibilityLabel="Create goal"
          accessibilityRole="button"
        >
          <Text style={styles.submitButtonText}>Create Goal</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const updateArchiveResolution = useCallback(
    (
      taskId: string,
      action: GoalArchiveResolutionAction,
      goalId?: string,
    ): void => {
      setArchiveResolutions((prev) => ({
        ...prev,
        [taskId]: { action, goal_id: goalId },
      }));
    },
    [],
  );

  const archiveTaskLabel = useCallback((taskId: string): string => {
    const res = archiveResolutions[taskId];
    if (!res) return "Pause task";
    if (res.action === "reassign") {
      return res.goal_id ? "Reassign to selected goal" : "Reassign (pick goal)";
    }
    if (res.action === "keep_unaligned") return "Keep active (unaligned)";
    if (res.action === "archive_task") return "Archive task";
    return "Pause task";
  }, [archiveResolutions]);

  const handleCommitArchive = useCallback(async () => {
    if (!archiveGoalTarget || !archivePreview) {
      return;
    }
    const taskResolutions: GoalArchiveTaskResolution[] =
      archivePreview.tasks_requiring_resolution.map((task) => {
        const selected = archiveResolutions[task.task_id] ?? {
          action: "pause_task" as GoalArchiveResolutionAction,
        };
        return {
          task_id: task.task_id,
          action: selected.action,
          goal_id: selected.goal_id,
        };
      });
    const missingReassignTarget = taskResolutions.some(
      (res) => res.action === "reassign" && !res.goal_id,
    );
    if (missingReassignTarget) {
      showAlert("Archive setup incomplete", "Choose a target goal for each reassigned task.");
      return;
    }
    try {
      const archived = await archiveGoal(archiveGoalTarget.id, {
        // Archived goals stop participating in active tracking; history remains visible.
        tracking_mode: "ignored",
        task_resolutions: taskResolutions,
      });
      setSelectedGoal(archived);
      setArchiveGoalTarget(null);
      setArchivePreview(null);
      setArchiveTargets([]);
      setArchiveResolutions({});
      showAlert(
        "Goal archived",
        "Tracking stops for this goal. Historical data remains available.",
      );
      setViewMode("list");
    } catch (error) {
      showAlert(
        "Archive failed",
        error instanceof Error ? error.message : "Unable to archive goal.",
      );
    }
  }, [archiveGoalTarget, archivePreview, archiveResolutions, archiveGoal]);

  const renderArchiveView = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setViewMode("detail");
          }}
          accessibilityLabel="Back to goal detail"
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resolve linked tasks</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView style={styles.formContainer}>
        <Text style={styles.detailText}>
          Archiving stops active tracking for this goal. Historical data remains viewable.
        </Text>
        {archivePreview?.tasks_requiring_resolution.map((task) => {
          const selected = archiveResolutions[task.task_id] ?? {
            action: "pause_task" as GoalArchiveResolutionAction,
          };
          return (
            <View key={task.task_id} style={styles.archiveTaskCard}>
              <Text style={styles.archiveTaskTitle}>{task.title}</Text>
              <Text style={styles.archiveTaskChoice}>
                Selected: {archiveTaskLabel(task.task_id)}
              </Text>
              <View style={styles.statusButtons}>
                <TouchableOpacity
                  style={styles.statusButton}
                  onPress={() => updateArchiveResolution(task.task_id, "pause_task")}
                >
                  <Text style={styles.statusButtonText}>Pause</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.statusButton}
                  onPress={() =>
                    updateArchiveResolution(task.task_id, "keep_unaligned")
                  }
                >
                  <Text style={styles.statusButtonText}>Keep unaligned</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.statusButton}
                  onPress={() => updateArchiveResolution(task.task_id, "archive_task")}
                >
                  <Text style={styles.statusButtonText}>Archive task</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.statusButton}
                  onPress={() => updateArchiveResolution(task.task_id, "reassign")}
                >
                  <Text style={styles.statusButtonText}>Reassign</Text>
                </TouchableOpacity>
              </View>
              {selected.action === "reassign" && (
                <View style={styles.archiveTargetList}>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      !selected.goal_id && styles.statusButtonActive,
                    ]}
                    onPress={() =>
                      updateArchiveResolution(task.task_id, "reassign", undefined)
                    }
                  >
                    <Text style={styles.statusButtonText}>Keep unaligned</Text>
                  </TouchableOpacity>
                  {archiveTargets.map((targetGoal) => (
                    <TouchableOpacity
                      key={targetGoal.id}
                      style={[
                        styles.statusButton,
                        selected.goal_id === targetGoal.id && styles.statusButtonActive,
                      ]}
                      onPress={() =>
                        updateArchiveResolution(
                          task.task_id,
                          "reassign",
                          targetGoal.id,
                        )
                      }
                    >
                      <Text style={styles.statusButtonText}>
                        {targetGoal.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={() => {
            void handleCommitArchive();
          }}
          accessibilityLabel="Confirm archive goal"
          accessibilityRole="button"
        >
          <Text style={styles.submitButtonText}>Archive Goal</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  switch (viewMode) {
    case "create":
      return renderCreateView();
    case "detail":
      if (!selectedGoal) {
        return <View style={styles.container} />;
      }
      return (
        <GoalDetailView
          goal={selectedGoal}
          onBack={handleDetailBack}
          onDelete={handleDeleteGoal}
          onStatusChange={handleStatusChange}
          onArchive={handleArchiveGoal}
          onPause={handlePauseGoal}
          onUnpause={handleUnpauseGoal}
        />
      );
    case "archive":
      return renderArchiveView();
    default:
      return renderListView();
  }
}
