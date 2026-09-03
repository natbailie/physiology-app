# Physiology Lab — working notes

Interactive physiology simulators for pre-clinical medical students. See `README.md` for what the
app is; this file is about how to work in it.

## Non-negotiables

- **Engines stay pure.** `src/modules/*/engine/` is plain TypeScript with no React import.
  `step(state, inputs, dt)` must have no side effects — the verification harness, the Step
  control and baseline comparison all depend on it.
- **No new runtime dependencies for anything the learner sees.** Charts and diagrams are
  hand-written SVG on purpose. Reach for a library and the engines stop being the fast, testable
  part of the app. There are exactly two exceptions, both infrastructure rather than UI, and both
  absent from what a learner downloads unless they need them: the Supabase client, which backs
  optional accounts and is never loaded when the app runs unconfigured, and RevenueCat's
  `@revenuecat/purchases-js`, which is imported dynamically inside `src/billing/revenuecat.ts` and
  only when somebody is actually buying. It is 840 kB — larger than the whole rest of the app — so
  the lazy chunk is not a nicety. `vite build` will tell you if it ever lands in the entry.
- **Constants are calibrated, not invented.** Baseline inputs must land on textbook values. If a
  constant changes, the engine test asserting the baseline should fail — that is the point.
- **Every module says where its numbers came from.** `src/modules/*/engine/references.ts` pairs each
  asserted band with a `Provenance`: `oracle` (corroborated by a committed Pulse trace),
  `literature` (a citation someone can look up) or `unsourced` (with a `needs` saying what would
  settle it). `src/shared/verification/references.test.ts` discovers them, fails if a module has
  none, and fails if a baseline falls outside its own band.

  **`unsourced` is a first-class answer, not a failure.** 23 of 219 bands are unsourced, and almost
  all of them for the same reason: the quantity is a 0-1 or 0-100 index, so no published reference
  interval CAN apply until the engine changes units. Reading those `needs` strings end to end is
  the most useful validation backlog in the repo. Do not convert one to `literature` without a
  citation you could hand a reviewer — a uniform-looking citation list that would not survive an
  audit is worth less than an honest gap.

  The repo-wide corroboration percentage is asserted as a RATCHET and should only ever rise.

## Adding or changing physiology

Engine tests first, then the module. Write them as clinical assertions, the way the existing 37
engine test files do, not as numeric snapshots. A test named "produces high calcium with LOW
phosphate" survives refactoring; one asserting `toBe(11.14)` does not.

When a preset does not produce the pattern it is named for, the model is usually missing a
mechanism rather than needing a tuned constant. Three examples from the shock module: venous
return had to work against the *measured* pressure before tamponade did anything; the wedge
needed separate "arriving" and "damming" terms before embolism and cardiogenic shock separated;
and backward failure had to load the right heart before cardiogenic shock raised the CVP.

## Starting states and scenario buttons

- A module that has a resting steady state declares `SETTLE_SECONDS` in its `*_SIMULATION`
  constants and `settleSeconds` on its loop config; `useEngineLoop` integrates that much simulated
  time before the first frame, so the page opens on normal physiology instead of relaxing into it
  while the learner watches. The result is cached per config, so mounts and resets are free.
- A module whose baseline is a TRAJECTORY declares none — cellCycle progresses through phases,
  micturition fills a bladder, inflammation resolves an insult, cerebralPerfusion accumulates CSF.
  Settling those would jump past the thing the module is about.
- Pressing a scenario button goes through `useScenarioPreset`: it rebuilds the inputs from the
  module DEFAULTS (never from the current sliders, which used to let two presets stack silently)
  and resets the engine with them, so the scenario arrives settled rather than over the ten real
  minutes cardiorenal's salt load used to need.
- A scenario that is the same inputs LATER — fetal circulation's "Transitioned" is "First breath"
  once the duct has closed — names its extra time in a `*_PRESET_SETTLE_SECONDS` map.
