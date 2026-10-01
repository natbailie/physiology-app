import { useEffect } from 'react';

/**
 * Keeps fixed bars and focused fields clear of an on-screen keyboard.
 *
 * Chrome on Android resizes the layout viewport when the keyboard opens (the viewport meta asks
 * for `interactive-widget=resizes-content`), so bottom-fixed bars ride up on their own. iOS Safari
 * does not: it shrinks only the *visual* viewport and leaves fixed elements where they were, under
 * the keyboard. This publishes the gap as `--kb-inset` on the root so the tutor sheet and the
 * control dock can add it to their `bottom`, and scrolls a field into view when it takes focus.
 */
export function keyboardInset(viewport: Pick<VisualViewport, 'height' | 'offsetTop'>, layoutHeight: number): number {
  return Math.max(0, Math.round(layoutHeight - viewport.height - viewport.offsetTop));
}

const FIELD = 'input, textarea, select, [contenteditable="true"]';
/** Input types that raise no keyboard. */
const NO_KEYBOARD = new Set(['checkbox', 'radio', 'range', 'button', 'submit', 'reset', 'file', 'color']);

export function useKeyboardInset(): void {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;

    const update = (): void => {
      root.style.setProperty('--kb-inset', `${keyboardInset(viewport, window.innerHeight)}px`);
    };

    const onFocusIn = (event: FocusEvent): void => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.matches(FIELD)) return;
      if (target instanceof HTMLInputElement && NO_KEYBOARD.has(target.type)) return;
      // After the keyboard has animated in; scrolling sooner measures the old viewport.
      window.setTimeout(() => target.scrollIntoView?.({ block: 'center', behavior: 'smooth' }), 300);
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      document.removeEventListener('focusin', onFocusIn);
      root.style.removeProperty('--kb-inset');
    };
  }, []);
}
