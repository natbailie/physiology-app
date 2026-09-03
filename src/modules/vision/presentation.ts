import { AQUEOUS, PUPIL } from './engine/constants';
import type { EyeFieldSectors, FieldLesionSite, VisionDerived, VisionHistoryPoint, VisionInputs, VisionInternalState } from './engine/types';
import type { FrameNode, SceneNode } from '@/shared/presentation/types';
import type { ModulePresentation, PresentationContext } from '@/shared/presentation/types';

type Ctx = PresentationContext<VisionInternalState, VisionDerived, VisionInputs, VisionHistoryPoint>;

/** Where each lesion the engine models actually sits on the pathway. Marking the site is the
 * point of the redraw: the field defect is a consequence of position, not a separate fact. */
const LESION_AT: Record<FieldLesionSite, { x: number; y: number; label: string } | null> = {
  none: null,
  rightOpticNerve: { x: 168, y: 322, label: 'optic nerve' },
  leftOpticNerve: { x: 392, y: 322, label: 'optic nerve' },
  chiasmalCentre: { x: 280, y: 280, label: 'chiasm' },
  rightOpticTract: { x: 216, y: 242, label: 'optic tract' },
  leftOpticTract: { x: 344, y: 242, label: 'optic tract' },
  rightTemporalRadiation: { x: 146, y: 198, label: "Meyer's loop" },
  leftTemporalRadiation: { x: 414, y: 198, label: "Meyer's loop" },
  rightParietalRadiation: { x: 207, y: 134, label: 'parietal radiation' },
  leftParietalRadiation: { x: 353, y: 134, label: 'parietal radiation' },
  rightOccipitalLobe: { x: 200, y: 76, label: 'occipital lobe' },
  leftOccipitalLobe: { x: 360, y: 76, label: 'occipital lobe' },
};

const QUAD = 30;

/** One eye's field, quadrant by quadrant, drawn as the patient sees it — so the temporal half
 * faces outward and a pair of charts mirror one another. Temporal is on the LEFT for the right
 * eye and on the RIGHT for the left eye. */
function fieldChart(
  x: number,
  y: number,
  sectors: EyeFieldSectors,
  temporalOnLeft: boolean,
  title: string,
): SceneNode[] {
  const outerX = x + (temporalOnLeft ? 0 : QUAD);
  const innerX = x + (temporalOnLeft ? QUAD : 0);
  const keptCls = (kept: number) => (kept > 0.5 ? 'fieldQuadKept' : 'fieldQuadLost');
  return [
    { type: 'text', x: x + QUAD, y: y - 8, text: title, cls: 'anatomy', anchor: 'middle' as const },
    { type: 'rect', x: outerX, y, width: QUAD, height: QUAD, cls: keptCls(sectors.superiorTemporal) },
    { type: 'rect', x: outerX, y: y + QUAD, width: QUAD, height: QUAD, cls: keptCls(sectors.inferiorTemporal) },
    { type: 'rect', x: innerX, y, width: QUAD, height: QUAD, cls: keptCls(sectors.superiorNasal) },
    { type: 'rect', x: innerX, y: y + QUAD, width: QUAD, height: QUAD, cls: keptCls(sectors.inferiorNasal) },
    { type: 'line', x1: x, y1: y, x2: x, y2: y + QUAD * 2, cls: 'fieldFrame' },
    { type: 'line', x1: x + QUAD, y1: y, x2: x + QUAD, y2: y + QUAD * 2, cls: 'fieldFrame' },
    { type: 'line', x1: x, y1: y, x2: x + QUAD * 2, y2: y, cls: 'fieldFrame' },
    { type: 'line', x1: x, y1: y + QUAD, x2: x + QUAD * 2, y2: y + QUAD, cls: 'fieldFrame' },
    { type: 'line', x1: x, y1: y + QUAD * 2, x2: x + QUAD * 2, y2: y + QUAD * 2, cls: 'fieldFrame' },
    { type: 'text', x: outerX + 4, y: y + 11, text: 'T', cls: 'fieldLetter' },
    { type: 'text', x: innerX + 4, y: y + 11, text: 'N', cls: 'fieldLetter' },
  ];
}

