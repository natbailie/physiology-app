import { useState } from 'react';
import type { Acuity } from '@/shared/cases/acuity';
import text from '@/shared/styles/text.module.css';
import { THEMES, type ThemeId } from './moduleRegistry';
import { setSpecialtyFilter, useSpecialtyFilter } from './specialtyFilter';
import type { Round, RoundBed } from './useRound';
import styles from './RoundBoard.module.css';

/** The word on the chip. Colour is the second carrier here, never the only one. */
const ACUITY_LABEL: Record<Acuity, string> = {
  crash: 'CRASH',
  due: 'DUE',
  check: 'CHECK',
  newAdmission: 'NEW',
};

const ACUITY_CLASS: Record<Acuity, string> = {
  crash: styles.crash!,
  due: styles.due!,
  check: styles.check!,
  newAdmission: styles.newAdmission!,
};

function Bed({ bed }: { bed: RoundBed }) {
  return (
    <a className={styles.bed} href={`#${bed.moduleId}?case=${bed.id}`}>
      <span className={`${styles.acuity} ${ACUITY_CLASS[bed.acuity]}`}>{ACUITY_LABEL[bed.acuity]}</span>
      <span className={styles.who}>
        <span className={styles.name}>
          {bed.name}, {bed.age}
        </span>
        <span className={styles.oneLiner}>{bed.oneLiner}</span>
        <span className={`${text.microLabel} ${styles.module}`}>{bed.moduleName}</span>
      </span>
    </a>
  );
}

/**
 * The specialties on the ward, in catalogue order.
 *
 * Offered from the UNFILTERED ward (`round.everySpecialty`) rather than from the beds currently
 * shown, or selecting one would leave a row containing only itself and no way back to the
 * others — the same trap "All exams" exists to avoid on the catalogue bar.
 */
function SpecialtyChips({ available }: { available: readonly ThemeId[] }) {
  const active = useSpecialtyFilter();
  if (available.length < 2) return null;

  const choose = (id: ThemeId | null) => () => setSpecialtyFilter(id);
  const ordered = THEMES.filter((theme) => available.includes(theme.id));

  return (
    <div className={styles.filter} role="group" aria-label="Filter the round by specialty">
      <span className={styles.filterLegend}>Specialty</span>
      <button type="button" className={styles.chip} aria-pressed={active === null} onClick={choose(null)}>
        All
      </button>
      {ordered.map((theme) => (
        <button
          key={theme.id}
          type="button"
          className={styles.chip}
          aria-pressed={active === theme.id}
          onClick={choose(theme.id)}
          title={theme.blurb}
        >
          {theme.name}
        </button>
      ))}
    </div>
  );
}

/** How the ward reads in one line: the urgent count if there is one, otherwise the honest state. */
function summarise(beds: readonly RoundBed[]): string {
  const crash = beds.filter((b) => b.acuity === 'crash').length;
  const due = beds.filter((b) => b.acuity === 'due').length;
  if (crash > 0) return `${crash} needing attention, ${due} routine`;
  if (due > 0) return `${due} to review`;
  const unmet = beds.filter((b) => b.acuity === 'newAdmission').length;
  if (unmet > 0) return `${unmet} you have not met yet`;
  return 'Everyone seen. Nothing outstanding.';
}

/**
 * The ward round: the first thing a returning learner sees.
 *
 * Renders NOTHING until both indices and entitlement have landed, which is the rule
 * `StudyStrip` and `StudyReport` already state in their own docblocks — a board of placeholder
 * beds that rewrites itself a moment later is worse than a board that arrives once.
 *
 * Unlike those two it does NOT wait for the learner to have attempted something. A ward with
 * four people in it nobody has met is a legitimate and legible first screen; three zeroes are
 * not, which is the difference.
 */
export function RoundBoard({ round }: { round: Round }) {
  const [showAll, setShowAll] = useState(false);
  if (!round.ready) return null;
  if (round.beds.length === 0 && round.referrals.length === 0) return null;

  // Today's slice, with the rest one press away. The summary counts the whole ward — crash
  // and due beds are always in the slice, so it never disagrees with what is shown.
  const shown = showAll ? round.beds : round.today;

  // Where "Start round" goes: the top of the board as drawn, not the globally highest-ranked
  // bed. When something is urgent those are the same thing — `todaysRound` puts crash and due
  // first. When nothing is, `today` is the day's deterministic shuffle, so the round opens on
  // the patient the learner is actually looking at and rotates tomorrow, where `beds[0]` would
  // hand them the same alphabetical name every morning until they answered something.
  const first = round.today[0];

  return (
    <section className={styles.board} aria-label="Ward round">
      <div className={styles.head}>
        <h2 className={styles.title}>Your round</h2>
        {round.beds.length > 0 && <span className={styles.summary}>{summarise(round.beds)}</span>}
      </div>

      <SpecialtyChips available={round.everySpecialty} />

      {first && (
        <a className={styles.start} href={`#${first.moduleId}?case=${first.id}`}>
          Start round <span aria-hidden="true">·</span> {round.beds.length}{' '}
          {round.beds.length === 1 ? 'patient' : 'patients'}
        </a>
      )}

      {round.beds.length === 0 && round.referrals.length > 0 && (
        <p className={styles.empty}>No patients on this ward you have access to.</p>
      )}

      {shown.length > 0 && (
        <div className={styles.beds}>
          {shown.map((bed) => (
            <Bed key={bed.id} bed={bed} />
          ))}
        </div>
      )}

      {!showAll && round.rest.length > 0 && (
        <button type="button" className={styles.more} onClick={() => setShowAll(true)}>
          Show all {round.beds.length} ({round.rest.length} more on the wards today)
        </button>
      )}
      {showAll && round.rest.length > 0 && (
        <button type="button" className={styles.more} onClick={() => setShowAll(false)}>
          Back to today&apos;s round
        </button>
      )}

      {round.referrals.length > 0 && (
        <p className={styles.referrals}>
          <span className={styles.referralText}>
            <span className={styles.referralCount}>{round.referrals.length}</span> more{' '}
            {round.referrals.length === 1 ? 'patient is' : 'patients are'} on wards you do not have
            access to
            {round.referrals.length <= 3 && ` — ${round.referrals.map((r) => r.name).join(', ')}`}.
          </span>
          <a className={styles.referralLink} href="#pricing">
            See who <span aria-hidden="true">→</span>
          </a>
        </p>
      )}
    </section>
  );
}
