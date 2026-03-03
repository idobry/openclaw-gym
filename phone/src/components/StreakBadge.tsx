import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

interface StreakBadgeProps {
  streak: number;
  workoutsThisWeek: number;
  size?: "small" | "large";
}

export function StreakBadge({ streak, workoutsThisWeek, size = "large" }: StreakBadgeProps) {
  const isOnFire = streak > 0;
  const weekDots = [0, 1, 2];

  // Pulse animation for the flame when streak > 0
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isOnFire) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [isOnFire]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // --- Small mode ---
  if (size === "small") {
    return (
      <View style={styles.smallContainer}>
        <Animated.View style={pulseStyle}>
          <Ionicons
            name={isOnFire ? "flame" : "flame-outline"}
            size={22}
            color={isOnFire ? "#FF6B6B" : "#7B7B94"}
          />
        </Animated.View>
        <Text style={[styles.smallNumber, isOnFire && styles.smallNumberActive]}>
          {streak}
        </Text>
      </View>
    );
  }

  // --- Large mode ---
  return (
    <View style={styles.largeContainer}>
      {/* Gradient ring */}
      <View style={styles.ringWrapper}>
        {isOnFire ? (
          <LinearGradient
            colors={["#FF6B6B", "#6C5CE7", "#FF6B6B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientRing}
          >
            <View style={styles.ringInner}>
              <Animated.View style={pulseStyle}>
                <Ionicons name="flame" size={44} color="#FF6B6B" />
              </Animated.View>
              <Text style={styles.largeStreakNumber}>{streak}</Text>
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.inactiveRing}>
            <Ionicons name="flame-outline" size={44} color="#7B7B94" />
            <Text style={styles.largeStreakNumberInactive}>{streak}</Text>
          </View>
        )}
      </View>

      {/* Label */}
      <Text style={styles.label}>
        {streak === 0 ? "Start your streak!" : `${streak} week${streak !== 1 ? "s" : ""} strong`}
      </Text>

      {/* Week dots + fraction */}
      <View style={styles.weekRow}>
        {weekDots.map((i) => (
          <View
            key={i}
            style={[
              styles.weekDot,
              i < workoutsThisWeek ? styles.weekDotFilled : styles.weekDotEmpty,
            ]}
          />
        ))}
        <Text style={styles.weekFraction}>{workoutsThisWeek}/3 this week</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // --- Small ---
  smallContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  smallNumber: {
    fontSize: 17,
    fontWeight: "700",
    color: "#7B7B94",
  },
  smallNumberActive: {
    color: "#FF6B6B",
  },

  // --- Large ---
  largeContainer: {
    alignItems: "center",
  },
  ringWrapper: {
    marginBottom: 12,
  },
  gradientRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  ringInner: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: "#0D0D12",
    alignItems: "center",
    justifyContent: "center",
  },
  inactiveRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderColor: "#242430",
    backgroundColor: "#1A1A24",
    alignItems: "center",
    justifyContent: "center",
  },
  largeStreakNumber: {
    color: "#FF6B6B",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 2,
  },
  largeStreakNumberInactive: {
    color: "#7B7B94",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 2,
  },
  label: {
    color: "#7B7B94",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 10,
  },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  weekDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  weekDotFilled: {
    backgroundColor: "#34D399",
  },
  weekDotEmpty: {
    backgroundColor: "#242430",
  },
  weekFraction: {
    color: "#7B7B94",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
});
