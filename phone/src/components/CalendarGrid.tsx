import React from "react";
import { Calendar } from "react-native-calendars";

interface WorkoutDot {
  date: string;
  color: string;
}

interface CalendarGridProps {
  workoutDots: WorkoutDot[];
  onDayPress?: (dateString: string) => void;
  currentMonth?: string;
}

export function CalendarGrid({ workoutDots, onDayPress, currentMonth }: CalendarGridProps) {
  const markedDates: Record<string, any> = {};

  for (const dot of workoutDots) {
    if (markedDates[dot.date]) {
      markedDates[dot.date].dots.push({ color: dot.color, key: dot.date + dot.color });
    } else {
      markedDates[dot.date] = {
        dots: [{ color: dot.color, key: dot.date + dot.color }],
        marked: true,
      };
    }
  }

  return (
    <Calendar
      current={currentMonth}
      markingType="multi-dot"
      markedDates={markedDates}
      onDayPress={(day: any) => onDayPress?.(day.dateString)}
      theme={{
        backgroundColor: "#0D0D12",
        calendarBackground: "#0D0D12",
        textSectionTitleColor: "#7B7B94",
        selectedDayBackgroundColor: "#6C5CE7",
        selectedDayTextColor: "#F5F5FA",
        todayTextColor: "#6C5CE7",
        dayTextColor: "#F5F5FA",
        textDisabledColor: "#2A2A38",
        monthTextColor: "#F5F5FA",
        arrowColor: "#6C5CE7",
        textDayFontWeight: "500",
        textMonthFontWeight: "bold",
        textDayHeaderFontWeight: "600",
        textDayFontSize: 16,
        textMonthFontSize: 18,
        textDayHeaderFontSize: 13,
      }}
      style={{
        backgroundColor: "#0D0D12",
        borderRadius: 20,
        overflow: "hidden",
        paddingBottom: 8,
      }}
    />
  );
}
