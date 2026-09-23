import { EXAMS, type ExamId } from './exams';
import { setExamFilter, useExamFilter } from './examFilter';
import styles from './ExamFilterBar.module.css';

interface ExamFilterBarProps {
  /** Shown at the end of the row, e.g. "9 of 14 modules". Omitted where it would be noise. */
  countText?: string;
}

/**
 * The catalogue's exam switcher.
 *
 * "All exams" is first and is a real chip rather than an X on the selected one, because the way
 * OUT of a filter has to be as obvious as the way in — a learner who cannot see why the catalogue
 * looks short will conclude the app is missing modules rather than that they filtered it.
 *
 * `aria-pressed` rather than a radio group: these are toggles over a list that is still there,
 * not a choice that changes what the page is.
 */
export function ExamFilterBar({ countText }: ExamFilterBarProps) {
  const active = useExamFilter();

  const choose = (id: ExamId | null) => () => setExamFilter(id);

  return (
    <div className={styles.bar} role="group" aria-label="Filter modules by exam">
      <span className={styles.legend}>Exam</span>

      <button type="button" className={styles.chip} aria-pressed={active === null} onClick={choose(null)}>
        All exams
      </button>

      {EXAMS.map((exam) => (
        <button
          key={exam.id}
          type="button"
          className={styles.chip}
          aria-pressed={active === exam.id}
          onClick={choose(exam.id)}
          title={exam.name}
        >
          {exam.short}
        </button>
      ))}

      {countText && <span className={styles.count}>{countText}</span>}
    </div>
  );
}
