import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AnimatedPressable } from "../../src/components/AnimatedPressable";
import { useOnboardingStore } from "../../src/stores/onboardingStore";

export default function WelcomeScreen() {
  const router = useRouter();
  const { setStep, completeOnboarding } = useOnboardingStore();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        {/* Logo area */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(0)}
          style={styles.logoArea}
        >
          <View style={styles.logoCircle}>
            <Ionicons name="barbell" size={48} color="#6C5CE7" />
          </View>
          <Text style={styles.appName}>GymTracker</Text>
          <Text style={styles.tagline}>
            Your workouts, your way. Track progress and connect with an AI coach.
          </Text>
        </Animated.View>

        {/* CTAs */}
        <View style={styles.ctaArea}>
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            <AnimatedPressable
              onPress={() => {
                setStep("import");
                router.push("/onboarding/import");
              }}
              style={styles.primaryBtn}
            >
              <Ionicons name="document-text" size={22} color="#0D0D12" style={{ opacity: 0.7 }} />
              <View style={styles.btnTextBlock}>
                <Text style={styles.primaryBtnText}>Import Program</Text>
                <Text style={styles.primaryBtnSub}>
                  Paste your workout JSON to get started
                </Text>
              </View>
            </AnimatedPressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(300)}>
            <AnimatedPressable
              onPress={() => {
                setStep("signup");
                router.push("/auth/register");
              }}
              style={styles.secondaryBtn}
            >
              <Ionicons name="person-add" size={22} color="#6C5CE7" />
              <View style={styles.btnTextBlock}>
                <Text style={styles.secondaryBtnText}>Create Account</Text>
                <Text style={styles.secondaryBtnSub}>
                  Sync and connect with your AI coach
                </Text>
              </View>
            </AnimatedPressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(400)}>
            <AnimatedPressable
              onPress={() => {
                completeOnboarding();
                router.replace("/(tabs)");
              }}
              style={styles.skipBtn}
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </AnimatedPressable>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D12" },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingTop: 80,
    paddingBottom: 40,
  },
  logoArea: {
    alignItems: "center",
    gap: 16,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(108, 92, 231, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  appName: {
    color: "#F5F5FA",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  tagline: {
    color: "#7B7B94",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 280,
  },
  ctaArea: {
    gap: 12,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#34D399",
    borderRadius: 16,
    padding: 18,
  },
  btnTextBlock: { flex: 1 },
  primaryBtnText: {
    color: "#0D0D12",
    fontSize: 16,
    fontWeight: "700",
  },
  primaryBtnSub: {
    color: "rgba(13, 13, 18, 0.6)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#1A1A24",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#242430",
  },
  secondaryBtnText: {
    color: "#F5F5FA",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtnSub: {
    color: "#7B7B94",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 14,
  },
  skipText: {
    color: "#7B7B94",
    fontSize: 14,
    fontWeight: "600",
  },
});
