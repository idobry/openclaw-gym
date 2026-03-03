import "../global.css";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SQLiteProvider, type SQLiteDatabase } from "expo-sqlite";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { runMigrations } from "../src/db/migrations";
import { useAuthStore } from "../src/stores/authStore";

const DB_NAME = "gym.db";

async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await db.execAsync("PRAGMA foreign_keys = ON;");
  await runMigrations(db);
}

function AuthInitializer() {
  const initialize = useAuthStore((s) => s.initialize);
  useEffect(() => {
    initialize();
  }, [initialize]);
  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0D0D12" }}>
        <SQLiteProvider
          databaseName={DB_NAME}
          onInit={initializeDatabase}
          useSuspense={false}
        >
          <AuthInitializer />
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#0D0D12" },
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="workout/[templateId]"
              options={{
                presentation: "fullScreenModal",
                animation: "slide_from_bottom",
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="workout/complete"
              options={{
                presentation: "fullScreenModal",
                animation: "fade",
                gestureEnabled: false,
              }}
            />
            <Stack.Screen name="template/[templateId]" />
            <Stack.Screen name="session/[sessionId]" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="exercise/[exerciseId]" />
            <Stack.Screen
              name="auth/login"
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />
            <Stack.Screen
              name="auth/register"
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />
          </Stack>
        </SQLiteProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
