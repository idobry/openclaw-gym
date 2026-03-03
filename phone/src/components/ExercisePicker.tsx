import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Keyboard,
  Modal,
  Dimensions,
} from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useSQLiteContext } from "expo-sqlite";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { ExerciseMedia } from "./ExerciseMedia";
import { AnimatedPressable } from "./AnimatedPressable";
import { getAllExercises, type Exercise } from "../db/queries/exercises";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PREVIEW_SIZE = Math.min(SCREEN_WIDTH - 80, 280);

interface ExercisePickerProps {
  mode: "add" | "replace";
  templateId: string;
  currentExerciseIds: string[];
  replaceTargetId?: number;
  onSelect: (exerciseId: string) => void;
  onClose: () => void;
}

export const ExercisePicker = React.forwardRef<BottomSheet, ExercisePickerProps>(
  function ExercisePicker(
    { mode, currentExerciseIds, onSelect, onClose },
    ref
  ) {
    const db = useSQLiteContext();
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [search, setSearch] = useState("");
    const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
    const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
    const snapPoints = useMemo(() => ["60%", "90%"], []);

    useEffect(() => {
      getAllExercises(db).then(setExercises);
    }, [db]);

    const muscleGroups = useMemo(() => {
      const groups = new Set<string>();
      for (const e of exercises) {
        if (e.muscle_group) groups.add(e.muscle_group);
      }
      return Array.from(groups).sort();
    }, [exercises]);

    const filtered = useMemo(() => {
      let list = exercises;
      if (search) {
        const q = search.toLowerCase();
        list = list.filter((e) => e.name.toLowerCase().includes(q));
      }
      if (selectedMuscle) {
        list = list.filter((e) => e.muscle_group === selectedMuscle);
      }
      return list;
    }, [exercises, search, selectedMuscle]);

    const currentSet = useMemo(
      () => new Set(currentExerciseIds),
      [currentExerciseIds]
    );

    const handleConfirmSelect = useCallback(() => {
      if (!previewExercise) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Keyboard.dismiss();
      const id = previewExercise.id;
      setPreviewExercise(null);
      onSelect(id);
    }, [previewExercise, onSelect]);

    const handleTapExercise = useCallback((exercise: Exercise) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Keyboard.dismiss();
      setPreviewExercise(exercise);
    }, []);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.6}
        />
      ),
      []
    );

    const renderItem = useCallback(
      ({ item }: { item: Exercise }) => {
        const inTemplate = currentSet.has(item.id);
        return (
          <Pressable
            onPress={() => handleTapExercise(item)}
            style={styles.exerciseRow}
          >
            <ExerciseMedia mediaSlug={item.media_slug} size={44} />
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.exerciseMeta}>
                {item.muscle_group}
                {item.equipment ? ` · ${item.equipment}` : ""}
              </Text>
            </View>
            {inTemplate && (
              <Ionicons name="checkmark-circle" size={20} color="#6C5CE7" />
            )}
          </Pressable>
        );
      },
      [currentSet, handleTapExercise]
    );

    return (
      <>
        <BottomSheet
          ref={ref}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          onChange={(index) => {
            if (index === -1) onClose();
          }}
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.sheetBg}
          handleIndicatorStyle={styles.handle}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {mode === "replace" ? "Replace Exercise" : "Add Exercise"}
            </Text>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={16}
              color="#7B7B94"
              style={styles.searchIcon}
            />
            <BottomSheetTextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor="#4A4A5E"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={16} color="#4A4A5E" />
              </Pressable>
            )}
          </View>

          {/* Muscle group pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsContainer}
            style={styles.pillsRow}
          >
            <Pressable
              onPress={() => setSelectedMuscle(null)}
              style={[styles.pill, !selectedMuscle && styles.pillActive]}
            >
              <Text
                style={[
                  styles.pillText,
                  !selectedMuscle && styles.pillTextActive,
                ]}
              >
                All
              </Text>
            </Pressable>
            {muscleGroups.map((mg) => (
              <Pressable
                key={mg}
                onPress={() =>
                  setSelectedMuscle(selectedMuscle === mg ? null : mg)
                }
                style={[styles.pill, selectedMuscle === mg && styles.pillActive]}
              >
                <Text
                  style={[
                    styles.pillText,
                    selectedMuscle === mg && styles.pillTextActive,
                  ]}
                >
                  {mg}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Exercise list */}
          <BottomSheetFlatList
            data={filtered}
            keyExtractor={(item: Exercise) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        </BottomSheet>

        {/* Exercise Preview Modal */}
        <Modal
          visible={previewExercise !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewExercise(null)}
        >
          <BlurView intensity={40} tint="dark" style={styles.modalOverlay}>
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setPreviewExercise(null)}
            >
              <Pressable
                style={styles.previewCard}
                onPress={(e) => e.stopPropagation()}
              >
                {previewExercise && (
                  <>
                    {/* Large exercise image */}
                    <View style={styles.previewMediaWrapper}>
                      <ExerciseMedia
                        mediaSlug={previewExercise.media_slug}
                        size={PREVIEW_SIZE}
                      />
                    </View>

                    {/* Exercise info */}
                    <Text style={styles.previewName}>
                      {previewExercise.name}
                    </Text>
                    <View style={styles.previewMetaRow}>
                      <View style={styles.previewPill}>
                        <Ionicons
                          name="body-outline"
                          size={13}
                          color="#7B7B94"
                        />
                        <Text style={styles.previewPillText}>
                          {previewExercise.muscle_group}
                        </Text>
                      </View>
                      {previewExercise.equipment && (
                        <View style={styles.previewPill}>
                          <Ionicons
                            name="barbell-outline"
                            size={13}
                            color="#7B7B94"
                          />
                          <Text style={styles.previewPillText}>
                            {previewExercise.equipment}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Notes if any */}
                    {previewExercise.notes && (
                      <Text style={styles.previewNotes}>
                        {previewExercise.notes}
                      </Text>
                    )}

                    {/* Action buttons */}
                    <View style={styles.previewActions}>
                      <AnimatedPressable
                        onPress={() => setPreviewExercise(null)}
                        style={styles.cancelButton}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </AnimatedPressable>
                      <AnimatedPressable
                        onPress={handleConfirmSelect}
                        style={styles.addButton}
                      >
                        <Ionicons name="add" size={20} color="#FFFFFF" />
                        <Text style={styles.addButtonText}>
                          {mode === "replace" ? "Replace" : "Add"}
                        </Text>
                      </AnimatedPressable>
                    </View>
                  </>
                )}
              </Pressable>
            </Pressable>
          </BlurView>
        </Modal>
      </>
    );
  }
);

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: "#1A1A24",
  },
  handle: {
    backgroundColor: "#4A4A5E",
    width: 36,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  headerTitle: {
    color: "#F5F5FA",
    fontSize: 18,
    fontWeight: "700",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#242430",
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#F5F5FA",
    fontSize: 15,
    fontWeight: "500",
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  pillsRow: {
    flexGrow: 0,
    flexShrink: 0,
  },
  pillsContainer: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 12,
  },
  pill: {
    backgroundColor: "#242430",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  pillActive: {
    backgroundColor: "#6C5CE7",
  },
  pillText: {
    color: "#7B7B94",
    fontSize: 13,
    fontWeight: "600",
  },
  pillTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#242430",
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: "#F5F5FA",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  exerciseMeta: {
    color: "#7B7B94",
    fontSize: 12,
    fontWeight: "500",
  },
  // Preview Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  previewCard: {
    backgroundColor: "#1A1A24",
    borderRadius: 24,
    padding: 20,
    width: SCREEN_WIDTH - 48,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  previewMediaWrapper: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
  },
  previewName: {
    color: "#F5F5FA",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  previewMetaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  previewPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#242430",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  previewPillText: {
    color: "#7B7B94",
    fontSize: 13,
    fontWeight: "600",
  },
  previewNotes: {
    color: "#9B9BAF",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  previewActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#242430",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "#7B7B94",
    fontSize: 15,
    fontWeight: "700",
  },
  addButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#6C5CE7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
