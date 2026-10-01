/**
 * The password policy for NEW accounts. Sign-in never enforces it: accounts made before the
 * policy existed carry shorter passwords, and locking those learners out would be worse than the
 * weakness. Mirror this in Supabase Auth's password requirements so the server agrees.
 */
export const MIN_PASSWORD_LENGTH = 8;

export interface PasswordChecks {
  length: boolean;
  upper: boolean;
  number: boolean;
  symbol: boolean;
}

export function checkPassword(password: string): PasswordChecks {
  return {
    length: password.length >= MIN_PASSWORD_LENGTH,
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password),
    // Anything that is not a letter, digit or whitespace.
    symbol: /[^A-Za-z0-9\s]/.test(password),
  };
}

export function isStrongPassword(password: string): boolean {
  return Object.values(checkPassword(password)).every(Boolean);
}

export const PASSWORD_RULE_LABELS: Record<keyof PasswordChecks, string> = {
  length: `At least ${MIN_PASSWORD_LENGTH} characters`,
  upper: 'One capital letter',
  number: 'One number',
  symbol: 'One symbol (e.g. ! ? # %)',
};

export const WEAK_PASSWORD_MESSAGE =
  'Choose a password with a capital letter, a number and a symbol, at least 8 characters long.';
