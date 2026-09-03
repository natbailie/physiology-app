import { clamp } from '@/shared/lib/math';
import type { HpgDerived, HpgHistoryPoint, HpgInputs, HpgState } from './engine/types';
import type {
  ModulePresentation,
  PresentationContext,
  ReadoutContext,
  ReadoutSpec,
} from '@/shared/presentation/types';

/* --- Geometry for the shared endocrine scaffold ----------------------
 *
 * Both HPG and HPT draw on the shared `EndocrineAxis` scaffold: hypothalamus on top, the
 * hypophyseal portal vessels carrying the releasing hormone, the two-lobed pituitary, a
 * trophic hormone through the blood to the target gland, a shared circulation, feedback
 * rising out of it, and the target tissue below. The coordinates below reproduce that
 * scaffold exactly (viewBox 0 0 560 440). Everything not in the 6-name OrganName union —
 * hypothalamus, pituitary, gonad, circulation, tissue — is drawn with primitives. */

function ellipse(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
}

const HYPOTHALAMUS =
  'M 96 50 C 118 40, 152 44, 160 60 C 166 74, 154 88, 132 90 C 110 92, 94 82, 92 68 C 91 60, 93 54, 96 50 Z';
const STALK = 'M 114 104 L 114 132 M 140 104 L 140 132';
const PORTAL = 'M 118 106 C 126 116, 130 124, 128 134';
const SELLA = 'M 78 148 C 78 184, 108 194, 128 194 C 150 194, 178 184, 178 148';
const TROPHIC = 'M 136 146 C 232 150, 330 168, 380 190';
const SECRETION = 'M 410 266 L 410 282';
const FEEDBACK_GLAND = 'M 196 286 C 186 250, 170 200, 146 174';
const FEEDBACK_HYPO = 'M 92 286 C 62 240, 56 120, 96 66';
const TO_TISSUE = 'M 330 320 L 330 336';
const EXOGENOUS = 'M 20 301 L 60 301';

const GLAND = { x: 410, y: 206 };

const PULSE_STRIP = { x: 196, y: 240, width: 150 };

const ANTERIOR = ellipse(110, 158, 26, 20);
const POSTERIOR = ellipse(152, 155, 14, 16);

type Ctx = PresentationContext<HpgState, HpgDerived, HpgInputs, HpgHistoryPoint>;

/** The dominant follicle diameter in SVG units, matching the legacy 0–11 growth range. */
function follicleRadius(follicleSize: number): number {
  return clamp(follicleSize, 0, 1) * 11;
}

