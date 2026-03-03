import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

const FREE_EXERCISE_DB_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

interface ExerciseMediaProps {
  mediaSlug: string | null;
  size?: number;
}

export function ExerciseMedia({ mediaSlug, size = 200 }: ExerciseMediaProps) {
  const [imageIndex, setImageIndex] = useState(0);

  const isDirectUrl = mediaSlug?.startsWith("http") ?? false;

  // Alternate between 0.jpg and 1.jpg for free-exercise-db slugs
  useEffect(() => {
    if (!mediaSlug || isDirectUrl) return;
    const interval = setInterval(() => {
      setImageIndex((prev) => (prev === 0 ? 1 : 0));
    }, 1500);
    return () => clearInterval(interval);
  }, [mediaSlug, isDirectUrl]);

  if (!mediaSlug) {
    return (
      <View style={[styles.emptyContainer, { width: size, height: size }]}>
        <Ionicons name="image-outline" size={32} color="#4A4A5E" />
        <Text style={styles.emptyText}>No image</Text>
      </View>
    );
  }

  const imageUrl = isDirectUrl
    ? mediaSlug
    : `${FREE_EXERCISE_DB_BASE}/${mediaSlug}/${imageIndex}.jpg`;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, { width: size - 4, height: size - 4 }]}
        contentFit="cover"
        cachePolicy="disk"
        placeholder={require("../../assets/icon.png")}
        placeholderContentFit="contain"
        transition={300}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1A1A24",
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  image: {
    borderRadius: 14,
  },
  emptyContainer: {
    backgroundColor: "#1A1A24",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    color: "#7B7B94",
    fontSize: 13,
    fontWeight: "500",
  },
});
