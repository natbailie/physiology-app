import type { ElementType } from 'react';
import styles from './BrandMark.module.css';

interface BrandMarkProps {
  /** `lg` is the sign-in panel; `sm` rides in the sticky module top bar. */
  size?: 'sm' | 'md' | 'lg';
  /** `ink` is the treatment for the dark brand panels, `paper` for the light page. */
  tone?: 'paper' | 'ink';
  /** Renders the lockup as a link home. The module top bar already has a back link, so
   *  there it stays inert rather than offering a second route to the same place. */
  href?: string;
  /**
   * Element for the wordmark. On the home screen the lockup IS the page heading, so it wants
   * to be an `h1`; everywhere else it is a mark beside a heading and must not compete with it.
   */
  as?: Extract<ElementType, 'span' | 'h1' | 'h2'>;
}

/**
 * The parent-company lockup: the product name over a small tracked caption naming the group
 * it belongs to. It is the same construction the haematology app uses, and it is what tells
 * someone holding both that they are looking at one company rather than two.
 *
 * The caption is the fixed half. The wordmark changes per product; "Bentara Medical" does not.
 */
export function BrandMark({ size = 'md', tone = 'paper', href, as: Word = 'span' }: BrandMarkProps) {
  const className = [styles.mark, styles[size], styles[tone]].join(' ');

  const content = (
    <>
      <Word className={styles.word}>Physiology Lab</Word>
      <span className={styles.parent}>Bentara Medical</span>
    </>
  );

  if (href) {
    return (
      <a className={className} href={href}>
        {content}
      </a>
    );
  }

  return <span className={className}>{content}</span>;
}
