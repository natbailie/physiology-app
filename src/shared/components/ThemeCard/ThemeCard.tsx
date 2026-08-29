import type { CSSProperties } from 'react';
import styles from './ThemeCard.module.css';

interface ThemeCardProps {
  id: string;
  name: string;
  blurb: string;
  accentColorVar?: string;
  moduleCount: number;
  /** Overrides the "N simulators" count text — used for a theme that is a browseable hub
   * rather than a set of simulators (e.g. the medications theme). */
  countText?: string;
}

/** A home-screen tile for one theme, linking to its page of module cards. Sized like a
 * ModuleCard so the two grids read as the same navigation surface. */
export function ThemeCard({ id, name, blurb, accentColorVar, moduleCount, countText }: ThemeCardProps) {
  const style = accentColorVar ? ({ '--card-accent': accentColorVar } as CSSProperties) : undefined;

  return (
    <a className={styles.card} style={style} href={`#theme/${id}`}>
      <span className={styles.nameRow}>
        <span className={styles.name}>{name}</span>
        <span className={styles.count}>
          {countText ?? `${moduleCount} simulator${moduleCount === 1 ? '' : 's'}`}
        </span>
      </span>
      <span className={styles.blurb}>{blurb}</span>
    </a>
  );
}