- `src/shared/verification/controls.test.tsx` discovers every module, reads each slider's range off
  the rendered control panel, and fails if a control changes no reading, if it changes nothing in
  the diagram, if two presets settle to the same scenario, or if a module that declares a settle is
  still drifting at it. Its two allowlists are a backlog with a reason per line, not exemptions.

## Validating against something other than ourselves

Three kinds of oracle, in descending order of how hard they are to fake:

- **Analytic** (`engine/analytic.test.ts`) — the reference is a published EQUATION, written out
  inside the test and importing nothing from the engine but the value under test. The strongest
  kind, because some of these are identities that must hold for any input at all: `ecgConduction`
  checks Einthoven's law (II = I + III) against arbitrary dipoles and it holds to ten decimal
  places, which no amount of miscalibration could produce.

  Nine modules have one: `membranePotentials` (Nernst, Goldman), `enzymeKinetics`
  (Michaelis-Menten, the three inhibition transforms, Lineweaver-Burk), `respiratory`
  (Henderson-Hasselbalch, the alveolar gas equation, Winters), `ecgConduction` (Einthoven,
  Bazett), `muscleContraction` (Gordon-Huxley, Hill), `venousReturn` (Guyton), `capillaryExchange`
  (Starling, Landis-Pappenheimer), `electrolyteBalance` (Edelman, the osmolar gap, the glucose
  correction), `renalTubular` (the clearance identities), `vision` (Watson-Yellott) and
  `vestibular` (Steinhausen).

  Where our model is not the published equation, say so and test the SHAPE rather than widening a
  tolerance until point agreement appears. `membranePotentials` inverts Goldman to recover the
  permeability ratio our membrane behaves as if it had, which is a sharper question than whether
  two voltages are close — a model can land on the right voltage with an absurd permeability.
- **Trace** (`engine/oracle.test.ts`, against `engine/__oracle__/*.json`) — the reference is a
  committed trace from the independently validated Pulse engine. See `tools/pulse-oracle/`.
- **Reference range** (`engine/references.ts`) — the reference is a published interval. Every
  module has this; the other two are for the modules where something better is available.

When writing an analytic oracle, the reference side must not call our own implementation of the
equation. A test that computed the expected Nernst potential by calling our Nernst function would
pass no matter what either of them did.

## Adding practice questions

`src/modules/<module>/questions.ts`, verified by `questions.test.ts`. A question is a stem, a
setup, an intervention, a keyed direction, a metric and an explanation. The explanation is the
product — the existing ones run 60–100 words and end on the clinical payoff.

Write them, run the suite, replace whatever it rejects. **Expect roughly one in three to be
rejected; that is the harness working.** When it rejects one, find out why before changing the
answer — twice it has been an engine gap rather than an authoring error.

Things that have caught questions out:

- **Check input scales.** Several inputs are 0–100 or 0–300, not fractions. Passing `1` to a
  0–100 input silently does nothing at all.
- **Check the time scale.** `timeScale` differs by three orders of magnitude between modules —
  electrolyte runs at 3600x, respiratory at 6x, muscle slower than real time. `observeSeconds` is
  simulated time; divide by `timeScale` for how long a learner actually waits.
- **Pick a metric that starts near zero.** Interstitial volume sits at ~10.5 L, so real oedema is
  a rounding error against it; `interstitialExcess` is the quantity that moves.
- **Oscillating quantities cannot be sampled.** Muscle calcium and tension read identically at
  15 Hz and 60 Hz because both oscillate per stimulus. Fusion is the frequency-dependent value.
- **A single run cannot compare two patients.** "Normal host versus deficient host" is a two-run
  comparison and belongs to the frozen-baseline overlay or a pattern drill.

Questions may carry a `perturb` in the setup or the intervention. Many of the sharpest teaching
moments are events rather than settings — a fasting glucose model defends itself almost perfectly,
and it is the meal that separates a working pancreas from a failed one.

## Selling it

