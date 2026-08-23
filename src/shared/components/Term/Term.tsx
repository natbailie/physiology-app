import { useId } from 'react';
import { lookupTerm } from '@/shared/glossary/terms';
import styles from './Term.module.css';

interface TermProps {
  label: string;
}

/**
 * A readout label with its definition available on hover, focus or tap.
 *
 * Deliberately NOT a `title` attribute. Institutional procurement asks for WCAG conformance,
 * and `title` fails it in three ways at once: it never appears on touch, most screen readers
 * ignore it, and it cannot be reached by keyboard. A focusable element with `aria-describedby`
 * costs about the same and does not have to be redone before a sale.
 *
 * The visibility is pure CSS — `:hover` and `:focus-visible` on the trigger reveal the bubble —
 * so there is no open state to manage, nothing to close, and no way for a stuck tooltip to
 * cover the numbers a learner is trying to read.
 *
 * Falls through to plain text for any label the glossary does not define, so adding a term is
 * the only work needed to cover a new readout anywhere in the app.
 */
export function Term({ label }: TermProps) {
  const entry = lookupTerm(label);
  const id = useId();

  if (!entry) return <>{label}</>;

  return (
    <span className={styles.wrap}>
      <button type="button" className={styles.trigger} aria-describedby={id}>
        {label}
      </button>
      <span role="tooltip" id={id} className={styles.bubble}>
        {entry.expansion && <span className={styles.expansion}>{entry.expansion}</span>}
        {entry.definition}
      </span>
    </span>
  );
}
