import { memo } from 'react';
import { useModuleShell } from '@/shared/context/moduleShell';
import styles from './ExplainerPanel.module.css';

/**
 * A scenario a section is talking about, offered as a button beside the prose that names it.
 *
 * Generic over the module's own preset union, so renaming a preset fails `tsc -b` rather than
 * rendering a button that quietly does nothing.
 */
export interface ExplainerDemo<TPreset extends string = string> {
  preset: TPreset;
  /** Button text. Defaults to the module's own label for that preset. */
  label?: string;
  /** Readout to watch once it loads, shown beside the button. */
  watch?: string;
}

export interface ExplainerSection<TPreset extends string = string> {
  /** A claim, not a topic — the same voice as the module title. */
  heading: string;
  paragraphs: string[];
  demos?: ExplainerDemo<TPreset>[];
}

export interface ExplainerContent<TPreset extends string = string> {
  title: string;
  /** Legacy flat prose. Replaced by `sections` as modules migrate. */
  paragraphs?: string[];
  sections?: ExplainerSection<TPreset>[];
}

/** Every paragraph in a module, whichever shape it is authored in. Used by the content test. */
export function paragraphsOf(content: ExplainerContent): string[] {
  return content.sections
    ? content.sections.flatMap((section) => section.paragraphs)
    : (content.paragraphs ?? []);
}

interface ExplainerPanelProps {
  content: ExplainerContent;
  /** Collapse on load. Only for modules where the mechanism text is long enough to
   * bury the controls. */
  startCollapsed?: boolean;
}

/**
 * Loads the scenario this section is about and scrolls the lab back into view.
 *
 * The prose has always pointed at scenarios — "watch crisis risk fall on the treated preset" —
 * from a position where the preset bar is a full scroll away and the reader has to guess which
 * of seven buttons was meant. Both halves come from the shell, which PresetBar registers itself
 * with, so no module page passes anything down for this.
 */
function DemoButton<TPreset extends string>({ demo }: { demo: ExplainerDemo<TPreset> }) {
  const { scenarioLabels, scenariosLocked, applyScenario, revealLab } = useModuleShell();
  const label = demo.label ?? scenarioLabels?.[demo.preset];
  // No preset bar on this page, or a preset that is no longer registered: show nothing rather
  // than a button that cannot work.
  if (!label) return null;

  return (
    <span className={styles.demo}>
      <button
        type="button"
        className={styles.demoButton}
        disabled={scenariosLocked}
        onClick={() => {
          applyScenario(demo.preset);
          revealLab();
        }}
      >
        <span aria-hidden="true">&#9654;</span> {label}
      </button>
      {demo.watch && <span className={styles.watch}>watch {demo.watch}</span>}
    </span>
  );
}

/** One titled, individually collapsible claim. Closed by default — see the panel's note. */
function SectionCard({ section, index }: { section: ExplainerSection; index: number }) {
  return (
    <li>
      <details className={styles.card}>
        <summary className={styles.cardSummary}>
          <span className={styles.ordinal} aria-hidden="true">
            {index + 1}
          </span>
          <h3 className={styles.heading}>{section.heading}</h3>
          <span className={styles.chevron} aria-hidden="true" />
        </summary>
        <div className={styles.cardBody}>
          {section.paragraphs.map((paragraph, i) => (
            <p key={i} className={styles.paragraph}>
              {paragraph}
            </p>
          ))}
          {section.demos && section.demos.length > 0 && (
            <div className={styles.demoRow}>
              {section.demos.map((demo) => (
                <DemoButton key={demo.preset} demo={demo} />
              ))}
            </div>
          )}
        </div>
      </details>
    </li>
  );
}

/** Concise "what's happening / why it matters" mechanism text for a module.
 * Open by default: sliders and numbers with no framing is a poor first encounter with
 * a mechanism, and the panel sits below the readouts and charts so it displaces nothing.
 *
 * A module authored as `sections` renders as a run of titled cards, each collapsible on its own.
 * The cards are CLOSED by default, so what a learner meets is a contents page: five or ten
 * headings, each a claim about the mechanism, that can be read in a glance and opened one at a
 * time. Opening them all by default was the earlier behaviour and it reproduced the wall of
 * prose the headings exist to break up — the landmarks are only useful if you can see them all
 * at once.
 *
 * A module still authored as flat `paragraphs` renders exactly as it always has. */
function ExplainerPanelBase({ content, startCollapsed = false }: ExplainerPanelProps) {
  return (
    <details className={styles.panel} open={!startCollapsed}>
      <summary className={styles.summary}>
        <h2 className={styles.title}>{content.title}</h2>
        <span className={styles.chevron} aria-hidden="true" />
      </summary>
      {content.sections ? (
        <ol className={styles.sections}>
          {content.sections.map((section, index) => (
            <SectionCard key={section.heading} section={section} index={index} />
          ))}
        </ol>
      ) : (
        <div className={styles.paragraphs}>
          {(content.paragraphs ?? []).map((paragraph, i) => (
            <p key={i} className={styles.paragraph}>
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </details>
  );
}

export const ExplainerPanel = memo(ExplainerPanelBase);
