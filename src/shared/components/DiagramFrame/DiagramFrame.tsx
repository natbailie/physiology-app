import type { ReactNode } from 'react';
import styles from './DiagramFrame.module.css';

interface DiagramFrameProps {
  viewBox: string;
  ariaLabel: string;
  defs?: ReactNode;
  children: ReactNode;
}

/** Shared scaffold for a module's animated SVG diagram: the dark panel, grid-line
 * "monitor screen" background, and the <svg> root itself. */
export function DiagramFrame({ viewBox, ariaLabel, defs, children }: DiagramFrameProps) {
  return (
    <div className={styles.panel}>
      <svg className={styles.screen} viewBox={viewBox} role="img" aria-label={ariaLabel}>
        {defs && <defs>{defs}</defs>}
        {children}
      </svg>
    </div>
  );
}
