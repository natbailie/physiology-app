# Pulse oracle

Generates reference traces from the [Pulse Physiology Engine](https://pulse.kitware.com/) and
commits them as small JSON files that the engine tests assert against.

Pulse is **not a dependency of this app** and never runs in the browser, in CI, or in
`npm run verify`. It is a developer tool that runs occasionally, on one machine, and leaves
behind static data. Nothing here is in `package.json`, nothing reaches the bundle, and `tsc`
never sees this directory (`tsconfig.app.json` includes only `src`).

## Why

Our engines are calibrated against textbook values we chose. Pulse is an independently built and
separately validated lumped-parameter model of the same physiology, published under Apache 2.0
with validation tables citing the clinical literature. Agreeing with it is evidence in a way that
agreeing with our own constants is not — and where we *disagree*, the disagreement is worth
understanding before it reaches a student.

## Setup

One-off, and the only thing to install:

1. Docker Desktop for Mac (Apple Silicon) from docker.com.
2. Pull the image:

   ```
   docker pull --platform linux/amd64 kitware/pulse:4.3.1
   ```

The image is amd64-only, so on Apple Silicon it runs under Rosetta. That is fine — nothing about
generating a reference trace is latency-sensitive.

Two macOS quirks `run.sh` already works around: Docker Desktop does not always symlink its CLI
into `/usr/local/bin`, and `docker-credential-desktop` must be on `PATH` or `docker pull` fails
with a confusing credentials error.

## Use

```
./run.sh                    # regenerate every trace
./run.sh hemorrhage-class3  # regenerate one
```

Each trace is declared in `traces.json`: which of Pulse's bundled scenarios to run, which CSV
columns to keep, how often to sample, and the named landmark times the tests assert against.
Scenarios are run **verbatim** from the container's own library rather than authored here, so a
trace is Kitware's validated case and not one of ours. Output lands in
`src/modules/<module>/engine/__oracle__/<id>.json`. Raw CSVs (~20 MB each) stay in `raw/`, which
is gitignored.

`PulseScenarioDriver` writes `<scenarioBasename>Results.csv` — named after the file, not the
scenario's `Name` field. The downsampler throws if a column named in `traces.json` is missing
from the CSV, so a Pulse upgrade that renames a property fails loudly instead of silently
committing a trace full of nulls.

Cost: roughly a minute per scenario, plus about 19 s of patient stabilisation on every run.
`/pulse/bin/states/` in the container holds serialised engine states that skip stabilisation, if
this ever gets tedious.

## Scenarios worth adding

The container ships a large scenario library at `/source/data/human/adult/scenarios/`; 62 of the
`patient/` scenarios pull in `StandardDataRequests.json`. Note that the respiratory scenarios emit
a much richer column set than the haemorrhage ones — airway resistance, lung compliance, shunt
fraction, dead-space ratio, physiologic dead space — so check the actual CSV header before
assuming a quantity is unavailable.

Still to do:

- `patient/TensionPneumothorax*` -> `respiratoryMechanics`.
- The `energyenvironment/` scenarios -> `exercisePhysiology`, which is untouched so far.
- `patient/Baroreceptors` is now used by three modules (`cardiorenal`, `cardiacElectro`, and as the
  source of the PV loops). Other cardiovascular scenarios would broaden that base.

**Deliberately skipped — `ecgConduction` and `cardiacElectro`'s conduction half.** Pulse does not
model cardiac conduction. Its ECG is a single stored waveform, `/pulse/bin/ecg/StandardECG.json`,
replayed and scaled with heart rate; there is no dipole, no activation sequence and no lead
projection. Our module computes a dipole from regional activation timing and projects it onto
twelve leads, so there is nothing here to compare and a comparison would be actively misleading.
The `acls/` arrhythmia scenarios change rhythm, not conduction, for the same reason. Pulse's heart
is useful to us for its mechanics — hence `pv-loop` — and not for its electrics.

**Deliberately skipped — `showcase/HeatStroke` for `thermoregulation`.** It runs 2,610 s and
confounds four exercise changes, three environment changes, a thermal application and a fluid
infusion in one trace, so a divergence could not be attributed to any one mechanism. A cleaner
comparison needs a simpler scenario.

Pulse has essentially nothing for our endocrine, immunology, neuro/special-senses, coagulation,
blood-group, erythropoiesis or liver modules. Roughly eight of forty modules are in scope.

## What the traces found

### `baroreflex-class1` -> `cardiorenal`

Kitware's own baroreflex test: a ~500 mL (Class I) loss, then 200 s of watching. Pulse produces a
textbook response — MAP defended (95.3 -> 94.2), HR 72 -> 84, SVR up, CO 5.79 -> 5.19, urine output
down, and **GFR held almost exactly still (120 -> 121) while renal blood flow fell 12%**.

Our engine reproduces every direction, and reproduces the two things the module exists to teach:
pressure is defended far better than flow, and autoregulation holds filtration while the flow
feeding it drops. That is the strongest evidence so far that the model is right in structure.

Note the scale trap when reading this module: `bloodVolume`, `gfr` and `urineOutput` are
**normalised** (100 = normal), not mL or mL/min. The oracle test compares fractions of each
engine's own baseline for exactly this reason.

### The haemorrhage ladder -> `shockStates` — the headline finding

Four scenarios losing 15%, 25%, 35% and 42% of blood volume give an independent dose-response
curve for the one claim the module exists to make.

| lost | Pulse MAP | ours | Pulse HR | ours |
|---|---|---|---|---|
| 0% | 95.3 | 95.0 | 72 | 72 |
| 15% | 94.4 | 87.1 | 92 | 74 |
| 25% | 90.8 | 81.7 | 110 | 76 |
| 35% | 65.0 | 76.8 | 129 | 80 |
| 42% | 21.7 *(collapse)* | 73.1 | 155 | 83 |

**Pulse holds pressure almost still through Class I and II, then loses it off a cliff. We fall in
a straight line from the first millilitre.** A learner reading our curve concludes that pressure
tracks blood loss proportionally — the opposite of the lesson the module is named for, and the
reason "classify before you treat" matters. The tachycardia gap is the same defect seen from the
other side: our reflex never really engages, so it cannot defend early or fail late.

This is the clearest instance of what this whole exercise was for. It is a missing mechanism, not
a constant to tune, and it is one mechanism explaining four separate `it.todo`s: the flat MAP
curve, the tachycardia gap, lactate that never rises, and a classification that still reads "no
shock" at a 25% loss where Pulse's patient is at 110 bpm.

Class IV is worth noting on its own: Pulse reaches cardiovascular collapse and an irreversible
state at ~746 s and the driver aborts. `run.sh` tolerates that and downsamples the partial CSV,
because the trace up to collapse is the interesting part. Its CVP is also the one non-monotonic
quantity in the ladder — it falls, then RISES again at collapse (3.80 -> 3.15 -> 3.28 -> 3.86) as
flow all but stops and pressures equalise toward the mean systemic filling pressure.

### `pv-loop` -> `cardiacElectro`

Left-heart pressure and volume at the full 50 Hz over two windows of the baroreflex scenario: a
healthy loop and a reduced-preload loop after the bleed. Reading EDV and ESV off the raw samples
reproduces Pulse's own reported stroke volume (80.4 mL) and ejection fraction (0.57) exactly,
which is what makes the extraction trustworthy.

The comparison must be made at **matched preload**. Pulse's healthy ventricle fills to 142 mL
where our default `preloadEDV` is 120, because for Pulse end-diastolic volume is emergent and for
us it is a slider. Fill ours to Pulse's post-bleed 122 mL and the two ventricles agree closely:

| | Pulse | ours |
|---|---|---|
| EDV | 122.4 | 121.9 |
| ESV | 60.0 | 60.5 |
| stroke volume | 62.4 | 61.4 |
| ejection fraction | 51.0% | 50.3% |

Both engines also defend ESV against a preload change while giving up stroke volume — Starling,
independently reproduced.

### `copd-exacerbation` -> `respiratory`

Baseline agreement is close on every gas: pH 7.400 vs 7.42, PaCO2 40.0 vs 39.9, PaO2 94.7 vs 89.3,
bicarbonate 24.0 vs 25.9, SaO2 97.4% vs 97%.

The better use of this trace is as **an independent oxygen dissociation curve**. Across the
scenario Pulse's PaO2 falls from 89 mmHg to 27, so its 103 samples trace out the whole sigmoid,
and we can ask whether our curve passes through the same points. It does, everywhere the two
curves overlap: within about 4% saturation across the range, both put the clinical 90% threshold
at a PaO2 near 60, both keep the plateau flat, and both make the steep limb steep. That is a test
of one mechanism rather than of a whole preset, which is why it is worth more than it looks.

Watch the units: Pulse reports `OxygenSaturation` as a fraction, our `saO2` is a percentage.

### `asthma-severe` -> `respiratoryMechanics`

This module's lesion parameters are **inputs, not outputs**, so the oracle asks a different
question: are our presets scaled the way an independent engine scales the same disease, and do we
model it as the same *kind* of lesion?

Pulse's severe asthma raises airway resistance 1.5 -> 21.5 cmH2O_s/L, a **14.3x** rise, against our
obstructive preset's **12x**. Same order, independently arrived at. And Pulse leaves compliance,
dead-space ratio and shunt untouched while doing it — so does our preset, which means we model
obstruction as a pure resistance lesion, as Pulse does.

Two Pulse columns are deliberately **not** compared, and both would have produced a plausible
wrong answer:

- `LungCompliance` (0.2 L/cmH2O) is *lung* compliance; our `lungCompliance` (100 mL/cmH2O) is
  *respiratory-system* compliance. Both are textbook-correct for their own definition, and they
  differ by the factor of two you would expect. Matching the absolute numbers would be wrong.
- `TotalLungVolume` is an instantaneous volume sampled at an arbitrary point in the breath cycle —
  it reads *higher* after recovery (2858 mL) than during the attack (2433 mL). It is not a usable
  stand-in for FRC or for air trapping.

### `pneumonia-moderate` / `ards-moderate` -> `respiratoryMechanics`

The closest agreement anywhere in the suite: our `pneumonia` preset sets `shuntFraction: 35`, and
Pulse's moderate pneumonia settles at a shunt fraction of **0.35**.

Pulse's pneumonia does more than shunt, though — it also cuts lung compliance (0.20 -> 0.11
L/cmH2O), raises airway resistance (1.5 -> 3.6) and nearly doubles the dead-space ratio (0.29 ->
0.55). Ours changes shunt alone. Recorded as an `it.todo`: the consolidated lung is also stiffer
and wastes more of each breath.

