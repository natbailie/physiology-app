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
- **Read the DOM in a separate tool call from the clicks.** React has not committed yet within
  the same synchronous block, and reading early has produced two false diagnoses so far.
- `inputsRef` in `useEngineLoop` syncs via an effect, so a preset applied and stepped in the same
  tick uses the old inputs. Harmless for real users; it will mislead you when scripting.

## Conventions

- Module ids are camelCase and appear in four places: `moduleRegistry.ts`, `useHashRoute.ts`,
  `App.tsx`, and the module directory name.
- New component tests need `afterEach(cleanup)` — vitest runs with `globals: false`, so Testing
  Library's automatic cleanup is never registered.
- British spelling in learner-facing prose; the existing content is consistent about it.
