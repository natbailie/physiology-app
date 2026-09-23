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

  **`unsourced` is a first-class answer, not a failure.** 29 of 265 bands are unsourced, and almost
  all of them for the same reason: the quantity is a 0-1 or 0-100 index, so no published reference
  interval CAN apply until the engine changes units. Reading those `needs` strings end to end is
  the most useful validation backlog in the repo. Do not convert one to `literature` without a
  citation you could hand a reviewer — a uniform-looking citation list that would not survive an
  audit is worth less than an honest gap.

  The repo-wide corroboration percentage is asserted as a RATCHET and should only ever rise.

## Adding or changing physiology

Engine tests first, then the module. Write them as clinical assertions, the way the existing 87
engine test files do, not as numeric snapshots. A test named "produces high calcium with LOW
phosphate" survives refactoring; one asserting `toBe(11.14)` does not.

When a preset does not produce the pattern it is named for, the model is usually missing a
mechanism rather than needing a tuned constant. Three examples from the shock module: venous
return had to work against the *measured* pressure before tamponade did anything; the wedge
needed separate "arriving" and "damming" terms before embolism and cardiogenic shock separated;
and backward failure had to load the right heart before cardiogenic shock raised the CVP.

## Starting states and scenario buttons

- A module that has a resting steady state declares `SETTLE_SECONDS` in its `*_SIMULATION`
  constants and `settleSeconds` on its loop config; `shared/engine/settle.ts` integrates that much
  simulated time before the first frame, so the page opens on normal physiology instead of relaxing
  into it while the learner watches. The result is cached per config, so mounts and resets are free.
  One implementation, file-synced, so the phone and the web open identically.
- **The settle keeps its own tail as the opening TRACE, and steps at the loop's own step.** Both
  halves are load-bearing. History used to start empty, so every chart drew blank, then a two-point
  line across the whole frame, then compressed leftwards on every tick until the buffer filled —
  on all 51 modules, and on every Reset and preset press. And the settle used to chunk at
  `maxDtSeconds` while the live loop sub-steps at `min(maxDtSeconds, frame * timeScale)`, which is
  smaller for half the modules: muscleContraction settled to a tension of 9.6 and the loop then
  relaxed it to 0.12 over five real seconds, which looked exactly like a module that had not been
  settled at all. Total simulated time is still exactly `settleSeconds`, which is what keeps the
  promise that what a learner reads on load is what the harness checks.
- **`Sparkline` takes the capacity, not just the points.** `ModulePage` passes `historyCapacity`
  into the shell and every chart on the page reads it from there, including the ones `TrendsView`
  builds from a schema and no page names. Without it a partial trace is stretched across the frame
  rather than growing in from the left. `cases.test.ts` requires it on all 51 pages, because a
  settle shortened during calibration would otherwise take the x-axis with it, silently.
- A module whose baseline is a TRAJECTORY declares none — cellCycle progresses through phases,
  micturition fills a bladder, inflammation resolves an insult, cerebralPerfusion accumulates CSF.
  Settling those would jump past the thing the module is about.
- **"No settle" is a claim, and it is now checked.** It used to be an early `return` in the drift
  test, so a module nobody had ever calibrated was indistinguishable from one that does not need
  it. `controls.test.tsx` measures the opening window of every unsettled module against the band it
  goes on to occupy, and `OPENS_ON_A_TRAJECTORY` names the three that legitimately fail that —
  cerebralPerfusion, inflammation, micturition. The other twelve were measured rather than assumed:
  every one opens on values it holds, so their `createInitialState()` genuinely IS the resting
  state, and each says so in its own `loopConfig.ts` now.
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

  Thirteen modules have one: `membranePotentials` (Nernst, Goldman), `enzymeKinetics`
  (Michaelis-Menten, the three inhibition transforms, Lineweaver-Burk), `respiratory`
  (Henderson-Hasselbalch, the alveolar gas equation, Winters), `ecgConduction` (Einthoven,
  Bazett), `muscleContraction` (Gordon-Huxley, Hill), `venousReturn` (Guyton), `capillaryExchange`
  (Starling, Landis-Pappenheimer), `electrolyteBalance` (Edelman, the osmolar gap, the glucose
  correction), `renalTubular` (the clearance identities), `mechanicalVentilation` (inverse
  Severinghaus, the content-based shunt equation), `respiratoryFailure` (the shunt and alveolar
  gas equations), `vision` (Watson-Yellott) and `vestibular` (Steinhausen).

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