Two revenue streams, resolved by one Postgres view so a client cannot route around the precedence
rule. `supabase/schema-billing.sql` is the whole design; `src/billing/useEntitlement.ts` reads
`v_entitlement` and nothing else.

- **Individuals** subscribe through RevenueCat Web Billing. The App User ID **is** the Supabase user
  id, which is what lets `supabase/functions/revenuecat-webhook/` join `app_user_id` onto
  `profiles.id` with no mapping table, and what makes a subscription follow the account rather than
  the browser.
- **Institutions** never touch RevenueCat. A school pays by purchase order — which is how UK medical
  schools pay — against a **Stripe invoice**, and `invoice.paid` mints the code itself. Students
  redeem it with `redeem_licence`, which takes a row lock before counting seats so two people cannot
  both claim the last one. A licence may name a cohort, and redeeming then enrols the student in it:
  one code both pays for them and puts them in their teacher's dashboard. `mint_licence` (service
  role only) is still there and still works, for a school that pays some other way.
- **An institutional seat beats a personal subscription**, and the account page says so. A student
  whose school has paid may also be paying us directly, and has no way to find that out unless we
  tell them.
- **`CANCELLATION` does not end access.** It means auto-renew is off; the learner keeps what they
  paid for until `EXPIRATION`. `_shared/revenuecat.ts` derives status from `expiration_at_ms` rather
  than from the event type, which gets that right without a special case and also survives
  out-of-order delivery. `src/billing/revenuecatWebhook.test.ts` holds it there.
- The webhook is **idempotent on the event id** — RevenueCat retries five times over two and a half
  hours — and the event is recorded AFTER the writes, so a failed write is retried rather than
  swallowed.
- `startCheckout` unlocks **optimistically** and reconciles with the webhook afterwards
  (`confirmSubscription`). `purchase()` resolves before the webhook lands, and a learner who has
  just paid must not be looking at a paywall. If the poll never agrees the grant stands for the
  session.

There was a `TEST_ACCESS_CODE` compiled into the bundle. It is gone, and `licence.ts` replaced it;
if it reappears, `vite build` plus a grep of `dist/` is how that gets caught.

### Invoicing a school

`supabase/functions/stripe-webhook/` turns a paid invoice into a licence, so the second half of an
institutional sale is not your memory. **There is no admin UI and none is wanted: the Stripe
dashboard is the admin UI.** You raise the invoice there and type the seat count and expiry into its
metadata; the header of `supabase/schema-billing.sql` lists the keys. Nothing client-side talks to
Stripe, so this adds nothing to the bundle and no `VITE_` variable exists.

- **An invoice opts IN, via the `physiology_licence` marker.** You will invoice for things that are
  not seat licences, and the alternative — minting for every invoice that fails to opt out — is a
  licence attached to a conference stand.
- **`invoice.paid` only.** `invoice.finalized` means a school has been ASKED for money. Granting on
  it hands a year group full access against an unpaid invoice, which is the one failure in this
  path that costs real revenue rather than a support email.
- **A skip and an error are different answers and both return 200.** Not our invoice is silence.
  Ours-but-unusable — `seats: "three hundred"` — means somebody has paid and is owed a code, so the
  reason is written to `billing_events.error` where a query can find it. A retry cannot fix a typo,
  which is why neither is a 500; collapsing them would bury the case that matters.
- **Verify against the RAW body.** `await request.text()` before any parsing. `request.json()` looks
  right and re-serialises the payload, after which the signature can never match again. Note also
  `constructEventAsync`, not `constructEvent`: Deno's crypto is async and the sync form throws about
  a missing implementation rather than about the signature.
- **This is the one place an SDK earns its place.** The tutor deliberately uses raw `fetch`, but
  Stripe's signature scheme has a timestamp tolerance and multiple `v1` signatures during secret
  rotation, and getting either subtly wrong is silent. `npm:stripe` is server-side and never reaches
  a learner.
- **Idempotent three times over**, because Stripe retries for three days and can duplicate a success:
  the `billing_events` id check, an advisory lock inside `mint_licence_for_invoice` that serialises
  concurrent deliveries of the same invoice, and `licences.stripe_invoice_id` being unique.
