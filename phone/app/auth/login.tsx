import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedPressable } from "../../src/components/AnimatedPressable";
import { useAuthStore } from "../../src/stores/authStore";
import { syncAll } from "../../src/lib/sync";

export default function LoginScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const signIn = useAuthStore((s) => s.signIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) return;
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // Wait for sync so data is ready when user lands on home screen
      await syncAll(db).catch(console.warn);
      router.back();
    } catch (e: any) {
      setError(e.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
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
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={22} color="#F5F5FA" />
          </AnimatedPressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to sync with your AI coach
          </Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#4A4A5E"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                placeholderTextColor="#4A4A5E"
                secureTextEntry
                textContentType="password"
              />
            </View>

            {error && (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={18} color="#F87171" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <AnimatedPressable
              onPress={handleSignIn}
              style={[
                styles.signInBtn,
                (!email.trim() || !password) && styles.btnDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#0D0D12" />
              ) : (
                <Text
                  style={[
                    styles.signInBtnText,
                    (!email.trim() || !password) && styles.btnTextDisabled,
                  ]}
                >
                  Sign In
                </Text>
              )}
            </AnimatedPressable>
          </View>

          <AnimatedPressable
            onPress={() => {
              router.back();
              setTimeout(() => router.push("/auth/register"), 100);
            }}
            style={styles.switchLink}
          >
            <Text style={styles.switchText}>
              Don't have an account?{" "}
              <Text style={styles.switchTextAccent}>Create one</Text>
            </Text>
          </AnimatedPressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D12" },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A24",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    color: "#F5F5FA",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    color: "#7B7B94",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 40,
  },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: {
    color: "#7B7B94",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#1A1A24",
    borderRadius: 14,
    padding: 16,
    color: "#F5F5FA",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#242430",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(248, 113, 113, 0.1)",
    borderRadius: 12,
    padding: 12,
  },
  errorText: { color: "#F87171", fontSize: 13, fontWeight: "500", flex: 1 },
  signInBtn: {
    backgroundColor: "#6C5CE7",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  btnDisabled: { backgroundColor: "#242430" },
  signInBtnText: {
    color: "#0D0D12",
    fontSize: 16,
    fontWeight: "700",
  },
  btnTextDisabled: { color: "#4A4A5E" },
  switchLink: {
    alignItems: "center",
    marginTop: 24,
    padding: 12,
  },
  switchText: {
    color: "#7B7B94",
    fontSize: 14,
    fontWeight: "500",
  },
  switchTextAccent: {
    color: "#6C5CE7",
    fontWeight: "600",
  },
});
