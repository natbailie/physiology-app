import { useCallback, useEffect, useState } from 'react';
import { useAuthOptional } from '@/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { standingFor, type CohortProgressRow, type CohortStanding } from './aggregate';

/**
 * The dashboard's data layer.
 *
 * Every read goes through RLS as the signed-in teacher — `v_cohort_progress` is `security_invoker`
 * and the cohort policies are plain row policies — so this file contains no authorisation logic of
 * its own, and could not usefully add any. What it must do is fail SAFE when Supabase is absent:
 * the app runs fully local-only without credentials, and a teacher page that throws in that
 * configuration would take the whole route down.
 */

export interface Cohort {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
}

export type Role = 'loading' | 'teacher' | 'student' | 'signedOut';

export function useRole(): Role {
  const auth = useAuthOptional();
  const userId = auth?.user?.id ?? null;
  const [role, setRole] = useState<Role>('loading');

  useEffect(() => {
    if (!supabase || !userId) {
      setRole('signedOut');
      return;
    }
    let live = true;
    void supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (live) setRole(data?.role === 'teacher' ? 'teacher' : 'student');
      });
    return () => {
      live = false;
    };
  }, [userId]);

  return role;
}

export interface CohortsState {
  cohorts: Cohort[];
  loading: boolean;
  error: string | null;
  create: (name: string) => Promise<void>;
  reload: () => void;
}

export function useCohorts(enabled: boolean): CohortsState {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!supabase || !enabled) {
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    void supabase
      .from('cohorts')
      .select('id, name, join_code, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (!live) return;
        if (err) setError(err.message);
        else setCohorts((data ?? []) as Cohort[]);
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [enabled, revision]);

  const create = useCallback(async (name: string) => {
    if (!supabase) return;
    const { error: err } = await supabase.rpc('create_cohort', { p_name: name });
    if (err) {
      setError(err.message);
      return;
    }
    setError(null);
    setRevision((r) => r + 1);
  }, []);

  const reload = useCallback(() => setRevision((r) => r + 1), []);

  return { cohorts, loading, error, create, reload };
}

export interface ProgressState {
  standing: CohortStanding | null;
  loading: boolean;
  error: string | null;
}

export function useCohortProgress(cohortId: string | null): ProgressState {
  const [standing, setStanding] = useState<CohortStanding | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !cohortId) {
      setStanding(null);
      return;
    }
    let live = true;
    setLoading(true);
    void supabase
      .from('v_cohort_progress')
      .select('cohort_id, cohort_name, user_id, module_id, attempted, correct, last_attempt_at')
      .eq('cohort_id', cohortId)
      .then(({ data, error: err }) => {
        if (!live) return;
        if (err) setError(err.message);
        else {
          setError(null);
          setStanding(standingFor((data ?? []) as CohortProgressRow[]));
        }
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [cohortId]);

  return { standing, loading, error };
}
