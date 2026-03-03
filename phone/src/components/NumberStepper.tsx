import React from "react";
import { View, Text, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { AnimatedPressable } from "./AnimatedPressable";

interface NumberStepperProps {
  value: number;
  onValueChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  width?: number;
}

export function NumberStepper({
  value,
  onValueChange,
  step = 5,
  min = 0,
  max = 999,
  suffix,
  width = 130,
}: NumberStepperProps) {
  const decrease = () => {
    const newVal = Math.max(min, value - step);
    if (newVal !== value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onValueChange(newVal);
    }
  };

  const increase = () => {
    const newVal = Math.min(max, value + step);
    if (newVal !== value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onValueChange(newVal);
    }
  };

  const displayVal = value % 1 === 0 ? value.toString() : value.toFixed(1);

  return (
    <View style={[styles.container, { width }]}>
      <AnimatedPressable onPress={decrease} style={styles.decreaseButton}>
        <Text style={styles.decreaseText}>{"\u2212"}</Text>
      </AnimatedPressable>
      <View style={styles.valueContainer}>
        <Text style={styles.valueText}>
          {displayVal}
          {suffix ? <Text style={styles.suffixText}> {suffix}</Text> : null}
        </Text>
      </View>
      <AnimatedPressable onPress={increase} style={styles.increaseButton}>
        <Text style={styles.increaseText}>+</Text>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1A1A24",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  decreaseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#242430",
    alignItems: "center",
    justifyContent: "center",
  },
  decreaseText: {
    color: "#7B7B94",
    fontSize: 20,
    fontWeight: "700",
  },
  valueContainer: {
    flex: 1,
    alignItems: "center",
  },
  valueText: {
    color: "#F5F5FA",
    fontSize: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  suffixText: {
    color: "#7B7B94",
    fontSize: 12,
  },
  increaseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(108, 92, 231, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  increaseText: {
    color: "#6C5CE7",
    fontSize: 20,
    fontWeight: "700",
  },
});
