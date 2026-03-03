import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { StreakBadge } from "../../src/components/StreakBadge";
import { AnimatedPressable } from "../../src/components/AnimatedPressable";
import { useStreak } from "../../src/hooks/useStreak";
import { getRecentSessions } from "../../src/db/queries/workouts";
import {
  getAllTemplates,
  type WorkoutTemplateRow,
} from "../../src/db/queries/templates";
import {
  getProgramName,
  hasProgram,
} from "../../src/db/queries/import";
import { useAuthStore } from "../../src/stores/authStore";
import { pullFromServer } from "../../src/lib/sync";

export default function HomeScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const streak = useStreak();
  const tabBarHeight = useBottomTabBarHeight();

  const [programName, setProgramName] = useState("GymTracker");
  const [templates, setTemplates] = useState<WorkoutTemplateRow[]>([]);
  const [hasProgramData, setHasProgramData] = useState(true);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [has, name, tmpls, recent] = await Promise.all([
        hasProgram(db),
        getProgramName(db),
        getAllTemplates(db),
        getRecentSessions(db, 3),
      ]);
      setHasProgramData(has);
      setProgramName(name);
      setTemplates(tmpls);
      setRecentSessions(recent);
    } catch (e) {
      console.error("Failed to load home data:", e);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (isAuthenticated) {
      try {
        const hadChanges = await pullFromServer(db);
        if (hadChanges) await loadData();
      } catch {}
    }
    await loadData();
    streak.refresh();
    setRefreshing(false);
  }, [loadData, streak, isAuthenticated, db]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + 20 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6C5CE7"
          />
        }
      >
        {/* Header with title + settings */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(0)}
          style={styles.headerRow}
        >
          <Text style={styles.largeTitle}>{programName}</Text>
          <AnimatedPressable
            onPress={() => router.push("/settings")}
            style={styles.settingsBtn}
          >
            <Ionicons name="settings-outline" size={22} color="#7B7B94" />
          </AnimatedPressable>
        </Animated.View>

        {/* No program loaded */}
        {!hasProgramData && (
          <Animated.View entering={FadeInDown.duration(400).delay(60)}>
            <View style={styles.emptyCard}>
              <Ionicons name="document-text-outline" size={48} color="#4A4A5E" />
              <Text style={styles.emptyTitle}>No program loaded</Text>
              <Text style={styles.emptySubtitle}>
                Paste your workout JSON to get started
              </Text>
              <AnimatedPressable
                onPress={() => router.push("/settings")}
                style={styles.importBtn}
              >
                <Ionicons name="add-circle" size={20} color="#0D0D12" />
                <Text style={styles.importBtnText}>Import Program</Text>
              </AnimatedPressable>
            </View>
          </Animated.View>
        )}

        {/* Streak + Stats */}
        {hasProgramData && (
          <>
            <Animated.View
              entering={FadeInDown.duration(400).delay(60)}
              style={styles.streakRow}
            >
              <StreakBadge
                streak={streak.currentStreak}
                workoutsThisWeek={streak.workoutsThisWeek}
                size="small"
              />
            </Animated.View>

            {/* Section Title */}
            <Animated.View entering={FadeInDown.duration(400).delay(120)}>
              <Text style={styles.sectionTitle}>Choose Your Workout</Text>
            </Animated.View>

            {/* Workout Cards Grid */}
            <View style={styles.workoutGrid}>
              {templates.map((template, index) => (
                <Animated.View
                  key={template.id}
                  entering={FadeInDown.duration(350).delay(160 + index * 80)}
                  style={styles.gridItem}
                >
                  <AnimatedPressable
                    onPress={() => router.push(`/template/${template.id}`)}
                    style={styles.workoutTypeCard}
                  >
                    <LinearGradient
                      colors={[`${template.color}20`, "transparent"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.cardTop}>
                      <View
                        style={[
                          styles.cardDot,
                          { backgroundColor: template.color },
                        ]}
                      />
                    </View>
                    <Text style={styles.cardName}>{template.name}</Text>
                    {template.description ? (
                      <Text style={styles.cardDescription} numberOfLines={2}>
                        {template.description}
                      </Text>
                    ) : (
                      <Text style={styles.cardDayLabel}>
                        {template.day_label}
                      </Text>
                    )}
                    <View style={styles.cardBottom}>
                      <Text style={styles.cardExerciseCount}>
                        {template.exercise_count} exercises
                      </Text>
                      <View
                        style={[
                          styles.cardArrow,
                          { backgroundColor: `${template.color}25` },
                        ]}
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={template.color}
                        />
                      </View>
                    </View>
                  </AnimatedPressable>
                </Animated.View>
              ))}
            </View>

            {/* Recent Sessions */}
            {recentSessions.length > 0 && (
              <Animated.View
                entering={FadeInDown.duration(400).delay(
                  160 + templates.length * 80 + 60
                )}
              >
                <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
                  Recent
                </Text>
                {recentSessions.map((session, index) => (
                  <AnimatedPressable
                    key={session.id}
                    onPress={() => router.push(`/session/${session.id}`)}
                    style={[
                      styles.recentCard,
                      { borderLeftColor: session.template_color },
                    ]}
                  >
                    <View style={styles.recentCardInner}>
                      <View style={styles.recentCardLeft}>
                        <Text style={styles.recentCardName}>
                          {session.template_name}
                        </Text>
                        {session.started_at && session.completed_at && (
                          <Text style={styles.recentCardDuration}>
                            {Math.round(
                              (new Date(session.completed_at).getTime() -
                                new Date(session.started_at).getTime()) /
                                60000
                            )}{" "}
                            min
                          </Text>
                        )}
                      </View>
                      <View style={styles.recentCardRight}>
                        <Text style={styles.recentCardDate}>
                          {format(new Date(session.date), "MMM d")}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="#7B7B94"
                        />
                      </View>
                    </View>
                  </AnimatedPressable>
                ))}
              </Animated.View>
            )}
          </>
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
  scrollContent: {
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 24,
  },
  largeTitle: {
    color: "#F5F5FA",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0.37,
    flex: 1,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A24",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    backgroundColor: "#1A1A24",
    borderRadius: 20,
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    color: "#F5F5FA",
    fontSize: 20,
    fontWeight: "700",
  },
  emptySubtitle: {
    color: "#7B7B94",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
  importBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#6C5CE7",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  importBtnText: {
    color: "#0D0D12",
    fontSize: 15,
    fontWeight: "700",
  },
  streakRow: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#F5F5FA",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  workoutGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    width: "48%",
    flexGrow: 1,
  },
  workoutTypeCard: {
    backgroundColor: "#1A1A24",
    borderRadius: 20,
    padding: 18,
    minHeight: 160,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  cardName: {
    color: "#F5F5FA",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  cardDescription: {
    color: "#7B7B94",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 12,
    lineHeight: 16,
  },
  cardDayLabel: {
    color: "#7B7B94",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 16,
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardExerciseCount: {
    color: "#7B7B94",
    fontSize: 13,
    fontWeight: "500",
  },
  cardArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  recentCard: {
    backgroundColor: "#1A1A24",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  recentCardInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recentCardLeft: {
    flex: 1,
  },
  recentCardName: {
    color: "#F5F5FA",
    fontSize: 15,
    fontWeight: "600",
  },
  recentCardDuration: {
    color: "#7B7B94",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  recentCardDate: {
    color: "#7B7B94",
    fontSize: 12,
    fontWeight: "500",
  },
  recentCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
