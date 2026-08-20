import { Neuron } from './Neuron';
import { VesselFlow } from '@/shared/components/VesselFlow/VesselFlow';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { CONDUCTANCE, MEMBRANE } from '../engine/constants';
import { clamp, scaleClamped } from '@/shared/lib/math';
import styles from './Diagram.module.css';
import type { MembraneDerived } from '../engine/types';

interface MembraneDiagramProps {
  derived: MembraneDerived;
}

const PROPAGATION_PATH = 'M158,150 L378,150';

export function MembraneDiagram({ derived }: MembraneDiagramProps) {
  const depolarization = clamp(scaleClamped(derived.vmMillivolts, derived.restingPotentialMv, MEMBRANE.MAX_MV, 0, 1), 0, 1);
  const gNaNormalized = clamp(derived.gNa / (CONDUCTANCE.MAX_GNA * 0.5), 0, 1);
  const gKNormalized = clamp(derived.gK / (CONDUCTANCE.MAX_GK * 0.5), 0, 1);
  // Propagation speed along the axon reflects the computed conduction velocity.
  const propagationSpeed = clamp(derived.conductionVelocityMPerS / 25, 0.05, 3);

  return (
    <DiagramFrame
      viewBox="0 0 480 300"
      ariaLabel="Animated diagram of a neuron: the soma depolarizing during an action potential, sodium and potassium channels opening in sequence, and the impulse propagating along a myelinated axon"
    >
      <text className={styles.pathLabel} x={24} y={30}>
        Equilibrium potentials
      </text>
      <text className={styles.valueLabel} x={62} y={50}>
        E(Na+) {derived.eNa.toFixed(0)} mV
      </text>
      <text className={styles.valueLabel} x={62} y={68}>
        E(K+) {derived.eK.toFixed(0)} mV
      </text>
      <text className={styles.valueLabel} x={62} y={86}>
        Rest {derived.restingPotentialMv.toFixed(0)} mV
      </text>

      <Neuron
        x={110}
        y={150}
        depolarization={depolarization}
        gNaNormalized={gNaNormalized}
        gKNormalized={gKNormalized}
        myelination={derived.myelination}
        isRefractory={derived.isRefractory}
      />

      <VesselFlow path={PROPAGATION_PATH} speed={propagationSpeed} colorVar="var(--vm)" />
      <text className={styles.pathLabel} x={262} y={182}>
        {derived.conductionVelocityMPerS.toFixed(0)} m/s
      </text>

      <text className={styles.valueLabel} x={400} y={252}>
        Vm {derived.vmMillivolts.toFixed(0)} mV
      </text>
      <text className={styles.pathLabel} x={356} y={272}>
        threshold {derived.thresholdMv} mV
      </text>
    </DiagramFrame>
  );
}
