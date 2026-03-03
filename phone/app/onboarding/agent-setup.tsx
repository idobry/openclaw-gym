import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AnimatedPressable } from "../../src/components/AnimatedPressable";
import { auth as authApi } from "../../src/lib/apiClient";
import { useOnboardingStore } from "../../src/stores/onboardingStore";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "";

export default function AgentSetupScreen() {
  const router = useRouter();
  const { completeOnboarding } = useOnboardingStore();

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateKey();
  }, []);

  const generateKey = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await authApi.createApiKey("Default Agent Key");
      setApiKey(result.key);
    } catch (e: any) {
      setError(e.message || "Failed to generate API key");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!apiKey) return;
    await Clipboard.setStringAsync(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDone = () => {
    completeOnboarding();
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#F5F5FA" />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>Connect Agent</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Animated.View
          entering={FadeInDown.duration(400).delay(0)}
          style={styles.intro}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="key" size={32} color="#6C5CE7" />
          </View>
          <Text style={styles.title}>Your API Key</Text>
          <Text style={styles.subtitle}>
            Give this key to your AI agent so it can read and modify your
            workout program.
          </Text>
        </Animated.View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#6C5CE7" />
          </View>
        ) : error ? (
          <Animated.View entering={FadeInDown.duration(300)}>
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle" size={18} color="#F87171" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
            <AnimatedPressable onPress={generateKey} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </AnimatedPressable>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            {/* API Key display */}
            <View style={styles.keyCard}>
              <Text style={styles.keyLabel}>API Key</Text>
              <Text style={styles.keyValue} selectable>
                {apiKey}
              </Text>
              <AnimatedPressable onPress={handleCopy} style={styles.copyBtn}>
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  size={18}
                  color={copied ? "#4ECDC4" : "#6C5CE7"}
                />
                <Text
                  style={[
                    styles.copyBtnText,
                    copied && { color: "#4ECDC4" },
                  ]}
                >
                  {copied ? "Copied!" : "Copy to clipboard"}
                </Text>
              </AnimatedPressable>
            </View>

            {/* Endpoint info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Agent Endpoint</Text>
              <Text style={styles.infoValue} selectable>
                {API_URL || "https://openclaw-gym-api.vercel.app"}
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Usage</Text>
              <Text style={styles.infoCode}>
                Authorization: Bearer {apiKey ? apiKey.slice(0, 12) + "..." : "gym_..."}
              </Text>
            </View>

            {/* Warning */}
            <View style={styles.warningCard}>
              <Ionicons name="warning" size={18} color="#FBBF24" />
              <Text style={styles.warningText}>
                This key is shown only once. Store it somewhere safe.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Bottom button */}
        <View style={styles.bottomArea}>
          <AnimatedPressable onPress={handleDone} style={styles.doneBtn}>
            <Text style={styles.doneBtnText}>Done</Text>
          </AnimatedPressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D12" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A24",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#F5F5FA",
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: { width: 40 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  intro: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(108, 92, 231, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    color: "#F5F5FA",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    color: "#7B7B94",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22,
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: "center",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(248, 113, 113, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: "#F87171", fontSize: 13, fontWeight: "500", flex: 1 },
  retryBtn: {
    backgroundColor: "#1A1A24",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  retryBtnText: { color: "#6C5CE7", fontSize: 15, fontWeight: "600" },
  keyCard: {
    backgroundColor: "#1A1A24",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  keyLabel: {
    color: "#7B7B94",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  keyValue: {
    color: "#F5F5FA",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 12,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(108, 92, 231, 0.12)",
    borderRadius: 12,
    paddingVertical: 10,
  },
  copyBtnText: {
    color: "#6C5CE7",
    fontSize: 14,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#1A1A24",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  infoTitle: {
    color: "#7B7B94",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  infoValue: {
    color: "#F5F5FA",
    fontSize: 14,
    fontWeight: "500",
  },
  infoCode: {
    color: "#4ECDC4",
    fontSize: 13,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontWeight: "500",
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  warningText: {
    color: "#FBBF24",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  bottomArea: {
    marginTop: "auto",
    paddingBottom: 20,
  },
  doneBtn: {
    backgroundColor: "#34D399",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  doneBtnText: {
    color: "#0D0D12",
    fontSize: 16,
    fontWeight: "700",
  },
});
