import React from "react";
import { Pressable, type PressableProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const AnimatedPress = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps extends PressableProps {
  scaleValue?: number;
  children: React.ReactNode;
}

export function AnimatedPressable({
  scaleValue = 0.97,
  children,
  onPressIn,
  onPressOut,
  style,
  ...props
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPress
      onPressIn={(e) => {
        scale.value = withSpring(scaleValue, { damping: 15, stiffness: 150 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
        onPressOut?.(e);
      }}
      style={[animatedStyle, style as any]}
      {...props}
    >
      {children}
    </AnimatedPress>
  );
}
