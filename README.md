# Physiology Lab

Twenty-two interactive physiology simulators for medical students, plus an interactive formula
reference. Every module runs a real quantitative model — named equations, constants calibrated so
baseline lands on textbook values — and each carries verified practice questions.

Aimed at pre-clinical medicine (UKMLA, USMLE Step 1, MBBS).

## Running it

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # 564 tests
npm run build        # tsc -b && vite build
npm run lint         # oxlint
```

## What is in here

**Simulators.** Cardiorenal, respiratory and acid-base, respiratory mechanics, ECG and cardiac
conduction, cardiac cycle and PV loop, venous return, capillary exchange, shock states, renal
tubular, electrolyte balance, coagulation, erythropoiesis, immune response, muscle and EC
coupling, membrane potentials, autonomic nervous system, GI physiology, and the HPA, HPT, HPG,
calcium and glucose axes.

The physiology is not decorative. Guyton's two-curve analysis, Suga-Sagawa time-varying
elastance, the Edelman relation, Landis-Pappenheimer, Hodgkin-Huxley gating, Severinghaus,
Gordon-Huxley length-tension, Hill force-velocity, Henderson-Hasselbalch, Bazett — all
implemented and unit-tested against textbook baselines.

**Practice.** Two question formats, and every question is verified against the engine that
answers it (see below). *Predict-then-run*: read a scenario, commit to a direction, then watch
the model play it out against a frozen baseline. *Pattern discrimination*: the scenario runs with
the controls hidden and you name it from the readouts.

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
3. **No runtime dependencies beyond React.** Every chart and diagram is hand-written SVG.

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
