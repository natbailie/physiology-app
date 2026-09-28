import { LegalPage } from '@/legal/LegalPage';

/**
 * The privacy notice. Its words live in `src/shared/legal/privacy.ts`, shared with the phone
 * app; `legal.test.ts` fails if a processor or a personal-data table goes unmentioned, so if a
 * new table starts holding personal data, that file must be updated in the same change.
 */
export function PrivacyPage() {
  return <LegalPage doc="privacy" />;
}
