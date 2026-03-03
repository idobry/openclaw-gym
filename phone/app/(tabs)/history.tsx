import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSQLiteContext } from "expo-sqlite";
import { useRouter } from "expo-router";
import { format, parseISO, startOfWeek } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AnimatedPressable } from "../../src/components/AnimatedPressable";
import {
  getRecentSessions,
  type SessionWithTemplate,
} from "../../src/db/queries/workouts";

interface SessionWithSets extends SessionWithTemplate {
  totalVolume: number;
  duration: string;
}

export default function HistoryScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const [sessions, setSessions] = useState<SessionWithSets[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const raw = await getRecentSessions(db, 50);
      const enriched: SessionWithSets[] = raw.map((s) => {
        let duration = "";
        if (s.started_at && s.completed_at) {
          const mins = Math.round(
            (new Date(s.completed_at).getTime() -
              new Date(s.started_at).getTime()) /
              60000
          );
          duration = `${mins} min`;
        }
        return { ...s, totalVolume: 0, duration };
      });
      setSessions(enriched);
    } catch (e) {
      console.error("Failed to load sessions:", e);
    }
  }, [db]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  }, [loadSessions]);

  // Group by week
  const grouped = sessions.reduce<Record<string, SessionWithSets[]>>(
    (acc, session) => {
      const weekKey = format(
        startOfWeek(parseISO(session.date), { weekStartsOn: 1 }),
        "MMM d, yyyy"
      );
      if (!acc[weekKey]) acc[weekKey] = [];
      acc[weekKey].push(session);
      return acc;
    },
    {}
  );

  const sectionData = Object.entries(grouped).map(([week, items]) => ({
    week,
    items,
  }));

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="barbell-outline" size={48} color="#7B7B94" />
      </View>
      <Text style={styles.emptyTitle}>No workouts yet</Text>
      <Text style={styles.emptySubtitle}>
        Complete your first workout to see it here
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.largeTitle}>History</Text>

      <FlatList
        data={sectionData}
        keyExtractor={(item) => item.week}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + 20 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6C5CE7"
          />
        }
        ListEmptyComponent={renderEmpty}
        renderItem={({ item: section, index: sectionIndex }) => (
          <View style={styles.weekSection}>
            <Text style={styles.weekHeader}>Week of {section.week}</Text>
            {section.items.map((session, sessionIndex) => (
              <Animated.View
                key={session.id}
                entering={FadeInDown.duration(300).delay(
                  sectionIndex * 80 + sessionIndex * 60
                )}
              >
                <AnimatedPressable
                  onPress={() => router.push(`/session/${session.id}`)}
                  style={[
                    styles.sessionRow,
                    { borderLeftColor: session.template_color },
                  ]}
                >
                  <View style={styles.sessionColorBar}>
                    <View
                      style={[
                        styles.colorIndicator,
                        { backgroundColor: session.template_color },
                      ]}
                    />
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionName}>
                      {session.template_name}
                    </Text>
                    <Text style={styles.sessionMeta}>
                      {format(parseISO(session.date), "EEE, MMM d")}
                      {session.duration ? ` \u00B7 ${session.duration}` : ""}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#7B7B94"
                  />
                </AnimatedPressable>
              </Animated.View>
            ))}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D12",
  },
  largeTitle: {
    color: "#F5F5FA",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0.37,
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  weekSection: {
    marginBottom: 24,
  },
  weekHeader: {
    color: "#7B7B94",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sessionRow: {
    backgroundColor: "#1A1A24",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
  },
  sessionColorBar: {
    marginRight: 12,
  },
  colorIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    color: "#F5F5FA",
    fontSize: 16,
    fontWeight: "600",
  },
  sessionMeta: {
    color: "#7B7B94",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 3,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#1A1A24",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    color: "#F5F5FA",
    fontSize: 20,
    fontWeight: "700",
  },
  emptySubtitle: {
    color: "#7B7B94",
    fontSize: 15,
    fontWeight: "500",
    marginTop: 8,
  },
});
