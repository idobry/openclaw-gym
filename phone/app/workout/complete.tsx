import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { AnimatedPressable } from "../../src/components/AnimatedPressable";
import { getSessionVolume, getSessionPRs } from "../../src/db/queries/progress";

export default function WorkoutCompleteScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const db = useSQLiteContext();
  const [volume, setVolume] = useState(0);
  const [prs, setPRs] = useState<
    { exercise_name: string; weight: number; reps: number }[]
  >([]);
  const [duration, setDuration] = useState("");

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (!sessionId) return;
    (async () => {
      try {
        const [vol, sessionPRs] = await Promise.all([
          getSessionVolume(db, sessionId),
          getSessionPRs(db, sessionId),
        ]);
        setVolume(vol);
        setPRs(sessionPRs);

        const session = await db.getFirstAsync<{
          started_at: string;
          completed_at: string;
        }>(
          "SELECT started_at, completed_at FROM workout_sessions WHERE id = ?",
          sessionId
        );
        if (session?.started_at && session?.completed_at) {
          const mins = Math.round(
            (new Date(session.completed_at).getTime() -
              new Date(session.started_at).getTime()) /
              60000
          );
          setDuration(`${mins} min`);
        }
      } catch (e) {
        console.error("Failed to load completion data:", e);
      }
    })();
  }, [sessionId, db]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["rgba(52, 211, 153, 0.08)", "transparent"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.container}>
        {/* Success Checkmark */}
        <Animated.View
          entering={FadeIn.duration(600).delay(100)}
          style={styles.checkCircle}
        >
          <View style={styles.checkInner}>
            <Ionicons name="checkmark" size={56} color="#34D399" />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Text style={styles.title}>Workout Complete!</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(400).delay(260)}>
          <Text style={styles.subtitle}>Great work! Keep it up.</Text>
        </Animated.View>

        {/* Summary Card */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(320)}
          style={styles.summaryCard}
        >
          {duration ? (
            <>
              <View style={styles.summaryRow}>
                <View style={styles.summaryIconRow}>
                  <Ionicons name="time-outline" size={18} color="#7B7B94" />
                  <Text style={styles.summaryLabel}>Duration</Text>
                </View>
                <Text style={styles.summaryValue}>{duration}</Text>
              </View>
              <View style={styles.summaryDivider} />
            </>
          ) : null}

          <View style={styles.summaryRow}>
            <View style={styles.summaryIconRow}>
              <Ionicons name="barbell-outline" size={18} color="#7B7B94" />
              <Text style={styles.summaryLabel}>Total Volume</Text>
            </View>
            <Text style={styles.summaryValue}>
              {volume.toLocaleString()} lbs
            </Text>
          </View>

          {prs.length > 0 && (
            <>
              <View style={styles.summaryDivider} />
              <View style={styles.prSection}>
                <View style={styles.prHeader}>
                  <Ionicons name="trophy" size={18} color="#34D399" />
                  <Text style={styles.prHeaderText}>
                    {prs.length} Personal Record{prs.length !== 1 ? "s" : ""}!
                  </Text>
                </View>
                {prs.map((pr, i) => (
                  <View key={i} style={styles.prRow}>
                    <Text style={styles.prExercise}>{pr.exercise_name}</Text>
                    <Text style={styles.prWeight}>
                      {pr.weight} x {pr.reps}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </Animated.View>

        {/* Done Button */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(400)}
          style={styles.doneButtonContainer}
        >
          <AnimatedPressable
            onPress={() => router.replace("/(tabs)")}
            style={styles.doneButton}
          >
            <Text style={styles.doneButtonText}>DONE</Text>
          </AnimatedPressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D0D12",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(52, 211, 153, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  checkInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#F5F5FA",
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "#7B7B94",
    fontSize: 17,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 40,
  },
  summaryCard: {
    width: "100%",
    backgroundColor: "#1A1A24",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  summaryIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryLabel: {
    color: "#7B7B94",
    fontSize: 15,
    fontWeight: "500",
  },
  summaryValue: {
    color: "#F5F5FA",
    fontSize: 17,
    fontWeight: "700",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#242430",
  },
  prSection: {
    paddingTop: 12,
  },
  prHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  prHeaderText: {
    color: "#34D399",
    fontSize: 16,
    fontWeight: "700",
  },
  prRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  prExercise: {
    color: "#7B7B94",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  prWeight: {
    color: "#34D399",
    fontSize: 15,
    fontWeight: "600",
  },
  doneButtonContainer: {
    width: "100%",
  },
  doneButton: {
    backgroundColor: "#6C5CE7",
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
