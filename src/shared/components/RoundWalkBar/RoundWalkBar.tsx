import { bedHref, type RoundWalk } from '@/shared/hooks/useRoundWalk';
import styles from './RoundWalkBar.module.css';

/**
 * Previous patient · position · next patient, in the module's sticky header.
 *
 * It lives HERE rather than inside `CaseHeader`, which is where it started, because the walk is
 * navigation around the ROUND and the case header is the Lab tab's statement of whose physiology
 * the sliders belong to. `ModulePage` renders the case header on Lab only — and "Start round"
 * lands on the PATIENTS tab, so a walk inside it was invisible on the one tab the round actually
 * opens. In the top bar it is on every tab, which is what a round needs.
 *
 * Links, not buttons: each patient has a real address, so back, middle-click and open-in-new-tab
 * all keep working, and a bookmarked bedside comes back as that bedside.
 */
export function RoundWalkBar({ walk }: { walk: RoundWalk }) {
  if (walk.position === null || (!walk.previous && !walk.next)) return null;

  return (
    <nav className={styles.walk} aria-label="Ward round">
      {walk.previous ? (
        <a className={styles.link} href={bedHref(walk.previous)} rel="prev">
          <span aria-hidden="true">←</span> {walk.previous.name}
        </a>
      ) : (
        /* The ends say so rather than vanishing: a control that disappears at the edge leaves
           the learner wondering whether they mis-clicked. */
        <span className={styles.end}>First on the round</span>
      )}

      <span className={styles.position}>
        {walk.position} of {walk.total}
      </span>

      {walk.next ? (
        <a className={styles.link} href={bedHref(walk.next)} rel="next">
          {walk.next.name} <span aria-hidden="true">→</span>
        </a>
      ) : (
        <span className={styles.end}>Last on the round</span>
      )}
    </nav>
  );
}
