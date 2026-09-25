import type { ReactNode, Ref } from 'react';
import { useModuleShell } from '@/shared/context/moduleShell';
import styles from './DiagramFrame.module.css';

interface DiagramFrameProps {
  viewBox: string;
  ariaLabel: string;
  defs?: ReactNode;
  children: ReactNode;
  /**
   * Rendered under the svg, inside the panel. This is where a `labelRail`'s numbered key goes on a
   * narrow frame, and it has to be HTML rather than more svg: text inside the drawing is sized in
   * user units and scales with it, which is what makes an 11-unit label render at about 8.6px on a
   * phone. Out here a 12px label is 12px.
   */
  footer?: ReactNode;
  /**
   * Attached to the panel, so a caller can measure the width the drawing is actually given.
   *
   * `DiagramView` needs it to decide whether a `labelRail` has room for its names or has to fall
   * back to badges and a key — and, because that also changes the viewBox, the decision cannot be
   * a CSS container query the way the rest of the swap once was.
   */
  panelRef?: Ref<HTMLDivElement>;
}

/** Shared scaffold for a module's animated SVG diagram: the panel, the graph-paper
 * background, and the <svg> root itself.
 *
 * `data-blinded` propagates the shell's pattern-question state into the drawing, which is
 * what lets the shared `.verdict` class withhold the classification while the learner is
 * being asked to name it. */
export function DiagramFrame({ viewBox, ariaLabel, defs, children, footer, panelRef }: DiagramFrameProps) {
  const { blinded } = useModuleShell();
  return (
    <div ref={panelRef} className={styles.panel} data-blinded={blinded || undefined}>
      <svg className={styles.screen} viewBox={viewBox} role="img" aria-label={ariaLabel}>
        {defs && <defs>{defs}</defs>}
        {children}
      </svg>
      {footer}
    </div>
  );
}