- **`mint_licence_for_invoice` wraps `mint_licence` rather than extending it.** That signature is
  named in its own `revoke`/`grant` statements and called positionally by the documented SQL-editor
  workflow, so a sixth parameter would quietly break both.
- **A bare `expires_at` date means the END of that day.** `2027-07-31` becomes `23:59:59.999Z`, not
  UTC midnight, which would cut a school off a day early, on the day, looking exactly like an
  intentional expiry.
- Writing the minted code back onto the invoice is deliberately **not** fatal. The licence exists and
  the code is in Postgres either way; failing there would trade a working sale for a retry loop.

Test it with `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook` against
`supabase functions serve`. `stripe events resend <evt_id>` is the assertion worth being most
careful about — a second delivery must return 200 and produce no second licence.

**`automatic_tax` is off, on purpose.** It collects nothing until there is an active registration in
the customer's jurisdiction and it returns no error while doing so, and past invoices that collected
zero VAT cannot be corrected through Stripe. Turning it on is a decision with an accountant, not a
code change.

### Setting it up

Nothing is downloaded from RevenueCat — the SDK is an npm dependency and the integration code is
already here. What follows is account and dashboard work, and **the long pole is Stripe, not
RevenueCat**: Web Billing settles through a connected Stripe account, and live-mode activation wants
business and bank details that take days. Do not wait for it. If the connected account has test mode,
RevenueCat uses Stripe test mode automatically for sandbox purchases from a single Web Billing
config, so everything below is provable today and only real money waits on Stripe.

1. **Stripe.** Create the account and start live-mode activation. Then carry on.
2. **RevenueCat project**, then connect Stripe from it. **Only the project owner can connect a
   Stripe account** — a collaborator cannot, and the button is simply absent rather than an error.
3. **Web Billing config** in the project, with the connected Stripe account as the payment gateway.
4. **The key.** Copy the Web Billing *public* key into `.env.local` as `VITE_REVENUECAT_PUBLIC_KEY`
   and restart dev. It is publishable and belongs in the bundle, like the Supabase anon key. The
   secret key (`sk_…`) is a different object and must never go near `src/` — `secrets.test.ts`
   fails the build on both the name and the `sk_` shape.

**Three identifiers have to match the code exactly, and a mismatch fails silently**: the offering
loads, no package matches, `fetchOfferedPackages` drops it, and the pricing page quietly shows the
fallback prices and declines to sell. Nothing is logged, because nothing went wrong.

| Dashboard | Must be | Named in |
| --- | --- | --- |
| Entitlement | `full_access` | `ENTITLEMENT_ID`, `supabase/functions/_shared/revenuecat.ts` |
| Monthly package | Monthly, auto-id `$rc_monthly` | `FALLBACK_PACKAGES`, `src/billing/config.ts` |
| Annual package | Annual, auto-id `$rc_annual` | the same |

5. Create the two subscription products and attach both to the `full_access` entitlement.
6. Create one offering, **mark it current**, and add a Monthly and an Annual package. Choosing those
   two package TYPES is what generates the reserved identifiers above; a hand-typed custom
   identifier will not match.
7. Set real prices here. The `£9`/`£55` in `config.ts` are the fallback for when RevenueCat is
   unconfigured or unreachable — the dashboard wins at runtime and localises the currency.

Then the server half:

```
supabase secrets set REVENUECAT_WEBHOOK_SECRET=<a string you invent>
supabase functions deploy revenuecat-webhook --no-verify-jwt
```

Apply the SQL **in this order** — `schema-billing.sql` references `cohorts` and `cohort_members`
and fails if run before them: `schema.sql`, `schema-teachers.sql`, `schema-billing.sql`.

`--no-verify-jwt` is required and is not a hole. RevenueCat has no Supabase session to present, so
the request is authenticated by the shared secret in the Authorization header instead — set the
same string in the dashboard under Integrations > Webhooks, alongside the URL
`https://<project-ref>.supabase.co/functions/v1/revenuecat-webhook`.

