import { Suspense, useEffect, type MouseEvent } from 'react';
import { useHashRoute, type RouteId } from '@/shared/hooks/useHashRoute';
import { useLinkPrefetch } from '@/shared/hooks/useLinkPrefetch';
import { PAGES } from './pages';
import { AuthGate } from '@/auth/AuthGate';
import { useEntitlement } from '@/billing/useEntitlement';
import { Paywall } from '@/billing/Paywall';
import { HomePage } from '@/home/HomePage';
import { ThemePage } from '@/home/ThemePage';
import { DisciplinePage } from '@/home/DisciplinePage';
import { DISCIPLINES, THEMES } from '@/home/moduleRegistry';
import { MedicationsPage } from '@/medications/MedicationsPage';
import { ChatLauncher } from '@/shared/chat/ChatLauncher';
import { NavArrows } from '@/shared/components/NavArrows/NavArrows';
import { SiteFooter } from '@/shared/components/SiteFooter/SiteFooter';
import { CookieBanner } from '@/analytics/CookieBanner';
import { installAnalytics } from '@/analytics/ga';
import { useRouteFocus } from '@/shared/hooks/useRouteFocus';
import styles from './App.module.css';

/**
 * Routes that are never a paid module: they must open whatever the subscription says. That
 * includes every subject and theme page — those are browse pages, and the module-level lock is
 * rendered on their cards instead.
 */
const UNGATED_ROUTES: ReadonlySet<RouteId> = new Set<RouteId>([
  'home',
  'accessibility',
  'account',
  'privacy',
  'terms',
  'cookies',
  'refunds',
  'business',
  'reviews',
  'methodology',
  'review-h',
  'teacher',
  'pricing',
  ...DISCIPLINES.map((discipline) => `discipline/${discipline.id}` as RouteId),
  ...THEMES.map((theme) => `theme/${theme.id}` as RouteId),
]);

function App() {
  const route = useHashRoute();
  // One delegated listener for the whole app, mounted above the route so it survives every swap.
  useLinkPrefetch();
  useRouteFocus(route);
  // Follows the cookie choice from here on; loads nothing from Google until analytics is accepted.
  useEffect(() => installAnalytics(), []);

  // The single landmark pair for the whole site, above the auth gate: the signed-out landing
  // screen and the session-check splash render instead of RoutedApp, and a skip link that only
  // exists past sign-in would leave the first screen every visitor sees failing 2.4.1.
  return (
    <div className={styles.app}>
      {/* The href stays for middle-click and no-JS, but the click must not reach the router:
          this app routes on the hash, so `#main` used to resolve as an unknown route and send the
          learner to the home page instead of past the header. */}
      <a href="#main" className={styles.skipLink} onClick={skipToMain}>
        Skip to main content
      </a>
      <CookieBanner />
      <main id="main" className={styles.main} tabIndex={-1}>
        <AuthGate route={route}>
          {/* Inside the gate, so the signed-out landing screen is not offered arrows into an
              app it cannot open. BEFORE the page in DOM order: the arrows are drawn in the
              top-left corner, so as the last tab stops they were the first thing seen and the
              last thing reached (WCAG 2.4.3). */}
          <NavArrows />
          <RoutedApp route={route} />
        </AuthGate>
      </main>

      {/* The only element rendered on every route, which is why the tutor mounts here. It
          stands aside entirely when there is no backend or nobody signed in. */}
      <ChatLauncher route={route} />
      <SiteFooter />
    </div>
  );
}

function skipToMain(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  const main = document.getElementById('main');
  main?.focus();
  main?.scrollIntoView?.({ block: 'start' });
}

function RoutedApp({ route }: { route: RouteId }) {
  const { status, isUnlocked } = useEntitlement();

  if (!UNGATED_ROUTES.has(route)) {
    // Hold the render rather than flashing a paywall at someone who has in fact paid.
    if (status === 'loading') return <div className={styles.loading} aria-busy="true" />;
    if (!isUnlocked(route)) {
      return <Paywall moduleId={route} />;
    }
  }

  // The home grid stays eager so the first paint needs nothing but itself; everything else
  // arrives on demand. The blank fallback matches the entitlement-loading behaviour above.
  const Page = PAGES[route];

  return (
    <>
      {route.startsWith('discipline/') && (
        <DisciplinePage disciplineId={route.slice('discipline/'.length)} />
      )}
      {route.startsWith('theme/') && route !== 'theme/medications' && (
        <ThemePage themeId={route.slice('theme/'.length) as (typeof THEMES)[number]['id']} />
      )}
      {(route === 'theme/medications' || route.startsWith('medications/')) && <MedicationsPage />}
      {route === 'home' && <HomePage />}
      {Page && (
        <Suspense fallback={<div className={styles.loading} aria-busy="true" />}>
          <Page />
        </Suspense>
      )}
    </>
  );
}

export default App;
