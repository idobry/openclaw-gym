import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { AnimatedPressable } from "./AnimatedPressable";

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export function AgentChangeBanner({ visible, onDismiss }: Props) {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutUp.duration(300)}
    >
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <View style={styles.iconWrap}>
            <Ionicons name="sparkles" size={18} color="#6C5CE7" />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.bannerTitle}>Program Updated</Text>
            <Text style={styles.bannerSubtitle}>
              Your agent updated your workout program
            </Text>
          </View>
          <AnimatedPressable onPress={onDismiss} style={styles.dismissBtn}>
            <Ionicons name="close" size={18} color="#7B7B94" />
          </AnimatedPressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "rgba(108, 92, 231, 0.12)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(108, 92, 231, 0.2)",
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(108, 92, 231, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: { flex: 1 },
  bannerTitle: {
    color: "#F5F5FA",
    fontSize: 14,
    fontWeight: "600",
  },
  bannerSubtitle: {
    color: "#7B7B94",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  dismissBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