**Pulse does not distinguish ARDS from pneumonia.** `PneumoniaModerateBothLungs` and
`ARDSModerateBothLungs` are genuinely different `PatientCondition`s at the same severity (0.6,
both lungs), and they produce *identical* numbers on every column recorded — shunt, both
compliances, resistance, dead space, PaO2, SaO2. So ARDS cannot serve as an independent check on
compliance. There is a test asserting the identity, deliberately: if it ever fails, Pulse has
gained a mechanism that separates them and an ARDS trace becomes worth having.

### `hemorrhage-class3` -> `shockStates`

35% blood loss, no fluid given. Baseline agreement is close — MAP 95.0 vs 95.3, HR 71.7 vs 72.0 —
which is the result that makes the rest worth reading. Two divergences are recorded as `it.todo`
in `src/modules/shockStates/engine/oracle.test.ts`. **Both are decisions about what the module
should teach, not tolerances to widen.**

### 1. Haemoglobin in acute haemorrhage

Pulse's haemoglobin *content* falls 821 g → 535 g, but blood volume falls in step, so the
*concentration* barely moves: **15.0 → 14.8 g/dL across a 1.9 L loss.** You lose whole blood; you
do not dilute it until interstitial fluid shifts in or someone hangs crystalloid.

Our `haemorrhagic` preset sets `haemoglobinGDl: 7.5`, and the comment on it teaches that oxygen
delivery is "hit twice over — by the flow term and by the carriage term". For acute haemorrhage
before resuscitation that inverts the usual teaching point, which is that a normal haemoglobin
does not exclude massive blood loss.

