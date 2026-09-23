import { useSyncExternalStore } from 'react';
import { THEMES, type ThemeId } from './moduleRegistry';

/**
 * Which specialty the ward round is currently narrowed to, if any.
 *
 * A direct sibling of `examFilter.ts`, and for the same reasons: it lives in `sessionStorage`
 * rather than in a route or in React state. A route parameter would make a filter shareable,
 * which invites a bookmarked link that silently hides most of the ward; React state high in the
 * tree would reset on every navigation, and this filter has to survive home → bedside → back,
 * which is the entire journey it exists for. Per-tab, so two tabs can hold two rounds.
 *
 * The phone has no `sessionStorage`, and every access here is wrapped anyway — a browser set to
 * block site data throws on the property itself — so the same file degrades there to a filter
 * that lives for the length of the app session. That is why this is synced rather than written
 * twice.
 *
 * The specialties ARE `THEMES`: Cardiovascular, Respiratory, Renal & Fluids, Neuro & Muscle and
 * the rest. There is deliberately no second taxonomy — a ward list that disagreed with the
 * subject grid above it about what counts as renal would be worse than no grouping at all.
 */

const KEY = 'physiologylab.specialtyFilter';

let active: ThemeId | null = null;
let hydrated = false;

const listeners = new Set<() => void>();

function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && THEMES.some((theme) => theme.id === value);
}

/** Read the stored filter once, lazily, and never let a storage failure stop the round. */
function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  try {
    const stored = sessionStorage.getItem(KEY);
    if (isThemeId(stored)) active = stored;
  } catch {
    // No stored filter is a perfectly good answer: the round shows every specialty.
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Pure, and correct on the very first render — hydration happens at module load rather than
 * here, because React reads a snapshot BEFORE it subscribes and an unfiltered first render is
 * the flash this store exists to avoid.
 */
function snapshot(): ThemeId | null {
  return active;
}

const serverSnapshot = (): ThemeId | null => null;

hydrate();

/** Set the filter, or clear it with null. */
export function setSpecialtyFilter(next: ThemeId | null): void {
  hydrate();
  if (active === next) return;
  active = next;
  try {
    if (next === null) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, next);
  } catch {
    // Filtering still works for this page view; it just will not survive a reload.
  }
  emit();
}

export function useSpecialtyFilter(): ThemeId | null {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

/** Reset between tests, where a module-level store would otherwise leak across cases. */
export function clearSpecialtyFilterForTests(): void {
  active = null;
  hydrated = false;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing stored, nothing to clear.
  }
  emit();
}
