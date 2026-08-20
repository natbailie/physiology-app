import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import styles from './ModulePage.module.css';

interface ModulePageProps {
  title: string;
  subtitle: string;
  /** Module accent, e.g. "var(--artery)". Drives slider fills, focus rings and preset accents. */
  accentVar?: string;
  /** Preset / scenario row — pinned in the sticky top bar at every width. */
  presets: ReactNode;
  diagram: ReactNode;
  readouts: ReactNode;
  /** Predict-then-run practice. Sits between the readouts and the charts so a question
   * and the traces that answer it are on screen together. */
  practice?: ReactNode;
  /** Play/pause/speed + baseline capture. Sits directly above the charts because
   * that is where simulated time is legible. */
  transport?: ReactNode;
  charts?: ReactNode;
  /** Slider stack. Sticky side rail on wide screens, bottom dock on narrow ones. */
  controls: ReactNode;
  explainer: ReactNode;
  footnote: ReactNode;
}

/** Shared shell for every simulator module: sticky header + preset bar, diagram/readout
 * main column, and a control rail that stays on screen so a slider drag and the
 * diagram it drives are always visible together. */
export function ModulePage({
  title,
  subtitle,
  accentVar,
  presets,
  diagram,
  readouts,
  practice,
  transport,
  charts,
  controls,
  explainer,
  footnote,
}: ModulePageProps) {
  const [dockOpen, setDockOpen] = useState(false);
  const topBarRef = useRef<HTMLElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // The preset row wraps at narrow widths, so the top bar has no fixed height.
  // Publish its measured height so the rail can offset itself beneath it.
  useEffect(() => {
    const bar = topBarRef.current;
    const page = pageRef.current;
    if (!bar || !page) return;
    const observer = new ResizeObserver(() => {
      page.style.setProperty('--topbar-h', `${bar.offsetHeight}px`);
    });
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  const style = accentVar ? ({ '--accent': accentVar } as CSSProperties) : undefined;

  return (
    <div ref={pageRef} className={styles.page} style={style}>
      <header ref={topBarRef} className={styles.topBar}>
        <div className={styles.titleRow}>
          <a className={styles.backLink} href="#">
            &larr; Modules
          </a>
          <h1 className={styles.title}>{title}</h1>
          <span className={styles.subtitle}>{subtitle}</span>
        </div>
        {presets}
      </header>

      <div className={styles.body}>
        <div className={styles.main}>
          {diagram}
          {readouts}
          {practice}
          {(transport || charts) && (
            <div className={styles.charts}>
              {transport}
              {charts}
            </div>
          )}
          {explainer}
          <p className={styles.footnote}>{footnote}</p>
        </div>

        <div className={styles.railSlot} data-open={dockOpen}>
          <button
            type="button"
            className={styles.dockHandle}
            onClick={() => setDockOpen((open) => !open)}
            aria-expanded={dockOpen}
          >
            <span className="label">Controls</span>
            <span className={styles.dockChevron} aria-hidden="true">
              {dockOpen ? '▾' : '▴'}
            </span>
          </button>
          <div className={styles.railScroll}>{controls}</div>
        </div>
      </div>
    </div>
  );
}
