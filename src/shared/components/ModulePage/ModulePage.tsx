import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { RelatedModules } from '@/shared/components/RelatedModules/RelatedModules';
import { ModuleShellProvider, useModuleShell } from '@/shared/context/moduleShell';
import styles from './ModulePage.module.css';

interface ModulePageProps {
  /** Registry id, used to look up this module's related links. */
  moduleId: string;
  title: string;
  subtitle: string;
  /** Module accent, e.g. "var(--artery)". Drives slider fills, focus rings and preset accents. */
  accentVar?: string;
  /** Preset / scenario row — pinned in the sticky top bar at every width. */
  presets: ReactNode;
  diagram: ReactNode;
  readouts: ReactNode;
  /** Predict-then-run practice. Sits under the readouts, so a question and the numbers that
   * answer it are on screen together. */
  practice?: ReactNode;
  /** Play/pause/speed + baseline capture. Rendered at the head of the control rail: running
   * the model belongs with the inputs that set it up. */
  transport?: ReactNode;
  charts?: ReactNode;
  /** Slider stack. Sticky side rail on wide screens, bottom dock on narrow ones. */
  controls: ReactNode;
  /** Hides the control values while a pattern-discrimination question is unanswered — the
   * slider positions ARE the answer, so leaving them visible removes the exercise. */
  blindControls?: boolean;
  explainer: ReactNode;
  footnote: ReactNode;
}

/**
 * Registers "scroll the lab back into view" with the shell, for the explainer's scenario
 * buttons — a learner reading the prose is below the fold, and loading a scenario they cannot
 * see teaches nothing.
 *
 * `scrollIntoView({ block: 'start' })` would slide the diagram under the sticky header, so the
 * header's height is subtracted. It is MEASURED here rather than read from the `--topbar-h` the
 * page publishes: that variable comes from a ResizeObserver and can lag the wrapped preset row
 * badly — 88px against a real 240px in a narrow viewport — and an offset that is short by the
 * height of two button rows puts the diagram back under the bar this exists to clear.
 */
function LabAnchor({ labRef, topBarRef }: { labRef: RefObject<HTMLElement | null>; topBarRef: RefObject<HTMLElement | null> }) {
  const { registerRevealLab } = useModuleShell();
  useEffect(() => {
    registerRevealLab(() => {
      const lab = labRef.current;
      if (!lab) return;
      const topBar = topBarRef.current?.getBoundingClientRect().height ?? 0;
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      window.scrollTo({
        top: Math.max(0, lab.getBoundingClientRect().top + window.scrollY - topBar - LAB_SCROLL_GAP_PX),
        behavior: reduced ? 'auto' : 'smooth',
      });
    });
  }, [registerRevealLab, labRef, topBarRef]);
  return null;
}

/** Breathing room between the sticky header and the diagram it would otherwise cover. */
const LAB_SCROLL_GAP_PX = 8;

/** Offered in the sticky header whenever practice is idle, so starting a session does not
 * depend on scrolling past the diagram and the readout grid to find it. */
function PracticeCta() {
  const { canStartPractice, startPractice } = useModuleShell();
  if (!canStartPractice) return null;
  return (
    <button type="button" className={styles.practiceCta} onClick={startPractice}>
      Practise
    </button>
  );
}

/**
 * Shared shell for every simulator module.
 *
 * Two regions, not one grid. The `lab` region pairs the diagram, readouts, practice and charts
 * with a sticky rail carrying the transport and the sliders, so a drag and the thing it drives
 * are always visible together. The `study` region runs full width underneath, because the
 * explainer is the tallest block on the page and pinning it beside a 400px rail left roughly
 * 1900px of empty column running down the right of every module.
 */
export function ModulePage({
  moduleId,
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
  blindControls = false,
  explainer,
  footnote,
}: ModulePageProps) {
  const [dockOpen, setDockOpen] = useState(false);
  const topBarRef = useRef<HTMLElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const labRef = useRef<HTMLElement>(null);

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
    <ModuleShellProvider blinded={blindControls}>
      <LabAnchor labRef={labRef} topBarRef={topBarRef} />
      <div ref={pageRef} className={styles.page} style={style}>
        <header ref={topBarRef} className={styles.topBar}>
          <div className={styles.titleRow}>
            <a className={styles.backLink} href="#">
              &larr; Modules
            </a>
            <h1 className={styles.title}>{title}</h1>
            <span className={styles.subtitle}>{subtitle}</span>
            <PracticeCta />
          </div>
          {presets}
        </header>

        <section ref={labRef} className={styles.lab}>
          <div className={styles.main}>
            {diagram}
            {readouts}
            {practice}
            {charts && <div className={styles.trendGroup}>{charts}</div>}
          </div>

          <aside className={styles.railSlot} data-open={dockOpen}>
            {/* On wide screens this is the rail's head. At dock widths it is the always-visible
                bar above the collapsed sliders, which is why the transport lives here: pausing
                is what makes a fast module readable, and it must not be behind the chevron. */}
            <div className={styles.railHead}>
              <div className={styles.railTransport}>{transport}</div>
              <button
                type="button"
                className={styles.dockToggle}
                onClick={() => setDockOpen((open) => !open)}
                aria-expanded={dockOpen}
              >
                <span className="label">Controls</span>
                <span className={styles.dockChevron} aria-hidden="true">
                  {dockOpen ? '▾' : '▴'}
                </span>
              </button>
            </div>
            <div className={styles.railScroll}>
              {blindControls ? (
                <p className={styles.blinded}>
                  Controls hidden while you identify the scenario. Work from the readouts.
                </p>
              ) : (
                controls
              )}
            </div>
          </aside>
        </section>

        <section className={styles.study}>
          <div className={styles.prose}>{explainer}</div>
          <div className={styles.studyAside}>
            <RelatedModules moduleId={moduleId} />
          </div>
          <p className={styles.footnote}>{footnote}</p>
        </section>
      </div>
    </ModuleShellProvider>
  );
}
