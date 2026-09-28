import type { LegalDoc } from './types';

/** The localStorage key the consent choice is kept under. `src/analytics/consent.ts` reads it. */
export const CONSENT_STORAGE_KEY = 'physiologylab.consent';

/** How long a choice stands before we ask again. The ICO expects consent to be refreshed. */
export const CONSENT_MAX_AGE_DAYS = 365;

/**
 * Every item the website stores on a visitor's device. PECR reg. 6 covers localStorage and
 * sessionStorage as well as cookies, so this table lists all three. A new storage key belongs
 * here in the same change that introduces it.
 */
export const STORAGE_ITEMS = [
  ['theme', 'Local storage', 'Remembers light, dark or automatic theme', 'Until you clear it', 'Strictly necessary (your choice)'],
  ['physiologyLab.progress.v2', 'Local storage', 'Your practice progress when you are not signed in', 'Until you clear it', 'Strictly necessary'],
  ['physiologylab.examPromptDismissed', 'Local storage', 'Stops the "which exam?" prompt reappearing', 'Until you clear it', 'Strictly necessary (your choice)'],
  ['physiologylab.specialtyFilter', 'Session storage', 'Keeps the catalogue filter while the tab is open', 'Until the tab closes', 'Strictly necessary'],
  ['sb-…-auth-token', 'Local storage', 'Keeps you signed in (Supabase)', 'Until you sign out', 'Strictly necessary'],
  [CONSENT_STORAGE_KEY, 'Local storage', 'Remembers your cookie choice', '12 months', 'Strictly necessary'],
  ['RevenueCat / Stripe items', 'Local storage and cookies', 'Set only on the pricing page when you start a purchase, to run the checkout securely', 'Session to 1 year', 'Strictly necessary'],
  ['_ga, _ga_<id>', 'Cookie', 'Google Analytics: distinguishes visitors to count visits', '13 months', 'Analytics — only if you accept'],
] as const;

export const COOKIES: LegalDoc = {
  id: 'cookies',
  title: 'Cookie policy',
  summary: 'What the website stores on your device, and how to change your choice.',
  lastUpdated: '2026-09-28',
  sections: [
    {
      heading: 'The short version',
      paragraphs: [
        'We store a few things on your device so the site works — keeping you signed in, remembering your theme and holding your progress. These are strictly necessary and do not need your consent.',
        'We would also like to use Google Analytics to count visits and see which pages are useful. That sets cookies, so it only runs if you choose "Accept analytics". If you choose "Reject analytics", nothing is loaded from Google at all. Either choice is fine and the site works the same.',
        'We do not use advertising or cross-site tracking cookies.',
      ],
    },
    {
      heading: 'Everything we store',
      table: {
        head: ['Name', 'Type', 'Purpose', 'How long', 'Category'],
        rows: STORAGE_ITEMS,
      },
    },
    {
      heading: 'Google Analytics',
      paragraphs: [
        'If you accept, Google Analytics 4 records the pages you view, your device and browser type and your approximate location. Google truncates your IP address and we have turned off Google signals and advertising features. We never send your name, email or account ID. Data is kept for 14 months.',
      ],
      links: [{ label: 'How Google uses data', href: 'https://policies.google.com/technologies/partner-sites' }],
    },
    {
      heading: 'Changing your mind',
      paragraphs: [
        'Use "Cookie settings" at the bottom of any page to change your choice. Withdrawing consent stops analytics immediately and deletes the Google Analytics cookies. We ask again after 12 months.',
        'You can also clear or block storage in your browser settings; blocking strictly necessary items will stop sign-in and saved progress working.',
      ],
    },
    {
      heading: 'The phone app',
      paragraphs: [
        'The phone app does not use cookies or analytics. It stores your sign-in, theme and progress on the device only for the app to work.',
      ],
      links: [{ label: 'Privacy policy', route: 'privacy' }],
    },
  ],
};
