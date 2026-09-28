import { LegalPage } from '@/legal/LegalPage';

/**
 * Interim accessibility statement. The words live in `src/shared/legal/accessibility.ts`, shared
 * with the phone app, which the statement now covers too. See that file's docblock for the two
 * things it must never do.
 */
export function AccessibilityPage() {
  return <LegalPage doc="accessibility" />;
}
