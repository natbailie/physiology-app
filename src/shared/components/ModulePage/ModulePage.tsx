import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { ProvenanceNote } from '@/shared/components/ProvenanceNote/ProvenanceNote';
import { RelatedModules } from '@/shared/components/RelatedModules/RelatedModules';
import { ModuleShellProvider, useModuleShell } from '@/shared/context/moduleShell';
import { BrandMark } from '../BrandMark/BrandMark';
import { ThemeToggle } from '@/theme/ThemeToggle';
import styles from './ModulePage.module.css';

/** Which view of a module is showing. Every module has a lab and lessons; the other two exist
 * only where a module has patients. */
export type ModuleTab = 'lab' | 'clinic' | 'questions' | 'lessons';

interface ModulePageSlots {
  /** Registry id, used to look up this module's related links. */
  moduleId: string;
  title: string;
  subtitle: string;
  /** Module accent, e.g. "var(--artery)". Drives slider fills, focus rings and preset accents. */
  accentVar?: string;
  /** Preset / scenario row — pinned in the sticky top bar at every width. */
  presets: ReactNode;
  /**
   * Ward-round bedside banner: who this patient is, and what is being asked at the bed.
   *
   * A PROP rather than something the shell context carries, which is not a style preference:
   * `ModuleShellProvider` is created below, inside this component, so a module page's own body
   * runs outside it and cannot register the way `QuizPanel` and `PresetBar` — which are
   * children — do.
   *
   * Rendered inside the sticky header so it stays on screen while the learner works the
   * sliders. A case header that scrolls away is a patient nobody remembers they were seeing.
   * Absent for a module opened from the catalogue, which is most of them.
   */
  caseHeader?: ReactNode;
  /** Previous/next patient on the round. Rendered on EVERY tab, unlike `caseHeader`, because
   * the walk is navigation around the round rather than a statement about the Lab tab. */
  roundWalk?: ReactNode;
  /**
   * The Patients tab's body: the beds, the history, the observations and the practice.
   *
   * Absent on the 48 modules that have no patients, and its absence is the entire switch.
   */
  clinic?: ReactNode;
  /**
   * The Questions tab's body: the module's practice, wrapped in the current question's own
   * instrument.
   *
   * On the three modules with beds this is the questions no bed claims; on the other 48 it is
   * the whole set. Either way the page wraps it in a `QuestionSet` before passing it, so what
   * arrives here is ready to render. Its own prop rather than a flag, and its own tab button,
   * so a module whose beds happen to claim every question shows two tabs rather than three
   * with an empty one.
   */
  questions?: ReactNode;
  diagram: ReactNode;
  readouts: ReactNode;
  /** Play/pause/speed + baseline capture. Rendered at the head of the control rail: running
   * the model belongs with the inputs that set it up. */
  transport?: ReactNode;
  charts?: ReactNode;
  /** The engine's `historyCapacity`, forwarded to every chart on the page through the shell so a
   * trace that is still filling grows in from the left rather than being stretched across the
   * frame. Optional only so a page without charts need not state one. */
  historyCapacity?: number;
  /** Slider stack. Sticky side rail on wide screens, bottom dock on narrow ones. */
  controls: ReactNode;
  /** Hides the control values while a pattern-discrimination question is unanswered — the
   * slider positions ARE the answer, so leaving them visible removes the exercise. */
  blindControls?: boolean;
  explainer: ReactNode;
  footnote: ReactNode;
}

/**
 * Either the page drives the tab or this component does, and there is no third state.
 *
 * A union rather than two optional props. `activeTab` without `onTabChange` type-checks perfectly
 * well and ships a strip that swallows every press — invisible until somebody tries one, and with
 * all 51 modules tabbed there is no longer a page where that would go noticed.
 *
 * Uncontrolled is the default, and it is what keeps this feature out of 48 module pages: they gain
 * a Lessons tab because they already pass `explainer`, with no edit of their own. The three with
 * beds must control it — they need the tab BEFORE render, to build the question array that feeds
 * `useModulePractice` and to decide which single QuizPanel is mounted.
 */
type TabControl =
  | { activeTab: ModuleTab; onTabChange: (tab: ModuleTab) => void }
  | { activeTab?: never; onTabChange?: never };

export type ModulePageProps = ModulePageSlots & TabControl;

