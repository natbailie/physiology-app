import { clamp } from '@/shared/lib/math';
import { MASS, PROLACTIN_AXIS } from './engine/constants';
import type { PituitaryDerived, PituitaryHistoryPoint, PituitaryInputs, PituitaryInternalState } from './engine/types';
import { LABEL_WASH } from '@/shared/presentation/types';
import type { ModulePresentation, PresentationContext } from '@/shared/presentation/types';

type Ctx = PresentationContext<PituitaryInternalState, PituitaryDerived, PituitaryInputs, PituitaryHistoryPoint>;

const GLAND = { cx: 250, cy: 218 };
const SELLA = { left: 168, right: 332, top: 178, floor: 262 };
const LEGEND = { x: 416, top: 132, pitch: 24 };

const CELLS = [
  { key: 'somatotroph', colorToken: 'pituitary', x: 202, y: 202 },
  { key: 'lactotroph', colorToken: 'estrogen', x: 250, y: 202 },
  { key: 'thyrotroph', colorToken: 'tsh', x: 298, y: 202 },
  { key: 'corticotroph', colorToken: 'acth', x: 206, y: 242 },
  { key: 'gonadotroph', colorToken: 'lh', x: 294, y: 242 },
] as const;

const LEGEND_ITEMS: ReadonlyArray<{ colorToken: string; name: string }> = [
  { colorToken: 'pituitary', name: 'Somatotroph · GH' },
  { colorToken: 'estrogen', name: 'Lactotroph · Prolactin' },
  { colorToken: 'tsh', name: 'Thyrotroph · TSH' },
  { colorToken: 'acth', name: 'Corticotroph · ACTH' },
  { colorToken: 'lh', name: 'Gonadotroph · LH / FSH' },
];

