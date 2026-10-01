import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  /** Any CSS length. Defaults to the full width of the parent. */
  width?: string;
  height?: string;
  /** A round blob (avatar, icon tile) rather than a rounded bar. */
  round?: boolean;
  className?: string;
}

/**
 * A placeholder for content that is on its way.
 *
 * It exists so a screen can keep its shape while something loads — a price, a list — instead of
 * showing a spinner and then jumping. The shimmer is a gradient sweep and stops entirely under
 * `prefers-reduced-motion`, leaving a still block. Hidden from assistive tech: the surrounding
 * region should carry `aria-busy` and say what it is waiting for.
 */
export function Skeleton({ width = '100%', height = '1rem', round = false, className }: SkeletonProps) {
  const style: CSSProperties = { width, height };
  return (
    <span
      aria-hidden="true"
      className={`${styles.skeleton} ${round ? styles.round : ''} ${className ?? ''}`}
      style={style}
    />
  );
}