Send a test event from that screen. **`200` with `{"status":"ok","applied":0}` is the pass** —
`TEST` is in `IGNORED_TYPES`, so zero writes is the correct answer rather than a failure.

What to check once it is live, in sandbox with Stripe's `4242 4242 4242 4242`: a purchase unlocks
the catalogue *immediately* (the optimistic grant in `confirmSubscription`) and `profiles` catches
up when the webhook lands; replaying an event id answers `{"status":"duplicate"}` and writes
nothing; a `CANCELLATION` with a future expiry leaves access **intact**, and only `EXPIRATION` drops
it. The institutional stream is testable with no RevenueCat at all:

```
select code from public.mint_licence('Test School', 2, null, null, 'smoke test');
```

Redeem it from the pricing page on two accounts, then a third, which should be refused for want of
a seat.

## The tutor

`supabase/functions/chat/` is the only server-side code in the repo, and it exists for one
reason: every `VITE_`-prefixed variable is compiled into the bundle, so the model API key cannot
live in `import.meta.env`. It is an edge-function secret (`GEMINI_API_KEY`), and
`supabase/schema-chat.sql` adds the `chat_usage` table the daily cap counts rows in.

It runs on the **Google Gemini free tier**, over raw `fetch` rather than an SDK — the request
shape is small and a Deno `npm:` resolution is one more thing to break.

Two things about Google's API cost a debugging session each, and both are now load-bearing:

- **`v1`, not `v1beta`.** `streamGenerateContent` has been dropped from `v1beta` — every current
  model lists only `generateContent`, `countTokens`, `createCachedContent` and
  `batchGenerateContent`, and the streaming path 404s **with an empty body**, which reads exactly
  like a wrong model name. It is still there and streaming on `v1`.
- **Google separates SSE frames with `\r\n\r\n`, never `\n\n`.** Splitting on `\n\n` matches
  nothing: the response accumulates in the buffer, no text is extracted, and the stream closes
  having emitted only a `done`. No error, no answer, just an empty reply — in both hosts at once.
  `splitFrames` in the shared module is the one implementation, and
  `src/shared/chat/geminiFrames.test.ts` holds it there with real CRLF fixtures.

Also: `gemini-2.5-flash` is gone. Google answers it with "no longer available to new users", so a
key issued today cannot reach it at all.

**Two hosts call the model, and they share one module.** `supabase/functions/_shared/gemini.ts`
holds the persona, the model id, the request body and the frame reader; both
`supabase/functions/chat/index.ts` (Deno, production) and `tutorDevRoute` in `vite.config.ts`
(Node, local) import it. That is what makes a working local answer evidence about the deployed one.
The shared file is **plain data only** — no `Deno.`, no Node APIs, no `ReadableStream` — because
one runtime resolves `npm:` specifiers and the other does not, and because `vite.config.ts` pulls
it into the Node typecheck program where only `@types/node` exists. Stream plumbing stays in each
host; that part is host-specific and is not where drift hurts.

**The free tier is rate limited per project, not per user.** Every learner shares one allowance,
which is exactly why `DAILY_MESSAGE_CAP` exists — not to control a bill, but to stop one learner
draining the quota for everyone. Under real traffic this will throttle, and the answer then is a
paid key rather than a code change.

- **The client assembles the context, the function owns the quota.** Retrieval, the module
  catalogue and the learner's weakness summary are built in `src/shared/chat/` because the corpus
  and the progress store are already there. The function owns the persona, the auth check and
  every cap — all of the latter are named constants in one block at the top of `index.ts`.
- **The corpus is globbed, not listed, and never eagerly.** `corpus.ts` follows
  `moduleQuestionIds.ts`: an eager glob would weld ~105,000 words into whatever chunk imports it.
  `corpus.test.ts` asserts the glob still finds every module, for the same reason — a corpus that
  quietly stops covering a module breaks nothing and is simply wrong.
