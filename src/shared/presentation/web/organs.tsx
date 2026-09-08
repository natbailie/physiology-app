import type { CSSProperties, ReactElement } from 'react';
import { LIVER_PATH, PANCREAS_PATH } from '@/shared/diagram/organShapes';
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

/** Positions of the alveolar units drawn inside each lung, in the lung path's own coordinates. */

/* The legacy per-platform organ registry, now down to the two glucoseRegulation still uses.
 * Nothing should be added: new anatomy goes in `src/shared/diagram/organShapes.ts` as a scene
 * builder, so it is drawn once for the web and the phone rather than twice. */
export const ORGANS: Record<OrganName, (props: OrganProps) => ReactElement> = {
  pancreas: Pancreas,
  liver: Liver,
};