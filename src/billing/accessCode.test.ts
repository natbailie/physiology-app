// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { TEST_ACCESS_CODE } from './config';
import { clearAccessCode, hasRedeemedAccessCode, redeemAccessCode, subscribeAccessCode } from './accessCode';

const STORAGE_KEY = 'physiologyLab.accessCode.v1';

afterEach(() => {
  window.localStorage.removeItem(STORAGE_KEY);
});

describe('access code', () => {
  it('starts unredeemed', () => {
    expect(hasRedeemedAccessCode()).toBe(false);
  });

  it('accepts the code and remembers it', () => {
    expect(redeemAccessCode(TEST_ACCESS_CODE)).toBe(true);
    expect(hasRedeemedAccessCode()).toBe(true);
  });

  it('forgives case and stray whitespace — a code gets typed, and pasted', () => {
    expect(redeemAccessCode(`  ${TEST_ACCESS_CODE.toUpperCase()}  `)).toBe(true);
    expect(hasRedeemedAccessCode()).toBe(true);
  });

  it('rejects a wrong code without disturbing an unlock already granted', () => {
    redeemAccessCode(TEST_ACCESS_CODE);
    expect(redeemAccessCode('not-the-code')).toBe(false);
    expect(hasRedeemedAccessCode()).toBe(true);
  });

  it('rejects a wrong code when nothing was redeemed', () => {
    expect(redeemAccessCode('mbbs0000')).toBe(false);
    expect(hasRedeemedAccessCode()).toBe(false);
  });

  it('clears back to locked, so the paywall can be tested again', () => {
    redeemAccessCode(TEST_ACCESS_CODE);
    clearAccessCode();
    expect(hasRedeemedAccessCode()).toBe(false);
  });

  it('treats a stored code that no longer matches as no unlock at all', () => {
    // What a rotated TEST_ACCESS_CODE looks like to a browser holding the old one.
    window.localStorage.setItem(STORAGE_KEY, 'an-older-code');
    expect(hasRedeemedAccessCode()).toBe(false);
  });

  it('tells subscribers, since localStorage fires no event in the tab that wrote it', () => {
    let calls = 0;
    const unsubscribe = subscribeAccessCode(() => {
      calls += 1;
    });

    redeemAccessCode(TEST_ACCESS_CODE);
    expect(calls).toBe(1);
    clearAccessCode();
    expect(calls).toBe(2);

    unsubscribe();
    redeemAccessCode(TEST_ACCESS_CODE);
    expect(calls).toBe(2);
  });
});