**A pattern question's options carry a gloss, and the gloss says what a scenario IS.** One line
under the scenario's name — "a clot arriving where the blood should leave" — never what its
numbers do. The distinction is load-bearing: "Obstructive — blocked filling, high CVP" answers the
question from the options alone, without reading the panel it is asked against.
`shared/assessment/glossSuite.ts` holds all of it, and takes the panels from the QUESTIONS rather
than from a list, so it cannot go stale and `vision`'s three panels need no special case. Four
rules: name no panel row, quote no figure, gloss nothing the module does not have, and **gloss
every option any pattern question offers**. The last one leaks through LAYOUT rather than through
wording — in a row of four where three carry a line of prose and the fourth sits bare, the bare one
is marked as different before a word of it is read, and five of the seven gaps that test was
written against were the module's own healthy preset. Native reaches the same constant through
`gloss` on its `ModuleAdapter`, beside `labels`.

Questions may carry a `perturb` in the setup or the intervention. Many of the sharpest teaching
moments are events rather than settings — a fasting glucose model defends itself almost perfectly,
and it is the meal that separates a working pancreas from a failed one.

## Adding patient cases

A case is a patient: one scenario the module already produces, given a name, a history and a
reason to care. `src/modules/<module>/cases.ts`, verified by `cases.test.ts`. The ward round on
`#home` is built entirely out of them.

**Every module is tabbed.** All 51 show **Lab | Questions | Lessons**; the modules with
beds add **Patients** second. The Lab tab is the instrument alone — diagram, readouts, charts,
transport, sliders — and practice lives on the Questions tab everywhere, each question under
its own instrument. **Lessons** is the
old `section.study`: the explainer, related modules, the footnote and the provenance note.
**Patients** is `ClinicPanel` (bed picker, history, live observations, questions, payoff), and
**Questions** is what no bed claims. The two patient tabs appear only when `clinic` / `questions`
are passed.

**`ModulePage` owns the tab unless a page takes it.** `activeTab`/`onTabChange` are a discriminated
union — both or neither — so pages without beds need no tab state of their own. The bedded
pages control it through the `page` spread of `useModuleCases` (below), because they need the
tab before render to build the question array the session runs.

**A bedded page calls `useModuleCases`, not the wiring it replaced.** Tab, question sets,
session, bedside and the three bedded nodes live in `shared/hooks/useModuleCases.tsx` — one call
plus a spread into `ModulePage` — so a new tranche copies the call, not forty lines. The page
keeps its own case subscription for the input seed, and everything downstream of the engine.

**Every question carries its own instrument.** `QuestionSet` renders the current question's
panel rows (pattern) or live `metric` tile (predict) in the bedside chart idiom, above the
panel — which is what makes "work from the numbers above" true in all three homes: under the
bedside chart, under the question's own instrument, under the lab readouts. One honest
limit, stated in the code: `metric` takes a snapshot while `Sparkline` takes a history-point
accessor, so the dashed counterfactual trace cannot follow — the live number only.

**Tab crossings end sessions by set identity, not tab name.** Lab and Lessons show no set of
their own and are transparent: a glance at the diagram or the prose mid-question ends
nothing. Only arriving at a question-bearing tab with a different set ends the session, and
`useModulePractice` holds the array it started on while one is live — because the alternative
is worse than a blank panel: the cursor dangles, `blinded` lapses, and the preset bar and
controls switch back on mid-pattern-question, so the scenario being asked about can be
silently replaced.

**Blindness reaches the preset bar through the shell.** `PresetBar` ORs the shell's `blinded`
into its own `disabled`, and every page feeds `blindControls` — a no-op where a module asks
nothing pattern-shaped, required everywhere anyway so the next pattern question cannot reopen
it. `shared/verification/cases.test.ts` asserts every `*Page.tsx` passes `questions=` and
`blindControls=`, the way it asserts the case-file rules.

**The Questions tab holds only the UNCLAIMED set**, computed by `shared/cases/unclaimed.ts` and
cached per module in the hook's `WeakMap` keyed on `(questions, cases)`, so the array keeps one
identity without a per-page const. Pass module-scope arrays, never inline literals. Those leftovers are not
an oversight: they are the questions whose scenario has no bed, and the mechanism drills tied to
no presentation. Every question is therefore reachable from exactly one tab, which is the
property that makes the split worth making. Each module's `cases.test.ts` asserts the set is
non-empty, because a module that quietly claims everything renders a tab with nothing in it.

