import type { KeyboardEvent } from 'react';

/**
 * The ARIA radio-group keyboard pattern for a row of `role="radio"` buttons.
 *
 * One Tab stop for the whole group (the checked option, or the first if none is), and the arrow
 * keys move AND select, as native radios do. Without it every option was its own Tab stop and the
 * arrows did nothing, so a group that announced itself as a radio group behaved like a toolbar —
 * the mismatch screen-reader users notice first.
 */
export function rovingTabIndex<T>(values: readonly T[], current: T | undefined, value: T): 0 | -1 {
  const anchor = values.includes(current as T) ? current : values[0];
  return value === anchor ? 0 : -1;
}

export function radioKeyDown<T>(
  event: KeyboardEvent<HTMLElement>,
  values: readonly T[],
  current: T | undefined,
  choose: (value: T) => void,
) {
  const at = Math.max(0, values.indexOf(current as T));
  let next: number;
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      next = (at + 1) % values.length;
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      next = (at - 1 + values.length) % values.length;
      break;
    case 'Home':
      next = 0;
      break;
    case 'End':
      next = values.length - 1;
      break;
    default:
      return;
  }
  event.preventDefault();
  const value = values[next];
  if (value === undefined) return;
  choose(value);
  const radios = event.currentTarget.closest('[role="radiogroup"]')?.querySelectorAll<HTMLElement>('[role="radio"]');
  radios?.[next]?.focus();
}
