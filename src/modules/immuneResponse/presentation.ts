import { clamp } from '@/shared/lib/math';
import { CYTOKINES } from './engine/constants';
import type { ImmuneDerived, ImmuneHistoryPoint, ImmuneInputs, ImmuneState } from './engine/types';
import type { ModulePresentation, PresentationContext } from '@/shared/presentation/types';

/* The adaptive-immune cascade as a graph: a pathogen site where innate cells and antibody act,
 * dendritic cells trafficking antigen to a lymph node, and the node where helper T cells license
 * cytotoxic T cells and B cells before memory persists. The node swells as lymphocytes expand
 * (the palpable node), and each cell population appears only as strongly as it is active — count,
 * not opacity, so the cascade visibly builds and fades. */

const circlePath = (cx: number, cy: number, r: number) =>
  `M${cx - r},${cy} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0 Z`;

const PATHOGEN_DOTS = [
  { x: -22, y: -10 },
  { x: -6, y: 6 },
  { x: 14, y: -14 },
  { x: 24, y: 8 },
  { x: 0, y: -22 },
  { x: -30, y: 12 },
];

const INNATE_CELLS = [
  { x: -34, y: -22 },
  { x: 30, y: -24 },
  { x: -14, y: 22 },
];

/* Antibody drawn as small Y-shaped marks around the infection site. */
const ANTIBODY_MARKS = [
  'M-40,2 l0,-6 m0,6 l-4,4 m4,-4 l4,4',
  'M8,20 l0,-6 m0,6 l-4,4 m4,-4 l4,4',
  'M34,-4 l0,-6 m0,6 l-4,4 m4,-4 l4,4',
];

const MEMORY_CELLS = [
  { x: -14, y: 16 },
  { x: 6, y: 20 },
  { x: -3, y: 4 },
];

const TRAFFICKING_PATH = 'M178,110 C230,92 270,92 306,102';

/* Tissue macrophages already living at the site, as opposed to the neutrophils recruited into it.
 * Drawn FILLED where the recruited cells are outlined, so the two populations are told apart by
 * more than position. */
const RESIDENT_MACROPHAGES = [
  { x: 16, y: 26 },
  { x: -36, y: 4 },
  { x: 34, y: 18 },
];

type Ctx = PresentationContext<ImmuneState, ImmuneDerived, ImmuneInputs, ImmuneHistoryPoint>;

