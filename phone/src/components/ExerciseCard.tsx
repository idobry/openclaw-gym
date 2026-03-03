import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SetRow } from "./SetRow";
import { AnimatedPressable } from "./AnimatedPressable";
import type { ActiveExercise } from "../stores/workoutStore";

interface ExerciseCardProps {
  exercise: ActiveExercise;
  exerciseIndex: number;
  isActive: boolean;
  lastSessionSets?: { weight: number; reps: number; set_number: number }[];
  onSetWeightChange: (exerciseIndex: number, setIndex: number, weight: number) => void;
  onSetRepsChange: (exerciseIndex: number, setIndex: number, reps: number) => void;
  onLogSet: (exerciseIndex: number, setIndex: number) => void;
  onPress: () => void;
  onMediaPress?: () => void;
}

export function ExerciseCard({
  exercise,
  exerciseIndex,
  isActive,
  lastSessionSets,
  onSetWeightChange,
  onSetRepsChange,
  onLogSet,
  onPress,
  onMediaPress,
}: ExerciseCardProps) {
  const loggedCount = exercise.sets.filter((s) => s.isLogged).length;
  const totalSets = exercise.sets.length;

  // Collapsed completed state
  if (!isActive && exercise.isComplete) {
    return (
      <AnimatedPressable onPress={onPress} style={styles.completedCard}>
        <View style={styles.completedCheckCircle}>
          <Ionicons name="checkmark" size={14} color="#34D399" />
        </View>
        <Text style={styles.completedName} numberOfLines={1}>
          {exercise.exerciseName}
        </Text>
        <Text style={styles.completedSets}>
          {totalSets}/{totalSets} sets
        </Text>
      </AnimatedPressable>
    );
  }

  // Collapsed upcoming state
  if (!isActive) {
    return (
      <AnimatedPressable onPress={onPress} style={styles.upcomingCard}>
        <Text style={styles.upcomingName} numberOfLines={1}>
          {exercise.exerciseName}
        </Text>
        <Text style={styles.upcomingTarget}>
          {exercise.targetSets}{"\u00D7"}{exercise.repRangeMin}-{exercise.repRangeMax}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#4A4A5E" />
      </AnimatedPressable>
    );
  }

  // Build last session summary
  const lastSetSummary =
    lastSessionSets && lastSessionSets.length > 0
      ? `Last: ${lastSessionSets.map((s) => `${s.weight}\u00D7${s.reps}`).join(", ")}`
      : null;

  // Active / expanded state
  return (
    <Animated.View entering={FadeInDown.duration(350)} style={styles.activeCard}>
      {/* Accent gradient top bar */}
      <LinearGradient
        colors={["rgba(108, 92, 231, 0.25)", "rgba(108, 92, 231, 0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.accentBar}
      />

      {/* Header */}
      <View style={styles.activeHeader}>
        <View style={styles.activeHeaderLeft}>
          <Text style={styles.activeName}>{exercise.exerciseName}</Text>
          <Text style={styles.activeSubtitle}>
            {exercise.muscleGroup} {"\u00B7"} {exercise.equipment} {"\u00B7"} {exercise.restSeconds}s rest
          </Text>
        </View>
        <View style={styles.activeHeaderRight}>
          {onMediaPress && (
            <AnimatedPressable onPress={onMediaPress} style={styles.mediaButton}>
              <Ionicons name="image-outline" size={18} color="#7B7B94" />
            </AnimatedPressable>
          )}
          <View style={styles.setCountBadge}>
            <Text style={styles.setCountText}>
              {loggedCount}/{totalSets}
            </Text>
          </View>
        </View>
      </View>

      {/* Target info */}
      <Text style={styles.targetText}>
        Target: {exercise.targetSets} {"\u00D7"} {exercise.repRangeMin}-{exercise.repRangeMax} reps
      </Text>

      {/* Last session reference */}
      {lastSetSummary && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.lastSessionRow}>
          <Ionicons name="time-outline" size={12} color="#7B7B94" />
          <Text style={styles.lastSessionText}>{lastSetSummary}</Text>
        </Animated.View>
      )}

      {/* Sets */}
      <View style={styles.setsContainer}>
        {exercise.sets.map((set, setIndex) => (
          <SetRow
            key={setIndex}
            set={set}
            exerciseEquipment={exercise.equipment}
            onWeightChange={(w) => onSetWeightChange(exerciseIndex, setIndex, w)}
            onRepsChange={(r) => onSetRepsChange(exerciseIndex, setIndex, r)}
            onLogSet={() => onLogSet(exerciseIndex, setIndex)}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // --- Completed collapsed ---
  completedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(52, 211, 153, 0.06)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  completedCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(52, 211, 153, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  completedName: {
    flex: 1,
    color: "#F5F5FA",
    fontSize: 15,
    fontWeight: "600",
  },
  completedSets: {
    color: "#34D399",
    fontSize: 13,
    fontWeight: "600",
  },

  // --- Upcoming collapsed ---
  upcomingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 26, 36, 0.6)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  upcomingName: {
    flex: 1,
    color: "#7B7B94",
    fontSize: 15,
    fontWeight: "500",
  },
  upcomingTarget: {
    color: "#4A4A5E",
    fontSize: 13,
    fontWeight: "500",
    marginRight: 8,
  },

  // --- Active expanded ---
  activeCard: {
    backgroundColor: "#1A1A24",
    borderRadius: 20,
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(108, 92, 231, 0.25)",
    overflow: "hidden",
  },
  accentBar: {
    height: 4,
    marginHorizontal: -16,
    marginBottom: 16,
  },
  activeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  activeHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  activeName: {
    color: "#F5F5FA",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  activeSubtitle: {
    color: "#7B7B94",
    fontSize: 13,
    fontWeight: "500",
  },
  activeHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mediaButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#242430",
    alignItems: "center",
    justifyContent: "center",
  },
  setCountBadge: {
    backgroundColor: "rgba(108, 92, 231, 0.15)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  setCountText: {
    color: "#6C5CE7",
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  targetText: {
    color: "#6C5CE7",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  lastSessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    marginTop: 2,
  },
  lastSessionText: {
    color: "#7B7B94",
    fontSize: 12,
    fontWeight: "400",
  },
  setsContainer: {
    marginTop: 8,
  },
});
