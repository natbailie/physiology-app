import { clamp } from '@/shared/lib/math';
import { heartScene, kidneyScene } from '@/shared/diagram/organShapes';
import { HEMODYNAMICS, RENAL } from './engine/constants';
import type { DerivedValues, HistoryPoint, SimInputs, SimState } from './engine/types';
import type { ModulePresentation, PresentationContext, SceneNode } from '@/shared/presentation/types';

/* Where the two organs sit, and how big. Named because every path below is anchored to them:
 * move an organ and the vessels reaching it have to move with it, which is far easier to get
 * right against a constant than against nine hand-typed coordinates.
 *
 * ONE kidney, sectioned, rather than the two beans this used to draw. Nothing in the model is
 * about having a pair, and a section shows the cortex that filters and the medulla the loops
 * descend into — which IS what the module is about. */
const HEART = { x: 150, y: 170, scale: 1.25 };
const KIDNEY = { x: 420, y: 170, scale: 1.5 };

const ARTERIAL_PATH = 'M208,138 C258,108 308,112 352,150';
const VENOUS_PATH = 'M352,192 C308,226 258,232 208,202';
/* RAAS reaches the circulation by two routes with two different clocks, and the module turns on
 * the difference: angiotensin II squeezes the vessels within seconds, aldosterone rebuilds volume
 * at the tubule over hours. One arrow to one destination could not say that, so there are two. */
const ANGIOTENSIN_PATH = 'M378,238 C322,282 258,258 232,216';
const ALDOSTERONE_PATH = 'M492,266 C518,232 494,198 460,192';
const ANP_PATH = 'M158,96 C220,40 340,48 400,106';
/** The ureter, leaving the pelvis and running off the bottom of the drawing. */
const URINE_PATH = 'M396,190 C386,216 382,246 382,292';
/* The hilar segment of the renal artery, tracing the tube the kidney drawing already puts there.
 * Renal blood flow is autoregulated SEPARATELY from cardiac output — that is the whole point of
 * the autoregulation term — so it needs a flow of its own rather than sharing the systemic one. */
const RENAL_ARTERY_FLOW = 'M354,152 C372,154 384,157 396,160';

type Ctx = PresentationContext<SimState, DerivedValues, SimInputs, HistoryPoint>;

