import { Router, Request, Response, NextFunction } from "express";
import { eq, and, sql, count } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  workoutTemplates,
  templateExercises,
  exercises,
} from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { logChange } from "../middleware/changeLog.js";
import { NotFound, BadRequest } from "../lib/errors.js";

const router = Router();
router.use(authMiddleware);

// GET /templates
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await db
      .select({
        id: workoutTemplates.id,
        name: workoutTemplates.name,
        dayLabel: workoutTemplates.dayLabel,
        color: workoutTemplates.color,
        description: workoutTemplates.description,
        sortOrder: workoutTemplates.sortOrder,
        exerciseCount: sql<number>`count(${templateExercises.id})`.as(
          "exercise_count"
        ),
      })
      .from(workoutTemplates)
      .leftJoin(
        templateExercises,
        eq(workoutTemplates.id, templateExercises.templateId)
      )
      .where(eq(workoutTemplates.userId, req.auth!.userId))
      .groupBy(workoutTemplates.id)
      .orderBy(workoutTemplates.dayLabel);

    res.json({ data: results });
  } catch (err) {
    next(err);
  }
});

// GET /templates/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [template] = await db
      .select()
      .from(workoutTemplates)
      .where(
        and(
          eq(workoutTemplates.id, req.params.id),
          eq(workoutTemplates.userId, req.auth!.userId)
        )
      )
      .limit(1);

    if (!template) throw NotFound("Template");

    const exerciseRows = await db
      .select({
        id: templateExercises.id,
        exerciseId: templateExercises.exerciseId,
        sets: templateExercises.sets,
        repRangeMin: templateExercises.repRangeMin,
        repRangeMax: templateExercises.repRangeMax,
        restSeconds: templateExercises.restSeconds,
        sortOrder: templateExercises.sortOrder,
        exerciseName: exercises.name,
        muscleGroup: exercises.muscleGroup,
        equipment: exercises.equipment,
        mediaSlug: exercises.mediaSlug,
        notes: exercises.notes,
      })
      .from(templateExercises)
      .innerJoin(exercises, eq(templateExercises.exerciseId, exercises.id))
      .where(eq(templateExercises.templateId, req.params.id))
      .orderBy(templateExercises.sortOrder);

    res.json({ data: { ...template, exercises: exerciseRows } });
  } catch (err) {
    next(err);
  }
});

// PUT /templates/:id
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, color, description, dayLabel } = req.body;

    const [existing] = await db
      .select()
      .from(workoutTemplates)
      .where(
        and(
          eq(workoutTemplates.id, req.params.id),
          eq(workoutTemplates.userId, req.auth!.userId)
        )
      )
      .limit(1);

    if (!existing) throw NotFound("Template");

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (color !== undefined) updates.color = color;
    if (description !== undefined) updates.description = description;
    if (dayLabel !== undefined) updates.dayLabel = dayLabel;

    const [updated] = await db
      .update(workoutTemplates)
      .set(updates)
      .where(eq(workoutTemplates.id, req.params.id))
      .returning();

    await logChange(
      req.auth!,
      "template.update",
      "template",
      req.params.id,
      { before: existing, after: updated },
      req.body.reason
    );

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /templates/:id
router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [existing] = await db
        .select()
        .from(workoutTemplates)
        .where(
          and(
            eq(workoutTemplates.id, req.params.id),
            eq(workoutTemplates.userId, req.auth!.userId)
          )
        )
        .limit(1);

      if (!existing) throw NotFound("Template");

      await db
        .delete(workoutTemplates)
        .where(eq(workoutTemplates.id, req.params.id));

      await logChange(
        req.auth!,
        "template.delete",
        "template",
        req.params.id,
        { before: existing },
        req.body?.reason
      );

      res.json({ data: { deleted: true } });
    } catch (err) {
      next(err);
    }
  }
);