export function buildHpgPresentation(ctx: Ctx): ModulePresentation<HpgState, HpgDerived, HpgInputs, HpgHistoryPoint> {
  const { derived } = ctx;
  const isFemale = derived.sex === 'female';
  const positive = derived.feedbackMode === 'positive';

  const lh = clamp(derived.lhLevel, 0, 1);
  const gnrh = clamp(derived.gnrhDrive, 0, 1);
  const steroid = clamp(isFemale ? derived.estrogenLevel : derived.testosteroneLevel, 0, 1);
  const exogenous = clamp(
    (isFemale ? derived.exogenousEstrogenProgesterone : derived.exogenousTestosterone) / 100,
    0,
    1,
  );
  const pulse = clamp(derived.gnrhPulseFrequency, 0, 2);

  // GnRH has to arrive in PULSES — a steady infusion shuts the axis down. The pulse train is
  // drawn, and it visibly runs together into one continuous line as pulsatility is lost.
  const pulseCount = Math.max(1, Math.round(pulse * 5));
  const pulseSpikes = Array.from({ length: pulseCount }, (_, i) => {
    const x = PULSE_STRIP.x + ((i + 0.5) / pulseCount) * PULSE_STRIP.width;
    return { x1: x, y1: PULSE_STRIP.y + 14, x2: x, y2: PULSE_STRIP.y };
  });

  const productToken = isFemale ? 'estrogen' : 'testosterone';

  // The gonad with the structures the cycle actually consists of: a set of antral follicles of
  // which one is selected and grows, a corpus luteum that appears after ovulation (the ovary);
  // or the seminiferous tubules where FSH acts / inhibin is made (the testis).
  const dominantR = follicleRadius(derived.follicleSize);
  const gonadVisible = isFemale
    ? [
        { type: 'circle' as const, cx: 0, cy: 0, r: 0, fill: 'gnrh', colorToken: 'gnrh' },
        { type: 'circle' as const, cx: -17, cy: -6, r: 3.6, colorToken: 'text-faint' },
        { type: 'circle' as const, cx: -13, cy: 8, r: 3.6, colorToken: 'text-faint' },
        { type: 'circle' as const, cx: 16, cy: -9, r: 3.6, colorToken: 'text-faint' },
        ...(dominantR > 1
          ? [{ type: 'circle' as const, cx: -2, cy: -3, r: dominantR, fill: 'estrogen', colorToken: 'estrogen' }]
          : []),
        ...(derived.corpusLuteumActivity > 0.02
          ? [{ type: 'circle' as const, cx: 14, cy: 7, r: 7, fill: 'progesterone', colorToken: 'progesterone' }]
          : []),
      ]
    : [
        { type: 'path' as const, d: 'M -26 -8 C -16 -14, -4 -2, 8 -12 C 14 -15, 18 -10, 20 -8', colorToken: 'testosterone' },
        { type: 'path' as const, d: 'M -26 0 C -16 -6, -4 6, 8 -4 C 14 -7, 18 -2, 20 0', colorToken: 'testosterone' },
        { type: 'path' as const, d: 'M -26 8 C -16 2, -4 14, 8 4 C 14 1, 18 6, 20 8', colorToken: 'testosterone' },
        { type: 'path' as const, d: 'M 22 -14 C 32 -8, 32 8, 22 14', colorToken: 'testosterone' },
      ];

  const pulseCaption =
    pulse < 0.12
      ? 'continuous — the pituitary stops responding'
      : `×${pulse.toFixed(2)} · responsiveness ${(derived.pituitaryResponsiveness * 100).toFixed(0)}%`;

  const statusCaption = isFemale
    ? `E2 ${(derived.estrogenLevel * 100).toFixed(0)}% · P4 ${(derived.progesteroneLevel * 100).toFixed(0)}% · follicle ${(derived.follicleSize * 100).toFixed(0)}%`
    : `testosterone ${(derived.testosteroneLevel * 100).toFixed(0)}% · inhibin ${(derived.inhibinLevel * 100).toFixed(0)}%`;

  const feedbackToken = positive ? 'ok' : 'text-dim';

  const readouts: ReadoutSpec<HpgState, HpgDerived, HpgInputs>[] = [
    {
      label: 'Feedback mode',
      value: (c) => (c.derived.feedbackMode === 'positive' ? 'positive' : 'negative'),
      secondary: (c) => (c.derived.feedbackMode === 'positive' ? 'LH surge — ovulation' : undefined),
      colorToken: 'lh',
    },
    { label: 'GnRH drive', value: (c) => (c.derived.gnrhDrive * 100).toFixed(0), unit: '%', colorToken: 'gnrh' },
    { label: 'LH', value: (c) => (c.derived.lhLevel * 100).toFixed(0), unit: '%', colorToken: 'lh' },
    { label: 'FSH', value: (c) => (c.derived.fshLevel * 100).toFixed(0), unit: '%', colorToken: 'fsh' },
    ...(isFemale
      ? [
          { label: 'Estrogen', value: (c: ReadoutContext<HpgState, HpgDerived, HpgInputs>) => (c.derived.estrogenLevel * 100).toFixed(0), unit: '%', colorToken: 'estrogen' },
          { label: 'Progesterone', value: (c: ReadoutContext<HpgState, HpgDerived, HpgInputs>) => (c.derived.progesteroneLevel * 100).toFixed(0), unit: '%', colorToken: 'progesterone' },
          { label: 'Follicle', value: (c: ReadoutContext<HpgState, HpgDerived, HpgInputs>) => (c.derived.follicleSize * 100).toFixed(0), unit: '%', colorToken: 'estrogen' },
          { label: 'Cycle day', value: (c: ReadoutContext<HpgState, HpgDerived, HpgInputs>) => c.derived.cycleDay.toFixed(0), secondary: (c: ReadoutContext<HpgState, HpgDerived, HpgInputs>) => c.derived.cyclePhase, colorToken: 'text' },
        ]
      : [
          { label: 'Testosterone', value: (c: ReadoutContext<HpgState, HpgDerived, HpgInputs>) => (c.derived.testosteroneLevel * 100).toFixed(0), unit: '%', colorToken: 'testosterone' },
          { label: 'Inhibin', value: (c: ReadoutContext<HpgState, HpgDerived, HpgInputs>) => (c.derived.inhibinLevel * 100).toFixed(0), unit: '%', secondary: () => 'FSH-selective brake', colorToken: 'fsh' },
        ]),
    {
      label: 'Pituitary responsiveness',
      value: (c) => (c.derived.pituitaryResponsiveness * 100).toFixed(0),
      unit: '%',
      secondary: (c) => (c.derived.pituitaryResponsiveness < 0.3 ? 'pulsatility lost' : undefined),
      colorToken: 'gnrh',
    },
  ];

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 560, 440],
        ariaLabel:
          'The hypothalamic-pituitary-gonadal axis: pulsatile GnRH down the portal vessels, LH and FSH through the circulation to the gonad, and gonadal steroids feeding back on the axis — negatively for most of the cycle and positively at the surge',
        defs: [
          { type: 'marker', id: 'trophic-arrow', colorToken: 'lh' },
          { type: 'marker', id: 'product-arrow', colorToken: productToken },
          { type: 'marker', id: 'feedback-arrow', colorToken: feedbackToken },
          { type: 'marker', id: 'tissue-arrow', colorToken: 'text-faint' },
          ...(exogenous > 0.01 ? [{ type: 'marker' as const, id: 'exo-arrow', colorToken: 'danger' }] : []),
        ],
        children: [
          /* ---- Hypothalamus ---- */
          { type: 'path', d: HYPOTHALAMUS, fill: 'co2', colorToken: 'co2', strokeWidth: 1.8 },
          { type: 'text', x: 126, y: 36, text: 'Hypothalamus', cls: 'anatomyStrong', anchor: 'middle' },
          // Neurosecretory neurons ending on the primary plexus — carry the releasing hormone
          // the short way, into the portal system rather than into the blood.
          { type: 'path', d: 'M 112 84 L 112 104', colorToken: 'co2', strokeWidth: 1 + gnrh * 1.6 },
          { type: 'path', d: 'M 126 84 L 126 104', colorToken: 'co2', strokeWidth: 1 + gnrh * 1.6 },
          { type: 'path', d: 'M 140 84 L 140 104', colorToken: 'co2', strokeWidth: 1 + gnrh * 1.6 },

          /* ---- Stalk and the hypophyseal portal vessels ---- */
          { type: 'path', d: STALK, colorToken: 'text-faint', strokeWidth: 1.5 },
          { type: 'path', d: PORTAL, colorToken: 'co2', strokeWidth: 1.5 + gnrh * 2 },
          { type: 'text', x: 158, y: 116, text: 'Portal vessels', cls: 'anatomy' },
          { type: 'text', x: 158, y: 130, text: 'GnRH', cls: 'label', colorToken: 'gnrh' },

          /* ---- Pituitary in its sella ---- */
          { type: 'path', d: SELLA, colorToken: 'text-faint', strokeWidth: 3 },
          { type: 'path', d: ANTERIOR, fill: 'pituitary', colorToken: 'pituitary', strokeWidth: 1.8 },
          { type: 'path', d: POSTERIOR, fill: 'adh', colorToken: 'adh', strokeWidth: 1.5 },
          { type: 'text', x: 110, y: 162, text: 'anterior', cls: 'tickLabel', anchor: 'middle', colorToken: 'text-faint' },
          { type: 'text', x: 152, y: 159, text: 'post.', cls: 'tickLabel', anchor: 'middle', colorToken: 'text-faint' },
          { type: 'text', x: 128, y: 210, text: 'Pituitary', cls: 'anatomyStrong', anchor: 'middle' },

          /* ---- Trophic hormone: pituitary to gland, through the blood ---- */
          { type: 'path', d: TROPHIC, colorToken: 'lh', strokeWidth: 1.5 + lh * 2.5, markerEnd: 'trophic-arrow' },
          { type: 'text', x: 250, y: 148, text: 'LH / FSH', cls: 'label', colorToken: 'lh' },

          /* ---- The target gonad ---- */
          {
            type: 'group',
            transform: `translate(${GLAND.x}, ${GLAND.y})`,
            children: [
              // Gonad body: an ellipse hinting at the gland shape beneath the drawn structures.
              {
                type: 'path',
                d: isFemale ? ellipse(0, 0, 30, 20) : ellipse(-4, 0, 28, 20),
                fill: 'gnrh',
                colorToken: 'gnrh',
                strokeWidth: 1.8,
              },
              ...gonadVisible,
            ],
          },
          { type: 'text', x: GLAND.x, y: GLAND.y + 52, text: isFemale ? 'Ovary' : 'Testis', cls: 'anatomyStrong', anchor: 'middle' },

          /* ---- The circulation everything downstream shares ---- */
          { type: 'rect', x: 64, y: 286, width: 432, height: 30, fill: 'artery' },
          { type: 'text', x: 72, y: 306, text: 'Circulation', cls: 'anatomy' },

          /* ---- Secretion into the circulation ---- */
          { type: 'path', d: SECRETION, colorToken: productToken, strokeWidth: 1.5 + steroid * 2.5, markerEnd: 'product-arrow' },
          { type: 'text', x: GLAND.x + 12, y: 282, text: isFemale ? 'Oestrogen' : 'Testosterone', cls: 'label', colorToken: productToken },

          /* ---- An exogenous steroid joins the circulation from outside the axis, which is why
             it suppresses the axis and lets the gland waste ---- */
          ...(exogenous > 0.01
            ? [
                { type: 'path' as const, d: EXOGENOUS, colorToken: 'danger', strokeWidth: 1.5 + exogenous * 2.5, markerEnd: 'exo-arrow' },
                { type: 'text' as const, x: 20, y: 290, text: isFemale ? 'Oestrogen / progestin' : 'Exogenous testosterone', cls: 'label', colorToken: 'danger', opacity: 0.3 + exogenous * 0.7 },
              ]
            : []),

          /* ---- Feedback, rising out of the circulation ---- */
          {
            type: 'axis',
            path: FEEDBACK_GLAND,
            activation: steroid,
            colorToken: feedbackToken,
            label: '',
            labelX: 0,
            labelY: 0,
            markerId: 'feedback-arrow',
            inhibitory: !positive,
          },
          {
            type: 'axis',
            path: FEEDBACK_HYPO,
            activation: steroid,
            colorToken: feedbackToken,
            label: '',
            labelX: 0,
            labelY: 0,
            markerId: 'feedback-arrow',
            inhibitory: !positive,
          },
          { type: 'text', x: 40, y: 200, text: positive ? 'positive' : 'negative', cls: 'label', colorToken: feedbackToken },
          { type: 'text', x: 40, y: 212, text: 'feedback', cls: 'label', colorToken: feedbackToken },

          /* ---- What the hormone actually does ---- */
          { type: 'path', d: TO_TISSUE, colorToken: 'text-faint', strokeWidth: 2, markerEnd: 'tissue-arrow' },
          { type: 'rect', x: 252, y: 338, width: 244, height: 56, fill: 'sarcomere' },
          {
            type: 'text',
            x: 374,
            y: 358,
            text: isFemale ? 'Endometrium · breast · bone' : 'Muscle · bone · spermatogenesis',
            cls: 'anatomyStrong',
            anchor: 'middle',
          },
          {
            type: 'text',
            x: 374,
            y: 372,
            text: isFemale ? 'proliferation then secretory change, and bone kept dense' : 'anabolism, bone density, and sperm production alongside FSH',
            cls: 'caption',
            anchor: 'middle',
            colorToken: 'text-faint',
          },

          /* ---- GnRH pulsatility, the axis's own peculiarity ---- */
          { type: 'text', x: PULSE_STRIP.x, y: PULSE_STRIP.y - 10, text: 'GnRH pulses', cls: 'label', colorToken: 'gnrh' },
          { type: 'line', x1: PULSE_STRIP.x, y1: PULSE_STRIP.y + 14, x2: PULSE_STRIP.x + PULSE_STRIP.width, y2: PULSE_STRIP.y + 14 },
          ...(pulse < 0.12
            ? [{ type: 'line' as const, x1: PULSE_STRIP.x, y1: PULSE_STRIP.y + 2, x2: PULSE_STRIP.x + PULSE_STRIP.width, y2: PULSE_STRIP.y + 2, colorToken: 'danger' }]
            : pulseSpikes.map((s) => ({ type: 'line' as const, x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, colorToken: 'gnrh' }))),
          { type: 'text', x: PULSE_STRIP.x, y: PULSE_STRIP.y + 28, text: pulseCaption, cls: 'tickLabel', colorToken: 'text-faint' },

          /* ---- Header readout strip ---- */
          {
            type: 'text',
            x: 20,
            y: 410,
            text: `LH ${(derived.lhLevel * 100).toFixed(0)}% · FSH ${(derived.fshLevel * 100).toFixed(0)}%${isFemale ? ` · day ${derived.cycleDay} ${derived.cyclePhase}` : ''}`,
            cls: 'label',
          },
          { type: 'text', x: 20, y: 430, text: statusCaption, cls: 'caption' },
        ],
      },
    ],
    controls: [
      {
        kind: 'toggle',
        label: 'Axis',
        key: 'sex',
        options: [
          { value: 'female', label: 'Female' },
          { value: 'male', label: 'Male' },
        ],
        colorToken: 'lh',
      },
      { kind: 'slider', label: 'GnRH pulse frequency', key: 'gnrhPulseFrequency', min: 0, max: 2, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Hypothalamic suppression', key: 'hypothalamicSuppression', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Gonadal function', key: 'gonadalFunction', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      {
        kind: 'slider',
        label: isFemale ? 'Exogenous estrogen/progestin' : 'Exogenous testosterone',
        key: isFemale ? 'exogenousEstrogenProgesterone' : 'exogenousTestosterone',
        min: 0,
        max: 200,
        step: 5,
        unit: '%',
      },
    ],
    readouts,
    charts: [
      { kind: 'sparkline', label: 'LH', unit: '%', colorToken: 'lh', domainMin: 0, domainMax: 100, data: (points) => points.map((p) => p.lh * 100) },
      { kind: 'sparkline', label: 'FSH', unit: '%', colorToken: 'fsh', domainMin: 0, domainMax: 100, data: (points) => points.map((p) => p.fsh * 100) },
      {
        kind: 'sparkline',
        label: isFemale ? 'Estrogen' : 'Testosterone',
        unit: '%',
        colorToken: productToken,
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.gonadalSteroid * 100),
      },
    ],
  };
}
