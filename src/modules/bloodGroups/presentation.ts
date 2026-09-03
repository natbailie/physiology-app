import { clamp } from '@/shared/lib/math';
import { ABO } from './engine/constants';
import { aboMajorIncompatible } from './engine/bloodMechanics';
import type {
  BloodDerived,
  BloodHistoryPoint,
  BloodInputs,
  BloodInternalState,
} from './engine/types';
import type { ModulePresentation, PresentationContext, SceneNode } from '@/shared/presentation/types';

type Ctx = PresentationContext<BloodInternalState, BloodDerived, BloodInputs, BloodHistoryPoint>;

/* The legacy diagram is not anatomy but a decision aid: an ABO compatibility matrix (donor
 * columns vs recipient rows, with the incompatible cells and the current pair highlighted) next
 * to the two reaction timelines (immediate IgM intravascular vs delayed IgG extravascular) with
 * live severity marked. It needs no organ, so it is drawn entirely with primitives. */

const GRID = { x: 44, y: 66, cell: 52 };
const PLOT = { x: 330, y: 70, width: 200, height: 120 };

/** A rectangle outline path — the matrix cell border, since a schema rect can only carry a fill. */
function ringPath(x: number, y: number, w: number, h: number): string {
  return `M${x},${y}H${x + w}V${y + h}H${x}Z`;
}

