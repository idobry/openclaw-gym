import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface DataPoint {
  date: string;
  value: number;
}

interface ProgressChartProps {
  data: DataPoint[];
  title: string;
  suffix?: string;
  color?: string;
  height?: number;
}

export function ProgressChart({
  data,
  title,
  suffix = "",
  color = "#6C5CE7",
  height = 150,
}: ProgressChartProps) {
  // Empty state
  if (data.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.emptyContainer, { height }]}>
          <Ionicons name="bar-chart-outline" size={40} color="#242430" />
          <Text style={styles.emptyText}>No data yet</Text>
          <Text style={styles.emptySubtext}>Complete workouts to see progress</Text>
        </View>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;
  const latestValue = values[values.length - 1];

  // Compute a lighter version of the color for gradient top
  const colorFaded = `${color}40`;

  // Grid line values (min, mid, max)
  const midVal = Math.round((maxVal + minVal) / 2);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.latestValue, { color }]}>
          {latestValue}
          {suffix}
        </Text>
      </View>

      {/* Chart area */}
      <View style={[styles.chartArea, { height }]}>
        {/* Grid lines */}
        <View style={styles.gridContainer}>
          <View style={styles.gridLine}>
            <Text style={styles.gridLabel}>{maxVal}{suffix}</Text>
          </View>
          <View style={styles.gridLine}>
            <Text style={styles.gridLabel}>{midVal}{suffix}</Text>
          </View>
          <View style={styles.gridLine}>
            <Text style={styles.gridLabel}>{minVal}{suffix}</Text>
          </View>
        </View>

        {/* Bars */}
        <View style={styles.barsContainer}>
          {data.map((point, i) => {
            const barHeight = Math.max(8, ((point.value - minVal) / range) * (height - 28));
            const barOpacity = 0.55 + (i / data.length) * 0.45;

            return (
              <View key={i} style={styles.barWrapper}>
                <View style={[styles.barOuter, { height: barHeight }]}>
                  <LinearGradient
                    colors={[color, colorFaded]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={[styles.barFill, { opacity: barOpacity }]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1A1A24",
    borderRadius: 20,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    color: "#F5F5FA",
    fontSize: 17,
    fontWeight: "600",
  },
  latestValue: {
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },

  // Chart
  chartArea: {
    flexDirection: "row",
    position: "relative",
  },
  gridContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  gridLine: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(36, 36, 48, 0.8)",
    paddingBottom: 2,
  },
  gridLabel: {
    color: "#4A4A5E",
    fontSize: 10,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  barsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    paddingLeft: 36,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
  },
  barOuter: {
    width: "80%",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    flex: 1,
    borderRadius: 4,
  },

  // Empty state
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    color: "#7B7B94",
    fontSize: 15,
    fontWeight: "600",
  },
  emptySubtext: {
    color: "#4A4A5E",
    fontSize: 13,
  },
});
