import type { ReactNode } from 'react';
import { useModuleShell } from '@/shared/context/moduleShell';
import styles from './DiagramFrame.module.css';

interface DiagramFrameProps {
  viewBox: string;
  ariaLabel: string;
  defs?: ReactNode;
  children: ReactNode;
}

/** Shared scaffold for a module's animated SVG diagram: the panel, the graph-paper
 * background, and the <svg> root itself.
 *
 * `data-blinded` propagates the shell's pattern-question state into the drawing, which is
 * what lets the shared `.verdict` class withhold the classification while the learner is
 * being asked to name it. */
export function DiagramFrame({ viewBox, ariaLabel, defs, children }: DiagramFrameProps) {
  const { blinded } = useModuleShell();
  return (
    <div className={styles.panel} data-blinded={blinded || undefined}>
      <svg className={styles.screen} viewBox={viewBox} role="img" aria-label={ariaLabel}>
        {defs && <defs>{defs}</defs>}
        {children}
      </svg>
    </div>
  );
}
