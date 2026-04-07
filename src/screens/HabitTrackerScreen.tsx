import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type {
  Task,
  User,
  RootStackParamList,
  TaskStatsResponse,
} from "../types";
import api from "../services/api";
import { styles } from "./styles/habitTrackerStyles";
import { getRecurrenceShortLabel } from "../utils/recurrenceDescription";
import { useTime } from "../context/TimeContext";

interface HabitTrackerScreenProps {
  user: User;
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

interface HabitWithStats extends Task {
  stats?: TaskStatsResponse | null;
  statsLoading?: boolean;
}

/**
 * HabitTrackerScreen - Shows all recurring tasks as "habits" with streak info.
 * Tapping a habit navigates to the metrics screen.
 */
export default function HabitTrackerScreen({
  navigation,
}: HabitTrackerScreenProps): React.ReactElement {
  const { getCurrentDate } = useTime();
  const [habits, setHabits] = useState<HabitWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async () => {
    try {
      setError(null);
      const response = await api.getTasks({ status: "pending" });
      // Filter for recurring tasks only
      const recurringTasks = response.tasks.filter((t) => t.is_recurring);
      // Initialize with statsLoading
      const habitsWithPendingStats = recurringTasks.map((t) => ({
        ...t,
        stats: null,
        statsLoading: true,
      }));
      setHabits(habitsWithPendingStats);
      return recurringTasks;
    } catch {
      setError("Failed to load habits");
      return [];
    }
  }, []);

  const fetchStatsForHabits = useCallback(async (habitsToFetch: Task[]) => {
    // Calculate date range: last 30 days
    // Use UTC dates to avoid timezone off-by-one errors
    const today = getCurrentDate();
    const todayDate = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
    );

    const startDate = new Date(todayDate);
    startDate.setUTCDate(startDate.getUTCDate() - 29); // 29 days back + today = 30 days

    const endDate = new Date(todayDate);
    endDate.setUTCHours(23, 59, 59, 999);

    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();

    // Fetch stats for each habit
    await Promise.all(
      habitsToFetch.map(async (habit) => {
        try {
          const stats = await api.getTaskStats(habit.id, startStr, endStr);
          setHabits((prev) =>
            prev.map((h) =>
              h.id === habit.id ? { ...h, stats, statsLoading: false } : h,
            ),
          );
        } catch {
          // Stats failed, mark as not loading
          setHabits((prev) =>
            prev.map((h) =>
              h.id === habit.id
                ? { ...h, stats: null, statsLoading: false }
                : h,
            ),
          );
        }
      }),
    );
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const fetchedHabits = await fetchHabits();
    setLoading(false);
    if (fetchedHabits.length > 0) {
      await fetchStatsForHabits(fetchedHabits);
    }
  }, [fetchHabits, fetchStatsForHabits]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const fetchedHabits = await fetchHabits();
    if (fetchedHabits.length > 0) {
      await fetchStatsForHabits(fetchedHabits);
    }
    setRefreshing(false);
  }, [fetchHabits, fetchStatsForHabits]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleHabitPress = useCallback(
    (habit: HabitWithStats) => {
      // Blur any focused element on web to prevent aria-hidden accessibility warning
      if (
        Platform.OS === "web" &&
        document.activeElement instanceof HTMLElement
      ) {
        document.activeElement.blur();
      }
      navigation.navigate("HabitMetrics", {
        taskId: habit.id,
        taskTitle: habit.title,
      });
    },
    [navigation],
  );

  const renderStreakBadge = (streak: number) => {
    if (streak === 0) return null;
    return (
      <View style={styles.streakBadge}>
        <Text style={styles.streakText}>🔥 {streak}</Text>
      </View>
    );
  };

  const renderCompletionRate = (rate: number) => {
    const percentage = Math.round(rate * 100);
    let color = "#4CAF50"; // green
    if (percentage < 50)
      color = "#F44336"; // red
    else if (percentage < 75) color = "#FF9800"; // orange
    return (
      <View style={styles.completionRateContainer}>
        <Text style={[styles.completionRate, { color }]}>{percentage}%</Text>
        <Text style={styles.completionPeriod}>(30d)</Text>
      </View>
    );
  };

  const renderHabitItem = useCallback(
    ({ item: habit }: { item: HabitWithStats }) => (
      <TouchableOpacity
        style={styles.habitCard}
        onPress={() => handleHabitPress(habit)}
        accessibilityLabel={`View tracking for ${habit.title}`}
        accessibilityRole="button"
      >
        <View style={styles.habitContent}>
          <View style={styles.habitInfo}>
            <Text style={styles.habitTitle}>{habit.title}</Text>
            <View style={styles.habitMeta}>
              {habit.recurrence_rule && (
                <Text style={styles.recurrenceLabel}>
                  {getRecurrenceShortLabel(habit.recurrence_rule)}
                </Text>
              )}
              {habit.goal && (
                <Text style={styles.habitGoal}>• {habit.goal.title}</Text>
              )}
            </View>
          </View>
          <View style={styles.habitStats}>
            {habit.statsLoading ? (
              <ActivityIndicator size="small" color="#666" />
            ) : habit.stats ? (
              <>
                {renderStreakBadge(habit.stats.current_streak)}
                {renderCompletionRate(habit.stats.completion_rate)}
              </>
            ) : (
              <Text style={styles.noStats}>--</Text>
            )}
          </View>
        </View>
        <Text style={styles.arrowIcon}>→</Text>
      </TouchableOpacity>
    ),
    [handleHabitPress],
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading habits...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (habits.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>No Habits Yet</Text>
        <Text style={styles.emptySubtitle}>
          Create recurring tasks to track them as habits
        </Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate("Tasks")}
        >
          <Text style={styles.createButtonText}>Go to Tasks</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.backButtonRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back to Dashboard"
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Habit Tracker</Text>
        <Text style={styles.headerSubtitle}>
          {habits.length} habit{habits.length !== 1 ? "s" : ""} tracked
        </Text>
      </View>

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={renderHabitItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </View>
  );
}
