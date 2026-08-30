import { lazy, Suspense, useRef, useState } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuthOptional } from '@/auth/AuthContext';
import { MODULES } from '@/home/moduleRegistry';
import styles from './ChatLauncher.module.css';

const ChatPanel = lazy(() => import('./ChatPanel').then(({ ChatPanel: Panel }) => ({ default: Panel })));

const MODULE_IDS = new Set(MODULES.map((module) => module.id));

export interface ChatLauncherProps {
  /** The current hash route, so the tutor knows what the learner is looking at. */
  route: string;
}

/**
 * The tutor's entry point, mounted on every route.
 *
 * In production it renders nothing at all when there is no backend or nobody signed in — the same
 * graceful stand-aside `AuthGate` and `useEntitlement` take. The edge function is the only thing
 * capping a shared free-tier quota, and an anonymous caller cannot be capped.
 *
 * In development that gate is lifted, because the dev server answers the tutor itself (see
 * `tutorDevRoute` in vite.config.ts) and has nothing to authenticate against. Keeping the gate
 * here would mean the tutor only worked locally for someone also signed in to a real Supabase
 * project, which is exactly the deploy dependency the dev route exists to remove.
 *
 * The panel is lazy, so the ~105,000-word corpus and the retrieval index cost nothing to a
 * learner who never opens it.
 */
export function ChatLauncher({ route }: ChatLauncherProps) {
  const { user } = useAuthOptional() ?? { user: null };
  const [open, setOpen] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);

  if (!import.meta.env.DEV && (!isSupabaseConfigured || !user)) return null;

  const close = (): void => {
    setOpen(false);
    // Focus goes back where it came from, or a keyboard user is dropped at the top of the page.
    launcher.current?.focus();
  };

  return (
    <>
      <button
        ref={launcher}
        type="button"
        className={styles.launcher}
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
      >
        {open ? 'Hide tutor' : 'Ask the tutor'}
      </button>

      {open && (
        <Suspense fallback={null}>
          <ChatPanel moduleId={MODULE_IDS.has(route) ? route : undefined} onClose={close} />
        </Suspense>
      )}
    </>
  );
}
