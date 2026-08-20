import type { CSSProperties } from 'react';
import styles from './ModuleCard.module.css';

interface ModuleCardProps {
  id: string;
  name: string;
  tagline: string;
  status: 'available' | 'comingSoon';
  accentColorVar?: string;
  kind?: 'simulator' | 'reference';
}

/** A home-screen tile for one physiology module — a clickable link when available,
 * a non-focusable disabled tile (not a disabled button, to avoid a keyboard dead-end)
 * when the topic is still on the roadmap. */
export function ModuleCard({ id, name, tagline, status, accentColorVar, kind = 'simulator' }: ModuleCardProps) {
  const style = accentColorVar ? ({ '--card-accent': accentColorVar } as CSSProperties) : undefined;

  if (status === 'comingSoon') {
    return (
      <div className={`${styles.card} ${styles.comingSoon}`} style={style} aria-disabled="true">
        <span className={styles.name}>{name}</span>
        <span className={styles.tagline}>{tagline}</span>
        <span className={styles.badge}>Coming soon</span>
      </div>
    );
  }

  return (
    <a className={styles.card} style={style} href={`#${id}`}>
      <span className={styles.name}>{name}</span>
      <span className={styles.tagline}>{tagline}</span>
      {kind === 'reference' && <span className={styles.badge}>Reference</span>}
    </a>
  );
}
