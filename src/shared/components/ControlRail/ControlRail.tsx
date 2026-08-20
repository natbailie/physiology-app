import type { ReactNode } from 'react';
import styles from './ControlRail.module.css';

interface ControlRailProps {
  children: ReactNode;
}

/** Panel chrome for a module's slider stack. Rendered inside ModulePage's sticky rail
 * (wide screens) or its bottom dock (narrow screens); the accent comes from
 * `--accent`, set once by ModulePage, so modules need no per-module stylesheet. */
export function ControlRail({ children }: ControlRailProps) {
  return (
    <div className={styles.rail}>
      <span className={`label ${styles.railHeader}`}>Controls</span>
      <div className={styles.stack}>{children}</div>
    </div>
  );
}

interface ControlGroupProps {
  label: string;
  children: ReactNode;
}

/** Optional labelled section within a rail, for modules with many related sliders. */
export function ControlGroup({ label, children }: ControlGroupProps) {
  return (
    <div className={styles.group}>
      <span className={`label ${styles.groupLabel}`}>{label}</span>
      <div className={styles.stack}>{children}</div>
    </div>
  );
}
