import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AnimatedPressable } from "../../src/components/AnimatedPressable";
import {
  validateProgram,
  importProgram,
  importUnifiedData,
} from "../../src/db/queries/import";
import { useOnboardingStore } from "../../src/stores/onboardingStore";

export default function ImportScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { completeOnboarding } = useOnboardingStore();

  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    setError(null);
    setImporting(true);
    try {
      const parsed = JSON.parse(jsonText);
      const result = validateProgram(parsed);
      if (!result.valid) {
        setError(result.error!);
        setImporting(false);
        return;
      }
      await importProgram(db, result.program!, jsonText);
      await importUnifiedData(db, parsed);

      completeOnboarding();
      router.replace("/(tabs)");
    } catch (e: any) {
      if (e.message?.includes("JSON")) {
        setError("Invalid JSON format. Check your syntax.");
      } else {
        setError(e.message || "Import failed");
      }
    }
    setImporting(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <AnimatedPressable
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color="#F5F5FA" />
          </AnimatedPressable>
          <Text style={styles.headerTitle}>Import Program</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.duration(400).delay(0)}>
            <Text style={styles.subtitle}>
              Paste your workout program JSON below
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <TextInput
              style={styles.jsonInput}
              value={jsonText}
              onChangeText={(text) => {
                setJsonText(text);
                setError(null);
              }}
              placeholder='{ "program_name": "My Program", "workouts": {...} }'
              placeholderTextColor="#4A4A5E"
              multiline
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
            />
          </Animated.View>

          {error && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={18} color="#F87171" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            <AnimatedPressable
              onPress={handleImport}
              style={[
                styles.importBtn,
                !jsonText.trim() && styles.importBtnDisabled,
              ]}
            >
              {importing ? (
                <Text style={styles.importBtnText}>Importing...</Text>
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload"
                    size={20}
                    color={jsonText.trim() ? "#0D0D12" : "#4A4A5E"}
                  />
                  <Text
                    style={[
                      styles.importBtnText,
                      !jsonText.trim() && styles.importBtnTextDisabled,
                    ]}
                  >
                    Import Program
                  </Text>
                </>
              )}
            </AnimatedPressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D12" },
  flex: { flex: 1 },
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  subtitle: {
    color: "#7B7B94",
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 20,
  },
  jsonInput: {
    backgroundColor: "#1A1A24",
    borderRadius: 16,
    padding: 16,
    color: "#F5F5FA",
    fontSize: 13,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    minHeight: 250,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: "#242430",
    marginBottom: 16,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(248, 113, 113, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: "#F87171", fontSize: 13, fontWeight: "500", flex: 1 },
  importBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#34D399",
    borderRadius: 14,
    paddingVertical: 16,
  },
  importBtnDisabled: { backgroundColor: "#242430" },
  importBtnText: { color: "#0D0D12", fontSize: 16, fontWeight: "700" },
  importBtnTextDisabled: { color: "#4A4A5E" },
});
