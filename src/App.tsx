import { Suspense } from 'react';
import { useHashRoute, type RouteId } from '@/shared/hooks/useHashRoute';
import { PAGES } from './pages';
import { AuthGate } from '@/auth/AuthGate';
import { useEntitlement } from '@/billing/useEntitlement';
import { Paywall } from '@/billing/Paywall';
import { HomePage } from '@/home/HomePage';
import styles from './App.module.css';

/** Routes that are never a paid module: they must open whatever the subscription says. */
const UNGATED_ROUTES: ReadonlySet<RouteId> = new Set<RouteId>(['home', 'account', 'privacy', 'pricing']);

function App() {
  const route = useHashRoute();

  return (
    <AuthGate route={route}>
      <RoutedApp route={route} />
    </AuthGate>
  );
}

function RoutedApp({ route }: { route: RouteId }) {
  const { status, isUnlocked } = useEntitlement();

  if (!UNGATED_ROUTES.has(route)) {
    // Hold the render rather than flashing a paywall at someone who has in fact paid.
    if (status === 'loading') return <div className={styles.app} />;
    if (!isUnlocked(route)) {
      return (
        <div className={styles.app}>
          <Paywall moduleId={route} />
        </div>
      );
    }
  }

  // The home grid stays eager so the first paint needs nothing but itself; everything else
  // arrives on demand. The blank fallback matches the entitlement-loading behaviour above.
  const Page = PAGES[route];

  return (
    <div className={styles.app}>
      {route === 'home' && <HomePage />}
      {Page && (
        <Suspense fallback={<div className={styles.loading} aria-busy="true" />}>
          <Page />
        </Suspense>
      )}
    </div>
  );
}

export default App;
