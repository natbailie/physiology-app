import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAuthOptional } from '@/auth/AuthContext';
import { isExamId, isTrainingLevelId, type ExamId, type TrainingLevelId } from '@/home/exams';

/**
 * What the learner says they are revising for.
 *
 * Deliberately the same shape as `useEntitlement`: one lookup per user for the app's lifetime, a
 * module-level cache every page shares, and a revision counter so a change on the account page
 * re-renders the catalogue filter without either knowing about the other. Two stores that behave
 * differently would be two things to learn.
 *
 * Both fields are nullable and both stay nullable. A learner who has not answered, and one who
 * answered "not sure yet", are the same state as far as the catalogue is concerned: show
 * everything. Storing a sentinel string for the second would mean every reader had to know about
 * it, and the first thing to forget would be the filter.
 */

export interface ExamProfile {
  targetExam: ExamId | null;
  trainingLevel: TrainingLevelId | null;
}

const EMPTY: ExamProfile = { targetExam: null, trainingLevel: null };

const cache = new Map<string, ExamProfile>();
const inFlight = new Map<string, Promise<ExamProfile>>();

let revision = 0;
const listeners = new Set<() => void>();

function subscribeRevision(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getRevision = () => revision;
const getRevisionServerSnapshot = () => 0;

function bump() {
  revision += 1;
  for (const listener of listeners) listener();
}

/** Drops the memoised answer — call after sign-out, and between tests. */
export function clearExamProfileCache(userId?: string) {
  if (userId === undefined) {
    cache.clear();
    inFlight.clear();
  } else {
    cache.delete(userId);
    inFlight.delete(userId);
  }
}

async function fetchExamProfile(userId: string): Promise<ExamProfile> {
  if (!supabase) return EMPTY;

  const { data, error } = await supabase
    .from('profiles')
    .select('target_exam, training_level')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return EMPTY;

  // Validated rather than cast. These are free-text columns, and an exam retired from `EXAMS`
  // would otherwise filter the catalogue down to nothing with no way for a learner to see why.
  return {
    targetExam: isExamId(data.target_exam) ? data.target_exam : null,
    trainingLevel: isTrainingLevelId(data.training_level) ? data.training_level : null,
  };
}

function profileFor(userId: string): Promise<ExamProfile> {
  const running = inFlight.get(userId);
  if (running) return running;

  const promise = fetchExamProfile(userId).then((resolved) => {
    cache.set(userId, resolved);
    inFlight.delete(userId);
    return resolved;
  });
  inFlight.set(userId, promise);
  return promise;
}

export interface ExamProfileHandle extends ExamProfile {
  /** False until the first lookup resolves, so a filter never flashes the wrong catalogue. */
  ready: boolean;
  /** Whether there is anywhere to save this — no Supabase means no profile row. */
  canSave: boolean;
  save(next: Partial<ExamProfile>): Promise<boolean>;
}

/**
 * Read and write the learner's exam profile.
 *
 * With no Supabase configured this resolves immediately to an empty profile that cannot be saved,
 * which is the same standing-aside the auth gate and the tutor do — the app has always been
 * required to run without accounts.
 */
export function useExamProfile(): ExamProfileHandle {
  const { user } = useAuthOptional() ?? { user: null };
  const userId = user?.id ?? null;

  const revisionNow = useSyncExternalStore(subscribeRevision, getRevision, getRevisionServerSnapshot);

  const canSave = isSupabaseConfigured && userId !== null;

  const [resolved, setResolved] = useState<ExamProfile | 'loading'>(() => {
    if (!isSupabaseConfigured || userId === null) return EMPTY;
    return cache.get(userId) ?? 'loading';
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setResolved(EMPTY);
      return;
    }
    if (userId === null) {
      // Signing out must not leave the next learner on this browser filtered by the last one's exam.
      clearExamProfileCache();
      setResolved(EMPTY);
      return;
    }

    const known = cache.get(userId);
    if (known) {
      setResolved(known);
      return;
    }

    let cancelled = false;
    setResolved('loading');
    void profileFor(userId).then((next) => {
      if (!cancelled) setResolved(next);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, revisionNow]);

  const save = useCallback(
    async (next: Partial<ExamProfile>): Promise<boolean> => {
      if (!supabase || userId === null) return false;

      const merged: ExamProfile = {
        targetExam: next.targetExam !== undefined ? next.targetExam : (cache.get(userId)?.targetExam ?? null),
        trainingLevel:
          next.trainingLevel !== undefined ? next.trainingLevel : (cache.get(userId)?.trainingLevel ?? null),
      };

      const { error } = await supabase
        .from('profiles')
        .update({ target_exam: merged.targetExam, training_level: merged.trainingLevel })
        .eq('id', userId);

      if (error) return false;

      // Written through rather than re-fetched: the row we just wrote is the answer, and a second
      // round trip would leave the catalogue filtered by the old exam until it landed.
      cache.set(userId, merged);
      bump();
      return true;
    },
    [userId],
  );

  const value = resolved === 'loading' ? EMPTY : resolved;
  return { ...value, ready: resolved !== 'loading', canSave, save };
}