- **Answers are plain prose because there is no markdown renderer.** Adding one would be a runtime
  dependency for something nothing else needs, so the system prompt forbids markdown and
  `ChatPanel` splits on blank lines. If an answer ever comes back full of asterisks, the prompt
  is what to fix.
- **Retrieval returning nothing is a feature.** `retrieve` scores zero overlap as no result, so
  the tutor is handed an empty excerpt block and can say the app does not cover something, rather
  than reasoning from the six least-irrelevant paragraphs in the corpus.
- **A failed tutor is never a dead end.** Every failure path — unreachable function, exhausted
  quota, daily cap, expired session — falls back to `corpusAnswer`, which shows the passages
  retrieval already found, labelled and attributed. Retrieval is therefore hoisted above the token
  check in `useChat`, so the fallback is available even when the request never leaves the browser.
  A generated answer and an authored passage are rendered differently on purpose: a learner has to
  be able to tell which is which.
- **`Failed to fetch` is a symptom, not a bug.** It is what an undeployed function looks like. The
  browser's own `TypeError` wording is replaced in `useChat` with something a learner can act on.
- The tutor renders for nobody when Supabase is unconfigured or nobody is signed in — the same
  stand-aside `AuthGate` and `useEntitlement` take, and what keeps the unauthed dev config honest.

### Running it locally, with no deploy

The dev server serves the tutor at `/api/chat` itself. Put `GEMINI_API_KEY=...` in `.env.local`
(**no `VITE_` prefix** — that prefix compiles a value into the bundle every learner downloads) and
restart dev. `useChat` picks the dev route whenever `import.meta.env.DEV`, so no Supabase deploy,
CLI or dashboard is involved, and no signed-in session is required for that route.

`src/shared/chat/secrets.test.ts` fails the build if anything under `src/` ever names a server-only
key, or reads a non-`VITE_` variable from `import.meta.env`. It is the difference between a
convention and a guarantee, and it has been checked against a deliberate violation.

### Deploying it

Both routes need the same two things: the SQL applied, and `GEMINI_API_KEY` set. Get a free key
from Google AI Studio (aistudio.google.com/apikey) — it needs no card.

**Dashboard**, no CLI required:

1. SQL Editor → paste `supabase/schema-chat.sql` → Run. It is idempotent, so re-running is safe.
2. Edge Functions → Create function, name it `chat` → paste `supabase/functions/chat/index.ts`
   → Deploy.
3. Edge Functions → Secrets → add `GEMINI_API_KEY`.

**CLI**, the repeatable path:

```
brew install supabase/tap/supabase
supabase link --project-ref <ref>
supabase db push
supabase secrets set GEMINI_API_KEY=...
supabase functions deploy chat
```

`supabase functions serve chat --env-file supabase/.env.local` runs it locally; that file is
already gitignored by the `*.local` pattern.

## Before pushing

`npm run verify` runs the same four steps CI does, in the same order: `tsc -b`, `oxlint`,
`vitest run`, `vite build`. A green local run is the same claim as a green CI run, so a red CI
after a green verify means an environment difference worth investigating, not a slip.

`.githooks/pre-push` runs it automatically and refuses the push if anything fails; `npm install`
points `core.hooksPath` at that directory via the `prepare` script, so a fresh clone gets it
after one install. `git push --no-verify` (or `SKIP_VERIFY=1`) bypasses it.

**The working tree is inside iCloud's Desktop & Documents sync.** That produces `<name> 2.ext`
conflict copies after a burst of file writes — 42 of them in one session, every one byte-identical
to its original. They are untracked and inert (the questions index globs `*/questions.ts`, which
those names do not match), but they clutter `git status` at exactly the moment you are checking
the tree is clean. `cmp -s` them against the original, then delete.

## Verifying UI work

- `npm test` and `npx tsc -b` do **not** catch CSS-module errors. Run `npx vite build` — a bad
  `composes:` reference passes both and breaks the page.
