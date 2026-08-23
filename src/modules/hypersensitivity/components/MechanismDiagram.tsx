import type { CSSProperties } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import styles from './Diagram.module.css';
import type { HypersensitivityDerived } from '../engine/types';

interface MechanismDiagramProps {
  derived: HypersensitivityDerived;
}

/**
 * The four mechanisms side by side, each lighting up in proportion to how much of the damage
 * it is currently doing.
 *
 * Drawn as four separate targets on purpose, because what differs between the types is WHERE
 * the antigen is and WHAT gets injured, not how severe the illness is. Type II and type III
 * use the same antibody and the same complement; the only difference is that one antigen is
 * stuck to a cell and the other is floating in plasma — and that single fact decides whether
 * the patient haemolyses or gets a vasculitis.
 */
export function MechanismDiagram({ derived }: MechanismDiagramProps) {
  const style = {
    '--arm-i': derived.armActivity.I.toFixed(3),
    '--arm-ii': derived.armActivity.II.toFixed(3),
    '--arm-iii': derived.armActivity.III.toFixed(3),
    '--arm-iv': derived.armActivity.IV.toFixed(3),
  } as CSSProperties;

  return (
    <DiagramFrame
      viewBox="0 0 480 220"
      ariaLabel={`The four hypersensitivity mechanisms, each shaded by how much of the current injury it is causing. Dominant mechanism: ${derived.mechanismSummary}`}
    >
      <g style={style}>
        {/* --- Type I: mast cell with granules, degranulating --- */}
        <text className={styles.armTitle} x={60} y={26}>
          Type I
        </text>
        <circle className={styles.mastCell} cx={60} cy={78} r={30} />
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i / 5) * Math.PI * 2;
          const spread = 1 + derived.armActivity.I * 1.6;
          return (
            <circle
              key={i}
              className={styles.granule}
              cx={60 + Math.cos(angle) * 14 * spread}
              cy={78 + Math.sin(angle) * 14 * spread}
              r={3.2}
              opacity={0.4 + derived.armActivity.I * 0.6}
            />
          );
        })}
        <text className={styles.armCaption} x={60} y={128}>
          preformed granules
        </text>
        <text className={styles.armCaption} x={60} y={140}>
          minutes
        </text>
        <text className={styles.armCaption} x={60} y={158}>
          wheal {derived.whealMm.toFixed(0)} mm
        </text>
        <text className={styles.armCaption} x={60} y={170}>
          tryptase {derived.tryptaseNgMl.toFixed(0)}
        </text>

        {/* --- Type II: antibody on a cell surface, cell destroyed --- */}
        <text className={styles.armTitle} x={180} y={26}>
          Type II
        </text>
        <circle className={styles.targetCell} cx={180} cy={78} r={30} />
        {[-1, 0, 1].map((i) => (
          <path
            key={i}
            className={styles.antibody}
            stroke="var(--cytotoxic-ab)"
            opacity={0.25 + derived.boundToCellSurface * 0.75}
            d={`M${180 + i * 18},${48 - 10} l-5,10 m5,-10 l5,10 m-5,0 v6`}
          />
        ))}
        <text className={styles.armCaption} x={180} y={128}>
          antigen ON the cell
        </text>
        <text className={styles.armCaption} x={180} y={140}>
          hours
        </text>
        <text className={styles.armCaption} x={180} y={158}>
          Coombs {derived.directCoombs > 0.25 ? 'positive' : 'negative'}
        </text>
        <text className={styles.armCaption} x={180} y={170}>
          hapto {derived.haptoglobinMgDl.toFixed(0)}
        </text>

        {/* --- Type III: complexes deposited in a vessel wall --- */}
        <text className={styles.armTitle} x={300} y={26}>
          Type III
        </text>
        <path className={styles.vesselWall} d="M270,52 h60 v52 h-60 z" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle
            key={i}
            cx={276 + (i % 3) * 24}
            cy={62 + Math.floor(i / 3) * 30}
            r={2.6 + derived.immuneComplexDeposition * 2.4}
            fill="var(--immune-complex)"
            opacity={0.2 + derived.immuneComplexDeposition * 0.8}
          />
        ))}
        <text className={styles.armCaption} x={300} y={128}>
          antigen IN the plasma
        </text>
        <text className={styles.armCaption} x={300} y={140}>
          hours to days
        </text>
        <text className={styles.armCaption} x={300} y={158}>
          C3 {derived.c3MgDl.toFixed(0)} · C4 {derived.c4MgDl.toFixed(0)}
        </text>
        <text className={styles.armCaption} x={300} y={170}>
          Coombs negative
        </text>

        {/* --- Type IV: T cells and macrophages infiltrating tissue --- */}
        <text className={styles.armTitle} x={420} y={26}>
          Type IV
        </text>
        <path className={styles.tissueSite} d="M390,52 h60 v52 h-60 z" />
        {[0, 1, 2, 3, 4].map((i) => {
          const arrive = derived.tCellRecruitment;
          return (
            <circle
              key={i}
              cx={396 + i * 13}
              cy={78 - (1 - arrive) * 26}
              r={3.4}
              fill="var(--delayed-type)"
              opacity={0.25 + arrive * 0.75}
            />
          );
        })}
        <text className={styles.armCaption} x={420} y={128}>
          no antibody at all
        </text>
        <text className={styles.armCaption} x={420} y={140}>
          days
        </text>
        <text className={styles.armCaption} x={420} y={158}>
          induration {derived.indurationMm.toFixed(0)} mm
        </text>
        <text className={styles.armCaption} x={420} y={170}>
          C3 / C4 normal
        </text>

        <text className={styles.pathLabel} x={22} y={198}>
          Same antigen, same host, four different injuries — the difference is which arm answers
        </text>
        <text className={styles.pathLabel} x={22} y={212}>
          Antigen: soluble {(derived.solubleAntigen * 100).toFixed(0)}% · fixed to tissue{' '}
          {(derived.fixedAntigen * 100).toFixed(0)}%
        </text>
      </g>
    </DiagramFrame>
  );
}
