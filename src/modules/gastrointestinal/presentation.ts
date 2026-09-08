import { clamp, scaleClamped } from '@/shared/lib/math';
import { pancreasScene, smallIntestineScene, stomachScene } from '@/shared/diagram/organShapes';
import { GASTRIC_PH } from './engine/constants';
import { motilityIntensity } from './engine/motility';
import type { GiDerived, GiHistoryPoint, GiInputs, GiState } from './engine/types';
import type { ModulePresentation, PresentationContext, SceneNode } from '@/shared/presentation/types';

/* The layout, in one place, because every path below is anchored to it.
 *
 * All three organs are FLIPPED where the shared builder draws them the other way round. The
 * stomach is a left-sided organ and the duodenum a right-sided one, so in an anterior view the
 * fundus is to the image right of the cardia and the duodenal C opens to the image right, with
 * the pancreatic head inside it and the tail running away towards the spleen. Drawn unflipped
 * the diagram would have said the opposite of all three.
 *
 * The pancreas goes down before the duodenum and the stomach, because it is behind both. */
const STOMACH = { x: 330, y: 118, flip: true, scale: 1.05 };
const INTESTINE = { x: 214, y: 178, flip: true, scale: 0.95 };
const PANCREAS = { x: 286, y: 196 };

/** Swallowed food arriving at the cardia. */
const OESOPHAGUS_FLOW = 'M376,28 C376,48 374,60 369,72';
/** Chyme leaving the pylorus and running down the descending duodenum. */
const EMPTYING_PATH = 'M280,144 C248,148 208,156 204,174';

/* The two gastric hormones act on the same cells from the same place, so their arrows are routed
 * on opposite sides of the stomach — drawn along the shortest path they lay on top of each other
 * and neither could be followed. */
const GASTRIN_PATH = 'M296,170 C320,214 380,196 390,152';
const SOMATOSTATIN_PATH = 'M296,138 C306,68 382,58 394,118';
/** CCK: duodenum to the pancreatic acini, the short way. */
const CCK_PATH = 'M246,206 C266,204 284,198 296,192';
/** Secretin: duodenum to the duct cells, routed below so it does not lie under CCK. */
const SECRETIN_PATH = 'M240,220 C258,256 316,250 334,216';

type Ctx = PresentationContext<GiState, GiDerived, GiInputs, GiHistoryPoint>;

export function buildGastrointestinalPresentation(ctx: Ctx): ModulePresentation<GiState, GiDerived, GiInputs, GiHistoryPoint> {
  const { derived } = ctx;
  // Higher acid intensity = lower pH (more acidic).
  const acidIntensity = clamp(scaleClamped(derived.gastricPH, GASTRIC_PH.MIN_PH, 6, 1, 0), 0, 1);
  const emptyingSpeed = derived.isFasting ? 0.05 : clamp(derived.gastricEmptyingRate / 100, 0.1, 2);
  const bicarbIntensity = clamp(derived.secretinDrive, 0, 1);
  const motility = motilityIntensity(derived.isFasting, derived.motilinPhase, (derived.gastricEmptyingRate / 100) * 0.006);

  const stomach = stomachScene(STOMACH, { acidIntensity });
  const intestine = smallIntestineScene(INTESTINE, { motility });
  const pancreas = pancreasScene(PANCREAS, {
    // This module has no insulin or glucagon in it: the pancreas is here as an exocrine gland,
    // so the islets stay small and constant and the DUCT carries secretin's bicarbonate.
    insulinLevel: 0.25,
    glucagonLevel: 0.25,
    bicarbIntensity,
    colorToken: 'cck',
    betaToken: 'cck',
    alphaToken: 'cck',
    ductToken: 'secretin',
  });

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [60, 6, 480, 300],
        ariaLabel:
          'Animated diagram of the stomach in anterior view — fundus, body, antrum and pylorus between the greater and lesser curvatures — emptying into the duodenal C-loop, with the head of the pancreas inside that loop and its duct running out to the tail, connected by the gastrin, somatostatin, CCK and secretin hormone pathways',
        defs: [
          { type: 'marker', id: 'gastrin-arrow', colorToken: 'gastrin' },
          { type: 'marker', id: 'somatostatin-arrow', colorToken: 'somatostatin' },
          { type: 'marker', id: 'cck-arrow', colorToken: 'cck' },
          { type: 'marker', id: 'secretin-arrow', colorToken: 'secretin' },
          ...pancreas.defs,
          ...intestine.defs,
          ...stomach.defs,
        ],
        children: [
          pancreas.node,
          intestine.node,
          stomach.node,
          {
            type: 'vessel',
            path: OESOPHAGUS_FLOW,
            speed: derived.gastricVolumeFraction > 0.9 ? 1 : 0.05,
            colorToken: 'motility',
          },
          { type: 'vessel', path: EMPTYING_PATH, speed: emptyingSpeed, colorToken: 'motility' },
          {
            type: 'axis',
            path: GASTRIN_PATH,
            activation: derived.gastrinDrive,
            colorToken: 'gastrin',
            label: 'Gastrin',
            labelX: 300,
            labelY: 240,
            markerId: 'gastrin-arrow',
          },
          {
            type: 'axis',
            path: SOMATOSTATIN_PATH,
            activation: derived.somatostatinDrive,
            colorToken: 'somatostatin',
            label: 'Somatostatin',
            labelX: 300,
            labelY: 54,
            markerId: 'somatostatin-arrow',
            inhibitory: true,
          },
          {
            type: 'axis',
            path: CCK_PATH,
            activation: derived.cckDrive,
            colorToken: 'cck',
            label: 'CCK',
            labelX: 306,
            labelY: 164,
            markerId: 'cck-arrow',
          },
          {
            type: 'axis',
            path: SECRETIN_PATH,
            activation: derived.secretinDrive,
            colorToken: 'secretin',
            label: 'Secretin',
            labelX: 254,
            labelY: 276,
            markerId: 'secretin-arrow',
          },
          { type: 'text', x: 406, y: 112, text: 'Stomach', cls: 'organLabel', anchor: 'start' },
          { type: 'path', d: 'M362,212 L346,196', cls: 'leader' },
          { type: 'text', x: 366, y: 216, text: 'Pancreas', cls: 'organLabel', anchor: 'start' },
          { type: 'path', d: 'M182,166 L198,170', cls: 'leader' },
          { type: 'text', x: 178, y: 164, text: 'Duodenum', cls: 'anatomy', anchor: 'end' },
          { type: 'text', x: 282, y: 262, text: 'Jejunum', cls: 'anatomy', anchor: 'start' },
        ] as SceneNode[],
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
