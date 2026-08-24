import { TEST_ACCESS_CODE } from './config';

const STORAGE_KEY = 'physiologyLab.accessCode.v1';

/**
 * A redeemed access code, held per browser.
 *
 * This is an override layer, not a subscription: the schema deliberately denies the client any
 * write to `profiles.subscription_status`, so a browser cannot grant itself real access. What it
 * can do is remember that a code was entered here, which is enough for testing and early access.
 *
 * The redeemed code is stored rather than a boolean, and checked against `TEST_ACCESS_CODE` on
 * every read — so changing the constant invalidates every unlock already handed out.
 */

function storage(): Storage | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
}

function normalise(code: string): string {
  return code.trim().toLowerCase();
}

export function hasRedeemedAccessCode(): boolean {
  const store = storage();
  if (!store) return false;
  try {
    return store.getItem(STORAGE_KEY) === normalise(TEST_ACCESS_CODE);
  } catch {
    // Private browsing or storage disabled — no unlock, rather than a thrown page.
    return false;
  }
}

/** Returns whether the code was accepted. A wrong code leaves any existing unlock alone. */
export function redeemAccessCode(code: string): boolean {
  if (normalise(code) !== normalise(TEST_ACCESS_CODE)) return false;

  const store = storage();
  if (store) {
    try {
      store.setItem(STORAGE_KEY, normalise(TEST_ACCESS_CODE));
    } catch {
      // Nothing to do: the unlock simply will not survive a reload.
    }
  }
  notify();
  return true;
}

export function clearAccessCode(): void {
  const store = storage();
  if (store) {
    try {
      store.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to undo */
    }
  }
  notify();
}

/**
 * Redeeming on the pricing page has to re-render the home grid and the route gate too, and
 * localStorage fires no event within the tab that wrote it — so subscribers are tracked here.
 */
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function subscribeAccessCode(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAccessCodeSnapshot(): boolean {
  return hasRedeemedAccessCode();
}

/** Server snapshot for `useSyncExternalStore`: nothing is redeemed before hydration. */
export function getAccessCodeServerSnapshot(): boolean {
  return false;
}