/**
 * Puts the lab in front of the learner: switches to it if they are elsewhere, then scrolls it
 * under the sticky header.
 *
 * The explainer's prose has always pointed at scenarios — "watch crisis risk fall on the treated
 * preset" — and its demo buttons load one and call this. Now that the lessons are a tab of their
 * own, "reveal" means a tab change as well as a scroll.
 *
 * The scroll runs in a LAYOUT effect, not a `requestAnimationFrame` and not inline. Until the
 * switch commits, `.lab` is `display: none`, and `getBoundingClientRect()` on such an element is
 * an all-zero rect — the scroll would land at the top of the document and the learner would watch
 * nothing happen. A layout effect runs after the mutation and before paint, and the rect read
 * inside `scroll` forces the layout it needs.
 *
 * The header height is MEASURED there rather than read from the `--topbar-h` the page publishes,
 * and that was careful before and is load-bearing now: the header grows by the preset row in the
 * same commit, and the ResizeObserver has not fired yet. `scrollIntoView({ block: 'start' })`
 * would slide the diagram under the bar for the same reason.
 */
function LabAnchor({
  labRef,
  topBarRef,
  showLab,
  onShowLab,
}: {
  labRef: RefObject<HTMLElement | null>;
  topBarRef: RefObject<HTMLElement | null>;
  showLab: boolean;
  onShowLab: () => void;
}) {
  const { registerRevealLab } = useModuleShell();

  // Latest-value refs: the closure below is registered once and must not read a tab it captured
  // several commits ago.
  const live = useRef({ showLab, onShowLab });
  live.current = { showLab, onShowLab };

  // Set when a reveal arrives from a tab that is not the lab; consumed once the lab is committed.
  const pending = useRef(false);

  const scroll = useCallback(
    (focus: boolean) => {
      const lab = labRef.current;
      if (!lab) return;
      const topBar = topBarRef.current?.getBoundingClientRect().height ?? 0;
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      // The button that sent us here has just become inert, so the browser drops focus to the
      // body and the next Tab would restart at the top of the document.
      if (focus) lab.focus?.({ preventScroll: true });
      window.scrollTo({
        top: Math.max(0, lab.getBoundingClientRect().top + window.scrollY - topBar - LAB_SCROLL_GAP_PX),
        behavior: reduced ? 'auto' : 'smooth',
      });
    },
    [labRef, topBarRef],
  );

  useEffect(() => {
    registerRevealLab(() => {
      // Already there: scroll now, as this always did. The shell's contract is "put the lab in
      // front of me", not "switch tabs", so both paths have to honour it.
      if (live.current.showLab) {
        scroll(false);
        return;
      }
      pending.current = true;
      live.current.onShowLab();
    });
  }, [registerRevealLab, scroll]);

  useLayoutEffect(() => {
    if (!showLab || !pending.current) return;
    pending.current = false;
    scroll(true);
  }, [showLab, scroll]);

  return null;
}

/** Breathing room between the sticky header and the diagram it would otherwise cover. */
const LAB_SCROLL_GAP_PX = 8;

