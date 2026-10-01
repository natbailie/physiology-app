# UK compliance — Physiology Lab (web + phone app)

Prepared 28 September 2026. This is an engineering record of what the code now does against each
rule, plus what only the business can do. **It is not legal advice**: have a solicitor review the
Terms and the Privacy policy before taking money from the public.

## Pre-launch checklist (only you can do these)

- [ ] **Fill every `{{PLACEHOLDER}}`** in `src/shared/legal/business.ts` — legal name, legal form,
      company number, geographic address, registered office, contact and privacy emails, VAT
      status, ICO number, governing law. They appear on every legal page, the footer and checkout.
      Then run `npm run sync` in `physiology-native`.
- [ ] **Pay the ICO data protection fee** (ico.org.uk/fee) — required for almost any business that
      processes personal data electronically. Put the reference in `icoRegistration`.
- [ ] **Solicitor review** of Terms, Privacy, Refund policy — especially the liability clause
      (section 12) and the renewal goodwill refund in the Refund policy (a promise you must honour).
- [ ] **VAT**: registration is compulsory above £90,000 turnover in any rolling 12 months. Digital
      services to UK consumers are standard-rated. Talk to an accountant before turning on Stripe
      `automatic_tax` (see CLAUDE.md "Invoicing a school").
- [ ] **Sign/accept processor DPAs**: Supabase, RevenueCat, Stripe, Google (Gemini + Analytics),
      Mistral. Confirm each transfer basis in `src/shared/legal/processors.ts` is still accurate
      (e.g. that Stripe and Google remain certified under the UK–US Data Bridge).
- [ ] **Move the tutor off Mistral's free "Experiment" tier** (and Gemini's free tier) before real
      learners use it: free-tier prompts may be used for training, which the privacy policy does
      not tell users. Either upgrade, or add that to the policy.
- [ ] **Apply the SQL**: `supabase/schema-privacy.sql` then `supabase/schema-reviews.sql`, and
      schedule `purge_old_chat_usage()` with pg_cron (the policy promises 90 days).
- [ ] **Set `VITE_GA_MEASUREMENT_ID`**, and in GA set data retention to 14 months and turn Google
      signals and ads personalisation off (matches the cookie policy).
- [ ] **App Store "App Privacy"**: Email address, User ID, Purchase history, Product interaction,
      Other user content — all *linked to the user*, *not used for tracking*, purpose *App
      functionality*. **Google Play Data safety**: the same, "collected, not shared", encrypted in
      transit, deletion available in-app. (`app.json` now carries the matching iOS privacy manifest.)
- [ ] **Store listing** needs a privacy-policy URL and (Apple) a Terms/EULA URL — use the website's
      `#privacy` and `#terms` once the site is live.
- [ ] **Decide on the MIT `LICENSE`** in both repos. It lets anyone copy, modify and sell the source
      if the repository is ever public. For a commercial product consider "All rights reserved".
- [ ] **Confirm provenance** of `physiology-native/assets/icon.png`, `adaptive-icon.png` and
      `favicon.png` (who made them, and that you own the rights). The web favicon was the stock Vite
      logo and has been replaced with a vector of the same waveform mark.
- [ ] Before the first institutional sale: the independent accessibility audit the accessibility
      statement promises.

## What each rule required, and what was done

