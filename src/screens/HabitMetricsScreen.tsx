import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type {
  RootStackParamList,
  TaskStatsResponse,
  CompletionHistoryResponse,
} from "../types";
import api from "../services/api";
import { styles } from "./styles/habitMetricsStyles";
import {
  getCompletionColor,
  getDayIcon,
  getDayCellStyle,
  groupDaysByWeek,
  calculateWeeklyData,
  calculateTenDayChunkData,
  calculateMonthlyData,
} from "../utils/habitMetricsHelpers";

type HabitMetricsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "HabitMetrics">;
  route: RouteProp<RootStackParamList, "HabitMetrics">;
};

type TimeSpan = "week" | "month" | "quarter" | "year";

const TIME_SPAN_DAYS: Record<TimeSpan, number> = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
};

const TIME_SPAN_LABELS: Record<TimeSpan, string> = {
  week: "7 Days",
  month: "30 Days",
  quarter: "90 Days",
  year: "365 Days",
};

/**
 * HabitMetricsScreen - Shows detailed metrics for a single habit (recurring task).
 * Includes calendar view for short spans, bar chart for longer spans.
 */
export default function HabitMetricsScreen({
  navigation,
  route,
}: HabitMetricsScreenProps): React.ReactElement {
  const { taskId, taskTitle } = route.params;
  const [timeSpan, setTimeSpan] = useState<TimeSpan>("month");
  const [stats, setStats] = useState<TaskStatsResponse | null>(null);
  const [history, setHistory] = useState<CompletionHistoryResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range for the selected time span
      // To avoid timezone-induced off-by-one errors, we:
      // 1. Get today's date (date only, ignoring time)
      // 2. Calculate start date as (today - N + 1) days
      // 3. Send as midnight UTC for start, end of day UTC for end
      const today = new Date();
      const todayDate = new Date(
        Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
      );

      const daysBack = TIME_SPAN_DAYS[timeSpan] - 1;
      const startDate = new Date(todayDate);
      startDate.setUTCDate(startDate.getUTCDate() - daysBack);

      // End of today in UTC
      const endDate = new Date(todayDate);
      endDate.setUTCHours(23, 59, 59, 999);

      const startStr = startDate.toISOString();
      const endStr = endDate.toISOString();

      const [statsResponse, historyResponse] = await Promise.all([
        api.getTaskStats(taskId, startStr, endStr),
        api.getCompletionHistory(taskId, startStr, endStr),
      ]);

      setStats(statsResponse);
      setHistory(historyResponse);
    } catch {
      setError("Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }, [taskId, timeSpan]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Determine if we should show calendar view or bar chart
  const showCalendarView = useMemo(() => {
    return timeSpan === "week" || timeSpan === "month";
  }, [timeSpan]);

  const renderTimeSpanPicker = () => (
    <View style={styles.timeSpanPicker}>
      {(Object.keys(TIME_SPAN_LABELS) as TimeSpan[]).map((span) => (
        <TouchableOpacity
          key={span}
          style={[
            styles.timeSpanButton,
            timeSpan === span && styles.timeSpanButtonActive,
          ]}
          onPress={() => setTimeSpan(span)}
        >
          <Text
            style={[
              styles.timeSpanText,
              timeSpan === span && styles.timeSpanTextActive,
            ]}
          >
            {TIME_SPAN_LABELS[span]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStatsCards = () => {
    if (!stats) return null;
    return (
      <View style={styles.statsGrid}>
        <View style={styles.statsCard}>
          <Text style={styles.statsValue}>🔥 {stats.current_streak}</Text>
          <Text style={styles.statsLabel}>Current Streak</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statsValue}>🏆 {stats.longest_streak}</Text>
          <Text style={styles.statsLabel}>Best Streak</Text>
        </View>
        <View style={styles.statsCard}>
          <Text
            style={[
              styles.statsValue,
              { color: getCompletionColor(stats.completion_rate) },
            ]}
          >
            {Math.round(stats.completion_rate * 100)}%
          </Text>
          <Text style={styles.statsLabel}>Completion Rate</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statsValue}>
            {stats.total_completed}/{stats.total_expected}
          </Text>
          <Text style={styles.statsLabel}>Days Completed</Text>
        </View>
      </View>
    );
  };

  const renderLastCompleted = () => {
    if (!stats?.last_completed_at) return null;
    const lastDate = new Date(stats.last_completed_at);
    const today = new Date();
    const diffDays = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    let relativeText = "Today";
    if (diffDays === 1) relativeText = "Yesterday";
    else if (diffDays > 1) relativeText = `${diffDays} days ago`;

    return (
      <View style={styles.lastCompleted}>
        <Text style={styles.lastCompletedLabel}>Last completed</Text>
        <Text style={styles.lastCompletedValue}>{relativeText}</Text>
      </View>
    );
  };

  const renderCalendarView = () => {
    if (!history?.days) return null;

    // Group days by week
    const weeks = groupDaysByWeek(history.days);

    return (
      <View style={styles.calendarContainer}>
        <Text style={styles.sectionTitle}>Calendar View</Text>
        <View style={styles.weekdayHeaders}>
          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
            <Text key={i} style={styles.weekdayHeader}>
              {day}
            </Text>
          ))}
        </View>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((day, dayIndex) => (
              <View
                key={dayIndex}
                style={[styles.dayCell, day && getDayCellStyle(day.status)]}
              >
                {day ? (
                  <>
                    <Text style={styles.dayNumber}>
                      {new Date(day.date).getDate()}
                    </Text>
                    <Text style={styles.dayIcon}>{getDayIcon(day.status)}</Text>
                  </>
                ) : null}
              </View>
            ))}
          </View>
        ))}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#4CAF50" }]} />
            <Text style={styles.legendText}>Completed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FF9800" }]} />
            <Text style={styles.legendText}>Skipped</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#F44336" }]} />
            <Text style={styles.legendText}>Missed</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderBarChart = () => {
    if (!history?.days) return null;

    // Choose aggregation based on time span:
    // - 90 days (quarter): 9 bars of 10-day chunks
    // - 365 days (year): 12 monthly bars
    let chartData;
    let chartTitle: string;

    if (timeSpan === "year") {
      chartData = calculateMonthlyData(history.days);
      chartTitle = "Monthly Progress";
    } else {
      // Quarter (90 days) - use 10-day chunks
      chartData = calculateTenDayChunkData(history.days);
      chartTitle = "10-Day Progress";
    }

    const maxValue = Math.max(...chartData.map((d) => d.rate), 1);
    const chartWidth = Dimensions.get("window").width - 64;
    const barWidth = Math.max(
      16,
      Math.min(30, chartWidth / chartData.length - 8),
    );

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>{chartTitle}</Text>
        <View style={styles.barChart}>
          <View style={styles.yAxis}>
            <Text style={styles.yAxisLabel}>100%</Text>
            <Text style={styles.yAxisLabel}>50%</Text>
            <Text style={styles.yAxisLabel}>0%</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.barsContainer}
          >
            {chartData.map((item, index) => (
              <View key={index} style={styles.barColumn}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${(item.rate / maxValue) * 100}%`,
                        width: barWidth,
                        backgroundColor: getCompletionColor(item.rate),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading metrics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMetrics}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Back to Habit Tracker"
            accessibilityRole="button"
          >
            <Text style={styles.backButtonText}>← Habits</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.habitTitle}>{taskTitle}</Text>
        {renderLastCompleted()}
      </View>

      {renderTimeSpanPicker()}
      {renderStatsCards()}

      {showCalendarView ? renderCalendarView() : renderBarChart()}
    </ScrollView>
  );
}