/**
 * Shared shell for every simulator module.
 *
 * Two regions, not one grid. The `lab` region pairs the diagram, readouts and charts
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
  caseHeader,
  roundWalk,
  clinic,
  questions,
  activeTab,
  onTabChange,
  diagram,
  readouts,
  transport,
  charts,
  historyCapacity,
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

  const [ownTab, setOwnTab] = useState<ModuleTab>('lab');
  const requested = activeTab ?? ownTab;
  const changeTab = onTabChange ?? setOwnTab;
  const hasClinic = clinic != null;

  // Clamped to a tab that exists. `activeTab='questions'` on a module with no question set would
  // otherwise hide the lab and render nothing in its place — a blank page, from a line that types
  // cleanly. Widening the union from three members to four widens that hazard, so it closes here.
  const available: readonly ModuleTab[] = [
    'lab',
    ...(hasClinic ? (['clinic'] as const) : []),
    ...(questions != null ? (['questions'] as const) : []),
    'lessons',
  ];
  const tab: ModuleTab = available.includes(requested) ? requested : 'lab';

  // One boolean per section rather than deriving the others from `showLab`. With two tabs
  // `!showLab` meant "the clinic", and widening the union alone left the clinic showing
  // UNDERNEATH the Questions tab — it compiled, and it put two panels on one page.
  const showLab = tab === 'lab';
  const showClinic = tab === 'clinic';
  const showQuestions = tab === 'questions';
  const showLessons = tab === 'lessons';

  return (
    <ModuleShellProvider blinded={blindControls} moduleId={moduleId} historyCapacity={historyCapacity ?? null}>
      <LabAnchor labRef={labRef} topBarRef={topBarRef} showLab={showLab} onShowLab={() => changeTab('lab')} />
      <div ref={pageRef} className={styles.page} style={style}>
        <header ref={topBarRef} className={styles.topBar}>
          <div className={styles.titleRow}>
            <span className={styles.brandSlot}>
              <BrandMark size="sm" href="#" />
            </span>
            <span className={styles.brandRule} aria-hidden="true" />
            <a className={styles.backLink} href="#">
              &larr; Modules
            </a>
            <h1 className={styles.title}>{title}</h1>
            <span className={styles.subtitle}>{subtitle}</span>
            {/* In the row rather than above it: this bar is sticky and its height is the
                budget that 2.4.11's scroll clearance spends, so a second row would cost
                every focusable element on the page. */}
            <span className={styles.themeSlot}>
              <ThemeToggle />
            </span>
          </div>
          {/* `aria-pressed` buttons rather than `role="tablist"`, following TeacherPage: the
              ARIA tab pattern obliges a roving tabindex, arrow-key navigation and a labelled
              tabpanel, and announcing "tab" without them promises a keyboard contract this
              does not honour. Pressed buttons say the same thing and are true. */}
          <div className={styles.tabStrip}>
            <button type="button" className={styles.tab} aria-pressed={showLab} onClick={() => changeTab('lab')}>
              Lab
            </button>
            {hasClinic && (
              <button type="button" className={styles.tab} aria-pressed={showClinic} onClick={() => changeTab('clinic')}>
                Patients
              </button>
            )}
            {questions != null && (
              <button type="button" className={styles.tab} aria-pressed={showQuestions} onClick={() => changeTab('questions')}>
                Questions
              </button>
            )}
            <button type="button" className={styles.tab} aria-pressed={showLessons} onClick={() => changeTab('lessons')}>
              Lessons
            </button>
          </div>
          {roundWalk}
          {showLab && caseHeader}
          {/* MOUNTED on every tab, hidden on all but the lab — load-bearing rather than tidy.
              PresetBar registers the module's scenario labels with the shell, and the explainer's
              415 "show me" buttons read their text from that registration: unmount the bar and
              `scenarioLabels` goes null, after which 411 of those buttons render nothing at all.
              A WRAPPER carries the attribute because `presets` is an opaque node and `.bar`
              declares `display: flex`, which beats the user agent's own `[hidden]` rule. */}
          <div className={styles.presetSlot} hidden={!showLab} inert={!showLab || undefined}>
            {presets}
          </div>
        </header>

        {/* HIDDEN, never unmounted. Every ReadoutItem registers its tile with the tutor
            (shared/chat/tileRegistry.ts), and `releaseTile` clears the live state once the last
            one goes — so unmounting the lab would blind the tutor on the Patients tab, which is
            exactly where a learner mid-question asks what a number means. Unmounting would also
            drop the explainer's open mechanism cards, which are uncontrolled DOM state. The
            engine republishes every frame whatever tab is showing, so hiding costs one extra
            reconcile of a subtree the app already reconciles on all 51 modules. */}
        {/* `tabIndex={-1}` so a demo button pressed from Lessons has somewhere to put focus: the
            button it came from has just gone inert, and without this the browser drops focus to
            <body> and the next Tab restarts at the top of the document. */}
        <section
          ref={labRef}
          className={styles.lab}
          hidden={!showLab}
          inert={!showLab || undefined}
          tabIndex={-1}
        >
          <div className={styles.main}>
            {diagram}
            {readouts}
            {charts && <div className={styles.trendGroup}>{charts}</div>}
            {/* The module's own footnote went to the Lessons tab with the rest of the study
                region, and it carries the "not a clinical or diagnostic tool" line every module
                states. ProvenanceNote's docblock argues it renders from here because "a
                disclosure a module can forget to include is not a disclosure" — and a disclosure
                one tab away is weaker than one below the fold. This is the short form, on the tab
                a learner actually works in. */}
            <p className={styles.labDisclaimer}>
              A simplified, conceptual model built to teach mechanism — not a clinical or
              diagnostic tool. <button type="button" className={styles.inlineLink} onClick={() => changeTab('lessons')}>
                Where these numbers came from
              </button>
            </p>
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

        <section className={styles.lessons} hidden={!showLessons} inert={!showLessons || undefined}>
          <div className={styles.prose}>{explainer}</div>
          <div className={styles.studyAside}>
            <RelatedModules moduleId={moduleId} />
          </div>
          <p className={styles.footnote}>{footnote}</p>
          <ProvenanceNote moduleId={moduleId} />
        </section>

        {hasClinic && (
          <section className={styles.clinic} hidden={!showClinic} inert={!showClinic || undefined}>
            {clinic}
          </section>
        )}

        {questions != null && (
          <section className={styles.questions} hidden={!showQuestions} inert={!showQuestions || undefined}>
            {questions}
          </section>
        )}
      </div>
    </ModuleShellProvider>
  );
}
