import { BUSINESS } from './business';
import type { LegalDoc } from './types';

/** The acknowledgement a buyer ticks before a website checkout. CCR 2013 regs 36–37. */
export const IMMEDIATE_ACCESS_ACKNOWLEDGEMENT =
  'I want my access to start now. I understand that if I cancel within 14 days I will get a pro-rata refund for the days I have not used.';

/**
 * Written to the Consumer Contracts (Information, Cancellation and Additional Charges)
 * Regulations 2013. A subscription is a SERVICE contract, so the 14-day right survives
 * immediate access: the buyer who asks for access to start and then cancels owes only for what
 * was supplied (reg. 36(4), reg. 34(4)) — hence pro-rata, not nothing and not everything.
 */
export const REFUNDS: LegalDoc = {
  id: 'refunds',
  title: 'Refund and cancellation policy',
  summary: 'Your 14-day right to cancel, and how refunds work after that.',
  lastUpdated: '2026-10-01',
  sections: [
    {
      heading: 'Your 14-day right to cancel',
      paragraphs: [
        'When you first take out a subscription on our website you have 14 days to change your mind, starting the day you subscribe.',
        'Because you ask for access to start straight away, if you cancel within those 14 days we refund what you paid minus a proportionate amount for the days you had access. For example, cancelling a £9.99 monthly plan after 3 days of a 30-day month refunds £8.99.',
        `To cancel, use "Manage or cancel your subscription" on your account page, or email ${BUSINESS.contactEmail} with your account email address and the words "I cancel my subscription". You do not have to give a reason. We refund within 14 days to the card you paid with.`,
      ],
      links: [
        { label: 'Your account', route: 'account' },
        { label: `Email ${BUSINESS.contactEmail}`, href: `mailto:${BUSINESS.contactEmail}?subject=Cancel%20my%20subscription` },
      ],
    },
    {
      heading: 'After 14 days',
      paragraphs: [
        'You can cancel at any time. You keep full access until the end of the period you have already paid for and are not charged again. We do not refund part-used months or years, except as described below.',
      ],
    },
    {
      heading: 'Renewals',
      paragraphs: [
        'Subscriptions renew automatically. If you forget to cancel an annual plan and contact us within 14 days of it renewing, having not used it since, we will refund the renewal in full.',
      ],
    },
    {
      heading: 'If something is wrong',
      paragraphs: [
        'If the service is faulty or not as described, your rights under the Consumer Rights Act 2015 apply whenever you bought it. Tell us and we will fix it; if we cannot within a reasonable time, you are entitled to some or all of your money back. The same applies if we remove a significant feature you paid for.',
      ],
    },
    {
      heading: 'Bought in the phone app',
      paragraphs: [
        'Subscriptions bought through the App Store or Google Play are billed by Apple or Google, and refunds are handled by them under their policies. Cancelling in the app store stops the next renewal.',
      ],
      links: [
        { label: 'Apple: request a refund', href: 'https://reportaproblem.apple.com/' },
        { label: 'Google Play: refunds', href: 'https://support.google.com/googleplay/answer/2479637' },
      ],
    },
    {
      heading: 'Institutional licences',
      paragraphs: [
        'Licences bought by a school or university by invoice are covered by the order terms agreed with that institution, not by this policy. Students with a licence code should contact their institution.',
      ],
    },
  ],
};
