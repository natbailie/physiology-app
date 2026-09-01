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
./run.sh --list             # list the container's scenario library
./run.sh --list patient     # list one subdirectory of it
./run.sh --columns asthma   # print the CSV header a trace produced, from raw/
```

`--list` and `--columns` exist because the two ways an new trace entry goes wrong are both cheap to
rule out first: a scenario path that is not in the image fails deep inside a docker run, and a
column that scenario does not record fails in the downsampler. Check both before writing the test.

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
- A distributive-shock oracle. `patient/Sepsis` does not work — see the null result below — so this
  needs either a longer sepsis run or a different scenario.

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

**Pulse held pressure almost still through Class I and II, then lost it off a cliff. We fell in a
straight line from the first millilitre.** A learner reading our curve concluded that pressure
tracks blood loss proportionally — the opposite of the lesson the module is named for, and the
reason "classify before you treat" matters. The tachycardia gap was the same defect seen from the
other side: our reflex never really engaged, so it could not defend early or fail late.

This was the clearest instance of what this whole exercise was for.

### FIXED — and it was two mechanisms, not one

The reflex was the obvious half and not the sufficient one.

1. **Sympathetic drive was a sigmoid of ABSOLUTE pressure**, half-activating at 55 mmHg. That put a
   resting patient at 93 mmHg on the flat tail of the curve with a drive of 0.02, so the reflex did
   essentially nothing until pressure was already nearly lethal. A real carotid sinus has its
   greatest gain at the normal operating point — that is what makes it a controller rather than an
   alarm. Drive is now taken from the ERROR against a setpoint and saturates smoothly
   (`BAROREFLEX.HALF_ACTIVATION_ERROR_MMHG`).
2. **Filling pressure fell in PROPORTION to blood volume.** Correcting only the reflex produced a
   circulation that defended pressure for ever and never reached a cliff at all — because with the
   reflex switched off entirely, a 42% loss still gave MAP 58 and a cardiac output of 3.1 L/min
   against Pulse's 21.7 and 0.63. Baseline stressed volume is only ~700 mL of a 5 L circulation,
   and vessels recoil as they empty, so blood is drawn preferentially out of the part that
   generates pressure. `CIRCULATION.UNSTRESSED_RECOIL_EXPONENT` makes that explicit.

The shape of the saturation mattered as much as the gain. A logistic steep enough to give the right
Class I tachycardia pinned at maximum by Class III, so every shock state on the page read 165 bpm
and the rate stopped discriminating between them. A Michaelis form keeps headroom all the way down.

| lost | Pulse MAP | ours | Pulse HR | ours |
|---|---|---|---|---|
| 0% | 95.3 | 93.0 | 72 | 70 |
| 15% | 94.4 | 90.5 | 92 | 93 |
| 25% | 90.8 | 84.6 | 110 | 119 |
| 35% | 65.0 | 59.9 | 129 | 147 |
| 42% | 21.7 | 22.3 | 155 | 155 |

Stroke volume tracks too — 71, 46, 29, 15, 5 mL against Pulse's 80, 52, 38, 26, 4. The residual
difference is that our rate runs high through Classes II and III where Pulse still has reserve;
the shape, which is what the module teaches, now matches.

Two consequences worth recording:

- **The `haemorrhagic` preset was rescaled from 3000 mL to 3600 mL.** Its 40% loss was chosen when
  a 40% loss was survivable with a near-normal pressure. Against the corrected curve 3000 mL reads
  MAP 35 — Class IV, not the compensated patient the module's classification trap is about.
  `decompensating` is the same bleed with the reflex removed, so the pair stays a controlled
  comparison.
- **Lactate now rises on its own** at the severe end, which is part of the third `it.todo`
  answering itself.

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

**The EDV question — settled by KEEPING the slider, and fixing what was actually wrong.** For Pulse
end-diastolic volume is emergent from venous return; for us it is an input, and 120 mL is the
textbook normal where Pulse's 142 sits at the top of the range. The slider stays: it is the
instrument this module is built on, and `venousReturn` and `shockStates` already own emergent
filling. But the real complaint behind that todo was that *the loop could not respond to anything on
its own* — and it could not, because EDV was pinned. End-diastolic volume is the residue of the last
beat plus venous return, so a ventricle that empties badly starts the next beat fuller.
`VENTRICLE.RESIDUAL_FILLING_COUPLING` adds that, measured from the baseline residue so the
calibration is untouched. A failing ventricle now DILATES — the single most recognisable thing about
one, and something this loop previously could not draw — and a raised afterload no longer costs
stroke volume one-for-one, because the accumulating residue recruits Starling.

### `copd-exacerbation` -> `respiratory` — FIXED, by shipping the second patient

Our `copdChronicAcidosis` was pure hypoventilation: PaCO2 71, a normal A-a gradient, PaO2 56. Pulse's
exacerbation is a different animal — PaO2 89 -> 27 with the CO2 barely moving, 40 -> 45. Both are
real patients and only one was teachable, so there are now two presets and what separates them is a
MECHANISM rather than a severity.

`vqMismatch` is a new input feeding the A-a gradient (and, more weakly, dead space). The asymmetry
is the teaching: CO2 is ~20x more diffusible and its dissociation curve is near-linear, so mismatch
that devastates oxygenation costs little CO2 clearance. Hypoxaemia out of proportion to hypercapnia
means mismatch, not hypoventilation.

| | pH | PaCO2 | PaO2 | SaO2 | A-a |
|---|---|---|---|---|---|
| chronic retainer | 7.28 | 70.7 | 56 | 89% | 5 |
| exacerbation (ours) | 7.37 | 45.9 | 29 | 55% | 64 |
| exacerbation (Pulse) | 7.31 | 45.0 | 27 | 51% | — |

Note the preset's minute ventilation is set BELOW baseline even though Pulse's patient is breathing
36 times a minute. Rate is not alveolar ventilation: fast and shallow over a large dead space moves
less gas, which is exactly why the effort is not rewarded. And the acid-base half of that gas reads
NORMAL — the trap being that half the ABG is reassuring while the patient is dying of the other half.

### `copd-exacerbation` -> `respiratory`, as first recorded

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
0.55). Ours changed shunt alone. **FIXED:** the preset now stiffens the lung, narrows the airways
and wastes more of each breath, scaled to the same fractions of our own baseline (our compliance is
respiratory-system compliance where Pulse's is lung compliance, so the absolute numbers must not be
matched).

**The rate question — FIXED by measuring the COST rather than modelling the response.** Pulse answers
a severe attack with 12 -> 18.6 breaths/min and tidal volume cut 535 -> 314 mL. Our respiratory rate
and tidal volume are inputs the learner sets, and turning them into outputs would take away the
instrument the module is built on. What was genuinely absent is that nothing showed the cost of the
pattern — so `workOfBreathingJPerMin` now does, using the Otis, Fenn & Rahn (1950) decomposition into
elastic and resistive work. The two halves scale differently with rate (elastic with f, resistive
with f^2), which is why tachypnoea punishes an obstructed lung far harder than a stiff one, and why
dynamic hyperinflation is treated by slowing the rate down.

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

### 1. Haemoglobin in acute haemorrhage — FIXED

Pulse's haemoglobin *content* falls 821 g → 535 g, but blood volume falls in step, so the
*concentration* barely moves. Checking all four no-fluid traces rather than the one makes it
emphatic:

| lost | content | volume | concentration |
|---|---|---|---|
| 15% | 821 → 698 g | 5.49 → 4.72 L | 14.95 → 14.79 g/dL (−1.1%) |
| 25% | 821 → 616 g | 5.49 → 4.19 L | 14.95 → 14.70 g/dL (−1.7%) |
| 35% | 821 → 535 g | 5.49 → 3.71 L | 14.95 → 14.42 g/dL (−3.6%) |
| 42% | 821 → 474 g | 5.49 → 3.23 L | 14.95 → 14.67 g/dL (−1.9%) |

You lose whole blood; you do not dilute it until interstitial fluid shifts in or someone hangs
crystalloid.

Our `haemorrhagic` preset set `haemoglobinGDl: 7.5`, and its comment taught that oxygen delivery is
"hit twice over — by the flow term and by the carriage term". For acute haemorrhage before
resuscitation that inverts the usual teaching point: **a normal haemoglobin does not exclude
massive blood loss**, and that is the commonest way an early bleed is missed.

**Both readings were defensible, which is why the answer was to stop conflating them.** The bleed
now holds its concentration at 14.5 g/dL, and a new `resuscitated` preset — volume largely restored
at 4700 mL, haemoglobin diluted to 7.5 — carries the state most patients are actually in by the
time anyone measures one. The two terms of oxygen delivery can now be taught separately instead of
at once, and the pair makes a further point the single preset could not: the resuscitated patient's
haemodynamic classification reads "no shock" while their oxygen delivery is down by a third,
because the classification reads flow and filling and cannot see carriage.

### 3. Lactate — FIXED, and the one claim NOT taken from the oracle

Ours held at 1.00 mmol/L at every severity. Pulse cannot arbitrate this one: its own lactate is flat
too, 1.60 -> 1.66 even at collapse with a mixed venous saturation of 21%, so agreeing with it would
have been agreeing with a gap. The case rests on the clinical literature, and the ladder is keyed to
the ATLS class bands.

The missing mechanism is regional. Global oxygen debt is a THRESHOLD — tissue extracts more until it
cannot — so keying lactate to it alone gave a flat line and then a step change. Defending arterial
pressure means shutting down splanchnic, muscle and skin, and those beds go anaerobic while the
global figures still balance. That is what makes a raised lactate in a patient with acceptable
vital signs mean anything at all.

Ours now runs 1.0, 1.0, 2.9, 5.1, 18.7 up the ladder — normal at Class I, clearly raised by Class II
while the MAP still reads 85. One refinement fell out of testing it: keyed to reflex drive alone, the
`decompensating` preset (reflex removed, MAP 38) reported a normal lactate. A bed starves for either
of two reasons, so the term takes the worse of reflex diversion and absent flow.

### 2. How the baroreflex defends pressure — seen in BOTH modules — FIXED

At a *larger* fractional volume loss than Pulse's we used to land at a higher MAP (74 vs 65),
nearly double the stroke volume (44 vs 26 mL), and a heart rate of 82 against Pulse's 129. Our
reflex defended pressure mostly through resistance; Pulse's does much more of it through rate.

The `cardiorenal` trace showed the same thing independently, at the other end of the severity
range: a ~9% loss moved our rate +2.5% against Pulse's +17%. Two different modules, two different
scenarios, one direction of error — **a single shared assumption, not two tuning problems.** That
is what made it worth chasing, and fixing it in one place did move both.

`cardiorenal` needed the same two corrections in its own units: a saturating drive
(`BAROREFLEX.HALF_ACTIVATION_ERROR_MMHG`, the same 8 mmHg) in place of a linear ramp that
saturated only 40 mmHg from setpoint, and `STARLING.SUB_BASELINE_EXPONENT` in place of a preload
factor that fell linearly with volume. A ~9% loss now moves our rate +14.7% against Pulse's +17.2%
and our cardiac output −10.0% against its −10.4%. The reflex's two arms were also rebalanced —
`MAX_HEART_RATE_ADJUST` 30 -> 45, `MAX_TONE_ADJUST` 0.30 -> 0.20 — because leaning on resistance
rather than rate was the finding itself.

A third mechanism had to be added to keep the module honest afterwards: **baroreceptor resetting**
(`BAROREFLEX.RESETTING_TAU_SECONDS`). With the reflex corrected but its setpoint fixed, a kidney at
25% function expanded blood volume to 130% of normal while the reflex held the pressure rise to 4%
— teaching that renal failure does not cause hypertension. Real baroreceptors reset to the
prevailing pressure, which is exactly why chronic hypertension persists and why the kidney, not the
reflex, is the long-term controller of arterial pressure.

Note that the severity of divergence 2 is partly downstream of decision 1: at 14.8 g/dL rather
than 7.5, oxygen delivery roughly doubles and the mixed venous saturation we produce (29.8%)
would be far less extreme.

## The second batch

Seven more traces, run to broaden the evidence under the baroreflex rebuild and to give the
non-haemorrhagic shock states any external evidence at all. Five were useful, one settled an open
question, and one is a null result worth committing.

### `hemorrhage-to-shock` — the best single trace in the suite

One patient bled steadily from health into collapse and then watched recovering, so the plateau and
the cliff are two parts of the same curve rather than an inference across four separate runs.

| lost | MAP | HR | CO |
|---|---|---|---|
| 0% | 95.3 | 72 | 5.79 |
| 20% | **93.0** | **105** | 4.55 |
| 31% | 64.1 | 122 | 3.19 |
| 38% | 44.0 | 154 | 2.14 |
| 38%, 24 min later | 71.6 | 97 | 3.74 |

The 20% row is the whole lesson in one line: **a fifth of the blood volume gone, the pressure down
2.4%, and the heart rate already up 46%.** Taking the blood pressure reassures you; taking the pulse
does not. The last row matters too — pressure climbs back and the rate falls with no fluid given,
so compensation is not a one-way ratchet and a falling heart rate is how haemostasis announces
itself.

### `hemorrhage-varying-severity` — the rate-versus-resistance split, measured

The only trace that records systemic vascular resistance alongside heart rate through a graded
bleed, so it answers the question the A1 divergence was actually about rather than leaving it to
inference. At a fifth of blood volume lost Pulse has raised the rate 46% and the resistance 26%; by
collapse the rate is up over 100% and the resistance still only about a fifth, because
**vasoconstriction saturates first and the rate arm carries everything after it.** That is a sharper
statement of the original finding and it is now asserted directly.

### `hemorrhage-class3-prbc` and `hemorrhage-class2-saline` — a preset corrected

The pair asks the same question from both sides: packed cells replace what was lost, crystalloid
replaces volume without cells.

- **PRBC:** concentration holds at 14.95 -> 14.34 g/dL across the bleed AND the transfusion, while
  content falls 821 -> 572 g and is then partly replaced. Confirms that a bleed does not dilute
  itself.
- **Saline:** flat through the bleed (14.95 -> 14.84), then falls only once fluid goes in, reaching
  **13.2 g/dL** with the haemoglobin content unchanged.

That last number **refuted a preset**. `resuscitated` was written at 7.5 g/dL as an inference when
the haemoglobin question was settled; with the content Pulse is left holding, reaching 7.5 by
dilution would take a blood volume near 8 litres, which is not a patient. It now sits at 10.5 g/dL —
about 40% of red cell mass lost and then volume-restored: clearly anaemic, below the reference
range, and still above the 7 g/dL transfusion threshold.

### `ventricular-systolic-dysfunction` — cardiogenic shock, corroborated at last

Until this trace the only externally corroborated shock state was haemorrhage. Pulse produces the
fingerprint the module teaches: output down (5.79 -> 5.23 L/min), mean pressure down (95 -> 79), and
the **wedge nearly doubled (6.5 -> 12.9 mmHg)** with mixed venous saturation falling — all achieved
without any tachycardia at all, which is the opposite of the haemorrhage picture at a similar output.

One divergence is recorded as an `it.todo`. Pulse leaves the CENTRAL venous pressure almost
untouched (4.6 -> 4.8) while the wedge doubles, so its wedge-to-CVP ratio nearly doubles; ours raises
both, so the ratio falls instead. Both are defensible — Pulse models a mild isolated left ventricular
lesion and ours a profound one where secondary right heart failure is real — but the ratio is the
bedside discriminator and the two engines move it in opposite directions.

### `sepsis` and `sepsis-zero` — a NULL result, committed on purpose

`Sepsis.json` applies Kitware's sepsis condition at severity 0.5 and then advances its own two
minutes. That is not long enough for anything to happen: comparing the trace against its
zero-severity control, **not one of the sixty-four recorded columns differs by more than 1%**. The
septic patient still has a normal systemic vascular resistance, so there is nothing here to compare
a distributive shock state against.

Both traces are committed anyway, and the test asserts the identity — exactly as the
ARDS-versus-pneumonia test does. If a future Pulse gains a sepsis model that does something in two
minutes, it fails and the trace becomes worth having.

One practical note for anyone adding traces: `TotalHemorrhagedVolume` does not exist in scenarios
with no haemorrhage, and the downsampler rightly refuses to write a column it cannot find. Check the
CSV header with `--columns` before writing the manifest entry.

## Attribution

Pulse is Apache 2.0, © Kitware Inc. See `NOTICE` at the repo root. The committed traces are
output generated by running Pulse; no Pulse source is vendored into this repository.