export function buildBloodGroupsPresentation(ctx: Ctx): ModulePresentation<BloodInternalState, BloodDerived, BloodInputs, BloodHistoryPoint> {
  const { derived, inputs } = ctx;
  const severity = clamp(derived.haemolyticSeverity, 0, 100) / 100;

  // Both reaction arms are drawn as fixed shapes whose height follows severity; the opacity that
  // used to say which arm is live is expressed here as stroke width (the live arm is the thick one)
  // because the shared schema has no per-path opacity field.
  const aboPath = `M${PLOT.x},${PLOT.y + PLOT.height} C ${PLOT.x + 40},${PLOT.y + PLOT.height - severity * PLOT.height * 0.9} ${PLOT.x + 60},${PLOT.y - severity * PLOT.height * 0.2} ${PLOT.x + 90},${PLOT.y}`;
  const rhPath = `M${PLOT.x},${PLOT.y + PLOT.height} q 60 0 100 -${severity * PLOT.height * 0.5} t 100 -${severity * PLOT.height * 0.4}`;

  const aboActive = derived.aboIncompatible;
  const rhActive = derived.rhIncompatible && derived.reactionArm.startsWith('delayed');

  const cells: SceneNode[] = [];
  for (let ri = 0; ri < ABO.NAMES.length; ri++) {
    const cellY = GRID.y + 18 + ri * GRID.cell;
    for (let di = 0; di < ABO.NAMES.length; di++) {
      const bad = aboMajorIncompatible(ri, di);
      const current = inputs.recipientAboIndex === ri && inputs.donorAboIndex === di;
      const x = GRID.x + di * GRID.cell;
      const y = cellY;
      if (current) {
        cells.push({
          type: 'path',
          d: ringPath(x, y, GRID.cell - 4, GRID.cell - 4),
          colorToken: 'transfusion',
          fill: 'none',
          strokeWidth: 3,
        });
      } else {
        cells.push(
          {
            type: 'rect',
            x,
            y,
            width: GRID.cell - 4,
            height: GRID.cell - 4,
            fill: bad ? 'danger' : 'ok',
          },
          {
            type: 'path',
            d: ringPath(x, y, GRID.cell - 4, GRID.cell - 4),
            colorToken: 'panel-border',
            fill: 'none',
            strokeWidth: 0.5,
          },
        );
      }
    }
  }

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 560, 440],
        ariaLabel: 'ABO compatibility matrix and the two haemolysis reaction timelines (immediate IgM versus delayed IgG) with the current severity marked',
        children: [
          { type: 'text', x: GRID.x, y: GRID.y - 12, text: 'Donor (columns) → recipient (rows)', cls: 'label' },
          ...ABO.NAMES.map((donor, di) => ({
            type: 'text' as const,
            x: GRID.x + di * GRID.cell + 20,
            y: GRID.y + 12,
            text: donor,
            cls: 'tickLabel',
            anchor: 'middle' as const,
          })),
          ...ABO.NAMES.map((recipient, ri) => ({
            type: 'text' as const,
            x: GRID.x - 14,
            y: GRID.y + ri * GRID.cell + 32,
            text: recipient,
            cls: 'tickLabel',
            anchor: 'end' as const,
          })),
          ...cells,
          { type: 'rect', x: PLOT.x, y: PLOT.y, width: PLOT.width, height: PLOT.height, cls: 'axis', fill: 'none' },
          { type: 'path', d: aboPath, colorToken: 'transfusion', fill: 'none', strokeWidth: aboActive ? 2.5 : 1 },
          { type: 'path', d: rhPath, colorToken: 'warn', fill: 'none', strokeWidth: rhActive ? 2 : 1 },
          {
            type: 'circle',
            cx: derived.aboIncompatible ? PLOT.x + 90 : PLOT.x + 170,
            cy: derived.aboIncompatible ? PLOT.y : PLOT.y + PLOT.height - severity * PLOT.height * 0.55,
            r: 5,
            fill: 'transfusion',
          },
          { type: 'text', x: PLOT.x, y: PLOT.y - 12, text: 'Haemolysis vs time', cls: 'label' },
          { type: 'text', x: PLOT.x, y: PLOT.y + PLOT.height + 16, text: 'minutes (IgM) · days (IgG) →', cls: 'caption' },
          { type: 'text', x: 44, y: 300, text: `crossmatch: ${derived.crossmatchVerdict}`, cls: 'caption' },
          {
            type: 'text',
            x: 44,
            y: 322,
            text: `free Hb ${derived.plasmaFreeHaemoglobin.toFixed(0)} · complement consumed ${derived.complementConsumedPct.toFixed(0)}% · haemoglobinuria ${derived.haemoglobinuriaPct.toFixed(0)}%`,
            cls: 'caption',
          },
          ...(derived.dicRiskPct > 30 || derived.renalInjuryRiskPct > 30
            ? [
                {
                  type: 'text' as const,
                  x: 44,
                  y: 352,
                  text: `DIC risk ${derived.dicRiskPct.toFixed(0)}% · renal injury ${derived.renalInjuryRiskPct.toFixed(0)}% — stop the unit NOW`,
                  cls: 'alarm',
                },
              ]
            : []),
          { type: 'text', x: 44, y: 386, text: derived.classification, cls: 'verdict' },
          { type: 'text', x: 44, y: 406, text: derived.patternSummary, cls: 'caption' },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Recipient ABO type', key: 'recipientAboIndex', min: 0, max: 3, step: 1 },
      { kind: 'slider', label: 'Recipient Rh', key: 'recipientRhPositive', min: 0, max: 1, step: 1 },
      { kind: 'slider', label: 'Donor ABO type', key: 'donorAboIndex', min: 0, max: 3, step: 1 },
      { kind: 'slider', label: 'Donor Rh', key: 'donorRhPositive', min: 0, max: 1, step: 1 },
      { kind: 'slider', label: 'Previously Rh-sensitised', key: 'rhSensitised', min: 0, max: 1, step: 1 },
      { kind: 'slider', label: 'Volume transfused', key: 'transfusionVolumeMl', min: 0, max: 500, step: 10, unit: ' mL' },
      { kind: 'slider', label: 'Maternal-fetal scenario (HDN)', key: 'hdnScenario', min: 0, max: 1, step: 1 },
      { kind: 'slider', label: 'Fetus Rh', key: 'fetusRhPositive', min: 0, max: 1, step: 1 },
      { kind: 'slider', label: 'Anti-D coverage', key: 'antiDProtectionPct', min: 0, max: 100, step: 5, unit: '%' },
    ],
    readouts: [
      {
        label: 'Crossmatch',
        value: (c) =>
          c.derived.crossmatchVerdict.startsWith('Major')
            ? 'Major mismatch'
            : c.derived.crossmatchVerdict.startsWith('Rh')
              ? 'Rh mismatch'
              : 'compatible',
        secondary: (c) => `${c.derived.donorType} unit into ${c.derived.recipientType} recipient`,
        colorToken: derived.crossmatchVerdict.startsWith('Major') ? 'danger' : 'ok',
      },
      {
        label: 'Reaction arm',
        value: (c) =>
          c.derived.reactionArm === 'none'
            ? 'none'
            : c.derived.reactionArm.startsWith('immediate')
              ? 'intravascular IgM'
              : c.derived.reactionArm.startsWith('delayed')
                ? 'extravascular IgG'
                : 'placental IgG',
        secondary: (c) =>
          c.derived.hdnScenario > 0.5
            ? c.derived.reactionArm.startsWith('fetal')
              ? 'maternal IgG crossing the placenta'
              : 'fetus not exposed to anti-D'
            : c.derived.aboIncompatible
              ? 'preformed antibodies — minutes'
              : c.derived.rhIncompatible
                ? 'acquired antibodies — days'
                : 'no antigen meeting',
        colorToken: 'transfusion',
      },
      {
        label: 'Haemolysis',
        value: (c) => c.derived.haemolyticSeverity.toFixed(0),
        unit: '% severity',
        secondary: (c) => (c.derived.haemolyticSeverity > 5 ? 'cells being destroyed' : 'cells surviving'),
        colorToken: 'hemoglobin',
      },
      {
        label: 'Free haemoglobin',
        value: (c) => c.derived.plasmaFreeHaemoglobin.toFixed(0),
        secondary: (c) => (c.derived.plasmaFreeHaemoglobin > 20 ? 'intravascular — the ABO signature' : 'plasma clear (extravascular or none)'),
        colorToken: 'danger',
      },
      {
        label: 'Complement consumed',
        value: (c) => c.derived.complementConsumedPct.toFixed(0),
        unit: '%',
        secondary: () => 'IgM fixes it; IgG barely does',
        colorToken: 'complement',
      },
      {
        label: 'DIC risk',
        value: (c) => c.derived.dicRiskPct.toFixed(0),
        unit: '%',
        secondary: () => 'thrombin generation from massive haemolysis',
        colorToken: 'fibrin',
      },
      {
        label: 'Renal injury',
        value: (c) => c.derived.renalInjuryRiskPct.toFixed(0),
        unit: '%',
        secondary: () => 'free Hb + shock = tubular damage',
        colorToken: 'kidney',
      },
      {
        label: 'Haemoglobinuria',
        value: (c) => c.derived.haemoglobinuriaPct.toFixed(0),
        unit: '%',
        secondary: () => 'dark urine once free Hb spills over',
        colorToken: 'urine',
      },
      {
        label: 'Fetal haemoglobin',
        value: (c) => c.derived.fetalHaemoglobinGDl.toFixed(1),
        unit: 'g/dL',
        secondary: (c) => (c.derived.hdnScenario > 0.5 ? (c.derived.fetalHaemoglobinGDl < 10 ? 'anaemic — consider transfusion' : 'healthy range') : 'HDN scenario'),
        colorToken: 'hemoglobin',
      },
      {
        label: 'Cord bilirubin',
        value: (c) => c.derived.cordBilirubinUmolL.toFixed(0),
        unit: 'µmol/L',
        secondary: () => 'the kernicterus number',
        colorToken: 'liver',
      },
      {
        label: 'Hydrops risk',
        value: (c) => c.derived.hydropsRiskPct.toFixed(0),
        unit: '%',
        secondary: () => 'fetal failure from severe anaemia',
        colorToken: 'danger',
      },
      {
        label: 'Next pregnancy risk',
        value: (c) => c.derived.nextPregnancySensitisationRiskPct.toFixed(0),
        unit: '%',
        secondary: () => 'if anti-D is missed at this delivery',
        colorToken: 'transfusion',
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
        label: 'Haemolytic severity',
        unit: '%',
        colorToken: 'transfusion',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.severity),
      },
      {
        kind: 'sparkline',
        label: 'Plasma free haemoglobin',
        colorToken: 'danger',
        domainMin: 0,
        domainMax: 350,
        data: (points) => points.map((p) => p.freeHb),
      },
    ],
  };
}
