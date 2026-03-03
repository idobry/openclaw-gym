const BASE_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

export function getExerciseImageUrl(mediaSlug: string | null): string | null {
  if (!mediaSlug) return null;
  return `${BASE_URL}/${mediaSlug}/0.jpg`;
}

export function getExerciseImageUrls(mediaSlug: string | null, count: number = 2): string[] {
  if (!mediaSlug) return [];
  return Array.from({ length: count }, (_, i) => `${BASE_URL}/${mediaSlug}/${i}.jpg`);
}
