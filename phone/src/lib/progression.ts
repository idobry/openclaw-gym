interface SetResult {
  weight: number;
  reps: number;
  isWarmup: boolean;
}

interface ProgressionInput {
  exerciseId: string;
  equipment: string;
  repRangeMax: number;
  sets: SetResult[];
}

interface ProgressionSuggestion {
  exerciseId: string;
  currentWeight: number;
  suggestedWeight: number;
  increase: number;
  reason: string;
}

const BARBELL_EQUIPMENT = ["Barbell"];
const BARBELL_INCREMENT = 5;
const OTHER_INCREMENT = 2.5;

export function calculateProgression(input: ProgressionInput): ProgressionSuggestion | null {
  const workingSets = input.sets.filter(s => !s.isWarmup);
  if (workingSets.length === 0) return null;

  // Check if ALL working sets hit the rep range max
  const allHitMax = workingSets.every(s => s.reps >= input.repRangeMax);
  if (!allHitMax) return null;

  const currentWeight = workingSets[0].weight;
  const increment = BARBELL_EQUIPMENT.includes(input.equipment)
    ? BARBELL_INCREMENT
    : OTHER_INCREMENT;

  return {
    exerciseId: input.exerciseId,
    currentWeight,
    suggestedWeight: currentWeight + increment,
    increase: increment,
    reason: `All ${workingSets.length} sets hit ${input.repRangeMax} reps`,
  };
}

export function calculateAllProgressions(
  exercises: ProgressionInput[]
): ProgressionSuggestion[] {
  return exercises
    .map(calculateProgression)
    .filter((s): s is ProgressionSuggestion => s !== null);
}