function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0 Z`;
}

function roundedRect(x: number, y: number, width: number, height: number, rx: number): string {
  return `M ${x + rx} ${y} h ${width - rx * 2} a ${rx} ${rx} 0 0 1 ${rx} ${rx} v ${height - rx * 2} a ${rx} ${rx} 0 0 1 ${-rx} ${rx} h ${-width + rx * 2} a ${rx} ${rx} 0 0 1 ${-rx} ${-rx} v ${-height + rx * 2} a ${rx} ${rx} 0 0 1 ${rx} ${-rx} Z`;
}

export function buildAnteriorPituitaryPresentation(ctx: Ctx): ModulePresentation<PituitaryInternalState, PituitaryDerived, PituitaryInputs, PituitaryHistoryPoint> {
  const { derived } = ctx;

  const massFraction = clamp(derived.totalMassCc / 15, 0, 1);
  const massRx = 12 + massFraction * 62;
  const massRy = 9 + massFraction * 44;
  const massCy = GLAND.cy - massFraction * 26;

  const components = [
    { cc: derived.ghAdenomaCc, colorToken: 'pituitary', label: 'somatotroph adenoma' as const },
    { cc: derived.prlAdenomaCc, colorToken: 'estrogen', label: 'lactotroph adenoma' as const },
    { cc: derived.nonfunctioningCc, colorToken: 'text-faint', label: 'non-functioning mass' as const },
  ];
  const dominant = components.reduce((a, b) => (b.cc > a.cc ? b : a));
  const hasMass = derived.totalMassCc > 0.05;

  const stalk = clamp(derived.stalkCompressionFraction / MASS.MAX_STALK_COMPRESSION_FRACTION, 0, 1);
  const waist = 26 - stalk * 19;
  const dopamineFlow = clamp(derived.effectiveDopamineFraction, 0, 1);
  const trhFlow = clamp(derived.trhStimulusUnits / 100, 0, 1);
  const d2Block = clamp(derived.d2ReceptorBlockPct / 100, 0, 1);
  const loss = clamp(derived.visualFieldDefectPct / 100, 0, 1);
  const chiasmLift = loss * 11;

  const crowding = (colorToken: string) =>
    hasMass && colorToken !== dominant.colorToken ? clamp(1 - massFraction * 0.85, 0.15, 1) : 1;

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 580, 400],
        ariaLabel:
          'Coronal section of the sella: hypothalamus, stalk, anterior pituitary cell lines, sellar mass and optic chiasm',
        defs: [
          { type: 'marker', id: 'pitExcite', colorToken: 'tsh' },
          { type: 'marker', id: 'pitInhibit', colorToken: 'basal-ganglia' },
        ],
        children: [
          // --- Hypothalamus and the stalk ---
          {
            type: 'path',
            d: roundedRect(158, 30, 184, 34, 12),
            /* Washed: "Hypothalamus" is written across the middle of this block. */
            fill: 'pituitary',
            fillOpacity: LABEL_WASH,
            colorToken: 'pituitary',
          },
          { type: 'text', x: 250, y: 52, text: 'Hypothalamus', cls: 'anatomyStrong', anchor: 'middle' },

          {
            type: 'path',
            d: `M 226 64 C ${(250 - waist).toFixed(1)} 110, ${(250 - waist).toFixed(1)} 130, 234 ${SELLA.top}
                L 266 ${SELLA.top} C ${(250 + waist).toFixed(1)} 130, ${(250 + waist).toFixed(1)} 110, 274 64 Z`,
            /* Washed: the optic chiasm is drawn across the stalk and labelled there. */
            fill: 'pituitary',
            fillOpacity: LABEL_WASH,
            colorToken: 'pituitary',
          },
          { type: 'text', x: 292, y: 84, text: 'Stalk', cls: 'anatomy', anchor: 'start' },
          ...(stalk > 0.12
            ? [
                {
                  type: 'text' as const,
                  x: 292,
                  y: 98,
                  text: `compressed ${(derived.stalkCompressionFraction * 100).toFixed(0)}%`,
                  cls: 'alarm' as const,
                  anchor: 'start' as const,
                },
              ]
            : []),

          // --- Dopamine: tonic inhibition, ending in a crossbar rather than an arrowhead ---
          {
            type: 'axis',
            path: 'M 240 66 C 236 118, 240 160, 246 194',
            activation: dopamineFlow,
            colorToken: 'basal-ganglia',
            label: '',
            labelX: 0,
            labelY: 0,
            markerId: 'pitInhibit',
            inhibitory: true,
          },
          // --- TRH drives the thyrotroph and spills onto the lactotroph ---
          {
            type: 'axis',
            path: 'M 262 66 C 276 116, 290 158, 296 194',
            activation: trhFlow,
            colorToken: 'tsh',
            label: '',
            labelX: 0,
            labelY: 0,
            markerId: 'pitExcite',
          },
          {
            type: 'path',
            d: 'M 283 152 C 272 168, 260 182, 255 193',
            colorToken: 'tsh',
            markerEnd: 'pitExcite',
            styleVars: { 'activation': trhFlow },
          },

          // --- D2 receptor block: the lesion sits on the path it interrupts ---
          ...(d2Block > 0.05
            ? [
                {
                  type: 'line' as const,
                  x1: 230,
                  y1: 172,
                  x2: 254,
                  y2: 158,
                  colorToken: 'danger' as const,
                },
                {
                  type: 'text' as const,
                  x: 150,
                  y: 166,
                  text: `D2 block ${derived.d2ReceptorBlockPct.toFixed(0)}%`,
                  colorToken: 'danger' as const,
                  anchor: 'end' as const,
                },
                {
                  type: 'line' as const,
                  x1: 154,
                  y1: 162,
                  x2: 226,
                  y2: 166,
                  colorToken: 'danger' as const,
                },
              ]
            : []),

          // --- Optic chiasm, lifted and stretched by anything growing under it ---
          {
            type: 'group',
            transform: `translate(0, ${-chiasmLift.toFixed(2)})`,
            children: [
              { type: 'path', d: 'M 158 128 L 342 150', colorToken: 'retina' },
              { type: 'path', d: 'M 158 150 L 342 128', colorToken: 'retina' },
            ],
          },
          // Halo: the chiasm's own crossing fibres run through this label, and moving it off
          // the chiasm would lose the one thing the label is pointing at.
          { type: 'text', x: 250, y: 112, text: 'Optic chiasm', cls: 'anatomy', anchor: 'middle', halo: 'bg' },
          ...(loss > 0.02
            ? [
                {
                  type: 'path' as const,
                  d: `158,${(139 - chiasmLift).toFixed(1)} ${(158 - 30 * loss).toFixed(1)},${(121 - chiasmLift).toFixed(1)} ${(158 - 30 * loss).toFixed(1)},${(157 - chiasmLift).toFixed(1)}`,
                  fill: 'danger' as const,
                  styleVars: { 'loss': loss },
                },
                {
                  type: 'path' as const,
                  d: `342,${(139 - chiasmLift).toFixed(1)} ${(342 + 30 * loss).toFixed(1)},${(121 - chiasmLift).toFixed(1)} ${(342 + 30 * loss).toFixed(1)},${(157 - chiasmLift).toFixed(1)}`,
                  fill: 'danger' as const,
                  styleVars: { 'loss': loss },
                },
                {
                  type: 'text' as const,
                  x: 124,
                  y: 106,
                  text: `bitemporal loss ${derived.visualFieldDefectPct.toFixed(0)}%`,
                  cls: 'alarm' as const,
                  anchor: 'middle' as const,
                },
              ]
            : []),

          // --- The bony sella and the sinus beneath it ---
          {
            type: 'path',
            d: `M ${SELLA.left - 10} ${SELLA.top} L ${SELLA.left - 10} ${SELLA.floor - 14}
                Q ${SELLA.left - 10} ${SELLA.floor} ${SELLA.left + 6} ${SELLA.floor}
                L ${SELLA.right - 6} ${SELLA.floor}
                Q ${SELLA.right + 10} ${SELLA.floor} ${SELLA.right + 10} ${SELLA.floor - 14}
                L ${SELLA.right + 10} ${SELLA.top}`,
            fill: 'bone',
            colorToken: 'text-dim',
          },
          { type: 'path', d: `M 186 ${SELLA.floor + 2} L 314 ${SELLA.floor + 2} L 292 322 L 208 322 Z`, fill: 'panel', colorToken: 'text-faint', },
          { type: 'text', x: 250, y: 306, text: 'Sphenoid sinus', cls: 'anatomy', anchor: 'middle' },

          // --- Cavernous sinuses and the carotid arteries running through them ---
          ...[110, 344].flatMap((x) => [
            { type: 'path' as const, d: roundedRect(x, 186, 52, 64, 10), fill: 'venous' as const, colorToken: 'venous' as const },
            { type: 'circle' as const, cx: x + 26, cy: 214, r: 10, fill: 'artery' as const },
            { type: 'text' as const, x: x + 26, y: 272, text: 'Cavernous sinus' as const, cls: 'anatomy' as const, anchor: 'middle' as const },
          ]),

          // --- The gland itself ---
          { type: 'path', d: ellipsePath(GLAND.cx, GLAND.cy, 84, 42), fill: 'pituitary', colorToken: 'pituitary' },
          // Washed: "Posterior" is written across it.
          { type: 'path', d: ellipsePath(GLAND.cx, GLAND.cy + 7, 27, 10), fill: 'adh', fillOpacity: LABEL_WASH, colorToken: 'adh' },
          // The posterior lobe is smaller than the word naming it, so the lobe's own outline
          // crossed it.
          { type: 'text', x: GLAND.cx, y: GLAND.cy + 11, text: 'Posterior', cls: 'anatomy', anchor: 'middle', halo: 'bg' },

          ...CELLS.flatMap((cell) =>
            [-8, 0, 8].map((dx) => ({
              type: 'circle' as const,
              cx: cell.x + dx,
              cy: cell.y,
              r: 4.4,
              fill: cell.colorToken,
              styleVars: { 'crowding': crowding(cell.colorToken) },
            })),
          ),

          ...(hasMass
            ? [
                {
                  type: 'path' as const,
                  d: ellipsePath(GLAND.cx, massCy, massRx, massRy),
                  fill: dominant.colorToken,
                  colorToken: dominant.colorToken,
                },
              ]
            : []),

          // --- Legend: the colour does real work, so it has to be keyed ---
          { type: 'text', x: LEGEND.x, y: LEGEND.top - 14, text: 'Cell lines', cls: 'label' },
          ...LEGEND_ITEMS.map((item, i) => [
            {
              type: 'circle' as const,
              cx: LEGEND.x + 6,
              cy: LEGEND.top + i * LEGEND.pitch,
              r: 5.5,
              fill: item.colorToken,
            },
            {
              type: 'text' as const,
              x: LEGEND.x + 20,
              y: LEGEND.top + i * LEGEND.pitch + 4,
              text: item.name,
              cls: 'anatomy' as const,
              anchor: 'start' as const,
            },
          ]).flat(),
          {
            type: 'line',
            x1: LEGEND.x,
            y1: LEGEND.top + CELLS.length * LEGEND.pitch - 4,
            x2: LEGEND.x + 140,
            y2: LEGEND.top + CELLS.length * LEGEND.pitch - 4,
            colorToken: 'panel-border',
          },
          {
            type: 'text',
            x: LEGEND.x,
            y: LEGEND.top + CELLS.length * LEGEND.pitch + 14,
            text: hasMass ? `${derived.totalMassCc.toFixed(1)} cm³ ${dominant.label}` : 'no sellar mass',
            cls: 'caption',
          },

          // --- Findings ---
          ...((derived.glucoseSuppressionTest !== 'not tested' || derived.acromegalicIndex > 20)
            ? [
                {
                  type: 'text' as const,
                  x: 28,
                  y: 334,
                  text:
                    derived.glucoseSuppressionTest !== 'not tested'
                      ? `glucose test: ${derived.glucoseSuppressionTest}`
                      : `acromegalic overgrowth index ${derived.acromegalicIndex.toFixed(0)}`,
                  cls: 'alarm' as const,
                },
              ]
            : []),
          { type: 'text', x: 28, y: 358, text: derived.classification, cls: 'verdict' },
          { type: 'text', x: 28, y: 382, text: derived.patternSummary, cls: 'caption' },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'GH adenoma secretion', key: 'ghAdenomaSecretion', min: 0, max: 100, step: 1 },
      { kind: 'slider', label: 'Prolactinoma secretion', key: 'prolactinomaSecretion', min: 0, max: 100, step: 1 },
      { kind: 'slider', label: 'Non-functioning mass', key: 'nonfunctioningMass', min: 0, max: 100, step: 1 },
      { kind: 'slider', label: 'Dopamine tone', key: 'dopamineTonePct', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'D2 receptor block (drugs)', key: 'd2ReceptorBlockPct', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'TRH drive', key: 'trhStimulusUnits', min: 0, max: 100, step: 1 },
      { kind: 'slider', label: 'Epiphyses open', key: 'epiphysesOpen', min: 0, max: 1, step: 1 },
    ],
    readouts: [
      {
        label: 'GH',
        value: (c) => c.derived.ghNgMl.toFixed(1),
        unit: 'ng/mL',
        secondary: (c) => (c.derived.ghNgMl > 10 ? 'autonomous — ignores hypothalamus' : 'under hypothalamic control'),
        colorToken: 'basal-ganglia',
      },
      { label: 'IGF-1', value: (c) => c.derived.igf1NgMl.toFixed(0), unit: 'ng/mL', secondary: () => 'the integrated screening value', colorToken: 'ok' },
      {
        label: 'Prolactin',
        value: (c) => c.derived.prolactinNgMl.toFixed(0),
        unit: 'ng/mL',
        secondary: (c) =>
          c.derived.prolactinNgMl >= PROLACTIN_AXIS.MACROADENOMA_LIKELY_NG_ML
            ? 'macroadenoma range'
            : c.derived.prolactinNgMl > PROLACTIN_AXIS.UPPER_LIMIT_NG_ML
              ? 'Raised — ask why before scanning'
              : 'under dopamine brake',
        colorToken: 'ige',
      },
      {
        label: 'Glucose suppression test',
        value: (c) => c.derived.glucoseSuppressionTest,
        secondary: () => 'GH <1 ng/mL is the normal response',
        colorToken: 'warn',
      },
      {
        label: 'Dopamine brake',
        value: (c) => (c.derived.effectiveDopamineFraction * 100).toFixed(0),
        unit: '%',
        secondary: (c) => `stalk compressed ${(c.derived.stalkCompressionFraction * 100).toFixed(0)}%`,
        colorToken: 'pituitary',
      },
      {
        label: 'Sellar mass',
        value: (c) => c.derived.totalMassCc.toFixed(1),
        unit: 'cm³',
        secondary: (c) => (c.derived.visualFieldDefectPct > 5 ? `fields lost ${c.derived.visualFieldDefectPct.toFixed(0)}%` : 'chiasma clear'),
        colorToken: 'danger',
      },
      {
        label: 'Gonadal axis',
        value: (c) => `${100 - c.derived.gonadalSuppressionPct}%`,
        secondary: () => 'prolactin suppresses GnRH downstream of nothing',
        colorToken: 'lh',
      },
      {
        label: 'Somatic effect',
        value: (c) =>
          c.derived.heightVelocityCmPerYear > 0
            ? `${c.derived.heightVelocityCmPerYear.toFixed(1)} cm/yr`
            : `${c.derived.acromegalicIndex.toFixed(0)}/100`,
        secondary: (c) => (c.derived.heightVelocityCmPerYear > 8 ? 'linear growth (open epiphyses)' : 'acral overgrowth index'),
        colorToken: 'sarcomere',
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
      { kind: 'sparkline', label: 'GH', unit: 'ng/mL', colorToken: 'basal-ganglia', domainMin: 0, domainMax: 30, data: (points) => points.map((p) => p.gh) },
      { kind: 'sparkline', label: 'Prolactin', unit: 'ng/mL', colorToken: 'ige', domainMin: 0, domainMax: 400, data: (points) => points.map((p) => p.prolactin) },
      { kind: 'sparkline', label: 'IGF-1 (×10 ng/mL)', colorToken: 'ok', domainMin: 8, domainMax: 80, data: (points) => points.map((p) => p.igf1) },
    ],
  };
}
