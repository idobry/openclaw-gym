import { readFileSync } from "fs";
import { resolve } from "path";
import { db, queryClient } from "./client.js";
import { exercises } from "./schema.js";

async function seed() {
  const catalogPath = resolve(
    import.meta.dirname,
    "../../../../exercise-catalog.json"
  );

  console.log("Reading exercise catalog from:", catalogPath);
  const raw = readFileSync(catalogPath, "utf-8");
  const catalog: Array<{
    id: string;
    name: string;
    muscle_group: string;
    equipment: string | null;
    media_slug: string | null;
  }> = JSON.parse(raw);

  console.log(`Found ${catalog.length} exercises, seeding...`);

  const BATCH_SIZE = 100;
  let inserted = 0;

  for (let i = 0; i < catalog.length; i += BATCH_SIZE) {
    const batch = catalog.slice(i, i + BATCH_SIZE);
    await db
      .insert(exercises)
      .values(
        batch.map((e) => ({
          id: e.id,
          name: e.name,
          muscleGroup: e.muscle_group,
          equipment: e.equipment,
          mediaSlug: e.media_slug,
        }))
      )
      .onConflictDoNothing();

    inserted += batch.length;
    if (inserted % 500 === 0) {
      console.log(`  ${inserted}/${catalog.length} exercises seeded`);
    }
  }

  console.log(`Done! Seeded ${catalog.length} exercises.`);
  await queryClient.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