Two consequences, both deliberate: `dueCount` is scoped to whichever tab is showing, so there is
no whole-module "review everything" any more — it is distributed across the bed acuity chips and
the Questions tab, which names what is due at the bedsides so the module is not a dead end for
somebody following a "Review X" link. And `useReturnToBedsideOnComplete` is gated on the clinic
tab, or a `?case=` left in the URL would jump the engine to that patient at the end of a set that
has nothing to do with them.

**Exactly one quiz session per page, and exactly one MOUNTED `QuizPanel`.** Two sessions collide
on the shared engine, the shared frozen baseline, and the single mounted panel. Worse, and
the reason every render site is gated on its own tab being active: `QuizPanel`
installs a **`window`** keydown listener while a question is open, and the sections are hidden
rather than unmounted — so a second panel would answer the same keypress, one `session` would
`commit` twice, and `store.record` would write twice into the persisted review ladder.

Three rules, each enforced rather than asked for:

- **Observations are never written down.** `chart` is a list of `PanelField` ACCESSORS onto the
  settled simulation — the same rows the module's pattern questions are marked against, shared
  through a leaf `panel.ts`. A case therefore cannot claim a MAP of 62 while the engine settles
  at 78. `describeCaseSet` reads the chart through the real engine and **refuses a bed whose
  observations do not separate it from the healthy preset**, which is the case-shaped version of
  the pattern-question fairness check and catches the authoring error that actually happens.
- **Acuity is derived, never authored** (`shared/cases/acuity.ts`). It comes from the learner's
  own review ladder: `crash` is a question forgotten twice, `due` is one come round again,
  `check` is retained, `newAdmission` is unmet. A hand-typed acuity is stale the moment somebody
  answers a question, and the round needs no new persistence or schema because of this.
- **`cases.ts` has no value imports** except its own `./panel`. `home/moduleCases.ts` loads every
  case file on the HOME page, and TypeScript erases `import type`, so getting this wrong is
  silent: the round still works, having welded a physiology engine into the first chunk a
  learner downloads. `shared/verification/cases.test.ts` fails on it.

**Bedding a module, one theme per tranche with a review between.** Decide refuse-or-bed
first (above). Then, per module: `panel.ts` — extract from `questions.ts` where one exists,
author 4–6 rows where not; a leaf with `import type` only. 2–3 presets, each a presentation
rather than a manoeuvre, each pair a mistake somebody actually makes; each must separate
from the healthy preset on the chart, and `describeCaseSet` refuses the ones that read
normal. `cases.ts` — globally unique `<firstname>-<condition>` ids (they travel in the URL),
a bed of its own per patient, prose floors per `caseSuite`. `cases.test.ts` — copy
`shockStates/cases.test.ts`; `settleSeconds` matches the module's own pattern questions, and
a trajectory module with no steady state gets a chosen point plus a comment saying why. Wire
the page onto `useModuleCases`. Leave the Questions tab non-empty — the suite asserts it.
Then `npm run verify` (which regenerates the manifest — never hand-edit it), native
`sync && verify`, review.

Not every module gets a bed. 40 modules can carry a patient today and 7 more through a
drug/toxin framing; 4 are mechanism-only and keep Lab | Questions | Lessons (`enzymeKinetics`,
`cellCycle`, `muscleContraction`, `cognitiveNeuroscience`), and `anaesthesia` and
`muscleContraction` are hard exclusions for having no healthy baseline at all — that last one
is a requirement of `caseSuite`, not a judgement call. A patient admitted with
Michaelis-Menten kinetics is the same lie about scale as drawing a sarcomere as gross
anatomy. `caseModules` is deliberately a SUBSET of `MODULE_IDS` — the fourth manifest
surface, asserted beside the three-way agreement rather than inside it. Refusing a bed is a
valid tranche outcome and goes in its summary.

Things that have caught this out:

- **A bed is loaded by the URL, not by the route.** `#shockStates?case=amina` and
  `#shockStates?case=george` resolve to the same route id, so `useHashRoute` bails out and the
  page never remounts. `useModuleCase` therefore owns its own `hashchange` listener, and
  `useBedside` re-applies the preset when the bed changes — without the second of those, the
  round showed George's name over Amina's physiology, and the banner could not tell, because the
  patient was the thing that changed.
