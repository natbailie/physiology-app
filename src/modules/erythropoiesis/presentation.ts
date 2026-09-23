import { clamp, scaleClamped } from '@/shared/lib/math';
import { kidneyScene } from '@/shared/diagram/organShapes';
import { HEMOGLOBIN, OXYGEN_DELIVERY, RETICULOCYTE, SUBSTRATE } from './engine/constants';
import type { ErythroDerived, ErythroHistoryPoint, ErythroInputs, ErythroState } from './engine/types';
import type { ModulePresentation, PresentationContext } from '@/shared/presentation/types';

const MARROW_PATH = 'M-34,-20 C-14,-30 16,-30 34,-20 C40,-4 40,10 34,22 C14,32 -14,32 -34,22 C-40,10 -40,-4 -34,-20 Z';
const BLOOD_VESSEL_PATH = 'M78,240 L296,240';
const EPO_PATH = 'M330,150 C270,168 200,168 148,152';
const OXYGEN_FEEDBACK_PATH = 'M150,236 C226,266 314,232 348,196';

const CELL_POSITIONS = [
  { cx: 96, cy: 236 },
  { cx: 140, cy: 244 },
  { cx: 184, cy: 240 },
  { cx: 228, cy: 246 },
  { cx: 272, cy: 240 },
] as const;

type Ctx = PresentationContext<ErythroState, ErythroDerived, ErythroInputs, ErythroHistoryPoint>;

function mcvLabel(mcv: number): string {
  if (mcv < 80) return 'microcytic';
  if (mcv > 100) return 'macrocytic';
  return 'normocytic';
}

