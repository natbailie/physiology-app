import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { HeartConduction } from './HeartConduction';
import { HexaxialInset } from './HexaxialInset';
import { HorizontalPlaneInset } from './HorizontalPlaneInset';
import styles from './Diagram.module.css';
import type { EcgDerived } from '../engine/types';

interface EcgDiagramProps {
  derived: EcgDerived;
}

export function EcgDiagram({ derived }: EcgDiagramProps) {
  return (
    <DiagramFrame
      viewBox="0 0 480 300"
      ariaLabel="Animated diagram of cardiac activation: the depolarisation wavefront sweeping the atria, conduction system and ventricles, alongside a hexaxial reference and a horizontal-plane reference showing the instantaneous electrical vector and the selected lead axis"
    >
      <HeartConduction x={128} y={126} regions={derived.regions} />

      {/* Two planes, one vector. The limb leads measure its shadow on the frontal plane and the
          chest leads its shadow on the horizontal one, which is why a finding can be invisible
          in one picture and unmissable in the other. */}
      <HexaxialInset
        x={306}
        y={84}
        radius={42}
        selectedLead={derived.lead}
        dipoleAngleDegrees={derived.dipoleAngleDegrees}
        dipoleMagnitude={derived.dipoleMagnitude}
        meanQrsAxisDegrees={derived.meanQrsAxisDegrees}
      />
      <text className={styles.insetCaption} x={306} y={152}>
        Frontal · limb
      </text>

      <HorizontalPlaneInset
        x={422}
        y={84}
        radius={42}
        selectedLead={derived.lead}
        horizontalAngleDegrees={derived.horizontalAngleDegrees}
        dipoleMagnitude={derived.dipoleMagnitude}
      />
      <text className={styles.insetCaption} x={422} y={152}>
        Horizontal · chest
      </text>

      <text className={styles.segmentBadge} x={22} y={252}>
        {derived.currentSegment}
      </text>
      <text className={styles.valueLabel} x={22} y={272}>
        {derived.ecgVoltageMv >= 0 ? '+' : ''}
        {derived.ecgVoltageMv.toFixed(2)} mV · axis {derived.meanQrsAxisDegrees.toFixed(0)}&deg; ({derived.axisClassification})
      </text>
      <text className={styles.valueLabel} x={22} y={288}>
        {derived.isDissociated ? 'Atria and ventricles dissociated' : `PR ${derived.prIntervalMs.toFixed(0)} ms`} · QRS{' '}
        {derived.qrsDurationMs.toFixed(0)} ms · QTc {derived.qtcMs.toFixed(0)} ms · R/S transition{' '}
        {derived.rWaveTransitionLead ?? 'none'}
      </text>

      <text className={styles.pathLabel} x={296} y={214}>
        <tspan fill="var(--depolarized)">■</tspan> depolarising
      </text>
      <text className={styles.pathLabel} x={296} y={230}>
        <tspan fill="var(--repolarizing)">■</tspan> repolarising
      </text>
      <text className={styles.pathLabel} x={296} y={246}>
        <tspan fill="var(--conduction-path)">■</tspan> conduction tissue
      </text>
    </DiagramFrame>
  );
}