| Rule | What it requires here | Status |
| --- | --- | --- |
| **UK GDPR / DPA 2018** arts 12–14 | A transparent notice: controller, purposes, lawful bases, recipients, transfers, retention, rights, ICO complaint | Rewritten privacy policy (`src/shared/legal/privacy.ts`). The old one said "no third parties receiving your data"; four did. `legal.test.ts` now fails if a processor or personal-data table goes unnamed |
| UK GDPR art. 5(1)(c) minimisation | Collect only what is needed | Stopped copying the email prefix into `profiles.display_name`; dropped unused `stripe_customer_id`; stopped sending exam/stage to RevenueCat (web and phone); account deletion now strips billing payloads; tutor usage purged after 90 days |
| UK GDPR art. 17 erasure | Easy deletion | Web already had it; **phone app now has "Delete my account"** (also Apple 5.1.1(v)) |
| **PECR** reg. 6 (+ DUAA 2025) | Consent before non-essential storage; clear information; easy withdrawal | Opt-in banner, Accept and Reject equal; nothing loads from Google before Accept; "Cookie settings" in every footer; withdrawing deletes `_ga` cookies; choice re-asked after 12 months. Cookie policy lists every storage item |
| Do you need a cookie policy? | Yes — GA4 sets cookies, and PECR also covers localStorage | Added (`#cookies`). Without analytics you would still need the storage information, just not consent |
| **Consumer Contracts Regs 2013** | Pre-contract info (trader, price incl. tax, duration, auto-renewal, cancellation right); express request + acknowledgement to start within 14 days | Web pricing page: disclosure beside the button, trader line, Terms/Refund links, required acknowledgement checkbox; pro-rata refund in the Refund policy |
| **Consumer Rights Act 2015** | Digital content/services rights cannot be excluded | Terms s.12 preserves them; Refund policy "If something is wrong" |
| **DMCC Act 2024** — unfair practices | No fake reviews, no selectively published reviews, no misleading price claims | No fake reviews existed. Reviews: one per account, human-moderated, negatives published, average computed from rows, report link, published policy. **"Two months free" was false** (at the time £55 vs £108 ≈ six months; now £99 vs £119.88 ≈ 2.1 months) — replaced with a saving computed from the prices |
| DMCC Act 2024 — subscription contracts (Part 4) | Reminder notices, easy exit, cooling-off at renewal | Check commencement date. Already: one-press "Manage or cancel" on both apps, auto-renewal disclosed, 30-day price-change notice promised, annual-renewal refund promised in Refund policy. Still needed when it commences: renewal reminder emails |
| **E-Commerce Regs 2002** reg. 6 | Name, geographic address, email, company no., VAT no. easily accessible | Business details page + footer — **values are placeholders** |
| **Companies Act 2006** trading disclosures | If a Ltd: registered name, number, office on the website | Same page, same placeholders |
| **Equality Act 2010** / WCAG 2.2 AA | Reasonable adjustments; accessibility statement | See "Accessibility" below; statement updated, now covers the phone app and names a contact with a 5-working-day response |
| **CAP Code** | Claims must be substantiated | "Two months free" fixed. Exam names now carry a non-affiliation line (footer, Terms s.5, phone Account). Remaining claims ("simplified models built to teach mechanism", methodology percentages) are computed or modest |
| **Online Safety Act 2023** | User-to-user services have duties | Reviews of the provider's own service are exempt (Sch. 1 limited-functionality); pre-moderation keeps it that way. The tutor is not user-to-user |
| **MHRA** software as a medical device | Not a device if it is educational and not for patient care | Stated in Terms s.3, accessibility statement, landing/footer, and now on the phone's Drugs and Formulas tabs |
| **Children's Code (AADC)** | Applies if likely to be accessed by children | Service declared 18+; sign-up requires confirming it |
| **Copyright** (images, fonts) | Rights to every asset | No photographs or third-party images anywhere. Fonts are OFL: Literata was missing from `NOTICE` and no licence text shipped — both fixed (`public/fonts/OFL.txt`). Vite logo favicon replaced. Native icons: confirm provenance (checklist) |
| **App Store 3.1.2 / Google Play** | Paywall must state auto-renewal and link Terms + Privacy; restore purchases reachable | Done: `app/pricing.tsx` states price, renewal, where the charge lands and how to cancel before the button, links Terms / Privacy / Refunds, and Restore purchases is always shown |

## Third-party embeds

None. No iframes, no CDN scripts, no Google Fonts, no external images; fonts are self-hosted.
Runtime third parties: Supabase (London), RevenueCat + Stripe (pricing page only, lazy chunk),
Mistral/Google (tutor, via the edge function), Google Analytics (only after consent).

## Accessibility — fixed

Web: skip link no longer navigates home; per-route page titles; focus moves to the new page on
navigation; errors/confirmations announced (auth, pricing, account, teacher, reviews, medications
search, exam filter count, share link, quiz verdict); quiz focus follows the question and answer
shortcuts only fire with focus inside it (2.1.4); glossary tooltips hoverable, Escape-dismissible
and tappable (1.4.13); radio groups use arrow keys with one Tab stop; charts have text
descriptions; medications search focus ring restored and label made visible; tutor field has a
visible label; input focus halos (1.45:1) replaced with the house outline; placeholder colour fixed;
"coming soon" cards readable (were 2.57:1); oxygen curve at full strength (was 2.85:1); in-text
links underlined; 24px minimum targets on the theme toggle, chips, demo and exit buttons;
back/forward arrows first in tab order; focus kept clear of the mobile control dock;
`palette.test.ts` now checks text, border and focus ring on every surface.

Phone: roles on every pressable that lacked one; labels on every text field; errors announced and
marked in words, not just red; headers on section titles; charts described; checkbox and radio
semantics on the new forms.

**Known and left:** the explainer's `<h3>` inside `<summary>` (that file carries your uncommitted
work, so it was not touched); small diagram labels on the phone (changing SVG font sizes would
re-open the label-collision sweep); the tutor panel on narrow screens can cover the focused
element while open.

## Left undone — needs you

Nothing in code. Both apps have stopped sending target exam and training stage to RevenueCat
(web: `setExamAttributes` removed from `src/billing/revenuecat.ts`; phone: removed from
`src/purchases/revenuecat.ts`, with `useExamAttributes.ts` and its mount in `app/_layout.tsx`
deleted). Attributes already sent before this change are still stored in RevenueCat: clear
`target_exam` and `training_level` from existing customers in the RevenueCat dashboard (or via its
REST API) so the stored data matches the privacy policy.

`app/_layout.tsx` needs no change for the new screens (`app/legal/[doc].tsx`, `app/reviews.tsx`) —
expo-router registers them from the file tree and each sets its own title.