export function buildCardiorenalPresentation(ctx: Ctx): ModulePresentation<SimState, DerivedValues, SimInputs, HistoryPoint> {
  const { derived } = ctx;
  const strokeVolumeScale = clamp(derived.strokeVolume / HEMODYNAMICS.BASELINE_STROKE_VOLUME_ML, 0.5, 1.6);
  const flowSpeed = clamp(derived.cardiacOutput / HEMODYNAMICS.CO_BASELINE_ML_PER_MIN, 0.05, 2.5);
  // Calibre falls as angiotensin II constricts, so the resistance term is a visible narrowing
  // rather than only a number in the readouts.
  const arterialCalibre = clamp(1 / Math.max(derived.effectiveSVR, 0.3), 0.45, 1.8);
  const renalFlowSpeed = clamp(derived.renalBloodFlow, 0.05, 2.5);
  const gfrIntensity = clamp(derived.gfr / RENAL.BASELINE_GFR, 0, 1.8);
  const urineSpeed = clamp(derived.urineOutput / RENAL.BASELINE_URINE_TARGET, 0.05, 2.5);

  const heart = heartScene(HEART, { heartRate: derived.effectiveHeartRate, strokeVolumeScale });
  const kidney = kidneyScene(KIDNEY, { gfrIntensity });

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [62, 22, 478, 302],
        ariaLabel:
          'Animated diagram of the heart in anterior view — four chambers, aorta, pulmonary trunk and venae cavae — connected by an artery and a vein to a sectioned kidney showing its cortex, medullary pyramids and renal pelvis, with the RAAS and ANP hormone pathways drawn between them',
        defs: [
          { type: 'marker', id: 'raas-arrow', colorToken: 'raas' },
          { type: 'marker', id: 'anp-arrow', colorToken: 'anp' },
          ...heart.defs,
          ...kidney.defs,
        ],
        children: [
          { type: 'vessel', path: ARTERIAL_PATH, speed: flowSpeed, colorToken: 'artery', width: arterialCalibre },
          { type: 'vessel', path: VENOUS_PATH, speed: flowSpeed, colorToken: 'artery' },
          { type: 'vessel', path: RENAL_ARTERY_FLOW, speed: renalFlowSpeed, colorToken: 'kidney' },
          {
            type: 'axis',
            path: ANP_PATH,
            activation: derived.anpLevel,
            colorToken: 'anp',
            label: 'ANP',
            labelX: 288,
            labelY: 44,
            markerId: 'anp-arrow',
          },
          // Angiotensin II acts on the ARTERIES — the resistance term, and it acts at once.
          {
            type: 'axis',
            path: ANGIOTENSIN_PATH,
            activation: derived.angiotensinII,
            colorToken: 'raas',
            label: 'Angiotensin II',
            labelX: 244,
            labelY: 272,
            markerId: 'raas-arrow',
          },
          // Aldosterone acts on the TUBULE — the volume term, and it takes hours.
          {
            type: 'axis',
            path: ALDOSTERONE_PATH,
            activation: derived.aldosterone,
            colorToken: 'raas',
            label: 'Aldosterone',
            labelX: 464,
            labelY: 290,
            markerId: 'raas-arrow',
          },
          heart.node,
          kidney.node,
          { type: 'path', d: URINE_PATH, cls: 'urineFlow', styleVars: { 'urine-speed': urineSpeed } },
          { type: 'text', x: HEART.x, y: 282, text: 'Heart', cls: 'organLabel', anchor: 'middle' },
          { type: 'text', x: KIDNEY.x + 4, y: 268, text: 'Kidney', cls: 'organLabel', anchor: 'middle' },
          /* Two structure labels, not ten. The cortex is where the filtration this module models
           * happens and the medulla is where the gradient it depends on lives; naming every
           * pyramid and calyx would answer questions the module never asks.
           *
           * Both get a leader, because a name floating beside an organ names the organ. The
           * whole point of these two is that they name DIFFERENT LAYERS of it. */
          { type: 'path', d: 'M486,124 L458,146', cls: 'leader' },
          { type: 'text', x: 490, y: 122, text: 'Cortex', cls: 'anatomy', anchor: 'start' },
          { type: 'path', d: 'M486,212 L450,192', cls: 'leader' },
          { type: 'text', x: 490, y: 218, text: 'Medulla', cls: 'anatomy', anchor: 'start' },
          { type: 'text', x: 282, y: 124, text: 'Artery', cls: 'pathLabel', anchor: 'middle' },
          { type: 'text', x: 282, y: 232, text: 'Vein', cls: 'pathLabel', anchor: 'middle' },
          { type: 'text', x: 400, y: 300, text: 'urine', cls: 'pathLabel', anchor: 'start' },
        ] as SceneNode[],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Heart rate', key: 'heartRate', min: 40, max: 180, step: 1, unit: ' bpm' },
      { kind: 'slider', label: 'Contractility', key: 'contractility', min: 0, max: 2, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Vascular tone', key: 'vascularTone', min: 0.5, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Kidney function', key: 'kidneyFunction', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Sodium intake', key: 'sodiumIntake', min: 0, max: 300, step: 5, unit: '%' },
    ],
    readouts: [
      { label: 'MAP', value: (c) => c.derived.meanArterialPressure.toFixed(0), unit: 'mmHg', colorToken: 'artery' },
      { label: 'Cardiac output', value: (c) => (c.derived.cardiacOutput / 1000).toFixed(1), unit: 'L/min', colorToken: 'artery' },
      {
        label: 'Heart rate',
        value: (c) => c.derived.effectiveHeartRate.toFixed(0),
        unit: 'bpm',
        setPoint: (c) => c.inputs.heartRate,
        colorToken: 'artery',
      },
      { label: 'Blood volume', value: (c) => c.state.bloodVolume.toFixed(0), unit: '%', colorToken: 'text' },
      { label: 'GFR', value: (c) => c.derived.gfr.toFixed(0), unit: 'mL/min*', colorToken: 'kidney' },
      { label: 'Urine output', value: (c) => c.derived.urineOutput.toFixed(0), unit: 'mL/min*', colorToken: 'urine' },
      { label: 'RAAS activity', value: (c) => `${(c.derived.raasActivation * 100).toFixed(0)}%`, colorToken: 'raas' },
      { label: 'ANP activity', value: (c) => `${(c.derived.anpLevel * 100).toFixed(0)}%`, colorToken: 'anp' },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'MAP',
        unit: 'mmHg',
        colorToken: 'artery',
        domainMin: 30,
        domainMax: 180,
        data: (points) => points.map((p) => p.map),
      },
      {
        kind: 'sparkline',
        label: 'GFR',
        unit: '*',
        colorToken: 'kidney',
        domainMin: 0,
        domainMax: 150,
        data: (points) => points.map((p) => p.gfr),
      },
      {
        kind: 'sparkline',
        label: 'Blood volume',
        unit: '%',
        colorToken: 'text',
        domainMin: 40,
        domainMax: 220,
        data: (points) => points.map((p) => p.bloodVolume),
      },
    ],
  };
}