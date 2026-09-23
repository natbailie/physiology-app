import { clamp } from '@/shared/lib/math';
import { ACUTE } from './engine/constants';
import type { InflammationDerived, InflammationHistoryPoint, InflammationInputs, InflammationInternalState } from './engine/types';
import type { ModulePresentation, PresentationContext } from '@/shared/presentation/types';

const TISSUE = { x: 40, y: 80, w: 200, h: 160 };
const BAR = { x: 300, y: 90, width: 104, height: 160 };
const BAR_MAX = 2;

type Ctx = PresentationContext<InflammationInternalState, InflammationDerived, InflammationInputs, InflammationHistoryPoint>;

function feverVerdict(temp: number): string {
  if (temp >= 39) return 'pyrexia';
  if (temp >= 37.8) return 'low-grade';
  return 'afebrile';
}

function loadVerdict(load: number): string {
  if (load > 0.8) return 'heavy burden';
  if (load > 0.3) return 'moderate';
  if (load > 0.05) return 'resolving';
  return 'cleared';
}

export function buildInflammationPresentation(ctx: Ctx): ModulePresentation<InflammationInternalState, InflammationDerived, InflammationInputs, InflammationHistoryPoint> {
  const { derived } = ctx;

  const midX = TISSUE.x + TISSUE.w / 2;
  const midY = TISSUE.y + TISSUE.h / 2;

  /* The cardinal signs, which this diagram's own first readout names — "rubor · calor · tumor ·
   * dolor" — and which the picture did not carry at all. Rubor is the tissue's own colour getting
   * denser; tumor is the oedematous margin the leaky capillary produces. Both are stated as data
   * on the node, because a schema-only renderer has no stylesheet to fall back on.
   *
   * They are also what the three remaining scenarios needed: severity, antibiotic and source
   * control reached `derived` only as passthroughs nothing read, so acute cellulitis and a severe
   * bacterial load painted the same untouched rectangle as a healthy tissue. */
  const rubor = clamp(derived.vasodilationIndex, 0, 1.6);
  const oedema = clamp(derived.permeabilityIndex, 0, 1.6);
  const severity = clamp(derived.insultSeverityPct / 100, 0, 1);
  const antibiotic = clamp(derived.antibioticEfficacyPct / 100, 0, 1);
  const sourceControl = clamp(derived.sourceControlPct / 100, 0, 1);
  const steroid = clamp(derived.steroidDosePct / 100, 0, 1);

  const neutH = (clamp(derived.neutrophilPopulation, 0, BAR_MAX) / BAR_MAX) * BAR.height;
  const monoH = (clamp(derived.monocyteMacrophageActivity, 0, BAR_MAX) / BAR_MAX) * BAR.height;
  const pusH = (clamp(derived.pusBurden, 0, BAR_MAX) / BAR_MAX) * BAR.height;

  const insultR = clamp(derived.insultLoad * 18, 2, 36);
  const neutCount = Math.round(clamp(derived.neutrophilPopulation * 6, 0, 12));
  const monoCount = Math.round(clamp(derived.monocyteMacrophageActivity * 4, 0, 8));

  const neutDots = Array.from({ length: neutCount }, (_, i) => {
    const angle = (i / Math.max(neutCount, 1)) * Math.PI * 2 + 0.3;
    const dist = 40 + (i % 3) * 15;
    return { cx: midX + Math.cos(angle) * dist, cy: midY + Math.sin(angle) * dist };
  });

  const monoDots = Array.from({ length: monoCount }, (_, i) => {
    const angle = (i / Math.max(monoCount, 1)) * Math.PI * 2 + 1.8;
    const dist = 50 + (i % 3) * 12;
    return { cx: midX + Math.cos(angle) * dist, cy: midY + Math.sin(angle) * dist };
  });

  const crystalTriangles = Array.from({ length: 5 }, (_, i) => ({
    x: midX + (i - 2) * 10,
    y: midY,
  }));

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 560, 440],
        ariaLabel: 'Inflammatory site and immune cell populations',
        children: [
          { type: 'text', x: TISSUE.x, y: TISSUE.y - 12, text: 'Tissue site', cls: 'label' },
          { type: 'rect', x: TISSUE.x, y: TISSUE.y, width: TISSUE.w, height: TISSUE.h, cls: 'tissue' },
          // Rubor: the site's own colour deepening with vasodilation.
          { type: 'rect', x: TISSUE.x, y: TISSUE.y, width: TISSUE.w, height: TISSUE.h, fill: 'danger', fillOpacity: rubor * 0.22 },
          /* Tumor: an oedematous margin inside the tissue border, its width the permeability. The
           * capillary leak is what swells the part, so the swelling is drawn as thickness. */
          {
            type: 'rect',
            x: TISSUE.x,
            y: TISSUE.y,
            width: TISSUE.w,
            height: TISSUE.h,
            fill: 'none',
            stroke: 'capillary',
            strokeWidth: Math.max(0.5, oedema * 7),
            fillOpacity: 0,
          },
          /* The insult as the size it was DEPOSITED at, not only the size it has grown to. A
           * severe insult is a bigger thing at the moment it lands, which is the difference between
           * acute cellulitis and a severe bacterial load before either has had time to run. */
          { type: 'circle', cx: midX, cy: midY, r: 3 + severity * 14, fill: 'danger', fillOpacity: 0.18, stroke: 'danger', strokeWidth: 1 },
          ...(derived.insultType === 'bacterial'
            ? [{ type: 'circle' as const, cx: midX, cy: midY, r: insultR, cls: 'insultBacteria' }]
            : []),
          ...(derived.insultType === 'sterileCrystal'
            ? crystalTriangles.map((c) => ({
                type: 'path' as const,
                d: `M${c.x},${c.y - 8} L${c.x + 5},${c.y + 4} L${c.x - 5},${c.y + 4} Z`,
                cls: 'insultCrystal',
              }))
            : []),
          ...(derived.insultType === 'foreignBody'
            ? [{ type: 'rect' as const, x: midX - insultR * 0.8, y: midY - 4, width: insultR * 1.6, height: 8, cls: 'insultForeign' }]
            : []),
          ...neutDots.map((n) => ({
            type: 'circle' as const,
            cx: n.cx,
            cy: n.cy,
            r: 3,
            cls: 'neutrophilDot',
          })),
          ...monoDots.map((m) => ({
            type: 'circle' as const,
            cx: m.cx,
            cy: m.cy,
            r: 4,
            cls: 'macrophageDot',
          })),
          ...(derived.pusBurden > 0.1
            ? [{ type: 'circle' as const, cx: midX, cy: midY + 30, r: clamp(derived.pusBurden * 25, 5, 60), cls: 'pusPool' }]
            : []),
          /* The three therapies, drawn as what they DO to the site rather than as numbers beside
           * it: an antibiotic wash across the insult, a drain leaving the pus pool, and a steroid
           * band damping the recruitment ring the cells arrive on. */
          ...(antibiotic > 0
            ? [{ type: 'circle' as const, cx: midX, cy: midY, r: 34, fill: 'ok', fillOpacity: antibiotic * 0.3 }]
            : []),
          ...(sourceControl > 0
            ? [{
                type: 'path' as const,
                d: `M${midX},${midY + 30} L${midX + 40 + sourceControl * 40},${midY + 66}`,
                colorToken: 'ok',
                strokeWidth: 1 + sourceControl * 3,
                strokeLinecap: 'round' as const,
                fill: 'none' as const,
              }]
            : []),
          ...(steroid > 0
            ? [{
                type: 'circle' as const,
                cx: midX,
                cy: midY,
                r: 62,
                fill: 'none' as const,
                stroke: 'text-dim',
                strokeWidth: 1 + steroid * 4,
                opacity: 0.5,
              }]
            : []),
          { type: 'text', x: TISSUE.x + 4, y: TISSUE.y + TISSUE.h + 18, text: '\u25CF neutrophils \u00B7 \u25CF macrophages', cls: 'caption' },
          { type: 'text', x: BAR.x - 10, y: BAR.y - 24, text: 'Cells & pus', cls: 'label' },
          { type: 'rect', x: BAR.x, y: BAR.y + BAR.height - neutH, width: BAR.width * 0.3, height: neutH, cls: 'neutBar' },
          { type: 'rect', x: BAR.x + BAR.width * 0.35, y: BAR.y + BAR.height - monoH, width: BAR.width * 0.3, height: monoH, cls: 'monoBar' },
          { type: 'rect', x: BAR.x + BAR.width * 0.7, y: BAR.y + BAR.height - pusH, width: BAR.width * 0.3, height: pusH, cls: 'pusBar' },
          { type: 'line', x1: BAR.x - 4, y1: BAR.y + BAR.height, x2: BAR.x + BAR.width + 4, y2: BAR.y + BAR.height, cls: 'axis' },
          { type: 'text', x: BAR.x + BAR.width * 0.15, y: BAR.y + BAR.height + 16, text: 'neut', cls: 'tickLabel', anchor: 'middle' },
          { type: 'text', x: BAR.x + BAR.width * 0.5, y: BAR.y + BAR.height + 16, text: 'mono', cls: 'tickLabel', anchor: 'middle' },
          { type: 'text', x: BAR.x + BAR.width * 0.85, y: BAR.y + BAR.height + 16, text: 'pus', cls: 'tickLabel', anchor: 'middle' },
          {
            type: 'text',
            x: 40,
            y: 310,
            text: `load ${derived.insultLoad.toFixed(2)} \u00B7 CRP ${derived.crpMgL.toFixed(0)} mg/L \u00B7 temp ${derived.coreTemperatureC.toFixed(1)} \u00B0C`,
            cls: 'caption',
          },
          {
            type: 'text',
            x: 40,
            y: 328,
            text: `neutrophils ${derived.neutrophilCount10e9PerL.toFixed(1)} \u00D710\u2079/L \u00B7 chronic ${(derived.chronicInflammationIndex * 100).toFixed(0)}%`,
            cls: 'caption',
          },
          ...(derived.sirsActive
            ? [{ type: 'text' as const, x: 40, y: 350, text: 'SIRS \u2014 systemic inflammatory response', cls: 'alarm' }]
            : []),
          { type: 'text', x: 40, y: 380, text: derived.classification, cls: 'verdict' },
          { type: 'text', x: 40, y: 400, text: derived.patternSummary, cls: 'caption' },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Insult severity', key: 'insultSeverityPct', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Innate immunity', key: 'innateImmuneFunctionPct', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Antibiotic efficacy', key: 'antibioticEfficacyPct', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Steroid dose', key: 'steroidDosePct', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Source control', key: 'sourceControlPct', min: 0, max: 100, step: 5, unit: '%' },
      {
        kind: 'toggle',
        label: 'Insult type',
        key: 'insultType',
        options: [
          { value: 'bacterial', label: 'Bacteria' },
          { value: 'sterileCrystal', label: 'Crystal' },
          { value: 'foreignBody', label: 'Foreign body' },
        ],
        colorToken: 'danger',
      },
    ],
    readouts: [
      {
        label: 'Cardinal signs',
        value: (c) => `${(c.derived.vasodilationIndex * 100).toFixed(0)}%`,
        secondary: () => 'rubor \u00B7 calor \u00B7 tumor \u00B7 dolor',
        colorToken: 'text',
      },
      {
        label: 'Neutrophils',
        value: (c) => c.derived.neutrophilCount10e9PerL.toFixed(1),
        unit: '\u00D710\u2079/L',
        secondary: (c) =>
          c.derived.neutrophilCount10e9PerL > ACUTE.NEUTROPHILIA_THRESHOLD_10E9
            ? 'neutrophilia'
            : c.derived.neutrophilCount10e9PerL < 4
              ? 'neutropenia'
              : 'normal range',
        colorToken: 'text',
      },
      {
        label: 'CRP',
        value: (c) => c.derived.crpMgL.toFixed(0),
        unit: 'mg/L',
        secondary: (c) => (c.derived.crpMgL > 100 ? 'markedly raised' : c.derived.crpMgL > 20 ? 'raised' : 'normal'),
        colorToken: 'danger',
      },
      {
        label: 'Temperature',
        value: (c) => c.derived.coreTemperatureC.toFixed(1),
        unit: '\u00B0C',
        secondary: (c) => feverVerdict(c.derived.coreTemperatureC),
        colorToken: 'text',
      },
      {
        label: 'Pus',
        value: (c) => c.derived.pusBurden.toFixed(2),
        secondary: (c) => (c.derived.pusBurden > ACUTE.ABSCESS_PUS_THRESHOLD ? 'abscess forming' : 'draining'),
        colorToken: 'text',
      },
      {
        label: 'Load',
        value: (c) => c.derived.insultLoad.toFixed(2),
        secondary: (c) => loadVerdict(c.derived.insultLoad),
        colorToken: 'danger',
      },
      {
        label: 'Chronic',
        value: (c) => `${(c.derived.chronicInflammationIndex * 100).toFixed(0)}%`,
        secondary: (c) => (c.derived.chronicInflammationIndex > 0.4 ? 'organised' : 'acute phase'),
        colorToken: 'text',
      },
      {
        label: 'State',
        value: (c) => c.derived.classification,
        secondary: (c) => c.derived.patternSummary,
        colorToken: 'text',
        revealsPattern: true,
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Bacterial load',
        colorToken: 'danger',
        domainMin: 0,
        domainMax: 2.4,
        data: (points) => points.map((p) => p.insultLoad),
      },
      {
        kind: 'sparkline',
        label: 'CRP',
        unit: 'mg/L',
        colorToken: 'artery',
        domainMin: 0,
        domainMax: 320,
        data: (points) => points.map((p) => p.crpMgL),
      },
      {
        kind: 'sparkline',
        label: 'Neutrophils',
        unit: '\u00D710\u2079/L',
        colorToken: 'o2',
        domainMin: 0,
        domainMax: 30,
        data: (points) => points.map((p) => p.neutrophilCount10e9PerL),
      },
    ],
  };
}
