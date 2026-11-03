/**
 * Seeds scheme data. Safe to run repeatedly: records are matched by slug, so nothing is duplicated.
 *
 *   npm run seed                 # real scheme records (inserted only if missing)
 *   npm run seed -- --update     # also overwrite existing real records with the seed content
 *   npm run seed:demo            # + clearly-labelled demo schemes and a demo student account
 *   npm run seed:reset-demo      # remove and recreate demo schemes and the demo student's data
 *
 * The demo student is only created when DEMO_USER_PASSWORD is set in the environment.
 */
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { Scheme } from '../models/Scheme.js';
import { User } from '../models/User.js';
import { SavedScheme } from '../models/SavedScheme.js';
import { Application } from '../models/Application.js';
import { ChecklistProgress } from '../models/ChecklistProgress.js';
import { createSchemeSchema } from '../validators/index.js';
import { toCalendarDate } from '../utils/dates.js';
import { realSchemes, type SeedScheme } from './data/realSchemes.js';
import { buildDemoSchemes, DEMO_STUDENT } from './data/demoSchemes.js';

/* eslint-disable no-console */

function toDocument(s: SeedScheme) {
  // Validate seed data with the same rules the admin API uses.
  const parsed = createSchemeSchema.parse({
    ...s,
    applicationOpenDate: s.applicationOpenDate ?? null,
    applicationDeadline: s.applicationDeadline ?? null,
    applicationWindowStatus: s.applicationWindowStatus ?? 'not_verified',
    verificationStatus: s.verificationStatus ?? 'needs_review',
    // Only records checked against an official source carry a verification date (see realSchemes.ts).
    sourceVerifiedAt: s.sourceVerifiedAt ?? null,
    isDemo: s.isDemo ?? false,
    publicationStatus: 'published',
  });
  return {
    ...parsed,
    slug: s.slug,
    applicationOpenDate: parsed.applicationOpenDate ? toCalendarDate(parsed.applicationOpenDate) : null,
    applicationDeadline: parsed.applicationDeadline ? toCalendarDate(parsed.applicationDeadline) : null,
    sourceVerifiedAt: parsed.sourceVerifiedAt ? toCalendarDate(parsed.sourceVerifiedAt) : null,
  };
}

export async function seedSchemes(list: SeedScheme[], overwrite: boolean) {
  let inserted = 0;
  let updated = 0;
  for (const s of list) {
    const doc = toDocument(s);
    const r = await Scheme.updateOne(
      { slug: doc.slug },
      overwrite ? { $set: doc } : { $setOnInsert: doc },
      { upsert: true, runValidators: true },
    );
    if (r.upsertedCount) inserted++;
    else if (overwrite) updated++;
  }
  return { inserted, updated, unchanged: list.length - inserted - updated, total: list.length };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const withDemo = args.has('--demo');
  const resetDemo = args.has('--reset-demo');
  const overwrite = args.has('--update');

  await connectDatabase();
  await Promise.all([Scheme.syncIndexes(), User.syncIndexes(), SavedScheme.syncIndexes(), Application.syncIndexes(), ChecklistProgress.syncIndexes()]);

  const real = await seedSchemes(realSchemes, overwrite);
  console.log(`Real schemes: ${real.inserted} inserted, ${real.updated} overwritten, ${real.unchanged} already present (kept as-is), ${real.total} in seed file.`);

  if (withDemo) {
    if (resetDemo) {
      const demoIds = (await Scheme.find({ isDemo: true }).select('_id').lean()).map((d) => d._id);
      const student = await User.findOne({ email: DEMO_STUDENT.email }).select('_id').lean();
      await Promise.all([
        SavedScheme.deleteMany({ $or: [{ schemeId: { $in: demoIds } }, ...(student ? [{ userId: student._id }] : [])] }),
        ChecklistProgress.deleteMany({ $or: [{ schemeId: { $in: demoIds } }, ...(student ? [{ userId: student._id }] : [])] }),
        Application.deleteMany({ $or: [{ schemeId: { $in: demoIds } }, ...(student ? [{ userId: student._id }] : [])] }),
        Scheme.deleteMany({ isDemo: true }),
      ]);
      if (student) await User.deleteOne({ _id: student._id });
      console.log('Demo data reset.');
    }
    // Demo deadlines are relative to today, so demo records are always refreshed.
    const demo = await seedSchemes(buildDemoSchemes(), true);
    console.log(`Demo schemes: ${demo.inserted} inserted, ${demo.updated} refreshed.`);

    const password = process.env.DEMO_USER_PASSWORD;
    if (password && password.length >= 8) {
      const exists = await User.exists({ email: DEMO_STUDENT.email });
      if (!exists) {
        await User.create({
          name: DEMO_STUDENT.name,
          email: DEMO_STUDENT.email,
          passwordHash: await bcrypt.hash(password, 12),
          role: 'user',
          profile: DEMO_STUDENT.profile,
          onboardingCompletedAt: new Date(),
        });
        console.log(`Demo student created: ${DEMO_STUDENT.email} (password from DEMO_USER_PASSWORD).`);
      } else console.log(`Demo student already exists: ${DEMO_STUDENT.email}`);
    } else {
      console.log('DEMO_USER_PASSWORD not set (min 8 chars) — skipping demo student account.');
    }
  }

  await disconnectDatabase();
}

const isDirectRun = process.argv[1]?.replace(/\\/g, '/').endsWith('seed/seed.ts');
if (isDirectRun) {
  main().catch(async (err) => {
    console.error('Seeding failed:', err);
    await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  });
}
