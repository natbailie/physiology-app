import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { ProgressStore } from './progressStore';
import { createLocalStorageProgressStore } from './progressStore';
import { createSupabaseProgressStore, type SubscribableProgressStore } from './supabaseProgressStore';
import { supabase } from '@/lib/supabase';
import { useAuthOptional, type AuthUser } from '@/auth/AuthContext';

let localStore: ProgressStore | null = null;
function sharedLocalStore(): ProgressStore {
  localStore ??= createLocalStorageProgressStore();
  return localStore;
}

/** One server-backed store per user for the app's lifetime — every page shares its hydration. */
const serverStores = new Map<string, SubscribableProgressStore>();
function storeForUser(userId: string): SubscribableProgressStore {
  let userStore = serverStores.get(userId);
  if (!userStore) {
    userStore = createSupabaseProgressStore(userId, supabase);
    serverStores.set(userId, userStore);
  }
  return userStore;
}

/** Which store governs this learner right now: signed in means the server, otherwise localStorage. */
function selectStore(user: AuthUser | null): ProgressStore {
  if (user && supabase) return storeForUser(user.id);
  return sharedLocalStore();
}

/**
 * The progress store for the current learner, subscribed for re-render when a server-backed
 * store hydrates or flushes. The localStorage store has neither event, so its subscription is
 * inert — its tally updates ride on the session state change that follows every commit.
 */
export function useProgressStore(): ProgressStore {
  const { user } = useAuthOptional() ?? { user: null };
  const store = useMemo(() => selectStore(user), [user]);

  const subscribable = store as Partial<SubscribableProgressStore>;
  const subscribe = useCallback(
    (listener: () => void) => subscribable.subscribe?.(listener) ?? (() => {}),
    [subscribable],
  );
  const getSnapshot = useCallback(() => subscribable.version ?? 0, [subscribable]);
  useSyncExternalStore(subscribe, getSnapshot);

  return store;
}
