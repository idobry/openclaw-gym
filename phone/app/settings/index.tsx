import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Share,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AnimatedPressable } from "../../src/components/AnimatedPressable";
import { auth as authApi, type ApiKeyInfo } from "../../src/lib/apiClient";
import {
  validateProgram,
  importProgram,
  importUnifiedData,
  getProgramJson,
  getProgramName,
  hasProgram,
  deleteProgram,
} from "../../src/db/queries/import";
import { exportFullData } from "../../src/db/queries/history";
import { useAuthStore } from "../../src/stores/authStore";
import { useSync } from "../../src/hooks/useSync";

export default function SettingsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { user, isAuthenticated, signOut } = useAuthStore();
  const { isSyncing, lastSyncedAt, syncNow, loadLastSynced } = useSync();

  const [hasProgramData, setHasProgramData] = useState(false);
  const [programName, setProgramName] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const has = await hasProgram(db);
        setHasProgramData(has);
        if (has) {
          const name = await getProgramName(db);
          setProgramName(name);
          const json = await getProgramJson(db);
          if (json) setJsonText(json);
        }
        loadLastSynced();
        if (useAuthStore.getState().isAuthenticated) {
          setLoadingKeys(true);
          authApi.listApiKeys().then(setApiKeys).catch(console.warn).finally(() => setLoadingKeys(false));
        }
      })();
    }, [db, loadLastSynced])
  );

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

      // Also restore settings + history if present in the JSON
      const { historyCount } = await importUnifiedData(db, parsed);

      setShowEditor(false);
      setHasProgramData(true);
      setProgramName(result.program!.program_name);

      const historyMsg = historyCount > 0 ? ` Restored ${historyCount} workout sessions.` : "";
      Alert.alert(
        "Program Imported",
        `"${result.program!.program_name}" with ${result.program!.workouts.length} workout days loaded.${historyMsg}`
      );
    } catch (e: any) {
      if (e.message?.includes("JSON")) {
        setError("Invalid JSON format. Check your syntax.");
      } else {
        setError(e.message || "Import failed");
      }
    }
    setImporting(false);
  };

  const handleGenerateKey = async () => {
    router.push("/onboarding/agent-setup");
  };

  const handleRevokeKey = (keyId: number, keyName: string) => {
    Alert.alert(
      "Revoke API Key",
      `Are you sure you want to revoke "${keyName}"? Any agent using this key will lose access.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: async () => {
            try {
              await authApi.revokeApiKey(keyId);
              setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to revoke key");
            }
          },
        },
      ]
    );
  };

  const handleExportHistory = async () => {
    try {
      const data = await exportFullData(db);
      const jsonStr = JSON.stringify(data, null, 2);
      await Share.share({
        message: jsonStr,
        title: "GymTracker Export",
      });
    } catch (e: any) {
      if (e.message !== "User did not share") {
        Alert.alert("Export Failed", e.message || "Unknown error");
      }
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Program",
      "This will remove all workout templates and exercises. Your workout history will be kept.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteProgram(db);
            setHasProgramData(false);
            setProgramName("");
            setJsonText("");
            setShowEditor(false);
          },
        },
      ]
    );
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
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Current Program */}
          <Animated.View entering={FadeInDown.duration(400).delay(0)}>
            <Text style={styles.sectionTitle}>Workout Program</Text>
          </Animated.View>

          {hasProgramData && !showEditor && (
            <Animated.View entering={FadeInDown.duration(400).delay(60)}>
              <View style={styles.currentCard}>
                <View style={styles.currentInfo}>
                  <Ionicons
                    name="barbell-outline"
                    size={24}
                    color="#6C5CE7"
                  />
                  <View style={styles.currentTextBlock}>
                    <Text style={styles.currentName}>{programName}</Text>
                    <Text style={styles.currentSub}>Program loaded</Text>
                  </View>
                </View>

                <View style={styles.currentActions}>
                  <AnimatedPressable
                    onPress={() => setShowEditor(true)}
                    style={styles.actionBtn}
                  >
                    <Ionicons name="create-outline" size={18} color="#6C5CE7" />
                    <Text style={styles.actionBtnText}>Replace</Text>
                  </AnimatedPressable>
                  <AnimatedPressable
                    onPress={handleDelete}
                    style={styles.actionBtnDanger}
                  >
                    <Ionicons name="trash-outline" size={18} color="#F87171" />
                    <Text style={styles.actionBtnTextDanger}>Delete</Text>
                  </AnimatedPressable>
                </View>
              </View>
            </Animated.View>
          )}

          {(!hasProgramData || showEditor) && (
            <Animated.View entering={FadeInDown.duration(400).delay(60)}>
              {/* Instructions */}
              <View style={styles.instructionCard}>
                <Text style={styles.instructionTitle}>
                  Paste your workout JSON
                </Text>
                <Text style={styles.instructionText}>
                  Format: {`{ "program_name": "...", "exercises": [...], "workouts": { ... } }`}
                </Text>
                <Text style={styles.instructionText}>
                  Define exercises once in a top-level "exercises" array, then
                  reference them by id in workouts with sets, reps, rest_seconds.
                  Old format (exercises embedded in workouts) still works.
                </Text>
              </View>

              {/* JSON Input */}
              <TextInput
                style={styles.jsonInput}
                value={jsonText}
                onChangeText={(text) => {
                  setJsonText(text);
                  setError(null);
                }}
                placeholder='{ "program_name": "My Program", "workouts": [...] }'
                placeholderTextColor="#4A4A5E"
                multiline
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
              />

              {/* Error */}
              {error && (
                <View style={styles.errorCard}>
                  <Ionicons
                    name="alert-circle"
                    size={18}
                    color="#F87171"
                  />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Import Button */}
              <View style={styles.importActions}>
                {showEditor && (
                  <AnimatedPressable
                    onPress={() => {
                      setShowEditor(false);
                      setError(null);
                    }}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </AnimatedPressable>
                )}
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
              </View>
            </Animated.View>
          )}

          {/* Backup & Sync */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
              Backup & Sync
            </Text>

            {/* Account Card */}
            {!isAuthenticated ? (
              <AnimatedPressable
                onPress={() => router.push("/auth/login")}
                style={styles.accountCard}
              >
                <View style={styles.accountIconWrap}>
                  <Ionicons name="person-outline" size={22} color="#6C5CE7" />
                </View>
                <View style={styles.accountTextBlock}>
                  <Text style={styles.accountTitle}>Sign in to sync</Text>
                  <Text style={styles.accountSub}>
                    Connect with your AI coach
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#7B7B94" />
              </AnimatedPressable>
            ) : (
              <View style={styles.accountCardLoggedIn}>
                <View style={styles.accountRow}>
                  <View style={styles.accountIconWrap}>
                    <Ionicons name="person" size={22} color="#6C5CE7" />
                  </View>
                  <View style={styles.accountTextBlock}>
                    <Text style={styles.accountTitle}>{user?.email}</Text>
                    {lastSyncedAt && (
                      <Text style={styles.accountSub}>
                        Last synced{" "}
                        {new Date(lastSyncedAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.accountActions}>
                  <AnimatedPressable
                    onPress={() => syncNow()}
                    style={styles.syncBtn}
                  >
                    {isSyncing ? (
                      <ActivityIndicator size="small" color="#6C5CE7" />
                    ) : (
                      <>
                        <Ionicons
                          name="sync-outline"
                          size={16}
                          color="#6C5CE7"
                        />
                        <Text style={styles.syncBtnText}>Sync Now</Text>
                      </>
                    )}
                  </AnimatedPressable>
                  <AnimatedPressable
                    onPress={() =>
                      Alert.alert("Sign Out", "Your local data will be kept.", [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Sign Out",
                          style: "destructive",
                          onPress: signOut,
                        },
                      ])
                    }
                    style={styles.signOutBtn}
                  >
                    <Ionicons
                      name="log-out-outline"
                      size={16}
                      color="#F87171"
                    />
                    <Text style={styles.signOutBtnText}>Sign Out</Text>
                  </AnimatedPressable>
                </View>
              </View>
            )}

            <AnimatedPressable
              onPress={handleExportHistory}
              style={[styles.exportBtn, { marginTop: 12 }]}
            >
              <Ionicons name="download-outline" size={20} color="#4ECDC4" />
              <View style={styles.exportBtnTextBlock}>
                <Text style={styles.exportBtnTitle}>Export All Data</Text>
                <Text style={styles.exportBtnSub}>
                  Program, settings, history - one JSON file
                </Text>
              </View>
              <Ionicons name="share-outline" size={18} color="#7B7B94" />
            </AnimatedPressable>
          </Animated.View>

          {/* Agent Access - only shown when authenticated */}
          {isAuthenticated && (
            <Animated.View entering={FadeInDown.duration(400).delay(120)}>
              <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
                Agent Access
              </Text>

              {apiKeys.length > 0 ? (
                apiKeys.map((key) => (
                  <View key={key.id} style={[styles.accountCardLoggedIn, { marginBottom: 8 }]}>
                    <View style={styles.accountRow}>
                      <View style={styles.accountIconWrap}>
                        <Ionicons name="key" size={18} color="#6C5CE7" />
                      </View>
                      <View style={styles.accountTextBlock}>
                        <Text style={styles.accountTitle}>{key.name}</Text>
                        <Text style={styles.accountSub}>
                          Created {new Date(key.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <AnimatedPressable
                      onPress={() => handleRevokeKey(key.id, key.name)}
                      style={styles.actionBtnDanger}
                    >
                      <Ionicons name="trash-outline" size={16} color="#F87171" />
                      <Text style={styles.actionBtnTextDanger}>Revoke</Text>
                    </AnimatedPressable>
                  </View>
                ))
              ) : (
                <View style={styles.accountCard}>
                  <View style={styles.accountIconWrap}>
                    <Ionicons name="key-outline" size={18} color="#7B7B94" />
                  </View>
                  <Text style={[styles.accountSub, { flex: 1 }]}>
                    No API keys yet
                  </Text>
                </View>
              )}

              <AnimatedPressable
                onPress={handleGenerateKey}
                style={[styles.syncBtn, { marginTop: 8, paddingVertical: 14 }]}
              >
                <Ionicons name="add-circle-outline" size={18} color="#6C5CE7" />
                <Text style={styles.syncBtnText}>Generate New Key</Text>
              </AnimatedPressable>
            </Animated.View>
          )}

          {/* JSON Preview */}
          <Animated.View entering={FadeInDown.duration(400).delay(140)}>
            <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
              {hasProgramData ? "Current Program JSON" : "Example JSON"}
            </Text>
            <View style={styles.exampleCard}>
              <Text style={styles.exampleText}>
                {hasProgramData ? jsonText : EXAMPLE_JSON}
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const EXAMPLE_JSON = `{
  "program_name": "Push Pull Legs",
  "exercises": [
    {
      "id": "bench_press",
      "name": "Bench Press",
      "muscle_group": "Chest",
      "equipment": "Barbell",
      "image_url": "bench_press"
    },
    {
      "id": "barbell_row",
      "name": "Barbell Row",
      "muscle_group": "Back",
      "equipment": "Barbell"
    }
  ],
  "workouts": {
    "push": {
      "name": "Push",
      "color": "#FF6B6B",
      "exercises": [
        { "id": "bench_press", "sets": 4, "reps": "6-8", "rest_seconds": 180 }
      ]
    },
    "pull": {
      "name": "Pull",
      "color": "#4ECDC4",
      "exercises": [
        { "id": "barbell_row", "sets": 4, "reps": "8-10", "rest_seconds": 120 }
      ]
    }
  }
}`;

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
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: {
    color: "#F5F5FA",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },

  // Current program card
  currentCard: {
    backgroundColor: "#1A1A24",
    borderRadius: 20,
    padding: 20,
  },
  currentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  currentTextBlock: { flex: 1 },
  currentName: { color: "#F5F5FA", fontSize: 18, fontWeight: "700" },
  currentSub: {
    color: "#7B7B94",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  currentActions: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(108, 92, 231, 0.12)",
    borderRadius: 14,
    paddingVertical: 12,
  },
  actionBtnText: { color: "#6C5CE7", fontSize: 14, fontWeight: "600" },
  actionBtnDanger: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(248, 113, 113, 0.12)",
    borderRadius: 14,
    paddingVertical: 12,
  },
  actionBtnTextDanger: { color: "#F87171", fontSize: 14, fontWeight: "600" },

  // Instructions
  instructionCard: {
    backgroundColor: "#1A1A24",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  instructionTitle: { color: "#F5F5FA", fontSize: 16, fontWeight: "600" },
  instructionText: { color: "#7B7B94", fontSize: 13, fontWeight: "500" },

  // JSON input
  jsonInput: {
    backgroundColor: "#1A1A24",
    borderRadius: 16,
    padding: 16,
    color: "#F5F5FA",
    fontSize: 13,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    minHeight: 200,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: "#242430",
    marginBottom: 12,
  },

  // Error
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

  // Import actions
  importActions: { flexDirection: "row", gap: 10, marginBottom: 8 },
  cancelBtn: {
    backgroundColor: "#242430",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: { color: "#7B7B94", fontSize: 15, fontWeight: "600" },
  importBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6C5CE7",
    borderRadius: 14,
    paddingVertical: 14,
  },
  importBtnDisabled: { backgroundColor: "#242430" },
  importBtnText: { color: "#0D0D12", fontSize: 15, fontWeight: "700" },
  importBtnTextDisabled: { color: "#4A4A5E" },

  // Account
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#1A1A24",
    borderRadius: 16,
    padding: 16,
  },
  accountCardLoggedIn: {
    backgroundColor: "#1A1A24",
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  accountIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(108, 92, 231, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  accountTextBlock: { flex: 1 },
  accountTitle: { color: "#F5F5FA", fontSize: 15, fontWeight: "600" },
  accountSub: {
    color: "#7B7B94",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  accountActions: { flexDirection: "row", gap: 10 },
  syncBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(108, 92, 231, 0.12)",
    borderRadius: 14,
    paddingVertical: 12,
  },
  syncBtnText: { color: "#6C5CE7", fontSize: 14, fontWeight: "600" },
  signOutBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(248, 113, 113, 0.12)",
    borderRadius: 14,
    paddingVertical: 12,
  },
  signOutBtnText: { color: "#F87171", fontSize: 14, fontWeight: "600" },

  // Export
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#1A1A24",
    borderRadius: 16,
    padding: 16,
  },
  exportBtnTextBlock: { flex: 1 },
  exportBtnTitle: { color: "#F5F5FA", fontSize: 15, fontWeight: "600" },
  exportBtnSub: {
    color: "#7B7B94",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },

  // Example
  exampleCard: {
    backgroundColor: "#1A1A24",
    borderRadius: 16,
    padding: 16,
  },
  exampleText: {
    color: "#7B7B94",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    lineHeight: 18,
  },
});
