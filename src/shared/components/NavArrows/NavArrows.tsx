import { useEffect, useState } from 'react';
import styles from './NavArrows.module.css';

/** The slice of the Navigation API this reads. Not in every TS lib yet, so declared locally. */
interface NavigationLike extends EventTarget {
  canGoBack: boolean;
  canGoForward: boolean;
}

function navigationApi(): NavigationLike | undefined {
  return (window as unknown as { navigation?: NavigationLike }).navigation;
}

interface HistoryState {
  canGoBack: boolean;
  canGoForward: boolean;
}

function readHistory(): HistoryState {
  const nav = navigationApi();
  // Without the Navigation API there is no way to ask, so both stay live: pressing one with
  // nowhere to go does nothing, which is harmless, whereas a wrongly greyed-out arrow is a trap.
  return nav ? { canGoBack: nav.canGoBack, canGoForward: nav.canGoForward } : { canGoBack: true, canGoForward: true };
}

/**
 * Back and forward, as two big arrows on every page.
 *
 * Every route change is a hash change (see `useHashRoute`), so each page a learner visits is
 * already a browser-history entry and these are simply `history.back()` / `history.forward()`.
 * They move through where the learner has BEEN, which is a different job from the "← Modules"
 * links on each page: those go up the catalogue, these retrace steps.
 */
export function NavArrows() {
  const [state, setState] = useState(readHistory);

  useEffect(() => {
    const update = () => setState(readHistory());
    const nav = navigationApi();
    nav?.addEventListener('currententrychange', update);
    window.addEventListener('hashchange', update);
    return () => {
      nav?.removeEventListener('currententrychange', update);
      window.removeEventListener('hashchange', update);
    };
  }, []);

  return (
    <nav className={styles.dock} aria-label="Page history">
      <button
        type="button"
        className={styles.arrow}
        aria-label="Go back"
        title="Back"
        disabled={!state.canGoBack}
        onClick={() => window.history.back()}
      >
        <Chevron direction="left" />
      </button>
      <button
        type="button"
        className={styles.arrow}
        aria-label="Go forward"
        title="Forward"
        disabled={!state.canGoForward}
        onClick={() => window.history.forward()}
      >
        <Chevron direction="right" />
      </button>
    </nav>
  );
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      <path
        d={direction === 'left' ? 'M15 5 8 12l7 7' : 'M9 5l7 7-7 7'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
