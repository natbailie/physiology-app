import { describe, expect, it } from 'vitest';
import { checkPassword, isStrongPassword } from './passwordRules';

describe('password rules', () => {
  it('accepts a password with length, capital, number and symbol', () => {
    expect(isStrongPassword('Abcdef1!')).toBe(true);
  });

  it.each([
    ['too short', 'Ab1!xyz', 'length'],
    ['no capital', 'abcdef1!', 'upper'],
    ['no number', 'Abcdefg!', 'number'],
    ['no symbol', 'Abcdefg1', 'symbol'],
  ] as const)('rejects %s', (_label, pw, failing) => {
    expect(checkPassword(pw)[failing]).toBe(false);
    expect(isStrongPassword(pw)).toBe(false);
  });

  it('does not count whitespace as a symbol', () => {
    expect(checkPassword('Abcdefg1 ').symbol).toBe(false);
  });
});
