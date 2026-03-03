import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OnboardingState {
  step: "welcome" | "import" | "signup" | "agent-setup" | "done";
  hasCompletedOnboarding: boolean;
  setStep: (step: OnboardingState["step"]) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      step: "welcome",
      hasCompletedOnboarding: false,
      setStep: (step) => set({ step }),
      completeOnboarding: () =>
        set({ hasCompletedOnboarding: true, step: "done" }),
      reset: () =>
        set({ step: "welcome", hasCompletedOnboarding: false }),
    }),
    {
      name: "onboarding-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
