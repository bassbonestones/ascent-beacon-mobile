import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  OccurrenceState,
  DAY_LABELS,
  getWeekLabel,
  getMonthLabel,
} from "./rhythmSimulatorConstants";
import { StateToggleBox } from "./StateToggleBox";
import { styles } from "./rhythmSimulatorStyles";

interface DayData {
  date: string;
  dayOfWeek: number;
}

interface WeekData {
  weekStart: string;
  days: DayData[];
}

interface MonthData {
  yearMonth: string;
  weeks: WeekData[];
}

interface HierarchyViewProps {
  months: MonthData[];
  expandedMonths: Set<string>;
  expandedWeeks: Set<string>;
  occurrencesPerDay: number;
  getMonthState: (weeks: WeekData[]) => OccurrenceState;
  getWeekState: (days: DayData[]) => OccurrenceState;
  getDayState: (date: string) => OccurrenceState;
  getOccState: (date: string, occIdx: number) => OccurrenceState;
  toggleMonth: (weeks: WeekData[]) => void;
  toggleWeek: (days: DayData[]) => void;
  toggleDay: (date: string) => void;
  toggleOccurrence: (date: string, occIdx: number) => void;
  toggleMonthExpanded: (yearMonth: string) => void;
  toggleWeekExpanded: (weekStart: string) => void;
}

export function HierarchyView({
  months,
  expandedMonths,
  expandedWeeks,
  occurrencesPerDay,
  getMonthState,
  getWeekState,
  getDayState,
  getOccState,
  toggleMonth,
  toggleWeek,
  toggleDay,
  toggleOccurrence,
  toggleMonthExpanded,
  toggleWeekExpanded,
}: HierarchyViewProps): React.ReactElement {
  return (
    <View style={styles.hierarchySection}>
      {months.map((month) => (
        <View key={month.yearMonth} style={styles.monthBlock}>
          {/* Month Header */}
          <TouchableOpacity
            style={styles.monthHeader}
            onPress={() => toggleMonthExpanded(month.yearMonth)}
          >
            <StateToggleBox
              state={getMonthState(month.weeks)}
              onToggle={() => toggleMonth(month.weeks)}
              size="large"
            />
            <Ionicons
              name={
                expandedMonths.has(month.yearMonth)
                  ? "chevron-down"
                  : "chevron-forward"
              }
              size={20}
              color="#6366f1"
              style={styles.expandIcon}
            />
            <Text style={styles.monthLabel}>
              {getMonthLabel(month.yearMonth)}
            </Text>
          </TouchableOpacity>

          {expandedMonths.has(month.yearMonth) && (
            <View style={styles.weeksContainer}>
              {month.weeks.map((week) => (
                <View key={week.weekStart} style={styles.weekBlock}>
                  {/* Week Header */}
                  <TouchableOpacity
                    style={styles.weekHeader}
                    onPress={() => toggleWeekExpanded(week.weekStart)}
                  >
                    <StateToggleBox
                      state={getWeekState(week.days)}
                      onToggle={() => toggleWeek(week.days)}
                      size="medium"
                    />
                    <Ionicons
                      name={
                        expandedWeeks.has(week.weekStart)
                          ? "chevron-down"
                          : "chevron-forward"
                      }
                      size={16}
                      color="#9CA3AF"
                      style={styles.expandIcon}
                    />
                    <Text style={styles.weekLabel}>
                      {getWeekLabel(week.weekStart, week.days)}
                    </Text>
                  </TouchableOpacity>

                  {expandedWeeks.has(week.weekStart) && (
                    <View style={styles.daysContainer}>
                      {week.days.map((day) => (
                        <View key={day.date} style={styles.dayRow}>
                          {/* Day toggle */}
                          <StateToggleBox
                            state={getDayState(day.date)}
                            onToggle={() => toggleDay(day.date)}
                            size="medium"
                          />
                          <Text style={styles.dayLabel}>
                            {DAY_LABELS[day.dayOfWeek]} {day.date.split("-")[2]}
                          </Text>
                          {/* Individual occurrence checkboxes */}
                          <View style={styles.occurrencesRow}>
                            {Array.from(
                              { length: occurrencesPerDay },
                              (_, i) => (
                                <StateToggleBox
                                  key={i}
                                  state={getOccState(day.date, i)}
                                  onToggle={() => toggleOccurrence(day.date, i)}
                                  size="small"
                                  testID={`occ-${day.date}-${i}`}
                                />
                              ),
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

// Re-export types for use in main component
export type { DayData, WeekData, MonthData };
