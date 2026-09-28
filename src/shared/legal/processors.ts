/**
 * Every third party that receives personal data, and why.
 *
 * `legal.test.ts` fails if the privacy notice stops naming any of these, which is the guarantee
 * the old notice lacked: it said "no third parties receiving your data" while four did.
 * Add a processor HERE first, in the same change that starts sending it data.
 */
export interface Processor {
  name: string;
  role: string;
  data: string;
  location: string;
  transferBasis: string;
}

export const PROCESSORS: readonly Processor[] = [
  {
    name: 'Supabase',
    role: 'Database, sign-in and server functions',
    data: 'Your account, your answers, class membership and licence seats',
    location: 'United Kingdom (London region)',
    transferBasis: 'No restricted transfer; data is stored in the UK',
  },
  {
    name: 'RevenueCat',
    role: 'Subscription management',
    data: 'Your account ID and subscription status',
    location: 'United States',
    transferBasis: 'UK International Data Transfer Addendum to the EU Standard Contractual Clauses',
  },
  {
    name: 'Stripe',
    role: 'Card payments on the website, and invoices to institutions',
    data: 'Payment details (we never see your card number), billing name and email',
    location: 'United States and Ireland',
    transferBasis: 'UK–US Data Bridge (Stripe is certified) and the UK Addendum',
  },
  {
    name: 'Apple and Google',
    role: 'App Store and Google Play purchases in the phone app',
    data: 'Purchase records, held under their own privacy policies',
    location: 'United States',
    transferBasis: 'Their own terms as independent controllers',
  },
  {
    name: 'Mistral AI',
    role: 'Answers from the AI tutor (first choice)',
    data: 'The text of your question and the tutor context described below. Not your email or account ID',
    location: 'European Union (France)',
    transferBasis: 'UK adequacy regulations for the EU',
  },
  {
    name: 'Google (Gemini API)',
    role: 'Answers from the AI tutor (backup)',
    data: 'The text of your question and the tutor context described below. Not your email or account ID',
    location: 'United States',
    transferBasis: 'UK–US Data Bridge and the UK Addendum',
  },
  {
    name: 'Google Analytics',
    role: 'Website usage statistics, only if you accept analytics cookies',
    data: 'Pages viewed, device and browser type, approximate location from a truncated IP address',
    location: 'United States',
    transferBasis: 'UK–US Data Bridge (Google is certified)',
  },
];
