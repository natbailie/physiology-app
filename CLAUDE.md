# Physiology Lab — working notes

Interactive physiology simulators for pre-clinical medical students. See `README.md` for what the
app is; this file is about how to work in it.

## Non-negotiables

- **Engines stay pure.** `src/modules/*/engine/` is plain TypeScript with no React import.
  `step(state, inputs, dt)` must have no side effects — the verification harness, the Step
  control and baseline comparison all depend on it.
- **No new runtime dependencies for anything the learner sees.** Charts and diagrams are
  hand-written SVG on purpose. Reach for a library and the engines stop being the fast, testable
  part of the app. The one exception is the Supabase client, which backs optional accounts and is
  never loaded when the app runs unconfigured — an infrastructure dependency, not a UI one.
- **Constants are calibrated, not invented.** Baseline inputs must land on textbook values. If a
  constant changes, the engine test asserting the baseline should fail — that is the point.

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
- **Anatomical labels are sentence-case sans. Only measured values are uppercase mono.** The
  split is what lets a reader tell a structure from a reading at a glance. "Bowman's capsule"
  and "Proximal tubule" read; "RIGHT ARM (PRE)" reads as terminal output.
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
- **Headings are 700 and pull in** (`--tracking-tight`); **instrument labels are 700, uppercase
  and spread out** (`--tracking-wide`, or compose `microLabel` from `shared/styles/text.module.css`).
  Positive tracking on a heading is the old voice and should be deleted where it survives.
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
- New component tests need `afterEach(cleanup)` — vitest runs with `globals: false`, so Testing
  Library's automatic cleanup is never registered.
- Querying a CSS-module class in a test needs `[class*="name"]`, not `.name`. Vitest renders
  them as `_name_hash`, so an exact class selector matches nothing and the assertion passes
  vacuously — which is worse than failing.
- British spelling in learner-facing prose; the existing content is consistent about it.