Either reading can be defended — the preset may be intended as *resuscitated* haemorrhage, which
is the state most patients are in by the time anyone measures a haemoglobin. But it is currently
implicit, and the two readings teach opposite lessons. Worth settling deliberately.

### 2. How the baroreflex defends pressure — seen in BOTH modules

At a *larger* fractional volume loss than Pulse's, we land at a higher MAP (74 vs 65), nearly
double the stroke volume (44 vs 26 mL), and a heart rate of 82 against Pulse's 129. Our reflex
defends pressure mostly through resistance; Pulse's does much more of it through rate.
Tachycardia is the earliest and most reliable sign of Class III haemorrhage, so a model that
reaches Class III at 82/min under-teaches it.

The `cardiorenal` trace shows the same thing independently, at the other end of the severity
range: a ~9% loss moves our rate +2.5% against Pulse's +17%. Two different modules, two different
scenarios, one direction of error. **That points at a single shared assumption about how much of
the baroreflex runs through rate rather than resistance, rather than at two tuning problems.** It
is the more interesting finding of the two, because fixing it in one place would move both.

Note that the severity of divergence 2 is partly downstream of decision 1: at 14.8 g/dL rather
than 7.5, oxygen delivery roughly doubles and the mixed venous saturation we produce (29.8%)
would be far less extreme.

## Attribution

Pulse is Apache 2.0, © Kitware Inc. See `NOTICE` at the repo root. The committed traces are
output generated by running Pulse; no Pulse source is vendored into this repository.
