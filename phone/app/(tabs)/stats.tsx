import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { StreakBadge } from "../../src/components/StreakBadge";
import { ProgressChart } from "../../src/components/ProgressChart";
import { useStreak } from "../../src/hooks/useStreak";
import {
  getWeeklyVolume,
  getPersonalRecords,
  type PersonalRecord,
} from "../../src/db/queries/progress";

export default function StatsScreen() {
  const db = useSQLiteContext();
  const streak = useStreak();
  const tabBarHeight = useBottomTabBarHeight();
  const [volumeData, setVolumeData] = useState<
    { date: string; value: number }[]
  >([]);
  const [prs, setPRs] = useState<PersonalRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [volume, records] = await Promise.all([
        getWeeklyVolume(db, 8),
        getPersonalRecords(db),
      ]);
      setVolumeData(
        volume.map((v) => ({ date: v.date, value: v.total_volume }))
      );
      setPRs(records);
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
  }, [db]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    streak.refresh();
    setRefreshing(false);
  }, [loadData, streak]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 20 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6C5CE7"
          />
        }
      >
        {/* Large Title */}
        <Animated.View entering={FadeInDown.duration(400).delay(0)}>
          <Text style={styles.largeTitle}>Stats</Text>
        </Animated.View>

        {/* Streak Hero Section */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(60)}
          style={styles.streakCard}
        >
          <StreakBadge
            streak={streak.currentStreak}
            workoutsThisWeek={streak.workoutsThisWeek}
            size="large"
          />
          {streak.longestStreak > 0 && (
            <Text style={styles.longestStreakText}>
              Longest streak: {streak.longestStreak} week
              {streak.longestStreak !== 1 ? "s" : ""}
            </Text>
          )}
        </Animated.View>

        {/* Volume Chart */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(120)}
          style={styles.chartSection}
        >
          <ProgressChart
            data={volumeData}
            title="Volume Over Time"
            suffix=" lbs"
            color="#6C5CE7"
          />
        </Animated.View>

        {/* Personal Records */}
        <Animated.View entering={FadeInDown.duration(400).delay(180)}>
          <Text style={styles.sectionTitle}>Personal Records</Text>
        </Animated.View>

        {prs.length === 0 ? (
          <Animated.View
            entering={FadeInDown.duration(400).delay(240)}
            style={styles.emptyPrCard}
          >
            <View style={styles.trophyCircle}>
              <Ionicons name="trophy-outline" size={32} color="#7B7B94" />
            </View>
            <Text style={styles.emptyPrText}>
              Complete workouts to set personal records
            </Text>
          </Animated.View>
        ) : (
          prs.slice(0, 10).map((pr, index) => (
            <Animated.View
              key={pr.exercise_id}
              entering={FadeInDown.duration(300).delay(240 + index * 60)}
            >
              <View style={styles.prCard}>
                <View style={styles.prTrophyCircle}>
                  <Ionicons name="trophy" size={16} color="#34D399" />
                </View>
                <View style={styles.prInfo}>
                  <Text style={styles.prExerciseName}>
                    {pr.exercise_name}
                  </Text>
                  <Text style={styles.prDate}>{pr.date}</Text>
                </View>
                <Text style={styles.prWeight}>
                  {pr.max_weight} x {pr.reps_at_max}
                </Text>
              </View>
            </Animated.View>
          ))
        )}

        {/* Summary Table */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(360)}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Workouts</Text>
            <Text style={styles.summaryValue}>{streak.totalWorkouts}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Current Streak</Text>
            <Text style={styles.summaryValue}>
              {streak.currentStreak} weeks
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRowLast}>
            <Text style={styles.summaryLabel}>Longest Streak</Text>
            <Text style={styles.summaryValue}>
              {streak.longestStreak} weeks
            </Text>
          </View>
        </Animated.View>
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
  scrollContent: {
    paddingHorizontal: 20,
  },
  largeTitle: {
    color: "#F5F5FA",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0.37,
    marginTop: 16,
    marginBottom: 32,
  },
  streakCard: {
    backgroundColor: "#1A1A24",
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 32,
  },
  longestStreakText: {
    color: "#7B7B94",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 16,
  },
  chartSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: "#F5F5FA",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  emptyPrCard: {
    backgroundColor: "#1A1A24",
    borderRadius: 20,
    paddingVertical: 32,
    alignItems: "center",
    marginBottom: 32,
  },
  trophyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#242430",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyPrText: {
    color: "#7B7B94",
    fontSize: 15,
    fontWeight: "500",
  },
  prCard: {
    backgroundColor: "#1A1A24",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  prTrophyCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  prInfo: {
    flex: 1,
  },
  prExerciseName: {
    color: "#F5F5FA",
    fontSize: 16,
    fontWeight: "600",
  },
  prDate: {
    color: "#7B7B94",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  prWeight: {
    color: "#34D399",
    fontSize: 18,
    fontWeight: "700",
  },
  summaryCard: {
    backgroundColor: "#1A1A24",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginTop: 32,
  },
  summaryTitle: {
    color: "#F5F5FA",
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  summaryRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#242430",
  },
  summaryLabel: {
    color: "#7B7B94",
    fontSize: 15,
    fontWeight: "500",
  },
  summaryValue: {
    color: "#F5F5FA",
    fontSize: 15,
    fontWeight: "600",
  },
});
