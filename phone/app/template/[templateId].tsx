import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
  LayoutAnimation,
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { format } from "date-fns";
import Animated, { FadeInDown, FadeIn, FadeInUp } from "react-native-reanimated";
import type BottomSheetType from "@gorhom/bottom-sheet";
import { AnimatedPressable } from "../../src/components/AnimatedPressable";
import { ExerciseMedia } from "../../src/components/ExerciseMedia";
import { SwipeableExerciseRow } from "../../src/components/SwipeableExerciseRow";
import { ExercisePicker } from "../../src/components/ExercisePicker";
import { createSession, completeSession, logSet } from "../../src/db/queries/workouts";
import {
  getTemplateExercises,
  type TemplateExerciseRow,
} from "../../src/db/queries/exercises";
import { getLastSessionSetsForExercise } from "../../src/db/queries/progress";
import {
  removeExerciseFromTemplate,
  addExerciseToTemplate,
  replaceExerciseInTemplate,
} from "../../src/db/queries/templateMutations";

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}

interface ExerciseState {
  done: boolean;
  weight: string;
  reps: string;
  sets: string;
  note: string;
  showNote: boolean;
}

export default function TemplatePreviewScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { templateId } = useLocalSearchParams<{ templateId: string }>();

  const [templateName, setTemplateName] = useState("");
  const [templateColor, setTemplateColor] = useState("#6C5CE7");
  const [templateDescription, setTemplateDescription] = useState("");
  const [exerciseList, setExerciseList] = useState<TemplateExerciseRow[]>([]);
  const [exerciseStates, setExerciseStates] = useState<
    Record<string, ExerciseState>
  >({});
  const [weightUnit, setWeightUnit] = useState("kg");
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pickerMode, setPickerMode] = useState<"add" | "replace">("add");
  const [replaceTargetId, setReplaceTargetId] = useState<number | null>(null);
  const sheetRef = useRef<BottomSheetType>(null);

  // Draft persistence helpers
  const draftKey = `draft_${templateId}`;
  const saveDraftTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveDraft = useCallback(
    (states: Record<string, ExerciseState>) => {
      if (!templateId) return;
      // Debounce: save 500ms after last change
      if (saveDraftTimeout.current) clearTimeout(saveDraftTimeout.current);
      saveDraftTimeout.current = setTimeout(() => {
        db.runAsync(
          "INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)",
          draftKey,
          JSON.stringify(states)
        ).catch(() => {});
      }, 500);
    },
    [db, draftKey, templateId]
  );

  const clearDraft = useCallback(() => {
    if (!templateId) return;
    if (saveDraftTimeout.current) clearTimeout(saveDraftTimeout.current);
    db.runAsync("DELETE FROM user_settings WHERE key = ?", draftKey).catch(
      () => {}
    );
  }, [db, draftKey, templateId]);

  const loadTemplate = useCallback(async () => {
    if (!templateId) return;
    try {
      const tmpl = await db.getFirstAsync<{
        id: string;
        name: string;
        day_label: string;
        color: string;
        description: string | null;
      }>("SELECT * FROM workout_templates WHERE id = ?", templateId);
      if (tmpl) {
        setTemplateName(tmpl.name);
        setTemplateColor(tmpl.color);
        setTemplateDescription(tmpl.description || "");
      }

      // Get weight unit first (needed for converting stored kg values)
      const unitRow = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM user_settings WHERE key = 'weight_unit'"
      );
      const unit = unitRow?.value || "kg";
      setWeightUnit(unit);

      const rows = await getTemplateExercises(db, templateId);
      setExerciseList(rows);

      // Check for saved draft first
      const draftRow = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM user_settings WHERE key = ?",
        draftKey
      );
      if (draftRow?.value) {
        try {
          const saved = JSON.parse(draftRow.value) as Record<
            string,
            ExerciseState
          >;
          // Verify the draft matches current exercises (template may have changed)
          const rowKeys = new Set(
            rows.map((r) => r.exercise_id + "-" + r.sort_order)
          );
          const draftKeys = new Set(Object.keys(saved));
          const keysMatch =
            rowKeys.size === draftKeys.size &&
            [...rowKeys].every((k) => draftKeys.has(k));
          if (keysMatch) {
            setExerciseStates(saved);
            return;
          }
        } catch {
          // Invalid draft, fall through to fresh state
        }
      }

      // Initialize states, pre-filling from last session when available
      const states: Record<string, ExerciseState> = {};
      for (const r of rows) {
        const key = r.exercise_id + "-" + r.sort_order;
        const lastSets = await getLastSessionSetsForExercise(db, r.exercise_id);

        if (lastSets.length > 0) {
          // Convert stored kg to display unit
          const weightKg = lastSets[0].weight;
          const displayWeight =
            unit === "lb"
              ? Math.round((weightKg / 0.453592) * 10) / 10
              : weightKg;
          states[key] = {
            done: false,
            weight: weightKg > 0 ? String(displayWeight) : "",
            reps: String(lastSets[0].reps),
            sets: String(lastSets.length),
            note: r.notes || "",
            showNote: !!r.notes,
          };
        } else {
          // No history: template defaults
          states[key] = {
            done: false,
            weight: "",
            reps:
              r.rep_range_min === r.rep_range_max
                ? String(r.rep_range_min)
                : String(r.rep_range_max),
            sets: String(r.sets),
            note: r.notes || "",
            showNote: !!r.notes,
          };
        }
      }
      setExerciseStates(states);
    } catch (e) {
      console.error("Failed to load template:", e);
    }
  }, [db, templateId, draftKey]);

  useFocusEffect(
    useCallback(() => {
      loadTemplate();
    }, [loadTemplate])
  );

  // Auto-save draft whenever exerciseStates changes (skip initial empty state)
  useEffect(() => {
    if (Object.keys(exerciseStates).length > 0) {
      saveDraft(exerciseStates);
    }
  }, [exerciseStates, saveDraft]);

  // Also save immediately when app goes to background
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" && Object.keys(exerciseStates).length > 0) {
        // Flush immediately (bypass debounce)
        if (saveDraftTimeout.current) clearTimeout(saveDraftTimeout.current);
        db.runAsync(
          "INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)",
          draftKey,
          JSON.stringify(exerciseStates)
        ).catch(() => {});
      }
    });
    return () => sub.remove();
  }, [db, draftKey, exerciseStates]);

  const getKey = (te: TemplateExerciseRow) =>
    te.exercise_id + "-" + te.sort_order;

  const checkedCount = Object.values(exerciseStates).filter(
    (s) => s.done
  ).length;
  const totalCount = exerciseList.length;
  const allDone = checkedCount === totalCount && totalCount > 0;

  const toggleExercise = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExerciseStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], done: !prev[key].done },
    }));
  };

  const updateField = (
    key: string,
    field: "weight" | "reps" | "sets",
    value: string
  ) => {
    setExerciseStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const toggleNote = (key: string) => {
    setExerciseStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], showNote: !prev[key].showNote },
    }));
  };

  const updateNote = (key: string, exerciseId: string, value: string) => {
    setExerciseStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], note: value },
    }));
    // Save to DB immediately
    db.runAsync(
      "UPDATE exercises SET notes = ? WHERE id = ?",
      value || null,
      exerciseId
    );
  };

  const toggleWeightUnit = () => {
    const newUnit = weightUnit === "kg" ? "lb" : "kg";
    setWeightUnit(newUnit);
    db.runAsync(
      "INSERT OR REPLACE INTO user_settings (key, value) VALUES ('weight_unit', ?)",
      newUnit
    );
  };

  const toggleEditMode = () => {
    LayoutAnimation.easeInEaseOut();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const entering = !isEditing;
    setIsEditing(entering);
    if (!entering) {
      // Exiting edit mode: reload to refresh exercise states
      loadTemplate();
    }
  };

  const handleDeleteExercise = async (templateExerciseId: number) => {
    if (!templateId) return;
    await removeExerciseFromTemplate(db, templateExerciseId, templateId);
    const rows = await getTemplateExercises(db, templateId);
    setExerciseList(rows);
  };

  const handleAddExercise = async (exerciseId: string) => {
    if (!templateId) return;
    sheetRef.current?.close();
    await addExerciseToTemplate(db, templateId, exerciseId);
    const rows = await getTemplateExercises(db, templateId);
    setExerciseList(rows);
  };

  const handleReplaceExercise = async (exerciseId: string) => {
    if (!templateId || replaceTargetId === null) return;
    sheetRef.current?.close();
    await replaceExerciseInTemplate(db, replaceTargetId, exerciseId);
    const rows = await getTemplateExercises(db, templateId);
    setExerciseList(rows);
    setReplaceTargetId(null);
  };

  const openPickerForAdd = () => {
    setPickerMode("add");
    setReplaceTargetId(null);
    sheetRef.current?.snapToIndex(0);
  };

  const openPickerForReplace = (templateExerciseId: number) => {
    setPickerMode("replace");
    setReplaceTargetId(templateExerciseId);
    sheetRef.current?.snapToIndex(0);
  };

  const handleSubmitWorkout = async () => {
    if (checkedCount === 0 || submitting) return;
    setSubmitting(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const sessionId = generateId();
      const now = new Date().toISOString();
      const today = format(new Date(), "yyyy-MM-dd");
      await createSession(db, sessionId, templateId!, today, now);

      // Save set logs for all checked exercises
      for (const te of exerciseList) {
        const key = getKey(te);
        const state = exerciseStates[key];
        if (!state?.done) continue;

        const weight = parseFloat(state.weight) || 0;
        const reps = parseInt(state.reps) || 0;
        const sets = parseInt(state.sets) || te.sets;

        // Store weight in kg internally (convert from lb if needed)
        const weightKg =
          weightUnit === "lb" ? weight * 0.453592 : weight;

        for (let s = 1; s <= sets; s++) {
          await logSet(db, sessionId, te.exercise_id, s, weightKg, reps);
        }
      }

      await completeSession(db, sessionId, now, JSON.stringify({ weight_unit: weightUnit }));
      clearDraft();
      router.back();
    } catch (e) {
      console.error("Failed to save workout:", e);
      setSubmitting(false);
    }
  };

  if (!templateName && exerciseList.length === 0) {
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
              style={[styles.headerDot, { backgroundColor: templateColor }]}
            />
            <Text style={styles.headerTitle} numberOfLines={1}>
              {templateName}
            </Text>
          </View>
          {!isEditing && (
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>
                {checkedCount}/{totalCount}
              </Text>
            </View>
          )}
          <AnimatedPressable onPress={toggleEditMode} style={styles.editBtn}>
            {isEditing ? (
              <Text style={styles.editDoneText}>Done</Text>
            ) : (
              <Ionicons name="pencil" size={16} color="#6C5CE7" />
            )}
          </AnimatedPressable>
        </View>

        {/* Description + Unit toggle */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.infoBar}>
          {templateDescription ? (
            <View style={styles.infoPill}>
              <Ionicons name="fitness-outline" size={14} color="#7B7B94" />
              <Text style={styles.infoText} numberOfLines={1}>
                {templateDescription}
              </Text>
            </View>
          ) : null}
          <AnimatedPressable onPress={toggleWeightUnit} style={styles.unitPill}>
            <Ionicons name="swap-horizontal" size={14} color="#6C5CE7" />
            <Text style={styles.unitText}>{weightUnit.toUpperCase()}</Text>
          </AnimatedPressable>
        </Animated.View>

        {/* Exercise List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {isEditing
            ? exerciseList.map((te) => (
                <SwipeableExerciseRow
                  key={te.id}
                  exercise={te}
                  onDelete={handleDeleteExercise}
                  onReplace={openPickerForReplace}
                />
              ))
            : exerciseList.map((te, index) => {
                const key = getKey(te);
                const state = exerciseStates[key];
                if (!state) return null;
                const isDone = state.done;

                return (
                  <Animated.View
                    key={key}
                    entering={FadeInDown.duration(350).delay(index * 60)}
                  >
                    <View
                      style={[
                        styles.exerciseCard,
                        isDone && styles.exerciseCardDone,
                      ]}
                    >
                      {/* Top row: checkbox + media + name */}
                      <AnimatedPressable
                        onPress={() => toggleExercise(key)}
                        style={styles.exerciseTopRow}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            isDone && styles.checkboxDone,
                          ]}
                        >
                          {isDone && (
                            <Ionicons
                              name="checkmark"
                              size={18}
                              color="#0D0D12"
                            />
                          )}
                        </View>

                        <View style={styles.exerciseMediaWrapper}>
                          <ExerciseMedia mediaSlug={te.media_slug} size={70} />
                        </View>

                        <View style={styles.exerciseInfo}>
                          <Text
                            style={[
                              styles.exerciseName,
                              isDone && styles.exerciseNameDone,
                            ]}
                            numberOfLines={2}
                          >
                            {te.exercise_name}
                          </Text>
                          <Text style={styles.exerciseMuscle}>
                            {te.muscle_group || te.equipment
                              ? `${te.muscle_group}${te.muscle_group && te.equipment ? " · " : ""}${te.equipment}`
                              : `${te.sets} x ${te.rep_range_min}-${te.rep_range_max}`}
                          </Text>
                        </View>
                      </AnimatedPressable>

                      {/* Note toggle button - top right */}
                      <AnimatedPressable
                        onPress={() => toggleNote(key)}
                        style={[
                          styles.noteBtn,
                          (state.showNote || !!state.note) &&
                            styles.noteBtnActive,
                        ]}
                      >
                        <Ionicons
                          name={
                            state.note ? "document-text" : "create-outline"
                          }
                          size={14}
                          color={
                            state.showNote || state.note
                              ? "#FB923C"
                              : "#4A4A5E"
                          }
                        />
                      </AnimatedPressable>

                      {/* Note section */}
                      {state.showNote && (
                        <View style={styles.noteRow}>
                          <TextInput
                            style={styles.noteInput}
                            value={state.note}
                            onChangeText={(v) =>
                              updateNote(key, te.exercise_id, v)
                            }
                            placeholder="Add a note..."
                            placeholderTextColor="#4A4A5E"
                            multiline
                            blurOnSubmit
                          />
                        </View>
                      )}
                      {state.note && !state.showNote ? (
                        <AnimatedPressable
                          onPress={() => toggleNote(key)}
                          style={styles.savedNoteRow}
                        >
                          <Ionicons
                            name="document-text"
                            size={13}
                            color="#FB923C"
                          />
                          <Text
                            style={styles.savedNoteText}
                            numberOfLines={1}
                          >
                            {state.note}
                          </Text>
                        </AnimatedPressable>
                      ) : null}

                      {/* Bottom row: input fields */}
                      <View style={styles.inputRow}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Sets</Text>
                          <TextInput
                            style={styles.inputField}
                            value={state.sets}
                            onChangeText={(v) => updateField(key, "sets", v)}
                            keyboardType="number-pad"
                            selectTextOnFocus
                            placeholderTextColor="#4A4A5E"
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Reps</Text>
                          <TextInput
                            style={styles.inputField}
                            value={state.reps}
                            onChangeText={(v) => updateField(key, "reps", v)}
                            keyboardType="number-pad"
                            selectTextOnFocus
                            placeholderTextColor="#4A4A5E"
                          />
                        </View>
                        <View
                          style={[styles.inputGroup, styles.inputGroupWeight]}
                        >
                          <Text style={styles.inputLabel}>
                            Weight ({weightUnit})
                          </Text>
                          <TextInput
                            style={styles.inputField}
                            value={state.weight}
                            onChangeText={(v) =>
                              updateField(key, "weight", v)
                            }
                            keyboardType="decimal-pad"
                            placeholder="0"
                            selectTextOnFocus
                            placeholderTextColor="#4A4A5E"
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Rest</Text>
                          <View style={styles.restDisplay}>
                            <Text style={styles.restDisplayText}>
                              {te.rest_seconds >= 60
                                ? `${Math.floor(te.rest_seconds / 60)}m`
                                : `${te.rest_seconds}s`}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
        </ScrollView>

        {/* Bottom area */}
        {isEditing ? (
          <Animated.View
            entering={FadeInUp.duration(300).springify()}
            style={styles.fabContainer}
          >
            <AnimatedPressable onPress={openPickerForAdd} style={styles.fab}>
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </AnimatedPressable>
          </Animated.View>
        ) : (
          <View style={styles.bottomOverlay}>
            <LinearGradient
              colors={["transparent", "rgba(13, 13, 18, 0.95)", "#0D0D12"]}
              style={styles.bottomGradient}
            />
            <AnimatedPressable
              onPress={handleSubmitWorkout}
              style={[
                styles.submitButton,
                checkedCount > 0
                  ? { backgroundColor: "#34D399" }
                  : { backgroundColor: "#242430" },
              ]}
            >
              <Ionicons
                name={allDone ? "checkmark-circle" : "checkmark-done"}
                size={22}
                color={checkedCount > 0 ? "#0D0D12" : "#4A4A5E"}
                style={styles.submitIcon}
              />
              <Text
                style={[
                  styles.submitText,
                  checkedCount > 0
                    ? { color: "#0D0D12" }
                    : { color: "#4A4A5E" },
                ]}
              >
                {allDone
                  ? "COMPLETE WORKOUT"
                  : checkedCount > 0
                    ? `DONE · ${checkedCount}/${totalCount} EXERCISES`
                    : "MARK EXERCISES TO SUBMIT"}
              </Text>
            </AnimatedPressable>
          </View>
        )}
      </SafeAreaView>

      {/* Exercise Picker */}
      <ExercisePicker
        ref={sheetRef}
        mode={pickerMode}
        templateId={templateId!}
        currentExerciseIds={exerciseList.map((e) => e.exercise_id)}
        replaceTargetId={replaceTargetId ?? undefined}
        onSelect={
          pickerMode === "replace" ? handleReplaceExercise : handleAddExercise
        }
        onClose={() => setReplaceTargetId(null)}
      />
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
  progressBadge: {
    backgroundColor: "rgba(108, 92, 231, 0.15)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 40,
    alignItems: "center",
  },
  progressText: {
    color: "#6C5CE7",
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  infoBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  infoPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#1A1A24",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  infoText: { color: "#7B7B94", fontSize: 12, fontWeight: "600", flex: 1 },
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
  exerciseCardDone: {
    backgroundColor: "rgba(52, 211, 153, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.2)",
  },
  exerciseTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#4A4A5E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkboxDone: { backgroundColor: "#34D399", borderColor: "#34D399" },
  exerciseMediaWrapper: { marginRight: 10 },
  exerciseInfo: { flex: 1 },
  exerciseName: {
    color: "#F5F5FA",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
  },
  exerciseNameDone: { color: "#34D399" },
  exerciseMuscle: { color: "#4A4A5E", fontSize: 11, fontWeight: "500" },
  noteBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#242430",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  noteBtnActive: {
    backgroundColor: "rgba(251, 146, 60, 0.15)",
  },
  noteRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#242430",
  },
  noteInput: {
    backgroundColor: "#242430",
    borderRadius: 10,
    padding: 10,
    color: "#F5F5FA",
    fontSize: 13,
    fontWeight: "500",
    minHeight: 40,
    maxHeight: 100,
  },
  savedNoteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  savedNoteText: {
    color: "#FB923C",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#242430",
  },
  inputGroup: {
    flex: 1,
    alignItems: "center",
  },
  inputGroupWeight: {
    flex: 1.4,
  },
  inputLabel: {
    color: "#7B7B94",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  inputField: {
    backgroundColor: "#242430",
    borderRadius: 10,
    paddingVertical: Platform.OS === "ios" ? 8 : 4,
    paddingHorizontal: 8,
    color: "#F5F5FA",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    width: "100%",
    fontVariant: ["tabular-nums"],
  },
  restDisplay: {
    backgroundColor: "#242430",
    borderRadius: 10,
    paddingVertical: Platform.OS === "ios" ? 8 : 4,
    paddingHorizontal: 8,
    width: "100%",
    alignItems: "center",
  },
  restDisplayText: {
    color: "#7B7B94",
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
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
  submitButton: {
    height: 56,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitIcon: { marginRight: 10 },
  submitText: { fontSize: 15, fontWeight: "800", letterSpacing: 0.5 },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(108, 92, 231, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  editDoneText: {
    color: "#6C5CE7",
    fontSize: 14,
    fontWeight: "700",
  },
  fabContainer: {
    position: "absolute",
    bottom: 40,
    right: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6C5CE7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
