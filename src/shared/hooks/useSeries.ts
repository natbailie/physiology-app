import { useMemo } from 'react';

/**
 * One chart series pulled out of the engine's history, memoised on the history array itself.
 *
 * Every page used to build these inline — `history.map((h) => h.map)`, ten of them on the busier
 * modules — which meant a slider drag rebuilt ten arrays of up to 600 points per pointer event.
 * Worse, the fresh identity defeated the `useMemo`s inside `Sparkline`, so every SVG path was
 * rebuilt too. `history` only changes identity on the throttled engine tick, so keying on it
 * makes an input change cost nothing at all in the charts.
 *
 * `select` is deliberately NOT a dependency: an inline arrow is a new function every render, which
 * would defeat the memo the same way. It must therefore be pure and depend on nothing but the
 * point it is handed — which is what every call site does.
 */
export function useSeries<T, R>(history: readonly T[], select: (point: T) => R): R[];
export function useSeries<T, R>(history: readonly T[] | null | undefined, select: (point: T) => R): R[] | null;
export function useSeries<T, R>(history: readonly T[] | null | undefined, select: (point: T) => R): R[] | null {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `select` is intentionally excluded; see above
  return useMemo(() => (history ? history.map(select) : null), [history]);
}
