import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { format, parseISO } from "date-fns";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { AnimatedPressable } from "../../src/components/AnimatedPressable";
import { ExerciseMedia } from "../../src/components/ExerciseMedia";
import {
  getSessionSetsWithExercises,
  updateSetLog,
  type SessionWithTemplate,
  type SetLogWithExercise,
} from "../../src/db/queries/workouts";

interface ExerciseGroup {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  equipment: string;
  mediaSlug: string | null;
  sets: SetLogWithExercise[];
}

interface EditState {
  weight: string;
  reps: string;
}

export default function SessionDetailScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [session, setSession] = useState<SessionWithTemplate | null>(null);
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([]);
  const [weightUnit, setWeightUnit] = useState("kg");
  const [edits, setEdits] = useState<Record<number, EditState>>({});
  const [saving, setSaving] = useState(false);

  const hasChanges = Object.keys(edits).length > 0;

  const loadSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      const s = await db.getFirstAsync<SessionWithTemplate>(
        `SELECT ws.*, wt.name as template_name, wt.color as template_color
         FROM workout_sessions ws
         JOIN workout_templates wt ON ws.template_id = wt.id
         WHERE ws.id = ?`,
        sessionId
      );
      setSession(s);

      // Parse weight_unit from session notes JSON
      if (s?.notes) {
        try {
          const parsed = JSON.parse(s.notes);
          if (parsed.weight_unit) setWeightUnit(parsed.weight_unit);
        } catch {
          // not JSON, ignore
        }
      }

      const sets = await getSessionSetsWithExercises(db, sessionId);

      // Group by exercise_id preserving order
      const groupMap = new Map<string, ExerciseGroup>();
      for (const set of sets) {
        let group = groupMap.get(set.exercise_id);
        if (!group) {
          group = {
            exerciseId: set.exercise_id,
            exerciseName: set.exercise_name,
            muscleGroup: set.muscle_group,
            equipment: set.equipment,
            mediaSlug: set.media_slug,
            sets: [],
          };
          groupMap.set(set.exercise_id, group);
        }
        group.sets.push(set);
      }
      setExerciseGroups(Array.from(groupMap.values()));
    } catch (e) {
      console.error("Failed to load session:", e);
    }
  }, [db, sessionId]);

  useFocusEffect(
    useCallback(() => {
      loadSession();
      setEdits({});
    }, [loadSession])
  );

  const getDisplayWeight = (weightKg: number): string => {
    if (weightUnit === "lb") {
      return String(Math.round((weightKg / 0.453592) * 10) / 10);
    }
    return String(weightKg);
  };

  const getCurrentWeight = (set: SetLogWithExercise): string => {
    const edit = edits[set.id];
    if (edit) return edit.weight;
    return getDisplayWeight(set.weight);
  };

  const getCurrentReps = (set: SetLogWithExercise): string => {
    const edit = edits[set.id];
    if (edit) return edit.reps;
    return String(set.reps);
  };

  const handleEdit = (
    setLog: SetLogWithExercise,
    field: "weight" | "reps",
    value: string
  ) => {
    setEdits((prev) => {
      const existing = prev[setLog.id] ?? {
        weight: getDisplayWeight(setLog.weight),
        reps: String(setLog.reps),
      };
      return { ...prev, [setLog.id]: { ...existing, [field]: value } };
    });
  };

  const handleSave = async () => {
    if (!hasChanges || saving) return;
    setSaving(true);
    try {
      for (const [idStr, edit] of Object.entries(edits)) {
        const setLogId = Number(idStr);
        const weight = parseFloat(edit.weight) || 0;
        const reps = parseInt(edit.reps) || 0;
        // Convert display unit back to kg for storage
        const weightKg =
          weightUnit === "lb" ? weight * 0.453592 : weight;
        await updateSetLog(db, setLogId, weightKg, reps);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEdits({});
      await loadSession();
    } catch (e) {
      console.error("Failed to save edits:", e);
    } finally {
      setSaving(false);
    }
  };

  const duration = (() => {
    if (!session?.started_at || !session?.completed_at) return null;
    const mins = Math.round(
      (new Date(session.completed_at).getTime() -
        new Date(session.started_at).getTime()) /
        60000
    );
    return `${mins} min`;
  })();

  if (!session) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <AnimatedPressable
            onPress={() => router.back()}
            style={styles.headerBackBtn}
          >
            <Ionicons name="arrow-back" size={22} color="#F5F5FA" />
          </AnimatedPressable>
          <View style={styles.headerCenter}>
            <View
              style={[
                styles.headerDot,
                { backgroundColor: session.template_color },
              ]}
            />
            <Text style={styles.headerTitle} numberOfLines={1}>
              {session.template_name}
            </Text>
          </View>
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>
              {format(parseISO(session.date), "MMM d")}
            </Text>
          </View>
        </View>

        {/* Info bar */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.infoBar}>
          {duration && (
            <View style={styles.infoPill}>
              <Ionicons name="time-outline" size={14} color="#7B7B94" />
              <Text style={styles.infoText}>{duration}</Text>
            </View>
          )}
          <View style={styles.unitPill}>
            <Ionicons name="barbell-outline" size={14} color="#6C5CE7" />
            <Text style={styles.unitText}>{weightUnit.toUpperCase()}</Text>
          </View>
        </Animated.View>

        {/* Exercise cards */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {exerciseGroups.map((group, index) => (
            <Animated.View
              key={group.exerciseId}
              entering={FadeInDown.duration(350).delay(index * 60)}
            >
              <View style={styles.exerciseCard}>
                {/* Top row: media + name */}
                <View style={styles.exerciseTopRow}>
                  <View style={styles.exerciseMediaWrapper}>
                    <ExerciseMedia mediaSlug={group.mediaSlug} size={70} />
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName} numberOfLines={2}>
                      {group.exerciseName}
                    </Text>
                    <Text style={styles.exerciseMuscle}>
                      {group.muscleGroup}
                      {group.muscleGroup && group.equipment ? " · " : ""}
                      {group.equipment}
                    </Text>
                  </View>
                </View>

                {/* Set rows */}
                <View style={styles.setsContainer}>
                  <View style={styles.setHeaderRow}>
                    <Text style={[styles.setHeaderLabel, styles.setNumCol]}>
                      SET
                    </Text>
                    <Text style={[styles.setHeaderLabel, styles.setValCol]}>
                      WEIGHT ({weightUnit})
                    </Text>
                    <Text style={[styles.setHeaderLabel, styles.setValCol]}>
                      REPS
                    </Text>
                  </View>
                  {group.sets.map((set) => (
                    <View key={set.id} style={styles.setRow}>
                      <Text style={[styles.setNumber, styles.setNumCol]}>
                        {set.is_warmup ? "W" : set.set_number}
                      </Text>
                      <View style={styles.setValCol}>
                        <TextInput
                          style={[
                            styles.setInput,
                            edits[set.id] && styles.setInputEdited,
                          ]}
                          value={getCurrentWeight(set)}
                          onChangeText={(v) => handleEdit(set, "weight", v)}
                          keyboardType="decimal-pad"
                          selectTextOnFocus
                          placeholderTextColor="#4A4A5E"
                        />
                      </View>
                      <View style={styles.setValCol}>
                        <TextInput
                          style={[
                            styles.setInput,
                            edits[set.id] && styles.setInputEdited,
                          ]}
                          value={getCurrentReps(set)}
                          onChangeText={(v) => handleEdit(set, "reps", v)}
                          keyboardType="number-pad"
                          selectTextOnFocus
                          placeholderTextColor="#4A4A5E"
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Save button */}
        {hasChanges && (
          <View style={styles.bottomOverlay}>
            <LinearGradient
              colors={["transparent", "rgba(13, 13, 18, 0.95)", "#0D0D12"]}
              style={styles.bottomGradient}
            />
            <AnimatedPressable
              onPress={handleSave}
              style={[
                styles.saveButton,
                saving && { opacity: 0.6 },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={22}
                color="#0D0D12"
                style={styles.saveIcon}
              />
              <Text style={styles.saveText}>
                {saving ? "SAVING..." : "SAVE CHANGES"}
              </Text>
            </AnimatedPressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0D12" },
  container: { flex: 1 },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#0D0D12",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { color: "#7B7B94", fontSize: 17, fontWeight: "500" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A24",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headerDot: { width: 12, height: 12, borderRadius: 6 },
  headerTitle: { color: "#F5F5FA", fontSize: 18, fontWeight: "700" },
  dateBadge: {
    backgroundColor: "rgba(108, 92, 231, 0.15)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 40,
    alignItems: "center",
  },
  dateText: {
    color: "#6C5CE7",
    fontSize: 13,
    fontWeight: "700",
  },
  infoBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#1A1A24",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  infoText: { color: "#7B7B94", fontSize: 12, fontWeight: "600" },
  unitPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(108, 92, 231, 0.12)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  unitText: { color: "#6C5CE7", fontSize: 13, fontWeight: "700" },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 130 },
  exerciseCard: {
    backgroundColor: "#1A1A24",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  exerciseTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseMediaWrapper: { marginRight: 10 },
  exerciseInfo: { flex: 1 },
  exerciseName: {
    color: "#F5F5FA",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
  },
  exerciseMuscle: { color: "#4A4A5E", fontSize: 11, fontWeight: "500" },
  setsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#242430",
  },
  setHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  setHeaderLabel: {
    color: "#7B7B94",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  setNumCol: { width: 40 },
  setValCol: { flex: 1, alignItems: "center" },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  setNumber: {
    color: "#7B7B94",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  setInput: {
    backgroundColor: "#242430",
    borderRadius: 10,
    paddingVertical: Platform.OS === "ios" ? 8 : 4,
    paddingHorizontal: 8,
    color: "#F5F5FA",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    width: "80%",
    fontVariant: ["tabular-nums"],
  },
  setInputEdited: {
    borderWidth: 1,
    borderColor: "rgba(108, 92, 231, 0.4)",
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  bottomGradient: {
    position: "absolute",
    top: -40,
    left: 0,
    right: 0,
    height: 60,
  },
  saveButton: {
    height: 56,
    borderRadius: 20,
    backgroundColor: "#34D399",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  saveIcon: { marginRight: 10 },
  saveText: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#0D0D12",
  },
});