- **Seed, do not apply in an effect.** `useShareableInputs` takes an optional third argument so
  the engine settles the patient directly. Applying the preset afterwards shows half a second of
  normal physiology and then jumps.
- **The banner goes stale honestly.** Nothing stops a learner pressing "Septic" over Amina, and a
  header that kept asserting her name would be the only dishonest surface in the app. Preset-level
  only: nudging a slider is exploring WITHIN the patient, which is the point of a bedside opening
  into a live simulator.
- **A running question also replaces the patient, and `activePreset` cannot see it.** The quiz
  applies scenarios through `useModulePractice`, never through `bedside.apply`, so the stale
  banner has nothing to fire on. `ClinicPanel` takes `sessionActive` and stops captioning the
  chart with the patient's name for exactly that window — otherwise the tab would assert whose
  numbers these are a few hundred pixels above the options.
- **The lab is HIDDEN on every tab that is not the lab, never unmounted.** Every `ReadoutItem` registers its tile
  with `shared/chat/tileRegistry.ts`, and `releaseTile` clears the live state once the last one
  goes — so unmounting would blind the tutor on the tab where a learner is most likely to ask
  what a number means. It would also drop the explainer's open mechanism cards, which are
  uncontrolled DOM state. `.lab` is `display: grid`, so the user agent's own `[hidden]` rule loses
  on specificity: `ModulePage.module.css` states `.lab[hidden] { display: none }` explicitly, and
  without that line the tab strip toggles and nothing moves.
- **`useBedside` tracks the CLEARED bed too.** The guard used to bail on a null patient without
  writing its ref, so Amina -> all questions -> Amina matched a stale id and never re-applied her
  preset. Same failure as above, reached through the picker.
- **Ending a session on a bed change is not tidiness.** `useQuizSession` holds its queue as
  question IDS; rebuilding the list underneath a live session leaves the cursor pointing at
  nothing, and the panel renders blank while the phase still says a question is open.
- **`QuizPanel` refuses a keypress from an inert subtree.** Its shortcut listener is on `window`,
  and the sections are hidden rather than unmounted — so a learner who leaves a question open,
  crosses to Lessons to read, and then types anything would otherwise commit an answer to a
  question off screen, into the persisted review ladder. `rootRef.current?.closest('[inert]')`
  is what stops it, and it works for all 51 without any page knowing which tab is showing.
- **The preset bar is MOUNTED on every tab**, hidden with CSS, and this is the least obvious
  invariant on the page. `PresetBar` registers the module's scenario labels with the shell, and
  the explainer's 415 "show me" demo buttons read their text from that registration — only 4 set
  a label of their own. Unmount the bar off the Lab tab and 411 of them render as nothing at all.
  A wrapper carries the `hidden` attribute because `.bar` declares `display: flex`, an author rule
  that beats the user agent's `[hidden]`. `ModulePage.test.tsx` is the only thing that catches
  this; `ExplainerPanel.test.tsx` documents the failure but builds its own provider and cannot.
- **A demo button switches tabs, then scrolls — in a layout effect.** Until the switch commits the
  lab is `display: none`, and `getBoundingClientRect()` on such an element is an all-zero rect, so
  the scroll would land at the top of the document. The header height is measured rather than read
  from `--topbar-h` for the same reason: it grows by the preset row in that very commit.
- **The Lessons tab says why it is closed during practice.** Every page passes
  `startCollapsed={session.phase !== 'idle'}`, so the panel shuts the moment a question opens —
  several sections state the answer. The note explaining that sits OUTSIDE the `<details>`:
  anything inside a closed one that is not the `<summary>` is not rendered, so a note placed there
  would be invisible in exactly the state it exists to explain.
- **`teaching` is the answer.** It renders only once the session is `complete`, for the same
  reason a diagram never prints the pattern it is being asked about.
- **Prescriptions do not expire.** `StudyReport` was retitled rather than reimplemented; a weak
  spot stops being listed when it stops being weak and at no other time. Expiry is streak
  punishment, which `currentStreak`'s leniency exists to avoid.
