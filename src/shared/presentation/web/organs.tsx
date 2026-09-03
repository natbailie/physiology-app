import type { CSSProperties, ReactElement } from 'react';
import { LIVER_PATH, KIDNEY_PATH, PANCREAS_PATH } from '@/shared/diagram/organShapes';
import type { OrganName, StyleVars } from '../types';

/**
 * The web organ registry. Each organ is the hand-written SVG that a module used to inline in its
 * own component, ported verbatim and parameterised the same way — x, y, a handful of measured
 * quantities, and the CSS-module classes to paint them with. `params` values become CSS custom
 * properties (the engine's `--gfr-intensity`, `--hco3-intensity` ...) exactly as the old style objects
 * did, so the DOM matches the legacy component attribute for attribute.
 *
 * Nothing here is meant to be re-authored for the native app: the native renderer draws the same
 * ORGAN nodes through its own organ components.
 */

export interface OrganClasses {
  pancreasShape?: string;
  betaIslet?: string;
  alphaIslet?: string;
  isletLabel?: string;
  liverShape?: string;
  glycogenFill?: string;
  heart?: string;
  heartShape?: string;
  kidneyShape?: string;
  urineFlow?: string;
  trachea?: string;
  lungs?: string;
  lungShape?: string;
  alveolus?: string;
  alveolusMismatched?: string;
  organLabel: string;
  pathLabel?: string;
}

export interface OrganProps {
  x: number;
  y: number;
  params: Readonly<Record<string, number>>;
  classes: OrganClasses;
}

function toStyleVars(vars: StyleVars): CSSProperties {
  return Object.fromEntries(Object.entries(vars).map(([key, value]) => [`--${key}`, value])) as CSSProperties;
}

function Pancreas({ x, y, params, classes }: OrganProps) {
  const style = toStyleVars({
    'insulin-level': params.insulinLevel ?? 0,
    'glucagon-level': params.glucagonLevel ?? 0,
  });
  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <path className={classes.pancreasShape} d={PANCREAS_PATH} />
      <circle className={classes.betaIslet} cx={-12} cy={-3} r={7} />
      <circle className={classes.alphaIslet} cx={12} cy={-1} r={6} />
      <text className={classes.isletLabel} x={-12} y={-14}>
        β
      </text>
      <text className={classes.isletLabel} x={12} y={-12}>
        α
      </text>
      <text className={classes.organLabel} y={26}>
        Pancreas
      </text>
    </g>
  );
}

// Liver shape spans roughly y=-26..26; the glycogen level fills upward from the base.
const LIVER_TOP = -26;
const LIVER_BOTTOM = 26;
const LIVER_HEIGHT = LIVER_BOTTOM - LIVER_TOP;

function Liver({ x, y, params, classes }: OrganProps) {
  const style = toStyleVars({ 'hepatic-output': params.hepaticOutput ?? 0 });
  const fillHeight = LIVER_HEIGHT * (params.glycogenReserve ?? 0);
  const clipId = `liver-glycogen-clip-${Math.round(x)}-${Math.round(y)}`;
  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <clipPath id={clipId}>
        <path d={LIVER_PATH} />
      </clipPath>
      <path className={classes.liverShape} d={LIVER_PATH} />
      <rect
        className={classes.glycogenFill}
        clipPath={`url(#${clipId})`}
        x={-42}
        y={LIVER_BOTTOM - fillHeight}
        width={84}
        height={fillHeight}
      />
      <text className={classes.organLabel} y={44}>
        Liver
      </text>
    </g>
  );
}

const HEART_PATH = 'M0,-12 C-16,-28 -40,-12 -40,8 C-40,28 -16,36 0,48 C16,36 40,28 40,8 C40,-12 16,-28 0,-12 Z';

function Heart({ x, y, params, classes }: OrganProps) {
  const style = toStyleVars({ 'hr-bpm': params.heartRate ?? 70, 'sv-scale': params.strokeVolumeScale ?? 1 });
  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <g className={classes.heart}>
        <path className={classes.heartShape} d={HEART_PATH} />
      </g>
      <text className={classes.organLabel} y={68}>
        Heart
      </text>
    </g>
  );
}

function Kidneys({ x, y, params, classes }: OrganProps) {
  const style = toStyleVars({ 'gfr-intensity': params.gfrIntensity ?? 1, 'urine-speed': params.urineSpeed ?? 0.5 });
  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <g transform="translate(0, -22)">
        <path className={classes.kidneyShape} d={KIDNEY_PATH} />
      </g>
      <g transform="translate(0, 24) scale(-1, 1)">
        <path className={classes.kidneyShape} d={KIDNEY_PATH} />
      </g>
      <path className={classes.urineFlow} d="M0,68 L0,96" />
      <text className={classes.pathLabel} x={14} y={90}>
        urine
      </text>
      <text className={classes.organLabel} y={112}>
        Kidneys
      </text>
    </g>
  );
}

const LUNG_PATH =
  'M0,-38 C18,-40 30,-14 28,14 C26,38 14,50 0,50 C-2,50 -4,49 -6,48 C-16,42 -24,26 -24,4 C-24,-20 -14,-38 0,-38 Z';

/** Positions of the alveolar units drawn inside each lung, in the lung path's own coordinates. */
const UNITS = [
  { x: -6, y: -22 },
  { x: 6, y: -6 },
  { x: -8, y: 6 },
  { x: 4, y: 20 },
  { x: -4, y: 34 },
];

function Lungs({ x, y, params, classes }: OrganProps) {
  const style = toStyleVars({ 'breath-rate': params.breathRate ?? 14, 'vent-depth': params.ventDepth ?? 1 });
  // Which units have dropped out. Rounded so the count steps visibly as the slider moves rather
  // than fading, because a shunted alveolus is not a partly shunted one.
  const deadUnits = Math.round((params.vqMismatch ?? 0) * UNITS.length);
  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <path className={classes.trachea} d="M0,-56 L0,-8" />
      <g className={classes.lungs}>
        <path className={classes.lungShape} d={LUNG_PATH} transform="translate(-20, 0)" />
        <path className={classes.lungShape} d={LUNG_PATH} transform="translate(20, 0) scale(-1, 1)" />
        {[-20, 20].map((side) =>
          UNITS.map((unit, index) => (
            <circle
              // eslint-disable-next-line react/no-array-index-key -- one circle per fixed alveolar unit
              key={`${side}-${index}`}
              className={index < deadUnits ? classes.alveolusMismatched : classes.alveolus}
              cx={side + unit.x * (side < 0 ? 1 : -1)}
              cy={unit.y}
              r={4}
            />
          )),
        )}
      </g>
      <text className={classes.organLabel} y={66}>
        Lungs
      </text>
    </g>
  );
}

function RenalCompensation({ x, y, params, classes }: OrganProps) {
  const style = toStyleVars({ 'hco3-intensity': params.hco3Intensity ?? 0.5 });
  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <g transform="translate(0, -22)">
        <path className={classes.kidneyShape} d={KIDNEY_PATH} />
      </g>
      <g transform="translate(0, 24) scale(-1, 1)">
        <path className={classes.kidneyShape} d={KIDNEY_PATH} />
      </g>
      <text className={classes.organLabel} y={54}>
        Kidneys
      </text>
    </g>
  );
}

export const ORGANS: Record<OrganName, (props: OrganProps) => ReactElement> = {
  pancreas: Pancreas,
  liver: Liver,
  heart: Heart,
  kidneys: Kidneys,
  lungs: Lungs,
  renalCompensation: RenalCompensation,
};