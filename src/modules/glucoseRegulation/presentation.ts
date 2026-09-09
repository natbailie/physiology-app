import { clamp, scaleClamped } from '@/shared/lib/math';
import { liverScene, pancreasScene } from '@/shared/diagram/organShapes';
import { HEPATIC } from './engine/constants';
import type { GlucoseDerived, GlucoseHistoryPoint, GlucoseInputs, GlucoseState } from './engine/types';
import type { ModulePresentation, PresentationContext } from '@/shared/presentation/types';

const BLOODSTREAM_PATH = 'M96,150 C170,110 300,110 372,150';
const INSULIN_PATH = 'M120,196 C165,224 250,226 300,208';
const GLUCAGON_PATH = 'M330,178 C280,204 190,206 140,190';
const COUNTER_REG_PATH = 'M240,66 C300,52 350,84 360,122';

type Ctx = PresentationContext<GlucoseState, GlucoseDerived, GlucoseInputs, GlucoseHistoryPoint>;

function glucoseStatus(mgDl: number): string {
  if (mgDl < 54) return 'severe hypoglycemia';
  if (mgDl < 70) return 'hypoglycemia';
  if (mgDl > 180) return 'marked hyperglycemia';
  if (mgDl > 140) return 'hyperglycemia';
  return 'euglycemic';
}

const percent = (v: number) => `${Math.round(v * 100)}%`;

export function buildGlucosePresentation(ctx: Ctx): ModulePresentation<GlucoseState, GlucoseDerived, GlucoseInputs, GlucoseHistoryPoint> {
  const { derived } = ctx;
  // Blood flow speed stands in for how much glucose is circulating.
  const bloodstreamSpeed = clamp(scaleClamped(derived.bloodGlucoseMgDl, 40, 300, 0.3, 2.2), 0.1, 2.5);
  const hepaticOutputNormalized = clamp(derived.hepaticGlucoseOutputRate / HEPATIC.MAX_OUTPUT_MGDL_PER_SECOND, 0, 1);

  /* The last two users of the legacy `organ` node type, which is drawn by a hand-written registry
   * PER PLATFORM — so this pancreas and this liver were two different drawings maintained twice,
   * and CLAUDE.md says nothing may be added to either registry. The shared builders draw a real
   * gland: head, body and tail with the duct and the islets along it; right and left lobes with
   * the falciform ligament, the gallbladder and the IVC.
   *
   * Colours stay the module's own: the pancreas is drawn here because it makes INSULIN, so it is
   * the insulin colour rather than the CCK colour it takes in gastrointestinal. */
  const pancreas = pancreasScene(
    { x: 132, y: 206, scale: 0.92 },
    {
      insulinLevel: Math.min(derived.insulinLevel, 1),
      glucagonLevel: derived.glucagonLevel,
      colorToken: 'insulin',
      betaToken: 'insulin',
      alphaToken: 'glucagon',
      ductToken: 'insulin',
    },
  );
  const liver = liverScene(
    { x: 356, y: 196, scale: 0.78 },
    {
      // A liver that has spent its glycogen is drawn paler, which is the same quantity the
      // reserve readout carries and the thing the glucagon arrow is acting on.
      functionLevel: 0.4 + derived.hepaticGlycogenReserve * 0.6,
      bileLoad: hepaticOutputNormalized,
      colorToken: 'glucose',
    },
  );

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [64, 33, 360, 228],
        ariaLabel:
          'Animated diagram of the pancreas and liver connected by the bloodstream, with insulin driving glucose uptake, glucagon driving hepatic glucose output, and counter-regulatory hormones engaging during hypoglycemia',
        defs: [
          { type: 'marker', id: 'insulin-arrow', colorToken: 'insulin' },
          { type: 'marker', id: 'glucagon-arrow', colorToken: 'glucagon' },
          { type: 'marker', id: 'counter-reg-arrow', colorToken: 'epinephrine' },
          ...pancreas.defs,
          ...liver.defs,
        ],
        children: [
          {
            type: 'vessel',
            path: BLOODSTREAM_PATH,
            speed: bloodstreamSpeed,
            colorToken: 'glucose',
          },
          {
            type: 'axis',
            path: INSULIN_PATH,
            activation: clamp(derived.insulinLevel, 0, 1),
            colorToken: 'insulin',
            label: 'Insulin → uptake',
            labelX: 168,
            labelY: 244,
            markerId: 'insulin-arrow',
          },
          {
            type: 'axis',
            path: GLUCAGON_PATH,
            activation: derived.glucagonLevel,
            colorToken: 'glucagon',
            label: 'Glucagon → output',
            labelX: 186,
            labelY: 172,
            markerId: 'glucagon-arrow',
          },
          {
            type: 'axis',
            path: COUNTER_REG_PATH,
            activation: derived.counterRegulatoryDrive,
            colorToken: 'epinephrine',
            label: 'Counter-regulation',
            labelX: 234,
            labelY: 56,
            markerId: 'counter-reg-arrow',
          },
          {
            type: 'text',
            x: 240,
            y: 128,
            text: 'bloodstream',
            cls: 'pathLabel',
            // Written along the vessel it names, so it needs a halo rather than a new home.
            halo: 'bg',
            anchor: 'middle',
          },
          pancreas.node,
          liver.node,
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Meal carbohydrate', key: 'mealCarbLoadGrams', min: 0, max: 150, step: 5, unit: 'g' },
      { kind: 'slider', label: 'Insulin dose', key: 'exogenousInsulinUnits', min: 0, max: 20, step: 1, unit: ' U' },
      { kind: 'slider', label: 'Insulin secretion capacity', key: 'insulinSecretionCapacity', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Insulin resistance', key: 'insulinResistance', min: 0, max: 2, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Glucagon secretion capacity', key: 'glucagonSecretionCapacity', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
    ],
    readouts: [
      {
        label: 'Blood glucose',
        value: (c) => c.derived.bloodGlucoseMgDl.toFixed(0),
        unit: 'mg/dL',
        secondary: (c) => glucoseStatus(c.derived.bloodGlucoseMgDl),
        colorToken: 'glucose',
      },
      { label: 'Insulin', value: (c) => (c.derived.insulinLevel * 100).toFixed(0), unit: '%', colorToken: 'insulin' },
      { label: 'Glucagon', value: (c) => (c.derived.glucagonLevel * 100).toFixed(0), unit: '%', colorToken: 'glucagon' },
      {
        label: 'Counter-regulation',
        value: (c) => (c.derived.counterRegulatoryDrive * 100).toFixed(0),
        unit: '%',
        colorToken: 'epinephrine',
      },
      {
        label: 'Glycogen reserve',
        value: (c) => (c.derived.hepaticGlycogenReserve * 100).toFixed(0),
        unit: '%',
        colorToken: 'glucose',
      },
      { label: 'Meal remaining', value: (c) => c.derived.mealBolusRemaining.toFixed(0), unit: 'g', colorToken: 'text' },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Blood glucose',
        unit: 'mg/dL',
        colorToken: 'glucose',
        domainMin: 20,
        domainMax: 400,
        data: (points) => points.map((p) => p.bloodGlucose),
      },
      {
        kind: 'sparkline',
        label: 'Insulin',
        unit: '%',
        colorToken: 'insulin',
        domainMin: 0,
        domainMax: 200,
        data: (points) => points.map((p) => p.insulin * 100),
      },
      {
        kind: 'sparkline',
        label: 'Glucagon',
        unit: '%',
        colorToken: 'glucagon',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.glucagon * 100),
      },
    ],
  };
}

/** The shared percent formatter used by both the web control rail and any other platform. */
export const glucosePercent = percent;
