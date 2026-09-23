# Physiology Lab

Fifty-one interactive physiology simulators for medical students, plus an interactive formula
reference and a pharmacology hub. Every module runs a real quantitative model — named equations,
constants calibrated so baseline lands on textbook values — and each carries verified practice
questions.

Aimed at pre-clinical medicine (UKMLA, USMLE Step 1, MBBS), with modules tagged for MRCP Part 1,
MRCS Part A and FRCA Primary.

## Running it

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # 2,900 tests across 211 files
npm run build        # tsc -b && vite build
npm run lint         # oxlint
npm run verify       # all four, in CI order
```

## What is in here

**Simulators**, in twelve themes:

| Theme | Modules |
| --- | --- |
| Cardiovascular | cardiorenal, ECG conduction, cardiac cycle & PV loop, coronary circulation, capillary exchange, venous return, shock states |
| Respiratory | respiratory & acid-base, respiratory mechanics, mechanical ventilation, respiratory failure |
| Renal & fluids | renal tubular, electrolyte balance, micturition |
| Endocrine | HPA, HPT, HPG, glucose regulation, calcium homeostasis, anterior pituitary, adrenal cortex, adrenal medulla |
| Gastrointestinal | GI physiology, liver physiology, digestion & absorption |
| Haematology & immunity | coagulation, erythropoiesis, immune response, hypersensitivity, blood groups, inflammation |
| Neuro & muscle | membrane potentials, autonomic nervous system, muscle contraction, neuromuscular junction, cerebral perfusion, cognitive neuroscience, somatic sensation, motor control |
| Special senses | vision, hearing, vestibular |
| Reproduction & development | fetal circulation, pregnancy |
| Integrative | thermoregulation, exercise physiology |
| Metabolism | metabolism, toxicology, anaesthesia |
| Cell & molecular | enzyme kinetics, cell cycle |

The physiology is not decorative. Guyton's two-curve analysis, Suga-Sagawa time-varying
elastance, the Edelman relation, Landis-Pappenheimer, Hodgkin-Huxley gating, Severinghaus,
Gordon-Huxley length-tension, Hill force-velocity, Henderson-Hasselbalch, Winter's formula,
Bazett, Monro-Kellie, Watson & Yellott, Steinhausen, Gell and Coombs — all implemented and
unit-tested against textbook baselines.

Findings are emergent rather than drawn. R-wave progression across the chest leads falls out of
the activation sequence projected onto twelve lead axes; a posterior infarct shows ST depression
in V1-V3 because no electrode faces the back of the heart; compensation is always incomplete
because the renal arm has a bounded capacity rather than a set point.

**Practice.** Two question formats, and every question is verified against the engine that
answers it (see below). *Predict-then-run*: read a scenario, commit to a direction, then watch
the model play it out against a frozen baseline. *Pattern discrimination*: the scenario runs with
the controls hidden and you name it from the readouts.

**Progress.** Scores persist to localStorage by default. Signing in moves them to Postgres via
Supabase, behind the same `ProgressStore` interface, so the quiz code is identical either way —
and the app works fully without an account.

## Where the numbers come from

Every module carries `engine/references.ts`, pairing each asserted physiological band with a
provenance record saying where it came from. Three kinds, in descending order of how hard they
are to fake:

- **Analytic** — the reference is a published *equation*, written out inside the test and
  importing nothing from the engine. Thirteen modules have one. Some are identities that must
  hold for any input at all: `ecgConduction` checks Einthoven's law against arbitrary dipoles and
  it holds to ten decimal places.
- **Trace** — the reference is a committed trace from the [Pulse Physiology
  Engine](https://pulse.kitware.com/), an independently built and separately validated model of
  the same physiology. Five modules and nineteen traces. See `tools/pulse-oracle/`.
- **Reference range** — the reference is a published interval. Every module has this.

Of 265 asserted bands, 236 (89%) name an external source; the remaining 29 say so explicitly and
record what would settle them. That percentage is asserted as a ratchet in
`src/shared/verification/references.test.ts` and should only ever rise.

This matters more than it looks. `shockStates` agreed with Pulse almost exactly at baseline —
MAP 95.0 against 95.3, HR 71.7 against 72.0 — and was still teaching the *inverse* of its own
lesson: pressure falling linearly from the first millilitre, where the whole point of ATLS
classification is that pressure is defended and then collapses. A reference-range check passed
that module. Only the trace oracle caught it. `tools/pulse-oracle/README.md` records the fix.

## Architecture

```
src/modules/<module>/
  engine/          pure TypeScript, no React — types, constants, one file per mechanism,
                   engine.ts (createInitialState / computeDerived / tick / step / perturb*),
                   presets.ts, loopConfig.ts, *.test.ts
  components/      the module's diagram, readouts and control rail
  content.ts       the explainer prose
  questions.ts     practice questions, verified by questions.test.ts
  <Module>Page.tsx thin container
```

Three rules hold the project together:

1. **Engines are pure and framework-free.** `step(state, inputs, dt)` has no side effects. That
   is what makes them testable, and what lets the verification harness run a question against the
   real model.
2. **One loop drives everything.** `useEngineLoop` runs physics in refs at 60 Hz and throttles
   React updates, with transport controls (play/pause/step/speed) and baseline capture shared by
   every module.
3. **Nothing the learner sees depends on a library.** Every chart, diagram and ECG trace is
   hand-written SVG. The only runtime dependencies are React, the Supabase client and RevenueCat's
   web SDK. The latter two are infrastructure rather than UI, and both are optional: without
   credentials the app runs local-only and loads neither.

## Questions are verified against the engine

A question carries a machine-checkable claim: a metric, a direction, and settle/observe windows.
`describeQuestionSet` runs it against the real simulation and fails the build if the keyed answer
is not what the model does, or if the change is too small for a learner to see.
`describePatternSet` does the equivalent for pattern drills, rejecting any whose panel cannot
separate the answer from its distractors.

This is not ceremony. Roughly a third of authored questions were rejected by it, and two of those
rejections turned out to be engine gaps rather than authoring mistakes.

## Testing

`npm test` runs everything. Engine tests are written as clinical assertions rather than numeric
snapshots — "the D-dimer is what separates DIC from liver disease", "desmopressin concentrates
the urine in central DI but not nephrogenic".

Note `vitest` runs with `globals: false`, so component tests must register Testing Library
cleanup explicitly with `afterEach(cleanup)`.

CSS-module errors are caught by `vite build`, not by `tsc` or the test suite — run a build before
trusting a stylesheet change.
