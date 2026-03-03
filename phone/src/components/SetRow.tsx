import React from "react";
import { View, Text, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";
import { NumberStepper } from "./NumberStepper";
import { AnimatedPressable } from "./AnimatedPressable";
import type { ActiveSet } from "../stores/workoutStore";

interface SetRowProps {
  set: ActiveSet;
  exerciseEquipment: string;
  onWeightChange: (weight: number) => void;
  onRepsChange: (reps: number) => void;
  onLogSet: () => void;
}

export function SetRow({ set, exerciseEquipment, onWeightChange, onRepsChange, onLogSet }: SetRowProps) {
  const weightStep = exerciseEquipment === "Barbell" ? 5 : 2.5;
  const isLogged = set.isLogged;

  const handleLog = () => {
    if (!isLogged && set.reps > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onLogSet();
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.row, isLogged && styles.rowLogged]}
    >
      <View style={[styles.setCircle, isLogged && styles.setCircleLogged]}>
        <Text style={[styles.setNumber, isLogged && styles.setNumberLogged]}>
          {set.isWarmup ? "W" : set.setNumber}
        </Text>
      </View>

      <View style={styles.inputsContainer}>
        <NumberStepper
          value={set.weight}
          onValueChange={onWeightChange}
          step={weightStep}
          min={0}
          max={999}
          width={125}
        />
        <Text style={styles.separator}>{"\u00D7"}</Text>
        <NumberStepper
          value={set.reps}
          onValueChange={onRepsChange}
          step={1}
          min={0}
          max={99}
          width={100}
        />
      </View>

      {isLogged ? (
        <Animated.View entering={FadeIn.duration(200)} style={styles.loggedBadge}>
          <Text style={styles.loggedCheck}>{"\u2713"}</Text>
        </Animated.View>
      ) : (
        <AnimatedPressable
          onPress={handleLog}
          style={[styles.logButton, set.reps === 0 && styles.logButtonDisabled]}
        >
          <Text style={[styles.logButtonText, set.reps === 0 && styles.logButtonTextDisabled]}>
            LOG
          </Text>
        </AnimatedPressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: "#1A1A24",
  },
  rowLogged: {
    backgroundColor: "rgba(52, 211, 153, 0.08)",
  },
  setCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#242430",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  setCircleLogged: {
    backgroundColor: "rgba(52, 211, 153, 0.2)",
  },
  setNumber: {
    color: "#7B7B94",
    fontSize: 13,
    fontWeight: "700",
  },
  setNumberLogged: {
    color: "#34D399",
  },
  inputsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  separator: {
    color: "#4A4A5E",
    fontSize: 17,
    fontWeight: "500",
  },
  logButton: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6C5CE7",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  logButtonDisabled: {
    backgroundColor: "#242430",
  },
  logButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  logButtonTextDisabled: {
    color: "#4A4A5E",
  },
  loggedBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  loggedCheck: {
    color: "#34D399",
    fontSize: 18,
    fontWeight: "700",
  },
});
