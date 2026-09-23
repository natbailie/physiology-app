import { ThemeToggle } from './ThemeToggle';
import styles from './ThemeBar.module.css';

/**
 * The theme control as a page-level row, for the pages that are not the module shell.
 *
 * A row of its own rather than a slot inside each page's header, because those headers do not
 * agree on a layout — some are flex columns, some are baseline-aligned rows, several are plain
 * blocks — so there is no `margin-left: auto` that lands in the same place on all of them. One
 * right-aligned row above the header puts the control in the same spot on every page and keeps
 * the placement in one stylesheet instead of eleven.
 *
 * `ModulePage` does NOT use this: its sticky top bar is already a wrapping flex row, so the
 * toggle sits in the row itself rather than above it, where a second row would add height to
 * the one piece of chrome that has to stay short (see the 2.4.11 clearance in its stylesheet).
 *
 * Safe to render once per page and no more. `useTheme` holds its state in `useState`, so two
 * mounted toggles would not see each other's changes — but pages never co-render, so exactly
 * one is live at a time and each mount reads storage fresh.
 */
export function ThemeBar() {
  return (
    <div className={styles.bar}>
      <ThemeToggle />
    </div>
  );
}
