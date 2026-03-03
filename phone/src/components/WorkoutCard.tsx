import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AnimatedPressable } from "./AnimatedPressable";

interface WorkoutCardProps {
  templateId: string;
  name: string;
  dayLabel: string;
  color: string;
  exerciseCount: number;
  isRecommended?: boolean;
  onPress: () => void;
}

export function WorkoutCard({
  name,
  dayLabel,
  color,
  exerciseCount,
  isRecommended,
  onPress,
}: WorkoutCardProps) {
  return (
    <AnimatedPressable onPress={onPress} style={styles.wrapper}>
      <LinearGradient
        colors={[`${color}18`, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradientBg}
      />

      {/* Left color bar */}
      <View style={[styles.colorBar, { backgroundColor: color }]} />

      <View style={styles.content}>
        <View style={styles.textBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {isRecommended && (
              <View style={styles.nextBadge}>
                <Text style={styles.nextText}>NEXT</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>
            {dayLabel} {"\u00B7"} {exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#4A4A5E" />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#1A1A24",
    borderRadius: 20,
    marginBottom: 12,
    overflow: "hidden",
    flexDirection: "row",
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  colorBar: {
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  textBlock: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  name: {
    color: "#F5F5FA",
    fontSize: 17,
    fontWeight: "700",
    flexShrink: 1,
  },
  nextBadge: {
    backgroundColor: "rgba(108, 92, 231, 0.15)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(108, 92, 231, 0.3)",
  },
  nextText: {
    color: "#6C5CE7",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#7B7B94",
    fontSize: 13,
    fontWeight: "500",
  },
});
