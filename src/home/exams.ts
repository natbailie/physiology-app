/**
 * The exams a learner is revising for, and how far through training they are.
 *
 * One fact, captured once, doing two jobs. It filters a fifty-module catalogue down to what is
 * actually on somebody's syllabus, and it goes to RevenueCat as a subscriber attribute so the
 * offer a learner sees can be about the exam they are sitting. Neither job is worth a separate
 * question, and asking twice would get two different answers.
 *
 * ## What the list is, and is not
 *
 * Five exams, all of them ones this app's physiology is genuinely examined in. Deliberately no
 * USMLE Step 2: it is a clinical-knowledge paper and tagging a handful of modules for it would
 * offer a filter that empties the catalogue, which is worse than not offering it.
 *
 * `notSure` is a real answer and the default. A learner in their first term has not chosen a
 * postgraduate exam yet, and a picker that forces one gets noise rather than data.
 */

export const EXAMS = [
  { id: 'USMLE_STEP_1', short: 'USMLE 1', name: 'USMLE Step 1' },
  { id: 'UKMLA', short: 'UKMLA', name: 'UKMLA' },
  { id: 'MRCP_PART_1', short: 'MRCP 1', name: 'MRCP Part 1' },
  { id: 'MRCS_PART_A', short: 'MRCS A', name: 'MRCS Part A' },
  { id: 'FRCA_PRIMARY', short: 'FRCA', name: 'FRCA Primary' },
] as const;

export type ExamId = (typeof EXAMS)[number]['id'];

/** What a learner picks. `notSure` is stored as null — see `examProfile.ts`. */
export type ExamChoice = ExamId | 'notSure';

const EXAM_BY_ID = new Map<string, (typeof EXAMS)[number]>(EXAMS.map((exam) => [exam.id, exam]));

/** The full name, for prose. Falls back to the id so an exam retired from the list still reads. */
export function examName(id: string): string {
  return EXAM_BY_ID.get(id)?.name ?? id;
}

/** The badge form, which has to fit on a module card next to four others. */
export function examShortName(id: string): string {
  return EXAM_BY_ID.get(id)?.short ?? id;
}

export function isExamId(value: unknown): value is ExamId {
  return typeof value === 'string' && EXAM_BY_ID.has(value);
}

/**
 * How far through training, in the coarsest bands that still mean something.
 *
 * Coarse on purpose: the point is segmentation, not a CV. A band a learner picks in two seconds
 * and never revisits is worth more than a precise one they get wrong or skip.
 */
export const TRAINING_LEVELS = [
  { id: 'preclinical', name: 'Pre-clinical student' },
  { id: 'clinical', name: 'Clinical student' },
  { id: 'foundation', name: 'Foundation doctor' },
  { id: 'coreTrainee', name: 'Core / specialty trainee' },
  { id: 'registrar', name: 'Registrar or above' },
] as const;

export type TrainingLevelId = (typeof TRAINING_LEVELS)[number]['id'];

const LEVEL_BY_ID = new Map<string, (typeof TRAINING_LEVELS)[number]>(
  TRAINING_LEVELS.map((level) => [level.id, level]),
);

export function trainingLevelName(id: string): string {
  return LEVEL_BY_ID.get(id)?.name ?? id;
}

export function isTrainingLevelId(value: unknown): value is TrainingLevelId {
  return typeof value === 'string' && LEVEL_BY_ID.has(value);
}
