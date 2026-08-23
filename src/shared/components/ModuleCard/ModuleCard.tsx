import type { CSSProperties } from 'react';
import styles from './ModuleCard.module.css';

interface ModuleCardProps {
  id: string;
  name: string;
  tagline: string;
  status: 'available' | 'comingSoon';
  accentColorVar?: string;
  kind?: 'simulator' | 'reference';
  /** How much of the module is known, 0-1. Undefined means never attempted — the card then
   * shows nothing, so an untouched grid stays a grid rather than a wall of empty meters. */
  mastery?: number;
  /** Questions due for review right now. */
  dueCount?: number;
  /** Outside the learner's subscription: the card points at pricing rather than the module. */
  locked?: boolean;
}

/** A home-screen tile for one physiology module — a clickable link when available,
 * a non-focusable disabled tile (not a disabled button, to avoid a keyboard dead-end)
 * when the topic is still on the roadmap. A locked module stays a real link, to pricing:
 * a tile a learner cannot reach at all teaches them nothing about what they are missing. */
export function ModuleCard({
  id,
  name,
  tagline,
  status,
  accentColorVar,
  kind = 'simulator',
  mastery,
  dueCount = 0,
  locked = false,
}: ModuleCardProps) {
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

  if (locked) {
    return (
      <a
        className={`${styles.card} ${styles.locked}`}
        style={style}
        href="#pricing"
        aria-label={`${name} — included with full access`}
      >
        <span className={styles.name}>{name}</span>
        <span className={styles.tagline}>{tagline}</span>
        <span className={styles.badge}>Full access</span>
      </a>
    );
  }

  return (
    <a className={styles.card} style={style} href={`#${id}`}>
      <span className={styles.nameRow}>
        <span className={styles.name}>{name}</span>
        {dueCount > 0 && (
          <span className={styles.due} aria-label={`${dueCount} due for review`}>
            {dueCount} due
          </span>
        )}
      </span>
      <span className={styles.tagline}>{tagline}</span>
      {kind === 'reference' && <span className={styles.badge}>Reference</span>}
      {mastery !== undefined && (
        <span className={styles.meter} role="img" aria-label={`${Math.round(mastery * 100)} per cent known`}>
          <span className={styles.meterFill} style={{ width: `${Math.max(mastery * 100, 2)}%` }} />
        </span>
      )}
    </a>
  );
}