export function buildImmuneResponsePresentation(ctx: Ctx): ModulePresentation<ImmuneState, ImmuneDerived, ImmuneInputs, ImmuneHistoryPoint> {
  const { derived } = ctx;

  /* The HOST, as distinct from the response.
   *
   * Every quantity this diagram drew was a running one, and an unchallenged patient's response is
   * at rest — so a neutropenic host, a CD4-depleted host and an agammaglobulinaemic one all painted
   * the same empty site and the same unswollen node. What separates them is standing in `derived`
   * the whole time, and three lines of this file drew the Th and B cells at a fixed radius of seven
   * while the CD4 count is the single most important number in the module.
   */
  const helperT = clamp(derived.helperTCellCount, 0, 1.5);
  const bCells = clamp(derived.bCellFunction, 0, 1.5);
  const innateReserve = clamp(derived.innateImmuneFunction, 0, 1.5);
  const suppression = clamp(derived.immunosuppression / 100, 0, 1);
  const intracellular = derived.pathogenType === 'intracellular';

  const load = clamp(derived.pathogenLoad, 0, 1);
  const innate = clamp(derived.innateActivity, 0, 1);
  const antibody = clamp(derived.igmTitre * 0.4 + derived.iggTitre, 0, 1);
  const adaptive = clamp(Math.max(derived.helperTActivity, derived.bCellActivity), 0, 1);
  const memory = clamp(derived.memoryLevel, 0, 1);
  const presentation = clamp(derived.antigenPresentation, 0, 1);

  const pathogenDots = PATHOGEN_DOTS.slice(0, Math.round(load * PATHOGEN_DOTS.length));
  const innateCells = INNATE_CELLS.slice(0, Math.round(innate * INNATE_CELLS.length));
  const antibodyMarks = ANTIBODY_MARKS.slice(0, Math.round(antibody * ANTIBODY_MARKS.length));
  const memoryCells = MEMORY_CELLS.slice(0, Math.round(memory * MEMORY_CELLS.length));

  // The node visibly swells as lymphocytes proliferate — clinically, the palpable node.
  const nodeRadius = 38 * (0.82 + adaptive * 0.3);
  const febrile = derived.temperatureC > CYTOKINES.NORMAL_TEMPERATURE_C + 0.8;

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 480, 300],
        ariaLabel: 'Diagram of the immune response: pathogen and innate cells at the infection site, dendritic cells trafficking antigen to a lymph node where T and B cells are primed, and antibody plus memory cells persisting afterward',
        defs: [{ type: 'marker', id: 'presentation-arrow', colorToken: 'adaptive' }],
        children: [
          /* The infection site: the tissue lesion, with pathogen particles, recruited innate
             cells and antibody Y-marks appearing as strongly as each arm is active. */
          { type: 'text', x: 112, y: 40, text: 'Infection site', cls: 'organLabel' },
          {
            type: 'group',
            transform: 'translate(112, 118)',
            children: [
              { type: 'path', d: circlePath(0, 0, 55), colorToken: 'pathogen', strokeWidth: 2, fill: 'none' },
              /* Resident macrophages: the first line that is already there. A count, and the only
               * thing that distinguishes a neutropenic host from a healthy one before anything
               * infects either of them. */
              ...RESIDENT_MACROPHAGES.slice(0, Math.round(clamp(innateReserve, 0, 1) * RESIDENT_MACROPHAGES.length)).map((cell) => ({
                type: 'circle' as const,
                cx: cell.x,
                cy: cell.y,
                r: 5,
                fill: 'innate',
                fillOpacity: 0.6,
              })),
              /* An intracellular organism sits INSIDE a host cell, which is the whole reason
               * antibody cannot reach it — so the drawing puts it there rather than saying so in a
               * caption. Drawn whether or not a challenge has landed, because the scenario is the
               * kind of organism, not the infection. */
              ...(intracellular
                ? [{ type: 'path' as const, d: circlePath(0, -4, 24), colorToken: 'text-dim', strokeWidth: 1.2, fill: 'none' }]
                : []),
              ...pathogenDots.map((dot) => ({
                type: 'path' as const,
                d: intracellular ? circlePath(dot.x * 0.4, dot.y * 0.4 - 4, 4) : circlePath(dot.x, dot.y, 4),
                colorToken: 'pathogen',
                fill: 'none',
              })),
              ...innateCells.map((cell) => ({ type: 'path' as const, d: circlePath(cell.x, cell.y, 7), colorToken: 'innate', strokeWidth: 1.2, fill: 'none' })),
              ...antibodyMarks.map((d) => ({ type: 'path' as const, d, colorToken: 'antibody', strokeWidth: 1.6, fill: 'none' })),
            ],
          },
          { type: 'text', x: 54, y: 180, text: `Load ${(derived.pathogenLoad * 100).toFixed(0)}% · innate ${(derived.innateActivity * 100).toFixed(0)}%`, cls: 'pathLabel' },

          /* Dendritic trafficking to the node — the delay that makes a primary response slow. */
          {
            type: 'axis',
            path: TRAFFICKING_PATH,
            activation: presentation,
            colorToken: 'adaptive',
            label: 'antigen presentation',
            labelX: 202,
            labelY: 84,
            markerId: 'presentation-arrow',
          },

          /* The lymph node: where naive lymphocytes are primed. Helper T (adaptive) and B
             (antibody) sit inside, and the memory population persists after clearance. */
          { type: 'text', x: 356, y: 40, text: 'Lymph node', cls: 'organLabel' },
          {
            type: 'group',
            transform: 'translate(356, 116)',
            children: [
              { type: 'path', d: circlePath(0, 0, nodeRadius), colorToken: 'adaptive', strokeWidth: 2, fill: 'none' },
              // Radius is the CD4 count, not a constant seven.
              { type: 'path', d: circlePath(-18, -8, 3 + helperT * 5), colorToken: 'adaptive', strokeWidth: 1.2, fill: 'none' },
              // Haloed: these name the cells they sit inside, and the cell outlines cross them.
              { type: 'text', x: -18, y: -20, text: 'Th', cls: 'pathLabel', anchor: 'middle', halo: 'panel' },
              { type: 'path', d: circlePath(16, -12, 3 + bCells * 5), colorToken: 'antibody', strokeWidth: 1.2, fill: 'none' },
              { type: 'text', x: 16, y: -24, text: 'B', cls: 'pathLabel', anchor: 'middle', halo: 'panel' },
              ...memoryCells.map((cell) => ({ type: 'path' as const, d: circlePath(cell.x, cell.y, 5), colorToken: 'memory', strokeWidth: 1.2, fill: 'none' })),
              /* Pharmacological suppression damps every arm at once, so it is drawn across the
               * whole node rather than on any one cell in it. A wash, stated on the node. */
              ...(suppression > 0
                ? [{ type: 'circle' as const, cx: 0, cy: 0, r: nodeRadius, fill: 'text-dim', fillOpacity: suppression * 0.45 }]
                : []),
            ],
          },
          { type: 'text', x: 300, y: 172, text: `Memory ${(derived.memoryLevel * 100).toFixed(0)}%`, cls: 'pathLabel' },

          /* ---- Readings ---- */
          { type: 'text', x: 22, y: 228, text: derived.responsePhase, colorToken: 'adaptive' },
          { type: 'text', x: 22, y: 246, text: `IgM ${(derived.igmTitre * 100).toFixed(0)}% · IgG ${(derived.iggTitre * 100).toFixed(0)}% · Tc ${(derived.cytotoxicTActivity * 100).toFixed(0)}%`, cls: 'valueLabel' },
          { type: 'text', x: 22, y: 262, text: `${derived.daysSinceChallenge >= 0 ? `Day ${derived.daysSinceChallenge.toFixed(1)}` : 'No challenge'} · ${derived.clearanceTimeDays > 0 ? `cleared in ${derived.clearanceTimeDays.toFixed(1)}d` : 'not cleared'}`, cls: 'valueLabel' },
          { type: 'text', x: 22, y: 280, text: `${derived.temperatureC.toFixed(1)}°C${febrile ? ' — febrile' : ''}`, cls: 'valueLabel', colorToken: febrile ? 'pathogen' : 'text' },
        ],
      },
    ],
    controls: [
      {
        kind: 'toggle',
        label: 'Pathogen type',
        key: 'pathogenType',
        options: [
          { value: 'extracellular', label: 'Extracellular' },
          { value: 'intracellular', label: 'Intracellular' },
        ],
        colorToken: 'adaptive',
      },
      { kind: 'slider', label: 'Pathogen virulence', key: 'pathogenVirulence', min: 0, max: 200, step: 5, unit: '%' },
      { kind: 'slider', label: 'Innate immunity', key: 'innateImmuneFunction', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Helper T cell count', key: 'helperTCellCount', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'B cell function', key: 'bCellFunction', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Immunosuppression', key: 'immunosuppression', min: 0, max: 100, step: 5, unit: '%' },
    ],
    readouts: [
      { label: 'Pathogen load', value: (c) => (c.derived.pathogenLoad * 100).toFixed(0), unit: '%', secondary: (c) => (c.derived.pathogenLoad === 0 ? 'cleared' : undefined), colorToken: 'pathogen' },
      { label: 'Temperature', value: (c) => c.derived.temperatureC.toFixed(1), unit: '°C', secondary: (c) => (c.derived.temperatureC > CYTOKINES.NORMAL_TEMPERATURE_C + 0.8 ? 'febrile' : undefined), colorToken: derived.temperatureC > CYTOKINES.NORMAL_TEMPERATURE_C + 0.8 ? 'pathogen' : 'text' },
      { label: 'Phase', value: (c) => c.derived.responsePhase, colorToken: 'adaptive' },
      { label: 'Day', value: (c) => (c.derived.daysSinceChallenge >= 0 ? c.derived.daysSinceChallenge.toFixed(1) : '—'), secondary: (c) => (c.derived.clearanceTimeDays > 0 ? `cleared d${c.derived.clearanceTimeDays.toFixed(1)}` : undefined), colorToken: 'text' },
      { label: 'Innate', value: (c) => (c.derived.innateActivity * 100).toFixed(0), unit: '%', colorToken: 'innate' },
      { label: 'Helper T', value: (c) => (c.derived.helperTActivity * 100).toFixed(0), unit: '%', secondary: () => 'licenses both arms', colorToken: 'adaptive' },
      { label: 'Cytotoxic T', value: (c) => (c.derived.cytotoxicTActivity * 100).toFixed(0), unit: '%', colorToken: 'adaptive' },
      { label: 'IgM', value: (c) => (c.derived.igmTitre * 100).toFixed(0), unit: '%', secondary: () => 'first', colorToken: 'antibody' },
      { label: 'IgG', value: (c) => (c.derived.iggTitre * 100).toFixed(0), unit: '%', secondary: () => 'class switched', colorToken: 'antibody' },
      { label: 'Memory', value: (c) => (c.derived.memoryLevel * 100).toFixed(0), unit: '%', secondary: (c) => (c.derived.memoryLevel > 0.4 ? 'protected' : undefined), colorToken: 'memory' },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Pathogen load',
        unit: '%',
        colorToken: 'pathogen',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.pathogenLoad * 100),
      },
      {
        kind: 'sparkline',
        label: 'IgG',
        unit: '%',
        colorToken: 'antibody',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.iggTitre * 100),
      },
      {
        kind: 'sparkline',
        label: 'Memory',
        unit: '%',
        colorToken: 'memory',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.memoryLevel * 100),
      },
    ],
  };
}