- **The ward round must not be a wall of locked beds.** A locked module can hold no review state,
  so every one would read `newAdmission`. `useRound` segments them as referrals without an acuity
  chip, and the free modules carry beds of their own so a free round is not empty.


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

**CLI**, for the function and the secret:

```
brew install supabase/tap/supabase
supabase link --project-ref <ref>
supabase secrets set GEMINI_API_KEY=...
supabase functions deploy chat
```

**`supabase db push` is deliberately absent, and adding it back will not work.** It pushes files
from `supabase/migrations/`, and the schema here lives in four hand-ordered `schema*.sql` files
instead — there is no migrations directory and no `config.toml`, so the command exits 0 having
done nothing at all. That silence is the whole problem: it reads exactly like success, and the
next thing to fail is a save that no-ops because a column was never added.

Apply schema through the SQL Editor, or through the Supabase MCP connector, which is where every
migration in `supabase_migrations.schema_migrations` has actually come from. Should the CLI ever
become the way this project is managed, that is a real piece of work — `supabase init` plus
converting the four files into ordered migrations — and not a line in a code block.

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

Four modules have been through it — cardiorenal, respiratory, gastrointestinal and
liverPhysiology. They are the worked examples; the rest of the anatomy-bearing modules are the
backlog, and `src/shared/diagram/organShapes.ts` is where the next organ goes.

- **Reuse `organShapes.ts` rather than drawing an organ again.** Nine of the builders' consumers
  were added by walking the modules that drew an organ a builder already covered — a heart as six
  Bézier blobs, a kidney as one. Two things make a module a bad candidate even so, and both cost
  a reverted conversion to find out: a diagram whose GEOMETRY carries data (cardiacElectro's left
  ventricle is a circle whose radius IS the volume, and fetalCirculation and shockStates are
  circuit diagrams whose chambers are boxes because the shunts have to connect to them), and a
  page whose diagram slot holds more than the schema describes (ecgConduction also renders a live
  strip and an INTERACTIVE twelve-lead grid, so pointing its page at `slots.diagram` would have
  deleted both). Check the page's `diagram={…}` before converting it.
- **Anatomical where the subject is an organ; schematic everywhere else.** This rule used to say
  "without atlas rendering", and that half is retired. A module whose subject is an ORGAN draws
  the organ — four chambers and a coronary tree, three lobes on the right and two on the left,
  a cortex and its medullary pyramids — because the drawing is the first thing a learner looks
  at and a heart with no chambers teaches nothing to somebody learning where the chambers are.
  A module whose subject is a GRAPH stays a graph: venousReturn's Guyton curves and respiratory's
  Davenport diagram are not anatomy and must not be dressed as it. A module whose subject is
  CELLULAR or MOLECULAR stays schematic too — a sarcomere, the neuromuscular junction, a
  capillary wall, the cell cycle. Drawing those as gross anatomy would be a lie about the scale.
  Topological and structural truth is still the floor under all three.
- **Anatomy is written once, in `src/shared/diagram/organShapes.ts`, as a scene BUILDER.** A
  builder takes a placement and returns `{ node, defs }` — ordinary group/path nodes both
  renderers already handle — so an organ is drawn once for the web and the phone alike. The
  `organ` node type and its two per-platform registries are legacy: they are down to the two
  shapes glucoseRegulation still uses, and nothing should be added to them. A builder takes its
  COLOUR from the caller, because the same organ is drawn for different reasons in different
  modules — the pancreas is the insulin colour in glucoseRegulation and the CCK colour in
  gastrointestinal.
- **Shading is the organ's own colour getting denser, never white or black.** A white highlight
  survives the light theme and vanishes on the dark one; the same hue at 16% against the same hue
  at 68% reads as volume under both, and every colour stays a token `palette.test.ts` checks. Use
  `bodyGradient` with a `light` source in the ORGAN's coordinates for anything drawn as more than
  one shape — lit per shape, a heart's four chambers read as a patchwork however good each is.
  Light falls from the top-left, consistently, across the whole app.
- **A gradient is depth, never data.** It says an organ is round, not that a value is high.
  Anything a learner has to READ stays carried by position, size or a legended signal colour.