/** An ellipse drawn as a path — the schema has no ellipse primitive. */
function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx - rx},${cy} a ${rx},${ry} 0 1,0 ${2 * rx},0 a ${rx},${ry} 0 1,0 ${-2 * rx},0`;
}

/** A circle drawn as a path, for outlines that need a stroke of a given width. */
function circlePath(cx: number, cy: number, r: number): string {
  return `M ${cx},${cy - r} a ${r},${r} 0 1,0 ${2 * r},0 a ${r},${r} 0 1,0 ${-2 * r},0`;
}

export function buildVisionPresentation(ctx: Ctx): ModulePresentation<VisionInternalState, VisionDerived, VisionInputs, VisionHistoryPoint> {
  const { derived } = ctx;

  const pupilR = derived.pupilRightMm * 2.6;
  const pupilL = derived.pupilLeftMm * 2.6;
  const lesion = LESION_AT[derived.fieldLesionSite];

  const torchRight = derived.directReflexRightScore > 2;
  const torchLeft = derived.directReflexLeftScore > 2;

  const alarmText =
    derived.intraocularPressureMmHg >= AQUEOUS.CRISIS_IOP_MMHG
      ? `acute angle closure — IOP ${derived.intraocularPressureMmHg.toFixed(0)}`
      : derived.intraocularPressureMmHg >= AQUEOUS.GLAUCOMA_IOP_MMHG
        ? `raised pressure — IOP ${derived.intraocularPressureMmHg.toFixed(0)}`
        : derived.rapdPositive
          ? 'swinging-torch positive — afferent defect'
          : derived.anisocoriaMm > 1.5
            ? `anisocoria ${derived.anisocoriaMm.toFixed(1)} mm — efferent`
            : 'night blindness — rods cannot carry it';

  const showAlarm =
    derived.intraocularPressureMmHg >= AQUEOUS.GLAUCOMA_IOP_MMHG ||
    derived.rapdPositive ||
    derived.anisocoriaMm > 1.5 ||
    derived.nightBlindness;

  const sceneChildren: SceneNode[] = [
    ...fieldChart(20, 34, derived.fieldSectors.rightEye, true, 'Right eye'),
          ...fieldChart(480, 34, derived.fieldSectors.leftEye, false, 'Left eye'),

          // ---- Occipital cortex ----
          { type: 'rect', x: 150, y: 58, width: 100, height: 34, cls: 'cortex' },
          { type: 'rect', x: 310, y: 58, width: 100, height: 34, cls: 'cortex' },
          { type: 'text', x: 280, y: 40, text: 'Occipital cortex', cls: 'anatomy', anchor: 'middle' as const },
          { type: 'text', x: 200, y: 80, text: 'right', cls: 'sideTick', anchor: 'middle' as const },
          { type: 'text', x: 360, y: 80, text: 'left', cls: 'sideTick', anchor: 'middle' as const },

          // ---- Optic radiations: two bundles, and Meyer's loop swings forward ----
          { type: 'path', d: 'M 204 178 C 208 150, 208 120, 206 94', cls: 'fibreLeftField' },
          { type: 'path', d: 'M 188 180 C 156 186, 142 214, 148 176 C 154 138, 168 112, 180 94', cls: 'fibreLeftField' },
          { type: 'path', d: 'M 356 178 C 352 150, 352 120, 354 94', cls: 'fibreRightField' },
          { type: 'path', d: 'M 372 180 C 404 186, 418 214, 412 176 C 406 138, 392 112, 380 94', cls: 'fibreRightField' },
          { type: 'text', x: 126, y: 214, text: "Meyer's loop", cls: 'anatomy', anchor: 'middle' as const },

          // ---- Lateral geniculate nuclei ----
          { type: 'path', d: ellipsePath(198, 190, 19, 12), cls: 'lgn' },
          { type: 'path', d: ellipsePath(362, 190, 19, 12), cls: 'lgn' },
          { type: 'text', x: 198, y: 193, text: 'LGN', cls: 'sideTick', anchor: 'middle' as const },
          { type: 'text', x: 362, y: 193, text: 'LGN', cls: 'sideTick', anchor: 'middle' as const },

          // ---- Nerves, chiasm and tracts. Colour is the hemifield the fibres carry, so the
          //       chiasm is visibly a sorting office rather than a junction. ----
          { type: 'path', d: 'M 152 348 C 176 320, 224 300, 252 284 C 228 258, 206 228, 199 203', cls: 'fibreLeftField' },
          { type: 'path', d: 'M 200 348 C 214 326, 244 300, 266 286 C 300 272, 340 232, 358 205', cls: 'fibreRightField' },
          { type: 'path', d: 'M 408 348 C 384 320, 336 300, 308 284 C 332 258, 354 228, 361 203', cls: 'fibreRightField' },
          { type: 'path', d: 'M 360 348 C 346 326, 316 300, 294 286 C 260 272, 220 232, 202 205', cls: 'fibreLeftField' },

          { type: 'path', d: ellipsePath(280, 284, 34, 17), cls: 'chiasm' },
          { type: 'text', x: 280, y: 312, text: 'Optic chiasm', cls: 'anatomy', anchor: 'middle' as const },

          // ---- The eyes, with their live pupils ----
          { type: 'path', d: circlePath(176, 366, 30), cls: 'eyeOutline' },
          { type: 'path', d: circlePath(384, 366, 30), cls: 'eyeOutline' },
          { type: 'circle', cx: 176, cy: 366, r: Math.max(pupilR + 5, 11), cls: 'iris' },
          { type: 'circle', cx: 384, cy: 366, r: Math.max(pupilL + 5, 11), cls: 'iris' },
          { type: 'circle', cx: 176, cy: 366, r: pupilR, cls: 'pupil' },
          { type: 'circle', cx: 384, cy: 366, r: pupilL, cls: 'pupil' },
          { type: 'text', x: 176, y: 410, text: `R ${derived.pupilRightMm.toFixed(1)} mm`, cls: 'sideTick', anchor: 'middle' as const },
          { type: 'text', x: 384, y: 410, text: `L ${derived.pupilLeftMm.toFixed(1)} mm`, cls: 'sideTick', anchor: 'middle' as const },

          // Torch beams, when the swinging-torch test is running.
          ...(torchRight ? [{ type: 'line' as const, x1: 104, y1: 420, x2: 158, y2: 382, cls: 'torchBeam' }] : []),
          ...(torchLeft ? [{ type: 'line' as const, x1: 456, y1: 420, x2: 402, y2: 382, cls: 'torchBeam' }] : []),

          // ---- The lesion, drawn where it is ----
          ...(lesion
            ? [
                {
                  type: 'group' as const,
                  children: [
                    { type: 'line' as const, x1: lesion.x - 11, y1: lesion.y - 11, x2: lesion.x + 11, y2: lesion.y + 11, cls: 'lesionMark' },
                    { type: 'line' as const, x1: lesion.x + 11, y1: lesion.y - 11, x2: lesion.x - 11, y2: lesion.y + 11, cls: 'lesionMark' },
                    { type: 'text' as const, x: lesion.x, y: lesion.y - 17, text: lesion.label, cls: 'lesionLabel', anchor: 'middle' as const },
                  ],
                },
              ]
            : []),

          // ---- Colour key. The hemifield coding is load-bearing, so it is named. ----
          {
            type: 'group',
            transform: 'translate(20, 168)',
            children: [
              { type: 'line', x1: 0, y1: 0, x2: 22, y2: 0, cls: 'fibreLeftField' },
              { type: 'text', x: 28, y: 4, text: 'left field', cls: 'sideTick' },
              { type: 'line', x1: 0, y1: 16, x2: 22, y2: 16, cls: 'fibreRightField' },
              { type: 'text', x: 28, y: 20, text: 'right field', cls: 'sideTick' },
            ],
          },

          // ---- Readouts ----
          { type: 'text', x: 20, y: 286, text: derived.fieldDefectLabel, cls: 'caption' },
          {
            type: 'text',
            x: 20,
            y: 430,
            text: `acuity ${derived.acuityLabel} · IOP ${derived.intraocularPressureMmHg.toFixed(0)} mmHg · rod ${(derived.rodDrive * 100).toFixed(0)}% · cone ${(derived.coneDrive * 100).toFixed(0)}%`,
            cls: 'caption',
          },

          ...(showAlarm
            ? [{ type: 'text' as const, x: 440, y: 286, text: alarmText, cls: 'alarm', anchor: 'end' as const }]
            : []),

          {
            type: 'text',
            x: 20,
            y: 126,
            text: derived.classification,
            cls: 'verdict',
            styleVars: { 'font-size': 13, 'letter-spacing': 0.04 },
          },
    ];
    const scene: FrameNode = {
      type: 'frame',
      key: 'vision-pathway',
      viewBox: [0, 0, 560, 440],
      ariaLabel:
        'The visual pathway from both retinas through the optic chiasm, tracts, lateral geniculate nuclei and optic radiations to the occipital cortex, with the lesion marked at its site and the resulting field defect in each eye',
      children: sceneChildren,
    };
    return {
      diagram: [scene],
      controls: [
      { kind: 'slider', label: 'Scene luminance', key: 'sceneLuminanceLogCd', min: -5, max: 4, step: 0.5, unit: ' log cd/m²' },
      { kind: 'slider', label: 'Rod integrity', key: 'rodIntegrity', min: 0, max: 1, step: 0.02, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Foveal cone integrity', key: 'coneIntegrity', min: 0, max: 1, step: 0.02, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Left optic nerve (afferent)', key: 'leftOpticNerveAfferent', min: 0, max: 1, step: 0.02, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Right pupil efferent', key: 'rightPupilEfferentGain', min: 0, max: 1, step: 0.02, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Fixation distance', key: 'targetDistanceMetres', min: 0.12, max: 6, step: 0.02, unit: ' m' },
      { kind: 'slider', label: 'Lens amplitude', key: 'maximumAccommodationD', min: 0, max: 12, step: 0.5, unit: ' D' },
      { kind: 'slider', label: 'Aqueous production', key: 'aqueousProductionRate', min: 0, max: 2, step: 0.05 },
      { kind: 'slider', label: 'Meshwork outflow', key: 'trabecularOutflowFacility', min: 0, max: 1.5, step: 0.02, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Angle width', key: 'angleWidthPct', min: 0, max: 100, step: 2, unit: '%' },
      { kind: 'slider', label: 'Pilocarpine', key: 'pilocarpineDosePct', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Acetazolamide', key: 'acetazolamideDosePct', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Mydriatic', key: 'mydriaticDosePct', min: 0, max: 100, step: 5, unit: '%' },
      {
        kind: 'toggle',
        label: 'Pathway lesion',
        key: 'fieldLesionSite',
        colorToken: 'retina',
        options: [
          { value: 'none', label: 'None' },
          { value: 'leftOpticNerve', label: 'L nerve' },
          { value: 'rightOpticNerve', label: 'R nerve' },
          { value: 'chiasmalCentre', label: 'Chiasm' },
          { value: 'leftOpticTract', label: 'L tract' },
          { value: 'rightOpticTract', label: 'R tract' },
          { value: 'leftTemporalRadiation', label: "L Meyer's" },
          { value: 'rightTemporalRadiation', label: "R Meyer's" },
          { value: 'leftParietalRadiation', label: 'L parietal' },
          { value: 'rightParietalRadiation', label: 'R parietal' },
          { value: 'leftOccipitalLobe', label: 'L occipital' },
          { value: 'rightOccipitalLobe', label: 'R occipital' },
        ],
      },
    ],
    readouts: [
      {
        label: 'Acuity',
        value: (c) => c.derived.acuityLabel,
        secondary: (c) => (c.derived.acuityDenominator > 12 ? 'resolution lost' : 'foveal cones reading'),
        colorToken: 'retina',
      },
      {
        label: 'Right pupil',
        value: (c) => c.derived.pupilRightMm.toFixed(1),
        unit: 'mm',
        secondary: (c) =>
          c.derived.pupilRightMm > PUPIL.DARK_MM - 1
            ? 'dilated'
            : c.derived.pupilRightMm < PUPIL.CONSTRICTED_MM + 1
              ? 'constricted'
              : 'mid-position',
        colorToken: 'artery',
      },
      {
        label: 'Left pupil',
        value: (c) => c.derived.pupilLeftMm.toFixed(1),
        unit: 'mm',
        secondary: (c) => (c.derived.anisocoriaMm > 1.5 ? 'unequal pair' : 'equal pair'),
        colorToken: 'artery',
      },
      {
        label: 'Anisocoria',
        value: (c) => c.derived.anisocoriaMm.toFixed(1),
        unit: 'mm',
        secondary: (c) => (c.derived.anisocoriaMm > 1.5 ? 'efferent side suspect' : 'within normal'),
        colorToken: 'danger',
      },
      {
        label: 'Perceived brightness',
        value: (c) => c.derived.perceivedBrightness.toFixed(0),
        unit: '%',
        secondary: (c) =>
          `${c.derived.regime} scene at ${c.derived.effectiveLuminanceLogCd >= 0 ? '+' : ''}${c.derived.effectiveLuminanceLogCd.toFixed(1)} log cd/m²`,
        colorToken: 'o2',
      },
      {
        label: 'Glutamate release',
        value: (c) => (c.derived.glutamateRelease * 100).toFixed(0),
        unit: '%',
        secondary: (c) =>
          c.derived.glutamateRelease > 0.7 ? 'dark — receptors depolarised' : 'light — receptors hyperpolarised',
        colorToken: 'vm',
      },
      {
        label: 'Rod drive',
        value: (c) => (c.derived.rodDrive * 100).toFixed(0),
        unit: '%',
        secondary: (c) => (c.derived.rodDrive > 0.5 ? 'rods carrying vision' : 'rods saturated or lost'),
        colorToken: 'vm',
      },
      {
        label: 'Cone drive',
        value: (c) => (c.derived.coneDrive * 100).toFixed(0),
        unit: '%',
        secondary: (c) => (c.derived.coneDrive > 0.5 ? 'cones carrying vision' : 'below cone threshold'),
        colorToken: 'o2',
      },
      {
        label: 'Swinging torch',
        value: (c) => Math.min(c.derived.directReflexRightScore, c.derived.directReflexLeftScore).toFixed(0),
        unit: '%',
        secondary: (c) => (c.derived.rapdPositive ? 'RAPD — weaker from left eye' : 'direct = consensual'),
        colorToken: 'danger',
      },
      {
        label: 'Intraocular pressure',
        value: (c) => c.derived.intraocularPressureMmHg.toFixed(0),
        unit: 'mmHg',
        secondary: (c) =>
          c.derived.intraocularPressureMmHg >= AQUEOUS.CRISIS_IOP_MMHG
            ? 'crisis — painful red eye'
            : c.derived.intraocularPressureMmHg >= AQUEOUS.GLAUCOMA_IOP_MMHG
              ? 'raised — glaucoma range'
              : 'normal range',
        colorToken: derived.intraocularPressureMmHg >= AQUEOUS.GLAUCOMA_IOP_MMHG ? 'danger' : 'text',
      },
      {
        label: 'Angle closure',
        value: (c) => (c.derived.angleClosureFraction * 100).toFixed(0),
        unit: '%',
        secondary: (c) =>
          c.derived.angleClosureFraction > 0.5
            ? 'iris in the meshwork'
            : c.derived.angleClosureFraction > 0.05
              ? 'narrow, threatened'
              : 'angle open',
        colorToken: 'danger',
      },
      {
        label: 'Accommodation',
        value: (c) => `×${c.derived.accommodativeResponseD.toFixed(1)}`,
        unit: 'D',
        secondary: (c) =>
          c.derived.blurActive
            ? `blurred — ${c.derived.accommodationDeficitD.toFixed(1)} D short`
            : `demand ${c.derived.accommodationDemandD.toFixed(1)} D met`,
        colorToken: derived.blurActive ? 'danger' : 'text',
      },
      {
        label: 'Near point',
        value: (c) => c.derived.nearPointCm.toFixed(0),
        unit: 'cm',
        secondary: (c) => `convergence ${c.derived.convergenceDemandPrismD.toFixed(0)} Δ`,
        colorToken: 'text',
      },
      {
        label: 'Visual fields',
        value: (c) => c.derived.fieldDefectLabel,
        secondary: (c) => (c.derived.maculaSpared ? 'central vision spared' : undefined),
        colorToken: derived.fieldDefectLabel === 'no field defect' ? 'text' : 'danger',
      },
      {
        label: 'State',
        value: (c) => c.derived.classification,
        secondary: (c) => c.derived.patternSummary,
        colorToken: 'text',
        wide: true,
        revealsPattern: true,
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Perceived brightness',
        unit: '%',
        colorToken: 'o2',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.brightness),
      },
      {
        kind: 'sparkline',
        label: 'Right pupil',
        unit: 'mm',
        colorToken: 'artery',
        domainMin: 2,
        domainMax: 8,
        data: (points) => points.map((p) => p.pupilR),
      },
      {
        kind: 'sparkline',
        label: 'Rod pigment bleached',
        unit: '%',
        colorToken: 'danger',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.bleached),
      },
    ],
  };
}
