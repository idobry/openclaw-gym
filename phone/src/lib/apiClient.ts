import { supabase } from "./supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

// ── Types ──────────────────────────────────────────────────────────────────

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string | null;
  mediaSlug: string | null;
  notes: string | null;
}

export interface TemplateListItem {
  id: string;
  name: string;
  dayLabel: string;
  color: string;
  description: string | null;
  sortOrder: number;
  exerciseCount: number;
}

export interface TemplateExercise {
  id: number;
  exerciseId: string;
  sets: number;
  repRangeMin: number;
  repRangeMax: number;
  restSeconds: number;
  sortOrder: number;
  exerciseName: string;
  muscleGroup: string;
  equipment: string | null;
  mediaSlug: string | null;
  notes: string | null;
}

export interface TemplateDetail {
  id: string;
  userId: string;
  name: string;
  dayLabel: string;
  color: string;
  description: string | null;
  sortOrder: number;
  exercises: TemplateExercise[];
}

export interface SessionListItem {
  id: string;
  templateId: string;
  templateName: string;
  templateColor: string | null;
  date: string;
  startedAt: string;
  completedAt: string;
  notes: unknown;
}

export interface SessionDate {
  date: string;
  templateId: string;
  color: string | null;
}

export interface SessionSetDetail {
  id: number;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  equipment: string | null;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  isWarmup: boolean;
}

export interface SessionDetail {
  id: string;
  templateId: string;
  templateName: string;
  templateColor: string | null;
  date: string;
  startedAt: string;
  completedAt: string | null;
  notes: unknown;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string;
    equipment: string | null;
    sets: SessionSetDetail[];
  }[];
}

export interface SetLog {
  id: number;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  isWarmup: boolean;
}

export interface PersonalRecord {
  exercise_id: string;
  exercise_name: string;
  max_weight: number;
  reps_at_max: number;
  date: string;
}

export interface Streaks {
  currentStreak: number;
  longestStreak: number;
  thisWeek: number;
  totalWorkouts: number;
}

export interface VolumePoint {
  date: string;
  total_volume: number;
}

export interface ProgressPoint {
  date: string;
  max_weight: number;
  best_set_reps: number;
}

export interface StatsSummary {
  streaks: { current: number; longest: number; thisWeek: number; total: number };
  prs: { exercise_id: string; exercise_name: string; max_weight: number; reps_at_max: number }[];
}

export interface ProgramExport {
  program_name: string;
  settings: { weight_unit: string };
  exercises: { id: string; name: string; muscle_group: string; equipment: string | null }[];
  workouts: Record<string, {
    name: string;
    color: string;
    focus: string | null;
    exercises: { id: string; sets: number; reps: string; rest_seconds: number }[];
  }>;
  history: {
    date: string;
    workout: string;
    started_at: string;
    completed_at: string;
    exercises: { id: string; name: string; sets: { set: number; weight: number; reps: number }[] }[];
  }[];
  exported_at: string;
}

export interface ChangeLogEntry {
  id: number;
  userId: string;
  actor: "user" | "agent";
  action: string;
  entityType: string;
  entityId: string;
  diff: unknown;
  message: string | null;
  createdAt: string;
}

export interface ServerSession {
  id: string;
  userId: string;
  templateId: string;
  date: string;
  startedAt: string;
  completedAt: string | null;
  notes: unknown;
}

// ── Error ──────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Core fetch ─────────────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new ApiError(401, "NO_SESSION", "Not authenticated");

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Actor": "user",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let code = "UNKNOWN";
    let message = res.statusText;
    try {
      const json = await res.json();
      code = json.error?.code ?? code;
      message = json.error?.message ?? message;
    } catch {}
    throw new ApiError(res.status, code, message);
  }

  const json = await res.json();
  return json.data as T;
}

// ── Exercises ──────────────────────────────────────────────────────────────

export const exercises = {
  search(params?: { q?: string; muscle?: string; equipment?: string; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.muscle) qs.set("muscle", params.muscle);
    if (params?.equipment) qs.set("equipment", params.equipment);
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return request<Exercise[]>("GET", `/exercises${query ? `?${query}` : ""}`);
  },

  get(id: string) {
    return request<Exercise>("GET", `/exercises/${id}`);
  },
};

// ── Templates ──────────────────────────────────────────────────────────────

