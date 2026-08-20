import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { HeartConduction } from './HeartConduction';
import { HexaxialInset } from './HexaxialInset';
import styles from './Diagram.module.css';
import type { EcgDerived } from '../engine/types';

interface EcgDiagramProps {
  derived: EcgDerived;
}

export function EcgDiagram({ derived }: EcgDiagramProps) {
  return (
    <DiagramFrame
      viewBox="0 0 480 300"
      ariaLabel="Animated diagram of cardiac activation: the depolarisation wavefront sweeping the atria, conduction system and ventricles, alongside a hexaxial reference showing the instantaneous electrical vector and the selected lead axis"
    >
      <HeartConduction x={150} y={130} regions={derived.regions} />

      <HexaxialInset
        x={382}
        y={104}
        radius={54}
        selectedLead={derived.lead}
        dipoleAngleDegrees={derived.dipoleAngleDegrees}
        dipoleMagnitude={derived.dipoleMagnitude}
        meanQrsAxisDegrees={derived.meanQrsAxisDegrees}
      />
      <text className={styles.pathLabel} x={334} y={38}>
        Lead {derived.lead} axis
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
        {derived.qrsDurationMs.toFixed(0)} ms · QTc {derived.qtcMs.toFixed(0)} ms
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
