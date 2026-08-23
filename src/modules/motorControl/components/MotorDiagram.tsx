import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { clamp } from '@/shared/lib/math';
import type { MotorDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface MotorDiagramProps {
  derived: MotorDerived;
}

/** Basal-ganglia circuit with pathway thickness by activity, the reach against its target,
 * and a tremor strip showing which oscillator is speaking. */
export function MotorDiagram({ derived }: MotorDiagramProps) {
  // Reach panel: commanded target vs achieved amplitude.
  const REACH = { x: 330, y: 70, width: 190 };
  const command = clamp(55, 0, 100);
  const commandX = REACH.x + (command / 100) * REACH.width;
  const achievedX = REACH.x + (clamp(derived.achievedAmplitudePct, 0, 100) / 100) * REACH.width;

  // Tremor strip: superposed envelopes drawn as a schematic oscillation.
  const STRIP = { x: 40, y: 250, width: 480, height: 60 };
  const points: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    const x = STRIP.x + t * STRIP.width;
    const envelope =
      derived.restingTremorAmp * Math.sin(t * Math.PI * 8) +
      derived.intentionTremorAmp * Math.sin(t * Math.PI * 5) * Math.sin(t * Math.PI) +
      derived.posturalTremorAmp * 0.6 * Math.sin(t * Math.PI * 12);
    const y = STRIP.y + STRIP.height / 2 - envelope * 2.2;
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }

  return (
    <DiagramFrame viewBox="0 0 560 400" ariaLabel="Basal ganglia circuit, executed reach and tremor strip">
      {/* Circuit: cortex - striatum - GPi/SNr - thalamus - cortex, STN between. */}
      <text className={styles.label} x={40} y={44}>
        GATING CIRCUIT
      </text>
      <rect x={40} y={54} width={110} height={30} rx={7} fill="none" stroke="var(--text-dim)" />
      <text className={styles.nodeLabel} x={58} y={73}>
        cortex
      </text>

      <line
        className={derived.effectiveDopaminePct > 55 ? styles.pathwayDirect : styles.pathwayIndirect}
        x1={150}
        y1={69}
        x2={210}
        y2={69}
        opacity={(derived.effectiveDopaminePct / 130).toFixed(2)}
      />
      <rect x={210} y={54} width={96} height={30} rx={7} fill="none" stroke="var(--text-dim)" />
      <text className={styles.nodeLabel} x={222} y={73}>
        striatum
      </text>
      <text className={styles.caption} x={214} y={98}>
        dopamine {derived.effectiveDopaminePct.toFixed(0)}%
      </text>

      <line
        className={styles.pathwayIndirect}
        x1={306}
        y1={62}
        x2={352}
        y2={62}
        opacity={(derived.bradykinesiaIndex).toFixed(2)}
      />
      <circle cx={366} cy={62} r={13} fill="var(--danger)" opacity={clamp(derived.ballismAmp / 13, 0, 1) * 0.8} />
      <circle cx={366} cy={62} r={13} fill="none" stroke="var(--text-dim)" />
      <text className={styles.nodeLabel} x={344} y={66}>
        STN
      </text>

      <line
        className={styles.pathwayDirect}
        x1={306}
        y1={78}
        x2={410}
        y2={78}
        opacity={(1 - derived.bradykinesiaIndex).toFixed(2)}
      />
      <line
        className={derived.effectiveDopaminePct > 55 ? styles.pathwayDirect : styles.pathwayIndirect}
        x1={380}
        y1={69}
        x2={430}
        y2={69}
      />
      <rect x={430} y={54} width={92} height={30} rx={7} fill="none" stroke="var(--text-dim)" />
      <text className={styles.nodeLabel} x={452} y={73}>
        thalamus
      </text>
      <line className={styles.pathwayDirect} x1={476} y1={84} x2={476} y2={104} opacity={(1 - derived.bradykinesiaIndex).toFixed(2)} />

      {/* The reach: commanded vs achieved. */}
      <text className={styles.label} x={REACH.x} y={132}>
        REACH · commanded vs achieved
      </text>
      <line className={styles.axis} x1={REACH.x} x2={REACH.x + REACH.width} y1={160} y2={160} />
      <line className={styles.reachTarget} x1={commandX} x2={commandX} y1={148} y2={172} />
      <rect className={styles.reachActual} x={REACH.x} y={152} width={achievedX - REACH.x} height={16} rx={3} />
      <text className={styles.caption} x={REACH.x} y={192}>
        achieved {derived.achievedAmplitudePct.toFixed(0)}% of command · error{' '}
        {derived.amplitudeErrorPct.toFixed(0)}%{derived.dysmetriaPct > 15 ? ` · dysmetria ${derived.dysmetriaPct.toFixed(0)}%` : ''}
      </text>

      <text className={styles.caption} x={40} y={232}>
        latency {derived.initiationLatencyMs.toFixed(0)} ms · rigidity {derived.rigidityScore.toFixed(1)} · spasticity{' '}
        {derived.spasticityScore.toFixed(1)}
      </text>

      <text className={styles.label} x={STRIP.x} y={STRIP.y - 10}>
        TREMOR STRIP · rest {derived.restingTremorAmp.toFixed(1)} / intention{' '}
        {derived.intentionTremorAmp.toFixed(1)} / postural {derived.posturalTremorAmp.toFixed(1)}
      </text>
      <line className={styles.axis} x1={STRIP.x} x2={STRIP.x + STRIP.width} y1={STRIP.y + STRIP.height / 2} y2={STRIP.y + STRIP.height / 2} />
      <path className={styles.tremorWave} d={points.join(' ')} />
      {derived.involuntaryMovementIndex > 2 && (
        <text className={styles.alarm} x={STRIP.x} y={STRIP.y + STRIP.height + 18}>
          Involuntary movement invading the trace — chorea/ballism {derived.involuntaryMovementIndex.toFixed(1)}
        </text>
      )}

      <text className={styles.caption} x={40} y={352}>
        gait: {derived.gaitClass}
      </text>
      <text className={styles.verdict} x={40} y={372}>
        {derived.classification}
      </text>
      <text className={styles.label} x={40} y={391}>
        {derived.patternSummary}
      </text>
    </DiagramFrame>
  );
}
