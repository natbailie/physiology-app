import { useCallback, useRef } from 'react';
import { lookupTerm } from '@/shared/glossary/terms';
import styles from './Term.module.css';

interface TermProps {
  label: string;
  /** The module asking, so a label that module owns wins over the shared definition. */
  moduleId?: string;
}

/** Gap between the trigger and the bubble, and the margin kept from the viewport edges. */
const GAP_PX = 6;
const EDGE_PX = 8;

/** Height of the sticky module header when the page has not published a measured one. */
const FALLBACK_TOPBAR_PX = 88;

/**
 * A readout label with its definition available on hover, focus or tap.
 *
 * Deliberately NOT a `title` attribute. Institutional procurement asks for WCAG conformance,
 * and `title` fails it in three ways at once: it never appears on touch, most screen readers
 * ignore it, and it cannot be reached by keyboard. A focusable element with `aria-describedby`
 * costs about the same and does not have to be redone before a sale.
 *
 * The VISIBILITY is pure CSS — `:hover` and `:focus-visible` on the trigger reveal the bubble —
 * so there is no open state to manage, nothing to close, and no way for a stuck tooltip to
 * cover the numbers a learner is trying to read. Only the PLACEMENT is measured, and it is
 * written straight to the element rather than held in state, so hovering a label never
 * re-renders a page that is already animating at 60Hz.
 *
 * The bubble is `position: fixed` because the readout grid clips its overflow — that clip is
 * what rounds the panel's corners when an odd tile count leaves the last cell empty, so it
 * cannot simply be removed. A fixed element is laid out against the viewport instead, and no
 * ancestor sets transform, filter, will-change or contain, so nothing between here and the
 * viewport clips it.
 *
 * One known limit: scrolling while a bubble is open leaves it at a stale position until the next
 * hover. In practice the pointer leaves the trigger as soon as the page scrolls under it.
 *
 * Falls through to plain text for any label the glossary does not define, so adding a term is
 * the only work needed to cover a new readout anywhere in the app.
 */
/**
 * The bubble's id, derived from what it describes rather than from `useId`.
 *
 * `useId` would do the job and be unique by construction, but its counter advances across every
 * render in a process, so two renders of the SAME readout grid produce different HTML. That is
 * invisible in the app and load-bearing in `controls.test.tsx`, which detects a dead scenario
 * button by painting two presets and comparing the markup — ids that never repeat make every
 * pair of screens differ and the check stops finding anything.
 *
 * A readout grid never prints the same label twice, so label plus module is unique on the page.
 */
function bubbleId(label: string, moduleId: string | undefined): string {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `term-${moduleId ? `${moduleId}-` : ''}${slug}`;
}

export function Term({ label, moduleId }: TermProps) {
  const entry = lookupTerm(label, moduleId);
  const id = bubbleId(label, moduleId);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    const bubble = bubbleRef.current;
    if (!trigger || !bubble) return;

    const anchor = trigger.getBoundingClientRect();
    // `visibility: hidden` is still laid out, so the bubble already has its real size here —
    // which is what lets it be flipped and clamped BEFORE it is ever shown.
    const box = bubble.getBoundingClientRect();

    // Above by default. Flipped below when the bubble would slide under the sticky module
    // header, which paints over it — ModulePage publishes the bar's measured height because
    // the preset row wraps, so the bar has no fixed height to hard-code.
    // Custom properties inherit, so reading from the trigger picks up the height ModulePage
    // measures onto the page root without this component having to know where that root is.
    const topBar =
      Number.parseFloat(getComputedStyle(trigger).getPropertyValue('--topbar-h')) || FALLBACK_TOPBAR_PX;
    const above = anchor.top - box.height - GAP_PX;
    const top = above >= topBar + EDGE_PX ? above : anchor.bottom + GAP_PX;

    const maxLeft = window.innerWidth - box.width - EDGE_PX;
    const left = Math.min(Math.max(EDGE_PX, anchor.left), Math.max(EDGE_PX, maxLeft));

    bubble.style.left = `${left}px`;
    bubble.style.top = `${top}px`;
  }, []);

  if (!entry) return <>{label}</>;

  return (
    <span className={styles.wrap}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-describedby={id}
        onPointerEnter={place}
        onFocus={place}
      >
        {label}
      </button>
      <span ref={bubbleRef} role="tooltip" id={id} className={styles.bubble}>
        {entry.expansion && <span className={styles.expansion}>{entry.expansion}</span>}
        {entry.definition}
      </span>
    </span>
  );
}