// POST /templates/:id/exercises
router.post(
  "/:id/exercises",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const templateId = req.params.id;
      const { exerciseId, sets, repRangeMin, repRangeMax, restSeconds } =
        req.body;

      if (!exerciseId) throw BadRequest("exerciseId required");

      // Verify template belongs to user
      const [template] = await db
        .select({ id: workoutTemplates.id })
        .from(workoutTemplates)
        .where(
          and(
            eq(workoutTemplates.id, templateId),
            eq(workoutTemplates.userId, req.auth!.userId)
          )
        )
        .limit(1);

      if (!template) throw NotFound("Template");

      // Get max sort order
      const [maxOrder] = await db
        .select({ max: sql<number>`COALESCE(MAX(${templateExercises.sortOrder}), -1)` })
        .from(templateExercises)
        .where(eq(templateExercises.templateId, templateId));

      const [inserted] = await db
        .insert(templateExercises)
        .values({
          templateId,
          exerciseId,
          sets: sets ?? 3,
          repRangeMin: repRangeMin ?? 8,
          repRangeMax: repRangeMax ?? 12,
          restSeconds: restSeconds ?? 90,
          sortOrder: (maxOrder?.max ?? -1) + 1,
        })
        .returning();

      await logChange(
        req.auth!,
        "exercise.add",
        "template_exercise",
        String(inserted.id),
        { after: inserted },
        req.body.reason
      );

      res.status(201).json({ data: inserted });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /templates/:tid/exercises/:eid
router.delete(
  "/:tid/exercises/:eid",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const teId = parseInt(req.params.eid);
      if (isNaN(teId)) throw BadRequest("Invalid exercise ID");

      // Verify template ownership
      const [template] = await db
        .select({ id: workoutTemplates.id })
        .from(workoutTemplates)
        .where(
          and(
            eq(workoutTemplates.id, req.params.tid),
            eq(workoutTemplates.userId, req.auth!.userId)
          )
        )
        .limit(1);

      if (!template) throw NotFound("Template");

      const [existing] = await db
        .select()
        .from(templateExercises)
        .where(eq(templateExercises.id, teId))
        .limit(1);

      if (!existing) throw NotFound("Template exercise");

      await db.delete(templateExercises).where(eq(templateExercises.id, teId));

      // Re-normalize sort order
      const remaining = await db
        .select({ id: templateExercises.id })
        .from(templateExercises)
        .where(eq(templateExercises.templateId, req.params.tid))
        .orderBy(templateExercises.sortOrder);

      for (let i = 0; i < remaining.length; i++) {
        await db
          .update(templateExercises)
          .set({ sortOrder: i })
          .where(eq(templateExercises.id, remaining[i].id));
      }

      await logChange(
        req.auth!,
        "exercise.remove",
        "template_exercise",
        String(teId),
        { before: existing },
        req.body?.reason
      );

      res.json({ data: { deleted: true } });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /templates/:tid/exercises/:eid
router.put(
  "/:tid/exercises/:eid",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const teId = parseInt(req.params.eid);
      if (isNaN(teId)) throw BadRequest("Invalid exercise ID");

      const [existing] = await db
        .select()
        .from(templateExercises)
        .where(eq(templateExercises.id, teId))
        .limit(1);

      if (!existing) throw NotFound("Template exercise");

      const updates: Record<string, unknown> = {};
      if (req.body.sets !== undefined) updates.sets = req.body.sets;
      if (req.body.repRangeMin !== undefined)
        updates.repRangeMin = req.body.repRangeMin;
      if (req.body.repRangeMax !== undefined)
        updates.repRangeMax = req.body.repRangeMax;
      if (req.body.restSeconds !== undefined)
        updates.restSeconds = req.body.restSeconds;

      const [updated] = await db
        .update(templateExercises)
        .set(updates)
        .where(eq(templateExercises.id, teId))
        .returning();

      await logChange(
        req.auth!,
        "exercise.update",
        "template_exercise",
        String(teId),
        { before: existing, after: updated },
        req.body.reason
      );

      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// POST /templates/:tid/exercises/:eid/replace
router.post(
  "/:tid/exercises/:eid/replace",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const teId = parseInt(req.params.eid);
      if (isNaN(teId)) throw BadRequest("Invalid exercise ID");

      const { newExerciseId } = req.body;
      if (!newExerciseId) throw BadRequest("newExerciseId required");

      const [existing] = await db
        .select()
        .from(templateExercises)
        .where(eq(templateExercises.id, teId))
        .limit(1);

      if (!existing) throw NotFound("Template exercise");

      const [updated] = await db
        .update(templateExercises)
        .set({ exerciseId: newExerciseId })
        .where(eq(templateExercises.id, teId))
        .returning();

      await logChange(
        req.auth!,
        "exercise.replace",
        "template_exercise",
        String(teId),
        { before: existing, after: updated },
        req.body.reason
      );

      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
