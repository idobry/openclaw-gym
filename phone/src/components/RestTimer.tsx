import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Modal, Dimensions } from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { AnimatedPressable } from "./AnimatedPressable";
import { useWorkoutStore } from "../stores/workoutStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function RestTimer() {
  const {
    isRestTimerActive,
    restTimeRemaining,
    restTotalSeconds,
    tickRestTimer,
    adjustRestTimer,
    stopRestTimer,
  } = useWorkoutStore();

  const [expanded, setExpanded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimeRef = useRef(restTimeRemaining);

  useEffect(() => {
    if (isRestTimerActive) {
      intervalRef.current = setInterval(tickRestTimer, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRestTimerActive, tickRestTimer]);

  useEffect(() => {
    if (!isRestTimerActive) return;
    const prev = lastTimeRef.current;
    lastTimeRef.current = restTimeRemaining;

    if (restTimeRemaining === 10) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (restTimeRemaining > 0 && restTimeRemaining <= 5) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (restTimeRemaining === 0 && prev > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => stopRestTimer(), 3000);
    }
  }, [restTimeRemaining, isRestTimerActive, stopRestTimer]);

  if (!isRestTimerActive && restTimeRemaining <= 0) return null;

  const minutes = Math.floor(restTimeRemaining / 60);
  const seconds = restTimeRemaining % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const isComplete = restTimeRemaining <= 0;
  const progress = restTotalSeconds > 0 ? 1 - restTimeRemaining / restTotalSeconds : 1;
  const activeColor = isComplete ? "#34D399" : "#FBBF24";

  // Floating pill (minimized)
  if (!expanded) {
    return (
      <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.pillContainer}>
        <AnimatedPressable
          onPress={() => setExpanded(true)}
          style={[styles.pill, { borderColor: activeColor }]}
        >
          <View style={[styles.pillDot, { backgroundColor: activeColor }]} />
          <Text style={[styles.pillTime, { color: activeColor }]}>{timeStr}</Text>
          <Text style={styles.pillLabel}>{isComplete ? "Done!" : "Rest"}</Text>
        </AnimatedPressable>
      </Animated.View>
    );
  }

  // Expanded full-screen overlay
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill}>
        <View style={styles.expandedContainer}>
          <Text style={[styles.expandedLabel, { color: activeColor }]}>
            {isComplete ? "REST COMPLETE" : "REST TIMER"}
          </Text>

          {/* Progress ring */}
          <View style={styles.ringContainer}>
            <View style={styles.ringTrack} />
            <View
              style={[
                styles.ringProgress,
                { borderColor: activeColor, opacity: progress },
              ]}
            />
            <Text style={styles.timerText}>{timeStr}</Text>
          </View>

          {/* Adjust buttons */}
          <View style={styles.adjustRow}>
            <AnimatedPressable
              onPress={() => adjustRestTimer(-30)}
              style={styles.adjustButton}
            >
              <Text style={styles.adjustText}>{"\u2212"}30s</Text>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => adjustRestTimer(30)}
              style={styles.adjustButton}
            >
              <Text style={styles.adjustText}>+30s</Text>
            </AnimatedPressable>
          </View>

          {/* Skip / Continue */}
          <AnimatedPressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              stopRestTimer();
              setExpanded(false);
            }}
            style={[styles.skipButton, isComplete && styles.skipButtonComplete]}
          >
            <Text style={[styles.skipText, isComplete && styles.skipTextComplete]}>
              {isComplete ? "CONTINUE" : "SKIP REST"}
            </Text>
          </AnimatedPressable>

          {/* Minimize */}
          <AnimatedPressable
            onPress={() => setExpanded(false)}
            style={styles.minimizeButton}
          >
            <Text style={styles.minimizeText}>Minimize</Text>
          </AnimatedPressable>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // --- Floating pill ---
  pillContainer: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    zIndex: 100,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 26, 36, 0.95)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
    borderWidth: 1.5,
    gap: 10,
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillTime: {
    fontSize: 17,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  pillLabel: {
    fontSize: 13,
    color: "#7B7B94",
  },

  // --- Expanded overlay ---
  expandedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  expandedLabel: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 40,
  },
  ringContainer: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  ringTrack: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 6,
    borderColor: "#242430",
  },
  ringProgress: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 6,
  },
  timerText: {
    color: "#F5F5FA",
    fontSize: 48,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  adjustRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
  },
  adjustButton: {
    backgroundColor: "#242430",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  adjustText: {
    color: "#F5F5FA",
    fontSize: 15,
    fontWeight: "600",
  },
  skipButton: {
    backgroundColor: "#242430",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 28,
    minWidth: 200,
    alignItems: "center",
    marginBottom: 16,
  },
  skipButtonComplete: {
    backgroundColor: "#34D399",
  },
  skipText: {
    color: "#F5F5FA",
    fontSize: 17,
    fontWeight: "700",
  },
  skipTextComplete: {
    color: "#0D0D12",
  },
  minimizeButton: {
    paddingVertical: 12,
  },
  minimizeText: {
    color: "#7B7B94",
    fontSize: 15,
  },
});