export const templates = {
  list() {
    return request<TemplateListItem[]>("GET", "/templates");
  },

  get(id: string) {
    return request<TemplateDetail>("GET", `/templates/${id}`);
  },

  update(id: string, data: { name?: string; color?: string; description?: string; dayLabel?: string; reason?: string }) {
    return request<TemplateDetail>("PUT", `/templates/${id}`, data);
  },

  delete(id: string) {
    return request<{ deleted: true }>("DELETE", `/templates/${id}`);
  },

  addExercise(templateId: string, data: { exerciseId: string; sets?: number; repRangeMin?: number; repRangeMax?: number; restSeconds?: number; reason?: string }) {
    return request<TemplateExercise>("POST", `/templates/${templateId}/exercises`, data);
  },

  updateExercise(templateId: string, exerciseRelId: number, data: { sets?: number; repRangeMin?: number; repRangeMax?: number; restSeconds?: number; reason?: string }) {
    return request<TemplateExercise>("PUT", `/templates/${templateId}/exercises/${exerciseRelId}`, data);
  },

  removeExercise(templateId: string, exerciseRelId: number) {
    return request<{ deleted: true }>("DELETE", `/templates/${templateId}/exercises/${exerciseRelId}`);
  },

  replaceExercise(templateId: string, exerciseRelId: number, data: { newExerciseId: string; reason?: string }) {
    return request<TemplateExercise>("POST", `/templates/${templateId}/exercises/${exerciseRelId}/replace`, data);
  },
};

// ── Sessions ───────────────────────────────────────────────────────────────

export const sessions = {
  create(data: { templateId: string; date: string }) {
    return request<ServerSession>("POST", "/sessions", data);
  },

  list(params?: { from?: string; to?: string; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return request<SessionListItem[]>("GET", `/sessions${query ? `?${query}` : ""}`);
  },

  dates() {
    return request<SessionDate[]>("GET", "/sessions/dates");
  },

  recent(limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<SessionListItem[]>("GET", `/sessions/recent${qs}`);
  },

  get(id: string) {
    return request<SessionDetail>("GET", `/sessions/${id}`);
  },

  complete(id: string, notes?: unknown) {
    return request<ServerSession>("PUT", `/sessions/${id}/complete`, notes ? { notes } : undefined);
  },

  delete(id: string) {
    return request<{ deleted: true }>("DELETE", `/sessions/${id}`);
  },
};

// ── Sets ───────────────────────────────────────────────────────────────────

export const sets = {
  create(sessionId: string, data: { exerciseId: string; setNumber: number; weight?: number; reps?: number; isWarmup?: boolean }) {
    return request<SetLog>("POST", `/sessions/${sessionId}/sets`, data);
  },

  update(setId: number, data: { weight?: number; reps?: number }) {
    return request<SetLog>("PUT", `/sets/${setId}`, data);
  },

  delete(setId: number) {
    return request<{ deleted: true }>("DELETE", `/sets/${setId}`);
  },
};

// ── Stats ──────────────────────────────────────────────────────────────────

export const stats = {
  prs(limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<PersonalRecord[]>("GET", `/stats/prs${qs}`);
  },

  prForExercise(exerciseId: string) {
    return request<{ max_weight: number; reps: number }>("GET", `/stats/prs/${exerciseId}`);
  },

  streaks() {
    return request<Streaks>("GET", "/stats/streaks");
  },

  volume(weeks?: number) {
    const qs = weeks ? `?weeks=${weeks}` : "";
    return request<VolumePoint[]>("GET", `/stats/volume${qs}`);
  },

  progress(exerciseId: string, limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<ProgressPoint[]>("GET", `/stats/progress/${exerciseId}${qs}`);
  },

  summary() {
    return request<StatsSummary>("GET", "/stats/summary");
  },
};

// ── Program ────────────────────────────────────────────────────────────────

export const program = {
  import(data: { program_name: string; workouts: unknown[]; reason?: string }) {
    return request<{ success: true; templateCount: number }>("POST", "/program/import", data);
  },

  export() {
    return request<ProgramExport>("GET", "/program/export");
  },

  json() {
    return request<{ program_name: string; workouts: unknown[] }>("GET", "/program/json");
  },

  delete() {
    return request<{ deleted: true }>("DELETE", "/program");
  },
};

// ── Changes ────────────────────────────────────────────────────────────────

export const changes = {
  list(params?: { actor?: "user" | "agent"; limit?: number; since?: string }) {
    const qs = new URLSearchParams();
    if (params?.actor) qs.set("actor", params.actor);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.since) qs.set("since", params.since);
    const query = qs.toString();
    return request<ChangeLogEntry[]>("GET", `/changes${query ? `?${query}` : ""}`);
  },
};
