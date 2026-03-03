import { Router, Request, Response, NextFunction } from "express";
import { eq, and, isNotNull, sql, asc } from "drizzle-orm";
import { db } from "../db/client";
import {
  workoutTemplates,
  templateExercises,
  exercises,
  workoutSessions,
  setLogs,
  profiles,
} from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { logChange } from "../middleware/changeLog";
import { BadRequest } from "../lib/errors";

const DEFAULT_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#FFE66D",
  "#A78BFA",
  "#F472B6",
  "#34D399",
  "#FB923C",
  "#60A5FA",
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

const router = Router();
router.use(authMiddleware);

// POST /program/import
router.post(
  "/import",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { program_name, workouts } = req.body;
      if (!program_name || !workouts || !Array.isArray(workouts))
        throw BadRequest("program_name and workouts array required");

      if (workouts.length > 7)
        throw BadRequest("Maximum 7 workout days allowed");

      // Delete existing templates for this user
      await db
        .delete(workoutTemplates)
        .where(eq(workoutTemplates.userId, req.auth!.userId));

      const exerciseSet = new Set<string>();

      for (let wi = 0; wi < workouts.length; wi++) {
        const w = workouts[wi];
        const templateId = slugify(w.name);
        const color = w.color || DEFAULT_COLORS[wi % DEFAULT_COLORS.length];

        await db.insert(workoutTemplates).values({
          id: templateId,
          userId: req.auth!.userId,
          name: w.name,
          dayLabel: `Day ${wi + 1}`,
          color,
          description: w.description || null,
          sortOrder: wi,
        });

        for (let ei = 0; ei < (w.exercises || []).length; ei++) {
          const e = w.exercises[ei];
          const exerciseId = e.id || slugify(e.name);

          // Insert exercise if new
          if (!exerciseSet.has(exerciseId)) {
            exerciseSet.add(exerciseId);

            // Check if exercise exists in catalog
            const [existing] = await db
              .select({ id: exercises.id })
              .from(exercises)
              .where(eq(exercises.id, exerciseId))
              .limit(1);

            if (!existing) {
              await db.insert(exercises).values({
                id: exerciseId,
                name: e.name,
                muscleGroup: e.muscle_group || "Other",
                equipment: e.equipment || "Bodyweight",
                mediaSlug: e.image_url || null,
                notes: e.note || null,
              });
            }
          }

          // Parse reps
          let repMin = e.rep_min ?? 8;
          let repMax = e.rep_max ?? repMin;
          if (e.reps) {
            const match = String(e.reps).match(/^(\d+)\s*[-]\s*(\d+)/);
            if (match) {
              repMin = parseInt(match[1]);
              repMax = parseInt(match[2]);
            } else {
              const single = parseInt(String(e.reps));
              if (!isNaN(single)) {
                repMin = single;
                repMax = single;
              }
            }
          }

          await db.insert(templateExercises).values({
            templateId,
            exerciseId,
            sets: e.sets || 3,
            repRangeMin: repMin,
            repRangeMax: repMax,
            restSeconds: e.rest_seconds || 90,
            sortOrder: ei,
          });
        }
      }

      await logChange(
        req.auth!,
        "program.import",
        "program",
        "all",
        { after: { program_name, workoutCount: workouts.length } },
        req.body.reason
      );

      res.status(201).json({
        data: { success: true, templateCount: workouts.length },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /program/export
router.get(
  "/export",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, req.auth!.userId))
        .limit(1);

      // Get templates
      const templates = await db
        .select()
        .from(workoutTemplates)
        .where(eq(workoutTemplates.userId, req.auth!.userId))
        .orderBy(workoutTemplates.sortOrder);

      const workoutsData: Record<string, unknown> = {};
      const exerciseCatalog = new Map<string, unknown>();

      for (const tmpl of templates) {
        const exRows = await db
          .select({
            exerciseId: templateExercises.exerciseId,
            sets: templateExercises.sets,
            repRangeMin: templateExercises.repRangeMin,
            repRangeMax: templateExercises.repRangeMax,
            restSeconds: templateExercises.restSeconds,
            exerciseName: exercises.name,
            muscleGroup: exercises.muscleGroup,
            equipment: exercises.equipment,
            mediaSlug: exercises.mediaSlug,
            notes: exercises.notes,
          })
          .from(templateExercises)
          .innerJoin(exercises, eq(templateExercises.exerciseId, exercises.id))
          .where(eq(templateExercises.templateId, tmpl.id))
          .orderBy(templateExercises.sortOrder);

        const exerciseRefs = [];
        for (const e of exRows) {
          if (!exerciseCatalog.has(e.exerciseId)) {
            exerciseCatalog.set(e.exerciseId, {
              id: e.exerciseId,
              name: e.exerciseName,
              muscle_group: e.muscleGroup,
              equipment: e.equipment,
            });
          }
          exerciseRefs.push({
            id: e.exerciseId,
            sets: e.sets,
            reps:
              e.repRangeMin === e.repRangeMax
                ? String(e.repRangeMin)
                : `${e.repRangeMin}-${e.repRangeMax}`,
            rest_seconds: e.restSeconds,
          });
        }

        workoutsData[tmpl.id] = {
          name: tmpl.name,
          color: tmpl.color,
          focus: tmpl.description || undefined,
          exercises: exerciseRefs,
        };
      }

      // History
      const sessions = await db
        .select({
          id: workoutSessions.id,
          templateName: workoutTemplates.name,
          date: workoutSessions.date,
          startedAt: workoutSessions.startedAt,
          completedAt: workoutSessions.completedAt,
        })
        .from(workoutSessions)
        .leftJoin(
          workoutTemplates,
          eq(workoutSessions.templateId, workoutTemplates.id)
        )
        .where(
          and(
            eq(workoutSessions.userId, req.auth!.userId),
            isNotNull(workoutSessions.completedAt)
          )
        )
        .orderBy(asc(workoutSessions.date));

      const history = [];
      for (const s of sessions) {
        const logs = await db
          .select({
            exerciseId: setLogs.exerciseId,
            exerciseName: exercises.name,
            setNumber: setLogs.setNumber,
            weight: setLogs.weight,
            reps: setLogs.reps,
          })
          .from(setLogs)
          .innerJoin(exercises, eq(setLogs.exerciseId, exercises.id))
          .where(eq(setLogs.sessionId, s.id))
          .orderBy(setLogs.exerciseId, setLogs.setNumber);

        const exMap = new Map<
          string,
          { id: string; sets: { set: number; weight: number | null; reps: number | null }[] }
        >();
        for (const log of logs) {
          if (!exMap.has(log.exerciseName)) {
            exMap.set(log.exerciseName, { id: log.exerciseId, sets: [] });
          }
          exMap.get(log.exerciseName)!.sets.push({
            set: log.setNumber,
            weight: log.weight,
            reps: log.reps,
          });
        }

        history.push({
          date: s.date,
          workout: s.templateName,
          started_at: s.startedAt,
          completed_at: s.completedAt,
          exercises: Array.from(exMap.entries()).map(([name, data]) => ({
            id: data.id,
            name,
            sets: data.sets,
          })),
        });
      }

      res.json({
        data: {
          program_name: "GymTracker",
          settings: { weight_unit: profile?.weightUnit || "kg" },
          exercises: Array.from(exerciseCatalog.values()),
          workouts: workoutsData,
          history,
          exported_at: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /program
router.delete(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await db
        .delete(workoutTemplates)
        .where(eq(workoutTemplates.userId, req.auth!.userId));

      await logChange(req.auth!, "program.delete", "program", "all");

      res.json({ data: { deleted: true } });
    } catch (err) {
      next(err);
    }
  }
);

// GET /program/json
router.get(
  "/json",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const templates = await db
        .select()
        .from(workoutTemplates)
        .where(eq(workoutTemplates.userId, req.auth!.userId))
        .orderBy(workoutTemplates.sortOrder);

      const workouts = [];
      for (const tmpl of templates) {
        const exRows = await db
          .select({
            exerciseName: exercises.name,
            muscleGroup: exercises.muscleGroup,
            equipment: exercises.equipment,
            sets: templateExercises.sets,
            repRangeMin: templateExercises.repRangeMin,
            repRangeMax: templateExercises.repRangeMax,
            restSeconds: templateExercises.restSeconds,
          })
          .from(templateExercises)
          .innerJoin(exercises, eq(templateExercises.exerciseId, exercises.id))
          .where(eq(templateExercises.templateId, tmpl.id))
          .orderBy(templateExercises.sortOrder);

        workouts.push({
          name: tmpl.name,
          color: tmpl.color,
          description: tmpl.description,
          exercises: exRows.map((e) => ({
            name: e.exerciseName,
            muscle_group: e.muscleGroup,
            equipment: e.equipment,
            sets: e.sets,
            rep_min: e.repRangeMin,
            rep_max: e.repRangeMax,
            rest_seconds: e.restSeconds,
          })),
        });
      }

      res.json({
        data: { program_name: "GymTracker", workouts },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