- The browser pane runs hidden, so `requestAnimationFrame` is suspended. Pause and use **Step**
  to advance the engine.
- For the same reason **CSS transitions freeze partway and never settle**, so `getComputedStyle`
  reports a value that is neither the old one nor the new one and does not change no matter how
  long you wait. A `--flow` of 1 read back as `opacity: 0.36`. Inject
  `* { transition: none !important; animation: none !important; }`, read, then remove it. Assert
  the custom property in tests, not the computed result.
- **Read the DOM in a separate tool call from the clicks.** React has not committed yet within
  the same synchronous block, and reading early has produced two false diagnoses so far.
- `inputsRef` in `useEngineLoop` now syncs in a **layout** effect that also republishes the
  snapshot, so a slider moves the readouts and the diagram in the same frame whether the module is
  playing or paused. `reset` and `fastForward` still take an `inputsOverride` for callers changing
  inputs in the same tick, and `useScenarioPreset` passes it.

## Drawing diagrams

The diagram is what a learner actually looks at, and it is the part of this app that drifted
furthest. Three visual languages had grown up side by side — schematic anatomy (renalTubular,
still the best of them), box-and-line circuits (fetalCirculation, shockStates) and bar charts
living inside the diagram frame (coronaryCirculation, neuromuscularJunction). The rules below
are what they are being converged on.

- **Schematic but correct.** Topologically and structurally truthful — the right structures, in
  the right relationships, in the right spatial order — without atlas rendering. A module whose
  subject genuinely IS a graph stays a graph: venousReturn's Guyton curves and respiratory's
  Davenport diagram are not anatomy and should not be dressed as it.
- **Every control needs a visible correlate.** The test of a diagram is that moving a slider
  changes the picture, not just a number. neuromuscularJunction offered vesicle release, calcium
  channels, receptor density and cholinesterase against a rectangle with eight dots in it — four
  real structures, none drawn. Where a control genuinely has no structure to show, it belongs in
  a control group labelled as a model parameter.
- **Everything is sentence case. Acronyms stay uppercase; nothing else shouts.** The app used
  to encode structure-versus-reading as sans-sentence-case against mono-uppercase, and the
  uppercase half is gone: the family carries the split on its own, so an anatomical label is
  sans ("Bowman's capsule", "Proximal tubule") and a reading is tabular mono ("ADH 27%"). Real
  acronyms — GH, TSH, ICP, V/Q, FEV1/FVC — keep their capitals; words do not. The global
  `.label` utility in `index.css` no longer uppercases, so a readout label authored in sentence
  case renders that way with no per-component work.
- **Charts leave the diagram frame.** A supply-versus-demand bar pair is a chart. It belongs in
  the `charts` slot, where `ModulePage` groups it with the other traces under a shared time axis.
- **Centre a label on the thing it names.** Both text collisions ever found in this app came from
  anchoring a bar label at the bar's left edge; a label is routinely wider than its bar. Use
  `tickLabel` from `shared/styles/diagramText.module.css`, which is centred.
- **A collision sweep does not catch two labels that merely sit on the same baseline.** "Optic
  chiasm" and "compressed 39%" cleared each other by eight units and read as one phrase. Separate
  neighbouring labels vertically, not just horizontally.
- **Compose text from `shared/styles/diagramText.module.css`.** `label`, `pathLabel`, `caption`,
  `organLabel`, `valueLabel`, `tickLabel`, `alarm`, `axis` and `verdict` all live there. Override
  in the module only where that diagram genuinely differs.
- **Never print the answer during practice.** A diagram that names the pattern — "HYPOVOLAEMIC",
  "NORMAL TRANSMISSION" — answers the pattern-discrimination question being asked a few hundred
  pixels below it. Use the shared `verdict` class and `DiagramFrame` withholds it automatically;
  a readout tile that names the pattern needs `revealsPattern` on its `ReadoutItem`.
- **Colour that encodes a quantity needs a legend.** The signal palette is load-bearing in these
  drawings and nothing on screen explains it.
