import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { ExerciseMedia } from "../../src/components/ExerciseMedia";
import { ProgressChart } from "../../src/components/ProgressChart";
import { AnimatedPressable } from "../../src/components/AnimatedPressable";
import { getExercise, type Exercise } from "../../src/db/queries/exercises";
import { getExerciseProgress, getExercisePR } from "../../src/db/queries/progress";

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const db = useSQLiteContext();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [progress, setProgress] = useState<{ date: string; value: number }[]>(
    []
  );
  const [pr, setPR] = useState<{ max_weight: number; reps: number } | null>(
    null
  );

  useEffect(() => {
    if (!exerciseId) return;
    (async () => {
      try {
        const [ex, prog, prData] = await Promise.all([
          getExercise(db, exerciseId),
          getExerciseProgress(db, exerciseId),
          getExercisePR(db, exerciseId),
        ]);
        setExercise(ex);
        setProgress(
          prog.reverse().map((p) => ({ date: p.date, value: p.max_weight }))
        );
        setPR(prData);
      } catch (e) {
        console.error("Failed to load exercise:", e);
      }
    })();
  }, [exerciseId, db]);

  if (!exercise) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color="#F5F5FA" />
        </AnimatedPressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {exercise.name}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Exercise Media */}
        <Animated.View
          entering={FadeIn.duration(500).delay(0)}
          style={styles.mediaContainer}
        >
          <ExerciseMedia mediaSlug={exercise.media_slug} size={260} />
        </Animated.View>

        {/* Info Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(60)}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Ionicons
                  name="body-outline"
                  size={18}
                  color="#7B7B94"
                />
                <Text style={styles.infoLabel}>Muscle Group</Text>
              </View>
              <Text style={styles.infoValue}>{exercise.muscle_group}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={styles.infoLabelRow}>
                <Ionicons
                  name="barbell-outline"
                  size={18}
                  color="#7B7B94"
                />
                <Text style={styles.infoLabel}>Equipment</Text>
              </View>
              <Text style={styles.infoValue}>{exercise.equipment}</Text>
            </View>
          </View>
        </Animated.View>

        {/* PR Card */}
        {pr && (
          <Animated.View entering={FadeInDown.duration(400).delay(120)}>
            <View style={styles.prCard}>
              <View style={styles.prIconCircle}>
                <Ionicons name="trophy" size={22} color="#34D399" />
              </View>
              <View style={styles.prInfo}>
                <Text style={styles.prLabel}>Personal Record</Text>
                <Text style={styles.prValue}>
                  {pr.max_weight} lbs x {pr.reps}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Progress Chart */}
        <Animated.View entering={FadeInDown.duration(400).delay(180)}>
          <ProgressChart
            data={progress}
            title="Weight Over Time"
            suffix=" lbs"
            color="#6C5CE7"
            height={180}
          />
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
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0D0D12",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#7B7B94",
    fontSize: 17,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A24",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: {
    color: "#F5F5FA",
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  mediaContainer: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: "#1A1A24",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    color: "#7B7B94",
    fontSize: 15,
    fontWeight: "500",
  },
  infoValue: {
    color: "#F5F5FA",
    fontSize: 15,
    fontWeight: "600",
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#242430",
  },
  prCard: {
    backgroundColor: "#1A1A24",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  prIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  prInfo: {
    flex: 1,
  },
  prLabel: {
    color: "#7B7B94",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  prValue: {
    color: "#34D399",
    fontSize: 24,
    fontWeight: "800",
  },
});
