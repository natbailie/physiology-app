import { describe, expect, it } from 'vitest';
import { keyboardInset } from './useKeyboardInset';

describe('keyboardInset', () => {
  it('is the gap the keyboard leaves under the visual viewport', () => {
    expect(keyboardInset({ height: 500, offsetTop: 0 }, 800)).toBe(300);
  });
  it('is zero with no keyboard, or when the layout viewport already resized', () => {
    expect(keyboardInset({ height: 800, offsetTop: 0 }, 800)).toBe(0);
    expect(keyboardInset({ height: 500, offsetTop: 0 }, 500)).toBe(0);
  });
  it('never goes negative', () => {
    expect(keyboardInset({ height: 900, offsetTop: 10 }, 800)).toBe(0);
  });
});