- **Motion is emphasis, never the only carrier of meaning.** `index.css` stops all animation
  under `prefers-reduced-motion`, so anything a diagram says only by moving is lost for those
  readers. Say it with position, size or colour as well.

Two ways to check the result, both cheap:

- Overlapping labels: in the browser pane, measure every `<text>` in `svg[role="img"]` with
  **`getBoundingClientRect`, not `getBBox`** — `getBBox` ignores ancestor transforms, so labels
  inside a translated `<g>` all report the same origin and every diagram looks 100% broken.
- Contrast: `src/theme/palette.test.ts` checks all 93 signal colours against both themes. If a
  diagram needs a colour that is not in the palette, add a base and let it derive.

## The house style

This app and the haematology app (Bentara Medical) are one company's products and are meant to
read that way. The shared language lives in `src/index.css` and the four stylesheets in
`src/shared/styles/` — change it there, not in a component.

- **Neutrals are the slate ramp**, surfaces and text alike, in both themes. Dark mode's `--panel`
  is the same slate the light theme paints its brand panels in, so the two themes are one family.
- **`--brand` is the one house accent** and the only colour a primary action is ever painted in.
  A module's signal colour is for the physiology it draws, never for its buttons. It is declared
  as a `-base` like every signal, so it lifts into dark mode automatically and `palette.test.ts`
  holds it to the same contrast floors.
- **`--brand-ink` is a near-black panel used ON the light page**, not a dark-mode surface: the
  sign-in split card and the study band. Text on it uses `--on-brand-ink` / `--brand-ink-dim`,
  and the accent on it is **`--brand-on-ink`, never `--brand`** — blue-600 reads at 3.45:1 on
  slate, which is how that token came to exist. Compose `inkSurface` when the panel is a HALF of
  a larger card and `ink` when it is the whole thing.
- **Headings are 700 and pull in** (`--tracking-tight`); **instrument labels are sentence case**
  (compose `microLabel` from `shared/styles/text.module.css`, or the global `.label` utility).
  Positive tracking on a heading is the old voice and should be deleted where it survives.
  This is the one place we depart from the haematology app, which shouts its labels in caps —
  see the sentence-case rule under "Drawing diagrams". `--tracking-wide` survives for the one
  thing that is still a logotype rather than a label: the wordmark in `BrandMark`.
- `text.module.css` is the HTML half of `diagramText.module.css`. They are not interchangeable:
  the diagram sheet sets `fill` and sizes in SVG user units, so composing one into an HTML element
  silently does nothing.
- The house app sets its muted labels at 2.6:1 on white. We do not: `palette.test.ts` holds the
  text ramp to 4.5:1, so `--text-dim` / `--text-faint` sit one notch darker.

## Conventions

- Module ids are camelCase and appear in four places: `moduleRegistry.ts`, `useHashRoute.ts`,
  `App.tsx`, and the module directory name. Theme ids live in `THEMES` in `moduleRegistry.ts`
  and their `#theme/<id>` routes are generated from it, so a theme added there routes, renders
  and passes the wiring tests with no further edits.
- The catalogue has three tiers: `DISCIPLINES` (the subject picker on `#home`) own themes, themes
  own modules. `#discipline/<id>` routes are generated from `DISCIPLINES` the same way, with two
  rules the wiring test enforces: a `comingSoon` discipline owns no themes and gets no route, and
  a discipline that names its own `href` gets no route either — pharmacology points straight at
  `#theme/medications` because its one theme is already a hub, and a generated page would hold a
  single tile.
- New component tests need `afterEach(cleanup)` — vitest runs with `globals: false`, so Testing
  Library's automatic cleanup is never registered.
- Querying a CSS-module class in a test needs `[class*="name"]`, not `.name`. Vitest renders
  them as `_name_hash`, so an exact class selector matches nothing and the assertion passes
  vacuously — which is worse than failing.
- British spelling in learner-facing prose; the existing content is consistent about it.
