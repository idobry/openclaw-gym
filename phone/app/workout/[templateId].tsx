import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ExerciseCard } from "../../src/components/ExerciseCard";
import { RestTimer } from "../../src/components/RestTimer";
import { AnimatedPressable } from "../../src/components/AnimatedPressable";
import { useWorkoutStore } from "../../src/stores/workoutStore";
import { useActiveWorkout } from "../../src/hooks/useActiveWorkout";

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const store = useWorkoutStore();
  const { handleLogSet, handleCompleteWorkout, handleCancelWorkout } =
    useActiveWorkout();
  const scrollRef = useRef<ScrollView>(null);
  const [elapsed, setElapsed] = useState("0:00");

  // Elapsed timer
  useEffect(() => {
    if (!store.startedAt) return;
    const interval = setInterval(() => {
      const start = new Date(store.startedAt!).getTime();
      const now = Date.now();
      const diffSec = Math.floor((now - start) / 1000);
      const mins = Math.floor(diffSec / 60);
      const secs = diffSec % 60;
      setElapsed(`${mins}:${secs.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [store.startedAt]);

  if (!store.sessionId) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No active workout</Text>
        <AnimatedPressable
          onPress={() => router.back()}
          style={styles.goBackButton}
        >
          <Text style={styles.goBackText}>Go Back</Text>
        </AnimatedPressable>
      </SafeAreaView>
    );
  }

  const completedCount = store.exercises.filter((e) => e.isComplete).length;
  const totalExercises = store.exercises.length;
  const allComplete = completedCount === totalExercises;

  const handleEnd = () => {
    if (!allComplete) {
      Alert.alert(
        "End Workout?",
        `You've completed ${completedCount}/${totalExercises} exercises. End anyway?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "End & Save",
            onPress: async () => {
              const sessionId = await handleCompleteWorkout();
              if (sessionId) {
                router.replace(`/workout/complete?sessionId=${sessionId}`);
              }
            },
          },
          {
            text: "Discard",
            style: "destructive",
            onPress: async () => {
              await handleCancelWorkout();
              router.back();
            },
          },
        ]
      );
    } else {
      (async () => {
        const sessionId = await handleCompleteWorkout();
        if (sessionId) {
          router.replace(`/workout/complete?sessionId=${sessionId}`);
        }
      })();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.headerDot,
              { backgroundColor: store.templateColor ?? "#6C5CE7" },
            ]}
          />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {store.templateName}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.exerciseCounter}>
            <Text style={styles.exerciseCounterText}>
              {completedCount}/{totalExercises}
            </Text>
          </View>
          <Text style={styles.timerText}>{elapsed}</Text>
          <AnimatedPressable onPress={handleEnd} style={styles.closeButton}>
            <Ionicons name="close" size={22} color="#7B7B94" />
          </AnimatedPressable>
        </View>
      </View>

      {/* Exercise List */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {store.exercises.map((exercise, exerciseIndex) => (
          <Animated.View
            key={exercise.exerciseId}
            entering={FadeInDown.duration(300).delay(exerciseIndex * 60)}
          >
            <ExerciseCard
              exercise={exercise}
              exerciseIndex={exerciseIndex}
              isActive={exerciseIndex === store.currentExerciseIndex}
              onSetWeightChange={(ei, si, w) =>
                store.updateSet(ei, si, { weight: w })
              }
              onSetRepsChange={(ei, si, r) =>
                store.updateSet(ei, si, { reps: r })
              }
              onLogSet={handleLogSet}
              onPress={() => store.setCurrentExerciseIndex(exerciseIndex)}
            />
          </Animated.View>
        ))}
      </ScrollView>

      {/* Complete Workout Button */}
      {allComplete && (
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.completeOverlay}
        >
          <AnimatedPressable
            onPress={handleEnd}
            style={styles.completeButton}
          >
            <Ionicons
              name="checkmark-circle"
              size={24}
              color="#0D0D12"
              style={styles.completeIcon}
            />
            <Text style={styles.completeText}>COMPLETE WORKOUT</Text>
          </AnimatedPressable>
        </Animated.View>
      )}

      {/* Rest Timer Overlay */}
      <RestTimer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D12",
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#0D0D12",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#7B7B94",
    fontSize: 17,
    fontWeight: "500",
  },
  goBackButton: {
    marginTop: 20,
    backgroundColor: "#6C5CE7",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  goBackText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#242430",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  headerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  headerTitle: {
    color: "#F5F5FA",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  exerciseCounter: {
    backgroundColor: "rgba(108, 92, 231, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  exerciseCounterText: {
    color: "#6C5CE7",
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  timerText: {
    color: "#FBBF24",
    fontSize: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A24",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 140,
  },
  completeOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: "rgba(13, 13, 18, 0.92)",
  },
  completeButton: {
    backgroundColor: "#34D399",
    height: 56,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  completeIcon: {
    marginRight: 8,
  },
  completeText: {
    color: "#0D0D12",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
