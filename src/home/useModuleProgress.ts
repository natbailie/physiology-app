import { useMemo, useSyncExternalStore } from 'react';
import { useProgressStore } from '@/shared/assessment/useProgressStore';
import { knownCount, mastery as masteryOf } from '@/shared/assessment/scheduling';
import { rankWeaknesses, type WeakSpot } from '@/shared/assessment/weakness';
import {
  questionIdsFor,
  questionIndexVersion,
  subscribeQuestionIndex,
} from './moduleQuestionIds';
import { MODULES } from './moduleRegistry';

export interface ModuleProgress {
  mastery?: number;
  dueCount: number;
}

export interface ProgressTotals {
  due: number;
  attempted: number;
  known: number;
  totalQuestions: number;
  reviewModuleId: string | null;
  reviewModuleName: string | null;
}

/**
 * One pass over every module, read once rather than calling `summary(id)` per module — the
 * localStorage implementation re-reads and re-parses storage on every call.
 *
 * Shared by the home page (which needs only the totals for the study strip) and every theme
 * page (which needs the per-module map for its cards). The question index builds in the
 * background, so this recomputes once it lands.
 */
export function useModuleProgress(): {
  progress: Record<string, ModuleProgress>;
  totals: ProgressTotals;
  /** Modules with something wrong with them, weakest first. Empty until something is attempted. */
  weakSpots: WeakSpot[];
} {
  const store = useProgressStore();
  const indexVersion = useSyncExternalStore(subscribeQuestionIndex, questionIndexVersion);

  return useMemo(() => {
    const summaries = store.allSummaries();
    const byModule: Record<string, ModuleProgress> = {};
    const simulatorIds: string[] = [];

    let due = 0;
    let attempted = 0;
    let known = 0;
    let totalQuestions = 0;
    let mostDue: { id: string; name: string; count: number } | null = null;

    for (const module of MODULES) {
      if (module.kind === 'reference') continue;
      simulatorIds.push(module.id);
      const ids = questionIdsFor(module.id);
      totalQuestions += ids.length;

      const summary = summaries[module.id];
      if (!summary) {
        byModule[module.id] = { dueCount: 0 };
        continue;
      }

      const dueCount = store.due(module.id, ids).length;
      const moduleMastery = masteryOf(summary.schedule, ids);

      due += dueCount;
      attempted += summary.attempted;
      known += knownCount(summary.schedule, ids);
      byModule[module.id] = { mastery: moduleMastery, dueCount };

      if (dueCount > 0 && (mostDue === null || dueCount > mostDue.count)) {
        mostDue = { id: module.id, name: module.name, count: dueCount };
      }
    }

    return {
      progress: byModule,
      // Ranked in the same pass, off the same `summaries` read — the docblock above is about
      // not re-reading storage per module, and a separate weakness hook would do exactly that.
      weakSpots: rankWeaknesses(summaries, questionIdsFor, simulatorIds, Date.now()),
      totals: {
        due,
        attempted,
        known,
        totalQuestions,
        reviewModuleId: mostDue?.id ?? null,
        reviewModuleName: mostDue?.name ?? null,
      },
    };
  }, [store, indexVersion]);
}