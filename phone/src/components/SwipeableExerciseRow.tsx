import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  SharedValue,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ExerciseMedia } from "./ExerciseMedia";
import type { TemplateExerciseRow } from "../db/queries/exercises";

interface SwipeableExerciseRowProps {
  exercise: TemplateExerciseRow;
  onDelete: (templateExerciseId: number) => void;
  onReplace: (templateExerciseId: number) => void;
}

function RenderRightActions(_prog: SharedValue<number>, drag: SharedValue<number>) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + 80 }],
  }));

  return (
    <Animated.View style={[styles.deleteAction, animatedStyle]}>
      <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
    </Animated.View>
  );
}

export function SwipeableExerciseRow({
  exercise,
  onDelete,
  onReplace,
}: SwipeableExerciseRowProps) {
  const rowHeight = useSharedValue(1);
  const rowOpacity = useSharedValue(1);

  const animatedContainer = useAnimatedStyle(() => ({
    opacity: rowOpacity.value,
    transform: [{ scaleY: rowHeight.value }],
    marginBottom: rowHeight.value === 1 ? 12 : 0,
  }));

  const handleSwipeOpen = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    rowOpacity.value = withTiming(0, { duration: 250 });
    rowHeight.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(onDelete)(exercise.id);
      }
    });
  };

  return (
    <Animated.View style={animatedContainer}>
      <ReanimatedSwipeable
        friction={2}
        rightThreshold={60}
        renderRightActions={RenderRightActions}
        onSwipeableOpen={(direction) => {
          if (direction === "right") handleSwipeOpen();
        }}
        overshootRight={false}
      >
        <Pressable
          onPress={() => onReplace(exercise.id)}
          style={styles.row}
        >
          <View style={styles.mediaWrapper}>
            <ExerciseMedia mediaSlug={exercise.media_slug} size={50} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {exercise.exercise_name}
            </Text>
            <Text style={styles.subtitle}>
              {exercise.muscle_group}
              {exercise.equipment ? ` · ${exercise.equipment}` : ""}
            </Text>
          </View>
          <Ionicons name="swap-horizontal-outline" size={18} color="#4A4A5E" />
        </Pressable>
      </ReanimatedSwipeable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A24",
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  mediaWrapper: {},
  info: {
    flex: 1,
  },
  name: {
    color: "#F5F5FA",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
  },
  subtitle: {
    color: "#7B7B94",
    fontSize: 12,
    fontWeight: "500",
  },
  deleteAction: {
    backgroundColor: "#F87171",
    borderRadius: 16,
    width: 80,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
