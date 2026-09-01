import type { CSSProperties } from 'react';
import styles from './DisciplineCard.module.css';

interface DisciplineCardProps {
  id: string;
  name: string;
  blurb: string;
  status: 'available' | 'comingSoon';
  accentColorVar?: string;
  /** Where the tile goes. Required in practice for an available discipline; a coming-soon
   * one has nowhere to go and renders as a disabled tile instead. */
  href?: string;
  /** The right-hand count, e.g. "47 simulators" or "62 classes". */
  countText?: string;
}

/** A home-screen tile for one subject — the tier above themes. Available subjects are links;
 * an unbuilt one is a non-focusable disabled tile rather than a disabled link, the same
 * keyboard-dead-end reasoning ModuleCard uses for a module still on the roadmap. */
export function DisciplineCard({
  name,
  blurb,
  status,
  accentColorVar,
  href,
  countText,
}: DisciplineCardProps) {
  const style = accentColorVar ? ({ '--card-accent': accentColorVar } as CSSProperties) : undefined;

  if (status === 'comingSoon' || !href) {
    return (
      <div className={`${styles.card} ${styles.comingSoon}`} style={style} aria-disabled="true">
        <span className={styles.name}>{name}</span>
        <span className={styles.blurb}>{blurb}</span>
        <span className={styles.badge}>Coming soon</span>
      </div>
    );
  }

  return (
    <a className={styles.card} style={style} href={href}>
      <span className={styles.nameRow}>
        <span className={styles.name}>{name}</span>
        {countText && <span className={styles.count}>{countText}</span>}
      </span>
      <span className={styles.blurb}>{blurb}</span>
    </a>
  );
}
