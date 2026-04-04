import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Goal, User, RootStackParamList, GoalStatus } from "../types";
import { useGoals } from "../hooks/useGoals";
import { styles } from "./styles/goalsScreenStyles";
import { GoalCard, GoalDetailView } from "../components/goals";

interface GoalsScreenProps {
  user: User;
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

type ViewMode = "list" | "create" | "detail";

export default function GoalsScreen({
  user,
  navigation,
}: GoalsScreenProps): React.ReactElement {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDescription, setNewGoalDescription] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);

  const {
    goals,
    loading,
    error,
    refetch,
    createGoal,
    updateGoalStatus,
    deleteGoal,
  } = useGoals({
    includeCompleted: showCompleted,
    parentOnly: true,
  });

  const handleCreateGoal = useCallback(async () => {
    if (!newGoalTitle.trim()) {
      Alert.alert("Error", "Please enter a goal title");
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
        if (newStatus === "completed" && !showCompleted) {
          // Goal will disappear from list since we're not showing completed
        }
      } catch {
        // Error already handled in hook
      }
    },
    [updateGoalStatus, showCompleted],
  );

  const handleDeleteGoal = useCallback(
    async (goal: Goal) => {
      Alert.alert(
        "Delete Goal",
        `Are you sure you want to delete "${goal.title}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteGoal(goal.id);
                setSelectedGoal(null);
                setViewMode("list");
              } catch {
                // Error already handled in hook
              }
            },
          },
        ],
      );
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            blurActiveElement();
            navigation.goBack();
          }}
          accessibilityLabel="Back to Dashboard"
          accessibilityRole="button"
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Dashboard</Text>
        </TouchableOpacity>
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
        />
      );
    default:
      return renderListView();
  }
}
