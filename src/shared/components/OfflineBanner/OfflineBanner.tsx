import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import styles from './OfflineBanner.module.css';

/**
 * Shown while the browser reports no connection. The simulators run on-device, so it says what
 * still works rather than blocking anything. "Retry" reloads, which is what recovers a chunk that
 * failed to arrive while offline.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div className={styles.banner} role="status">
      <p className={styles.text}>
        You&rsquo;re offline. Pages you have already opened still work; sign-in, the tutor and
        syncing need a connection.
      </p>
      <button type="button" className={styles.retry} onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  );
}