export function buildErythropoiesisPresentation(ctx: Ctx): ModulePresentation<ErythroState, ErythroDerived, ErythroInputs, ErythroHistoryPoint> {
  const { derived } = ctx;

  const epoLevel = clamp(derived.epoLevel, 0, 1);
  const renalFunction = clamp(derived.renalFunction, 0, 1);
  const marrowOutput = clamp(derived.marrowOutput, 0, 1);
  const marrowFunction = clamp(derived.marrowFunction, 0, 1);
  const hbLevel = clamp(derived.hemoglobinGDl / HEMOGLOBIN.NORMAL_G_DL, 0.15, 1.4);
  const cellRadius = scaleClamped(derived.mcv, SUBSTRATE.MIN_MCV_FL, SUBSTRATE.MAX_MCV_FL, 5, 12);
  // Kidney size tracks renal function, so CKD reads as a shrunken kidney at a glance.
  const kidneyScale = 0.55 + renalFunction * 0.45;
  const normalDO2 = HEMOGLOBIN.NORMAL_G_DL * OXYGEN_DELIVERY.O2_CARRYING_CAPACITY_ML_PER_G * OXYGEN_DELIVERY.NORMAL_SAO2 * OXYGEN_DELIVERY.CARDIAC_OUTPUT_DL_PER_MIN;
  const flowSpeed = clamp(derived.oxygenDeliveryMlPerMin / normalDO2, 0.1, 2);

  const hypoproliferative = derived.isHypoproliferative;

  /* A sectioned kidney rather than the first-generation blob: capsule, cortex, the six medullary
   * pyramids, the calyces and pelvis, and the renal vessels. This module is ABOUT the kidney as
   * an oxygen sensor, and the peritubular fibroblasts that make EPO sit in the cortex — which the
   * blob had no way to show. The cortical wash carries renal function, so chronic kidney disease
   * reads as a pale cortex as well as a small organ. */
  const kidney = kidneyScene(
    { x: 372, y: 132, scale: kidneyScale },
    { gfrIntensity: renalFunction, colorToken: 'kidney', medullaToken: 'epo' },
  );

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 480, 300],
        ariaLabel:
          'Diagram of erythropoiesis: the kidney sensing tissue oxygen and releasing erythropoietin, the bone marrow producing red cells, and those cells carrying oxygen back to the tissues',
        defs: [{ type: 'marker', id: 'epo-arrow', colorToken: 'epo' }, ...kidney.defs],
        children: [
          // Kidney: the oxygen sensor and EPO source. Scaled by renal function so CKD
          // reads as a shrunken, dim organ.
          kidney.node,
          {
            type: 'group',
            transform: 'translate(372,132)',
            children: [
              { type: 'text', x: 0, y: 62, text: 'Kidney', cls: 'organLabel', anchor: 'middle' },
              { type: 'text', x: 0, y: 76, text: 'O2 sensor', cls: 'pathLabel', anchor: 'middle' },
            ],
          },
          {
            type: 'axis',
            path: EPO_PATH,
            activation: epoLevel,
            colorToken: 'epo',
            label: 'EPO',
            labelX: 236,
            labelY: 142,
            markerId: 'epo-arrow',
          },
          // Bone marrow: where the signal is answered — or is not. The filled density
          // tracks marrow output; the faint outline is the cavity that empties in aplasia.
          {
            type: 'group',
            transform: 'translate(96,120)',
            children: [
              /* Density IS output: a marrow working flat out is dense, an aplastic one is an
                 empty cavity with an outline. That was carried by `--marrow-output` alone, a
                 custom property no renderer without a cascade reads, so the phone drew every
                 marrow — failing, normal or driven — as the same solid brown block. */
              { type: 'path', d: MARROW_PATH, fill: 'marrow', fillOpacity: 0.12 + marrowOutput * 0.62, colorToken: 'marrow', strokeWidth: 2 },
              { type: 'path', d: MARROW_PATH, fill: 'none', colorToken: 'text-faint', strokeWidth: 1.5, opacity: 1 - marrowFunction * 0.6 },
              { type: 'text', x: 0, y: 52, text: 'Marrow', cls: 'organLabel', anchor: 'middle' },
            ],
          },
          // Circulating red cells inside the vessel: radius tracks MCV so micro- and
          // macrocytosis are directly visible rather than only reported as a number.
          { type: 'vessel', path: BLOOD_VESSEL_PATH, speed: flowSpeed, colorToken: 'hemoglobin' },
          {
            type: 'group',
            children: CELL_POSITIONS.map((p) => ({
              type: 'circle' as const,
              cx: p.cx,
              cy: p.cy,
              r: cellRadius,
              /* Colour IS the haemoglobin concentration; radius is the MCV. A pale cell and a
                 full one were identical while `--hb-level` carried it, which is the one thing an
                 anaemia diagram has to show. */
              fill: 'hemoglobin',
              fillOpacity: clamp(0.2 + hbLevel * 0.68, 0.2, 1),
            })),
          },
          { type: 'text', x: 78, y: 270, text: `MCV ${derived.mcv.toFixed(0)} fL`, cls: 'pathLabel' },
          {
            type: 'axis',
            path: OXYGEN_FEEDBACK_PATH,
            activation: clamp(1 - derived.tissueHypoxia, 0, 1),
            colorToken: 'o2',
            label: 'O2 delivery',
            labelX: 210,
            labelY: 288,
            markerId: 'epo-arrow',
            inhibitory: true,
          },
          { type: 'text', x: 22, y: 38, text: derived.anemiaClassification, colorToken: 'hemoglobin' },
          { type: 'text', x: 22, y: 56, text: `Hb ${derived.hemoglobinGDl.toFixed(1)} g/dL · Hct ${derived.hematocritPercent.toFixed(0)}%`, cls: 'valueLabel' },
          { type: 'text', x: 22, y: 72, text: `EPO ${(derived.epoLevel * 100).toFixed(0)}% · retic index ${derived.reticulocyteIndex.toFixed(2)}`, cls: 'valueLabel' },
          {
            type: 'text',
            x: 22,
            y: 90,
            text: hypoproliferative ? 'Marrow response inadequate' : 'Marrow response adequate',
            colorToken: hypoproliferative ? 'warn' : 'ok',
          },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Renal function', key: 'renalFunction', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Marrow function', key: 'marrowFunction', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Inspired oxygen', key: 'inspiredOxygen', min: 40, max: 150, step: 1, unit: '%' },
      { kind: 'slider', label: 'Iron availability', key: 'ironAvailability', min: 0, max: 150, step: 1, unit: '%' },
      { kind: 'slider', label: 'B12 / folate', key: 'b12FolateStatus', min: 0, max: 150, step: 1, unit: '%' },
      { kind: 'slider', label: 'Chronic blood loss', key: 'bloodLossRate', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Hemolysis', key: 'hemolysisRate', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Inflammation (IL-6)', key: 'inflammationLevelPct', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Liver synthetic function', key: 'liverSyntheticFunctionPct', min: 0, max: 100, step: 2, unit: '%' },
      { kind: 'slider', label: 'Erythropoietic drive', key: 'erythropoieticDriveMultiplier', min: 0.5, max: 3, step: 0.1, unit: '%' },
      { kind: 'slider', label: 'Iron sensing (HFE)', key: 'ironSensingIntegrityPct', min: 0, max: 100, step: 2, unit: '%' },
    ],
    readouts: [
      {
        label: 'Hemoglobin',
        value: (c) => c.derived.hemoglobinGDl.toFixed(1),
        unit: 'g/dL',
        secondary: (c) => c.derived.anemiaClassification,
        colorToken: 'hemoglobin',
      },
      { label: 'Hematocrit', value: (c) => c.derived.hematocritPercent.toFixed(0), unit: '%', colorToken: 'hemoglobin' },
      { label: 'MCV', value: (c) => c.derived.mcv.toFixed(0), unit: 'fL', secondary: (c) => mcvLabel(c.derived.mcv), colorToken: 'iron' },
      {
        label: 'Retic index',
        value: (c) => c.derived.reticulocyteIndex.toFixed(2),
        secondary: (c) =>
          c.derived.isHypoproliferative
            ? 'hypoproliferative'
            : c.derived.reticulocyteIndex >= RETICULOCYTE.ADEQUATE_RESPONSE_THRESHOLD
              ? 'adequate response'
              : 'normal',
        colorToken: hypoproliferative ? 'warn' : 'ok',
      },
      {
        label: 'EPO',
        value: (c) => (c.derived.epoLevel * 100).toFixed(0),
        unit: '%',
        secondary: (c) => (c.derived.epoLevel < 0.25 && c.derived.hemoglobinGDl < 12 ? 'inappropriately low' : undefined),
        colorToken: 'epo',
      },
      { label: 'Marrow output', value: (c) => (c.derived.marrowOutput * 100).toFixed(0), unit: '%', colorToken: 'marrow' },
      {
        label: 'Ferritin',
        value: (c) => c.derived.ferritinNgMl.toFixed(0),
        unit: 'ng/mL',
        secondary: (c) => (c.derived.ferritinNgMl < 30 ? 'depleted' : c.derived.inflammationLevelPct > 20 ? 'acute-phase veil' : undefined),
        colorToken: 'iron',
      },
      {
        label: 'Hepcidin',
        value: (c) => (c.derived.hepcidinFraction * 100).toFixed(0),
        unit: '%',
        secondary: (c) =>
          c.derived.hepcidinFraction > 2.5
            ? 'ferroportin shut — iron locked away'
            : c.derived.hepcidinFraction < 0.4
              ? 'export door wide open'
              : undefined,
        colorToken: 'liver',
      },
      {
        label: 'Transferrin saturation',
        value: (c) => c.derived.transferrinSaturationPct.toFixed(0),
        unit: '%',
        secondary: (c) =>
          c.derived.transferrinSaturationPct < 16
            ? 'deficient range'
            : c.derived.transferrinSaturationPct > 45
              ? 'overload range'
              : 'normal range',
        colorToken: derived.transferrinSaturationPct < 16 || derived.transferrinSaturationPct > 45 ? 'danger' : 'text',
      },
      {
        label: 'Serum iron / TIBC',
        value: (c) => `${c.derived.serumIronUgDl.toFixed(0)}/${c.derived.tibcUgDl.toFixed(0)}`,
        unit: 'µg/dL',
        colorToken: 'text',
      },
      { label: 'O2 delivery', value: (c) => (c.derived.oxygenDeliveryMlPerMin / 100).toFixed(1), unit: '×100 mL/min', colorToken: 'o2' },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Hemoglobin',
        unit: 'g/dL',
        colorToken: 'hemoglobin',
        domainMin: 3,
        domainMax: 22,
        data: (points) => points.map((p) => p.hemoglobin),
      },
      {
        kind: 'sparkline',
        label: 'EPO',
        unit: '%',
        colorToken: 'epo',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.epo * 100),
      },
      {
        kind: 'sparkline',
        label: 'Retic index',
        colorToken: 'marrow',
        domainMin: 0,
        domainMax: 6,
        data: (points) => points.map((p) => p.reticulocyteIndex),
      },
    ],
  };
}
