import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSQLiteContext } from "expo-sqlite";
import { format } from "date-fns";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { CalendarGrid } from "../../src/components/CalendarGrid";
import {
  getSessionDates,
  getSessionsByDateRange,
} from "../../src/db/queries/workouts";
import { getSessionDetail } from "../../src/db/queries/history";
import type { SessionWithTemplate } from "../../src/db/queries/workouts";
import type { SessionExerciseLog } from "../../src/db/queries/history";

export default function CalendarScreen() {
  const db = useSQLiteContext();
  const tabBarHeight = useBottomTabBarHeight();
  const [workoutDots, setWorkoutDots] = useState<
    { date: string; color: string }[]
  >([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<
    SessionWithTemplate[]
  >([]);
  const [sessionExercises, setSessionExercises] = useState<
    Record<string, { exercises: SessionExerciseLog[]; weight_unit: string }>
  >({});

  const loadDots = useCallback(async () => {
    try {
      const dates = await getSessionDates(db);
      setWorkoutDots(dates.map((d) => ({ date: d.date, color: "#34D399" })));
    } catch (e) {
      console.error("Failed to load calendar dots:", e);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadDots();
    }, [loadDots])
  );

  const handleDayPress = useCallback(
    async (dateString: string) => {
      setSelectedDate(dateString);
      try {
        const sessions = await getSessionsByDateRange(
          db,
          dateString,
          dateString
        );
        setSelectedSessions(sessions);

        // Load exercise details for each session
        const details: Record<
          string,
          { exercises: SessionExerciseLog[]; weight_unit: string }
        > = {};
        for (const s of sessions) {
          const detail = await getSessionDetail(db, s.id);
          if (detail) {
            details[s.id] = {
              exercises: detail.exercises,
              weight_unit: detail.weight_unit,
            };
          }
        }
        setSessionExercises(details);
      } catch (e) {
        console.error("Failed to load sessions for date:", e);
      }
    },
    [db]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + 20 },
        ]}
      >
        <Animated.View entering={FadeInDown.duration(400).delay(0)}>
          <Text style={styles.largeTitle}>Calendar</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(60)}>
          <CalendarGrid
            workoutDots={workoutDots}
            onDayPress={handleDayPress}
          />
        </Animated.View>

        {selectedDate && (
          <Animated.View
            entering={FadeInDown.duration(350).delay(0)}
            style={styles.selectedSection}
          >
            <Text style={styles.selectedDateTitle}>
              {format(
                new Date(selectedDate + "T12:00:00"),
                "EEEE, MMMM d, yyyy"
              )}
            </Text>

            {selectedSessions.length === 0 ? (
              <View style={styles.emptyDay}>
                <Ionicons
                  name="calendar-outline"
                  size={32}
                  color="#7B7B94"
                />
                <Text style={styles.emptyDayText}>
                  No workouts on this day
                </Text>
              </View>
            ) : (
              selectedSessions.map((session, index) => {
                const detail = sessionExercises[session.id];
                return (
                  <Animated.View
                    key={session.id}
                    entering={FadeInDown.duration(300).delay(index * 60)}
                  >
                    <View
                      style={[
                        styles.sessionCard,
                        { borderLeftColor: session.template_color },
                      ]}
                    >
                      <View style={styles.sessionCardHeader}>
                        <View
                          style={[
                            styles.colorDot,
                            { backgroundColor: session.template_color },
                          ]}
                        />
                        <Text style={styles.sessionName}>
                          {session.template_name}
                        </Text>
                      </View>
                      {session.started_at && session.completed_at && (
                        <View style={styles.sessionTimeRow}>
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color="#7B7B94"
                          />
                          <Text style={styles.sessionTime}>
                            {format(new Date(session.started_at), "h:mm a")} -{" "}
                            {format(new Date(session.completed_at), "h:mm a")}
                          </Text>
                          <Text style={styles.sessionDuration}>
                            {Math.round(
                              (new Date(session.completed_at).getTime() -
                                new Date(session.started_at).getTime()) /
                                60000
                            )}{" "}
                            min
                          </Text>
                        </View>
                      )}

                      {/* Exercise details */}
                      {detail && detail.exercises.length > 0 && (
                        <View style={styles.exerciseList}>
                          {detail.exercises.map((ex, ei) => (
                            <View key={ei} style={styles.exerciseRow}>
                              <Text
                                style={styles.exerciseRowName}
                                numberOfLines={1}
                              >
                                {ex.exercise_name}
                              </Text>
                              <Text style={styles.exerciseRowDetail}>
                                {ex.sets}x{ex.reps}
                                {ex.weight > 0
                                  ? ` · ${ex.weight}${detail.weight_unit}`
                                  : ""}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </Animated.View>
                );
              })
            )}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D12",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {},
  largeTitle: {
    color: "#F5F5FA",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0.37,
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  selectedSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  selectedDateTitle: {
    color: "#F5F5FA",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  emptyDay: {
    backgroundColor: "#1A1A24",
    borderRadius: 16,
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyDayText: {
    color: "#7B7B94",
    fontSize: 15,
    fontWeight: "500",
    marginTop: 10,
  },
  sessionCard: {
    backgroundColor: "#1A1A24",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  sessionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  sessionName: {
    color: "#F5F5FA",
    fontSize: 17,
    fontWeight: "600",
  },
  sessionTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sessionTime: {
    color: "#7B7B94",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  sessionDuration: {
    color: "#7B7B94",
    fontSize: 13,
    fontWeight: "600",
  },
  exerciseList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#242430",
    gap: 6,
  },
  exerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseRowName: {
    color: "#B0B0C8",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  exerciseRowDetail: {
    color: "#7B7B94",
    fontSize: 13,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
