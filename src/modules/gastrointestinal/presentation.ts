import { clamp, scaleClamped } from '@/shared/lib/math';
import { PANCREAS_PATH, SMALL_INTESTINE_PATH, STOMACH_PATH } from '@/shared/diagram/organShapes';
import { GASTRIC_PH } from './engine/constants';
import { motilityIntensity } from './engine/motility';
import type { GiDerived, GiHistoryPoint, GiInputs, GiState } from './engine/types';
import type { ModulePresentation, PresentationContext } from '@/shared/presentation/types';

const ESOPHAGUS_PATH = 'M130,32 L130,88';
const EMPTYING_PATH = 'M172,148 C232,168 300,152 335,124';
const GASTRIN_PATH = 'M115,170 C82,150 82,108 112,92';
const SOMATOSTATIN_PATH = 'M148,172 C177,146 174,104 146,90';
const CCK_PATH = 'M330,138 C300,164 272,176 256,183';
const SECRETIN_PATH = 'M352,150 C338,182 314,203 288,206';

type Ctx = PresentationContext<GiState, GiDerived, GiInputs, GiHistoryPoint>;

export function buildGastrointestinalPresentation(ctx: Ctx): ModulePresentation<GiState, GiDerived, GiInputs, GiHistoryPoint> {
  const { derived } = ctx;
  // Higher acid intensity = lower pH (more acidic).
  const acidIntensity = clamp(scaleClamped(derived.gastricPH, GASTRIC_PH.MIN_PH, 6, 1, 0), 0, 1);
  const emptyingSpeed = derived.isFasting ? 0.05 : clamp(derived.gastricEmptyingRate / 100, 0.1, 2);
  const bicarbIntensity = clamp(derived.secretinDrive, 0, 1);
  const motility = motilityIntensity(derived.isFasting, derived.motilinPhase, (derived.gastricEmptyingRate / 100) * 0.006);

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 480, 300],
        ariaLabel:
          'Animated diagram of the stomach, small intestine, and pancreas, connected by gastric emptying and the gastrin, somatostatin, CCK, and secretin hormone pathways',
        defs: [
          { type: 'marker', id: 'gastrin-arrow', colorToken: 'gastrin' },
          { type: 'marker', id: 'somatostatin-arrow', colorToken: 'somatostatin' },
          { type: 'marker', id: 'cck-arrow', colorToken: 'cck' },
          { type: 'marker', id: 'secretin-arrow', colorToken: 'secretin' },
        ],
        children: [
          {
            type: 'vessel',
            path: ESOPHAGUS_PATH,
            speed: derived.gastricVolumeFraction > 0.9 ? 1 : 0.05,
            colorToken: 'motility',
          },
          {
            type: 'vessel',
            path: EMPTYING_PATH,
            speed: emptyingSpeed,
            colorToken: 'motility',
          },
          {
            type: 'axis',
            path: GASTRIN_PATH,
            activation: derived.gastrinDrive,
            colorToken: 'gastrin',
            label: 'Gastrin',
            labelX: 55,
            labelY: 128,
            markerId: 'gastrin-arrow',
          },
          {
            type: 'axis',
            path: SOMATOSTATIN_PATH,
            activation: derived.somatostatinDrive,
            colorToken: 'somatostatin',
            label: 'Somatostatin',
            labelX: 195,
            labelY: 128,
            markerId: 'somatostatin-arrow',
            inhibitory: true,
          },
          {
            type: 'axis',
            path: CCK_PATH,
            activation: derived.cckDrive,
            colorToken: 'cck',
            label: 'CCK',
            labelX: 300,
            labelY: 178,
            markerId: 'cck-arrow',
          },
          {
            type: 'axis',
            path: SECRETIN_PATH,
            activation: derived.secretinDrive,
            colorToken: 'secretin',
            label: 'Secretin',
            labelX: 388,
            labelY: 200,
            markerId: 'secretin-arrow',
          },
          {
            type: 'group',
            transform: 'translate(130, 130)',
            styleVars: { 'acid-intensity': acidIntensity, 'stomach-volume': derived.gastricVolumeFraction },
            children: [
              {
                type: 'path',
                d: STOMACH_PATH,
                fill: 'gastrin',
                colorToken: 'gastrin',
                strokeWidth: 2,
              },
              { type: 'text', x: 0, y: 54, text: 'Stomach', cls: 'organLabel', anchor: 'middle' },
            ],
          },
          {
            type: 'group',
            transform: 'translate(270, 195)',
            styleVars: { 'cck-intensity': derived.cckDrive, 'secretin-intensity': derived.secretinDrive },
            children: [
              {
                type: 'path',
                d: PANCREAS_PATH,
                fill: 'cck',
                colorToken: 'cck',
                strokeWidth: 2,
              },
              { type: 'text', x: 0, y: 26, text: 'Pancreas', cls: 'organLabel', anchor: 'middle' },
            ],
          },
          {
            type: 'group',
            transform: 'translate(355, 115)',
            styleVars: { 'bicarb-intensity': bicarbIntensity, 'motility-intensity': motility },
            children: [
              {
                type: 'path',
                d: SMALL_INTESTINE_PATH,
                fill: 'secretin',
                colorToken: 'secretin',
                strokeWidth: 2,
              },
              { type: 'text', x: 0, y: 40, text: 'Small intestine', cls: 'organLabel', anchor: 'middle' },
            ],
          },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Meal fat', key: 'mealFatGrams', min: 0, max: 100, step: 5, unit: 'g' },
      { kind: 'slider', label: 'Meal protein', key: 'mealProteinGrams', min: 0, max: 100, step: 5, unit: 'g' },
      { kind: 'slider', label: 'Meal carbohydrate', key: 'mealCarbGrams', min: 0, max: 150, step: 5, unit: 'g' },
      { kind: 'slider', label: 'Meal volume', key: 'mealVolumeML', min: 0, max: 1000, step: 25, unit: 'mL' },
      { kind: 'slider', label: 'Vagal tone', key: 'vagalTone', min: 0, max: 200, step: 5, unit: '%' },
      { kind: 'slider', label: 'PPI dose', key: 'ppiDose', min: 0, max: 150, step: 5, unit: '%' },
      { kind: 'slider', label: 'H2 blocker dose', key: 'h2BlockerDose', min: 0, max: 150, step: 5, unit: '%' },
      { kind: 'slider', label: 'Autonomous gastrin', key: 'autonomousGastrinSecretion', min: 0, max: 100, step: 5 },
    ],
    readouts: [
      { label: 'Gastric pH', value: (c) => c.derived.gastricPH.toFixed(1), colorToken: 'gastrin' },
      { label: 'Duodenal pH', value: (c) => c.derived.duodenalPH.toFixed(1), colorToken: 'secretin' },
      { label: 'Acid output', value: (c) => c.derived.gastricAcidOutput.toFixed(0), unit: '%', colorToken: 'gastrin' },
      { label: 'Gastric volume', value: (c) => (c.derived.gastricVolumeFraction * 100).toFixed(0), unit: '%', colorToken: 'motility' },
      { label: 'Gastrin', value: (c) => (c.derived.gastrinDrive * 100).toFixed(0), unit: '%', colorToken: 'gastrin' },
      { label: 'Somatostatin', value: (c) => (c.derived.somatostatinDrive * 100).toFixed(0), unit: '%', colorToken: 'somatostatin' },
      { label: 'CCK', value: (c) => (c.derived.cckDrive * 100).toFixed(0), unit: '%', colorToken: 'cck' },
      { label: 'Secretin', value: (c) => (c.derived.secretinDrive * 100).toFixed(0), unit: '%', colorToken: 'secretin' },
      { label: 'GIP / GLP-1', value: (c) => (c.derived.gipGlp1Drive * 100).toFixed(0), unit: '%', colorToken: 'cck' },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Gastric pH',
        colorToken: 'gastrin',
        domainMin: 1,
        domainMax: 7,
        data: (points) => points.map((p) => p.gastricPH),
      },
      {
        kind: 'sparkline',
        label: 'Duodenal pH',
        colorToken: 'secretin',
        domainMin: 2,
        domainMax: 8,
        data: (points) => points.map((p) => p.duodenalPH),
      },
      {
        kind: 'sparkline',
        label: 'Gastrin',
        unit: '%',
        colorToken: 'gastrin',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.gastrinDrive * 100),
      },
    ],
  };
}
