import type { ModuleCase } from '@/shared/cases/types';
import { useModuleShell } from '@/shared/context/moduleShell';
import text from '@/shared/styles/text.module.css';
import styles from './CaseHeader.module.css';

export interface CaseHeaderProps<TPreset extends string, TSnapshot> {
  patient: ModuleCase<TPreset, TSnapshot>;
  /** Which scenario is actually loaded right now. */
  activePreset: TPreset | null;
  /** Puts the patient back. Wired to the module's own scenario applier. */
  onReturn: () => void;
  /** Whether the engine is running, for the monitor line. */
  playing: boolean;
  /** Whether a comparison trace is frozen, which the register reports as a monitor would. */
  baselineFrozen: boolean;
}

/**
 * Who is in the bed, on the Lab tab.
 *
 * Deliberately slim. The live observations moved to `ClinicPanel`, where they sit with the
 * history and the questions they are evidence for; keeping a copy here would have put a
 * six-row chart a few centimetres above the readout panel saying much the same thing. What is
 * left is the part the lab genuinely needs: whose physiology these sliders are.
 *
 * Sits in the module page's sticky header so it stays on screen while the learner works the
 * controls — the point of a case is that the mechanism being explored belongs to somebody, and
 * that stops being true the moment the patient scrolls away.
 *
 * **It goes stale honestly.** Nothing stops a learner pressing "Septic" while Amina is in the
 * bed, and a banner that kept asserting her name over somebody else's physiology would be the
 * one genuinely dishonest surface in the app — every other number here is read from the engine.
 * So when the loaded scenario diverges from the patient's, the task gives way to a note and a
 * way back. Exploring away from the case is a legitimate thing to do; pretending you have not
 * is not.
 */
export function CaseHeader<TPreset extends string, TSnapshot>({
  patient,
  activePreset,
  onReturn,
  playing,
  baselineFrozen,
}: CaseHeaderProps<TPreset, TSnapshot>) {
  // Null means "no scenario applied yet", which is the state a freshly seeded page is in
  // before anyone touches the preset bar — not a divergence.
  const strayed = activePreset !== null && activePreset !== patient.preset;

  // Read from the shell rather than threaded as a prop: PresetBar already publishes the module's
  // scenario labels there, and this renders inside ModuleShellProvider. (The `caseHeader` prop's
  // own docblock is about a page BODY being unable to register into the shell — reading from it
  // at render position is a different thing and works.)
  const { scenarioLabels } = useModuleShell();
  const scenario = scenarioLabels?.[activePreset ?? patient.preset];

  // What a monitor's register actually says. Deliberately NOT a simulated clock: the engine is
  // reset before every practice question, `settledState` pre-advances it, and `timeScale` differs
  // by three orders of magnitude between modules — "how long this patient has been simulated" is
  // not a quantity this app holds, and printing one would be the only invented number here.
  const register = [patient.bed, scenario, playing ? 'Live' : 'Paused', baselineFrozen ? 'Baseline frozen' : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <section className={styles.banner} aria-label={`Bedside: ${patient.name}`}>
      <div className={styles.identity}>
        <span className={styles.who}>
          {patient.name}, {patient.age}
        </span>
        <span className={`${text.microLabel} ${styles.oneLiner}`}>{patient.oneLiner}</span>
        {/* The dot is emphasis; the WORD is the carrier. index.css stops all animation under
            prefers-reduced-motion, so a blink that were the only sign of "running" would be lost
            for those readers — and a dot blinking over a paused engine would be the dishonest
            surface this component spends a paragraph refusing. */}
        <span className={styles.register}>
          <span className={styles.dot} data-live={playing || undefined} aria-hidden="true" />
          {register}
        </span>
      </div>

      {strayed ? (
        <div className={styles.stale}>
          <span className={styles.staleNote}>
            Showing a different scenario — these are not {patient.name}&apos;s numbers.
          </span>
          <button type="button" className={styles.returnButton} onClick={onReturn}>
            Back to the bedside
          </button>
        </div>
      ) : (
        <p className={styles.task}>{patient.task}</p>
      )}
    </section>
  );
}
