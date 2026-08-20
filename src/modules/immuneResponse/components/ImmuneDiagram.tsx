import type { CSSProperties } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { clamp } from '@/shared/lib/math';
import { CYTOKINES } from '../engine/constants';
import styles from './Diagram.module.css';
import type { ImmuneDerived } from '../engine/types';

interface ImmuneDiagramProps {
  derived: ImmuneDerived;
}

const PATHOGEN_DOTS = [
  { cx: -22, cy: -10 },
  { cx: -6, cy: 6 },
  { cx: 14, cy: -14 },
  { cx: 24, cy: 8 },
  { cx: 0, cy: -22 },
  { cx: -30, cy: 12 },
];

const INNATE_CELLS = [
  { cx: -34, cy: -22 },
  { cx: 30, cy: -24 },
  { cx: -14, cy: 22 },
];

/** Antibody drawn as small Y-shaped marks around the infection site. */
const ANTIBODY_MARKS = [
  'M-40,2 l0,-6 m0,6 l-4,4 m4,-4 l4,4',
  'M8,20 l0,-6 m0,6 l-4,4 m4,-4 l4,4',
  'M34,-4 l0,-6 m0,6 l-4,4 m4,-4 l4,4',
];

const MEMORY_CELLS = [
  { cx: -14, cy: 16 },
  { cx: 6, cy: 20 },
  { cx: -3, cy: 4 },
];

export function ImmuneDiagram({ derived }: ImmuneDiagramProps) {
  const siteStyle = {
    '--pathogen-load': clamp(derived.pathogenLoad, 0, 1),
    '--innate-level': clamp(derived.innateActivity, 0, 1),
    '--antibody-level': clamp(derived.igmTitre * 0.4 + derived.iggTitre, 0, 1),
  } as CSSProperties;

  const nodeStyle = {
    '--adaptive-level': clamp(Math.max(derived.helperTActivity, derived.bCellActivity), 0, 1),
    '--memory-level': clamp(derived.memoryLevel, 0, 1),
  } as CSSProperties;

  const traffickingStyle = { '--presentation': clamp(derived.antigenPresentation, 0, 1) } as CSSProperties;
  const febrile = derived.temperatureC > CYTOKINES.NORMAL_TEMPERATURE_C + 0.8;

  return (
    <DiagramFrame
      viewBox="0 0 480 300"
      ariaLabel="Diagram of the immune response: pathogen and innate cells at the infection site, dendritic cells trafficking antigen to a lymph node where T and B cells are primed, and antibody plus memory cells persisting afterward"
    >
      {/* --- Infection site --- */}
      <text className={styles.organLabel} x={112} y={40}>
        Infection site
      </text>
      <g transform="translate(112, 118)" style={siteStyle}>
        <ellipse className={styles.tissueSite} rx={62} ry={46} />
        {PATHOGEN_DOTS.map((dot) => (
          <circle key={`${dot.cx},${dot.cy}`} className={styles.pathogenDot} cx={dot.cx} cy={dot.cy} r={4} />
        ))}
        {INNATE_CELLS.map((cell) => (
          <circle key={`${cell.cx},${cell.cy}`} className={styles.innateCell} cx={cell.cx} cy={cell.cy} r={7} />
        ))}
        {ANTIBODY_MARKS.map((d) => (
          <path key={d} className={styles.antibodyMark} d={d} />
        ))}
      </g>
      <text className={styles.pathLabel} x={54} y={180}>
        Load {(derived.pathogenLoad * 100).toFixed(0)}% · innate {(derived.innateActivity * 100).toFixed(0)}%
      </text>

      {/* --- Dendritic trafficking to the node: the delay that makes a primary response slow --- */}
      <g style={traffickingStyle}>
        <path className={styles.traffickingPath} d="M178,110 C230,92 270,92 306,102" />
      </g>
      <text className={styles.pathLabel} x={202} y={84}>
        antigen presentation
      </text>

      {/* --- Lymph node --- */}
      <text className={styles.organLabel} x={356} y={40}>
        Lymph node
      </text>
      <g transform="translate(356, 116)" style={nodeStyle}>
        <ellipse className={styles.lymphNode} rx={48} ry={38} />
        <circle
          className={styles.lymphocyte}
          cx={-18}
          cy={-8}
          r={7}
          fill={`color-mix(in srgb, var(--adaptive) ${(15 + derived.helperTActivity * 70).toFixed(0)}%, transparent)`}
          stroke="var(--adaptive)"
        />
        <circle
          className={styles.lymphocyte}
          cx={16}
          cy={-12}
          r={7}
          fill={`color-mix(in srgb, var(--antibody) ${(15 + derived.bCellActivity * 70).toFixed(0)}%, transparent)`}
          stroke="var(--antibody)"
        />
        {MEMORY_CELLS.map((cell) => (
          <circle key={`${cell.cx},${cell.cy}`} className={styles.memoryCell} cx={cell.cx} cy={cell.cy} r={5} />
        ))}
        <text className={styles.pathLabel} x={-18} y={-20} textAnchor="middle">
          Th
        </text>
        <text className={styles.pathLabel} x={16} y={-24} textAnchor="middle">
          B
        </text>
      </g>
      <text className={styles.pathLabel} x={300} y={172}>
        Memory {(derived.memoryLevel * 100).toFixed(0)}%
      </text>

      <text className={styles.phaseBadge} x={22} y={228}>
        {derived.responsePhase}
      </text>
      <text className={styles.valueLabel} x={22} y={246}>
        IgM {(derived.igmTitre * 100).toFixed(0)}% · IgG {(derived.iggTitre * 100).toFixed(0)}% · Tc{' '}
        {(derived.cytotoxicTActivity * 100).toFixed(0)}%
      </text>
      <text className={styles.valueLabel} x={22} y={262}>
        {derived.daysSinceChallenge >= 0 ? `Day ${derived.daysSinceChallenge.toFixed(1)}` : 'No challenge'} ·{' '}
        {derived.clearanceTimeDays > 0 ? `cleared in ${derived.clearanceTimeDays.toFixed(1)}d` : 'not cleared'}
      </text>
      <text className={febrile ? styles.feverBadge : styles.valueLabel} x={22} y={280}>
        {derived.temperatureC.toFixed(1)}&deg;C{febrile ? ' — febrile' : ''}
      </text>
    </DiagramFrame>
  );
}