- **Layer an organ: wash, structures, outline, labels — and put an opaque underlay first.** Every
  organ used to be a stained-glass window: the wash is translucent, so the aorta showed straight
  through the atria. `opaqueUnderlay` paints the silhouette in `panel`, which is the ground the
  diagram sits on in both themes, so it occludes without introducing a colour. Draw a structure
  that is INSIDE an organ after the organ's fill — the bronchial tree drawn first was occluded by
  the very lungs it ventilates. Use `tubeNodes` for a vessel, bronchus or duct: a single
  translucent stroke has no edge, and every great vessel was a pale smudge until it had three.
- **A label beside an organ names the organ.** Give it a `leader` whenever it names a LAYER or a
  part instead — "Cortex" and "Medulla" beside one kidney are meaningless without one.
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

### Checking the result

`tools/diagram-audit` renders every module's diagram to a standalone SVG **the way the phone
draws it** — same class tables, same colour precedence — and writes `out/index.html`:

```
npx vitest run tools/diagram-audit
```

Open that page and paste `tools/diagram-audit/sweep.js` into the console. It answers four
questions, and all four found real faults the first time they were asked: labels leaving the
frame, labels landing on each other, labels a LINE runs through, and labels that cannot be READ
because they are written across a saturated fill. Run the geometry pass at the phone's width as
well as desktop — a pair of labels twelve units apart collides at one size and clears at the
other.

**A label a line runs through has three answers, in this order.** Move it, if it is static and
the space exists. Occlude the line, if the label sits inside a shape that ought to be solid —
adrenalCortex's four enzyme names each had the steroidogenic spine running through them because
their boxes were `fill: 'none'`, and the boxes are gates ON that spine. Or give the label a
`halo`, if it must stay on the thing it names: a value tracking a point across a plot, a vessel's
name written along it. The halo is painted as the same text stroked in the background colour
underneath, in both renderers, because `paint-order` does not exist in `react-native-svg`.

**A schema-only module has no stylesheet to fall back on.** Where a shape's tint lived in CSS and
the schema kept only `fill`, the phone drew it SOLID: the medullary bands over four labels, both
alveolar units under their own names, every basal ganglia nucleus, the circulation band beneath
all three pituitary axes. State a wash as `fillOpacity` on the node — `LABEL_WASH` in
`shared/presentation/types.ts` for anything that carries a label — and give it a `stroke`, which
circles and rects now take. `styleVars` is NOT a way to do this: `--opacity`, `--integrity` and
`--sx` were each set by a presentation and read by nothing in either project, so the shapes that
depended on them were solid, unshaded, or drawn twice on top of themselves.

Two more, both cheap:

- Shape, before wiring anything up: `node --experimental-strip-types` can import
  `organShapes.ts` directly, because its only import is a type-only one and type stripping
  removes it. A twenty-line script that walks a builder's nodes into a standalone SVG will show
  you an organ in a second, which beats booting the app and clicking to a module. Every shape in
  that file was corrected two or three times that way; the heart took four.
- Contrast: `src/theme/palette.test.ts` checks all 93 signal colours against both themes. If a
  diagram needs a colour that is not in the palette, add a base and let it derive.

**Look at the page as well as measuring it.** The sweep sees text against text and text against
fills; it does not see a tract drawn outside the organ it belongs to. `sector()` in
somaticSensation offset by the cord's centre inside a group that translated by it too, so all
four white-matter tracts were painted across the body maps below — obvious in the picture and
invisible to every check.

## Readouts

Every numeric readout in the app is the same device: a recessed slab on `--readout-ink`, a
tracked micro-label, a large mono numeral in the quantity's own signal colour with a phosphor
halo, and a mono note under it. `ReadoutItem` on the lab and `ClinicPanel`'s bedside chart are
the same idiom deliberately — the lab used to draw a quieter, different tile, so a module with
patients showed two ideas for one thing on one page.

- **The colour rides the NUMBER, not the label.** It used to be the other way round, which lit
  the word and left the quantity it names in plain text.
- **A verdict is not a reading.** A tile whose value is a classification stays small, unglowing
  and on `--on-readout-ink`. That is what keeps it outside the contrast claim below by
  construction, and `ReadoutItem` decides it from `wide`/`revealsPattern` rather than asking.
- **The numeral must stay large and bold.** `palette.test.ts` measures every signal against
  `--readout-ink` at the **3:1 WCAG large-text floor**, which is only the honest bar at ≥18.66px
  bold. `src/theme/readoutInkLargeText.style.test.ts` holds every surface that prints one to
  `--fs-2xl`, and to taking its weight by **composing** `figure` rather than restating 700 — a
  restated weight is a second place to be wrong.
- **A signal colour never goes on a solid accent — that is what `--on-solid` is for.** The phone's
  bed picker fills the selected bed with the module's accent, and the acuity chip inside it kept
  the acuity signal: every combination measured between 1.00 and 1.60:1, and because
  gastrointestinal's accent IS `--danger`, CRASH there rendered at exactly 1.00:1 — the word
  painted in its own background. `palette.test.ts` holds `--on-solid` to 4.5:1 on every signal for
  this reason; the chip is 11pt, so the large-text floor was never the honest bar. The related
  trap: React Native's `withAlpha` is translucent, so a "12% wash" is not a ground at all — it is
  12% of the colour over whatever sits behind, which is how the chip came to be on the accent
  without anyone choosing that.
- **`ReadoutGridView.tsx` on native is a hand-written copy of this tile, and
  `sync-engines.mjs --check` cannot see it** — `src/presentation` is outside `SYNCED_ONLY_DIRS`
  because it mixes synced schema with hand-written views. Change one, change both.

## The house style

This app and the haematology app (Bentara Medical) are one company's products and are meant to
read that way. The shared language lives in `src/index.css` and the four stylesheets in
`src/shared/styles/` — change it there, not in a component.

- **Neutrals are the slate ramp walked towards navy**, surfaces and text alike, in both themes.
  Light is white panels on a faintly blue ground; dark is a night-shift instrument console. This
  is a deliberate step away from the haematology app's exact neutrals — the family resemblance
  now rests on the type, the spacing and the signal palette rather than on identical greys.
- **`--brand` is the one house accent** and the only colour a primary action is ever painted in.
  A module's signal colour is for the physiology it draws, never for its buttons. It is declared
  as a `-base` like every signal, so it lifts into dark mode automatically and `palette.test.ts`
  holds it to the same contrast floors. Dark mode is the one exception in the whole palette: it
  states `--brand` outright as the monitor cyan, because the `color-mix` lift cannot turn a blue
  into a cyan without dragging all 93 signals with it.
- **`--readout-ink` is the instrument slab** a bedside vitals tile is printed on. It inverts with
  the theme like everything else, and it wanted not to — a monitor is black in a lit room too.
  It cannot be: the light signals are calibrated on WHITE, so on a near-black tile the worst of
  them reads at 2.48:1. What makes a tile read as an instrument in either theme is the mono
  numerals, the tight border and the halo, not the absence of light. `palette.test.ts` holds the
  signals on this ground to the 3:1 LARGE-text floor, which is only honest while the numeral is
  actually large — `src/theme/readoutInkLargeText.style.test.ts` is what keeps that true, for
  every surface that prints a number on this ground.
- **The browser-chrome colour is stated in four places and bound by a test.** `index.html`'s
  pre-paint script cannot import anything, `useTheme.ts` restates it for a later preference
  change, and both had silently drifted a whole design away from `--bg`. `themeColor.test.ts`
  binds every copy to the generated token.
- **`--brand-ink` is a near-black panel used ON the light page**, not a dark-mode surface: the
  sign-in split card and the study band. Text on it uses `--on-brand-ink` / `--brand-ink-dim`,
  and the accent on it is **`--brand-on-ink`, never `--brand`** — blue-600 reads at 3.45:1 on
  slate, which is how that token came to exist. Compose `inkSurface` when the panel is a HALF of
  a larger card and `ink` when it is the whole thing.
- **Headings are 700 and pull in** (`--tracking-tight`); **instrument labels are sentence case**
  (compose `microLabel` from `shared/styles/text.module.css`, or the global `.label` utility).
  Positive tracking on a heading is the old voice and should be deleted where it survives.
  This is the one place we depart from the haematology app, which shouts its labels in caps —
  see the sentence-case rule under "Drawing diagrams". `--tracking-wide` has exactly two uses:
  the wordmark in `BrandMark`, which is a logotype rather than a label, and the `kicker` eyebrow
  in `shared/styles/text.module.css`. A kicker is tracked because mono at that size closes up,
  **not** because it is shouting — it is sentence case like everything else, and one set in caps
  has become the old voice and should be reverted. Adopt it as a section eyebrow and nowhere
  else; a kicker on every surface is how a house style dies.
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
