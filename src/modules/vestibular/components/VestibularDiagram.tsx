import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { clamp } from '@/shared/lib/math';
import type { VestibularDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface VestibularDiagramProps {
  derived: VestibularDerived;
}

/** A horizontal canal pair with live cupula positions and firing bars, the nystagmus trace
 * drawn as slow-phase drift plus fast-phase resets, and a debris marker for BPPV. */
export function VestibularDiagram({ derived }: VestibularDiagramProps) {
  // Cupula deflection drawn as displacement of the cupula within each ampulla.
  const deflPx = derived.cupulaDeflection * 22;
  const CUPULA_R = { x: 150, y: 92 };
  const CUPULA_L = { x: 410, y: 92 };

  const fireBarMax = 130;
  const barR = clamp(derived.canalFiringRightSpikesPerSec / fireBarMax, 0, 1) * 90;
  const barL = clamp(derived.canalFiringLeftSpikesPerSec / fireBarMax, 0, 1) * 90;

  const spv = derived.slowPhaseVelocityDegPerSec;
  const positional = derived.positionalNystagmusPct;
  const totalNystagmus = Math.abs(spv) + positional;

  return (
    <DiagramFrame viewBox="0 0 560 400" ariaLabel="Canal pair, cupula deflection and nystagmus trace">
      {/* Right canal (left of frame = patient's right). */}
      <path
        className={styles.canalOutline}
        d={`M ${CUPULA_R.x - 60} ${CUPULA_R.y + 40} a 62 62 0 1 1 120 0`}
      />
      <rect className={styles.cupulaBar} x={CUPULA_R.x - 6 + deflPx} y={CUPULA_R.y - 26} width={12} height={26} rx={5} />
      <text className={styles.label} x={CUPULA_R.x - 44} y={CUPULA_R.y - 38}>
        RIGHT · {derived.canalFiringRightSpikesPerSec.toFixed(0)} spk/s
      </text>
      {/* Firing bar */}
      <rect x={CUPULA_R.x - 45} y={CUPULA_R.y + 58} width={barR} height={12} fill="var(--vestibular)" opacity={0.8} />
      <rect x={CUPULA_R.x - 45} y={CUPULA_R.y + 58} width={90} height={12} fill="none" stroke="var(--panel-border)" />

      {/* Left canal. */}
      <path
        className={styles.canalOutline}
        d={`M ${CUPULA_L.x - 60} ${CUPULA_L.y + 40} a 62 62 0 1 1 120 0`}
      />
      <rect className={styles.cupulaBar} x={CUPULA_L.x - 6 - deflPx} y={CUPULA_L.y - 26} width={12} height={26} rx={5} />
      <text className={styles.label} x={CUPULA_L.x - 40} y={CUPULA_L.y - 38}>
        LEFT · {derived.canalFiringLeftSpikesPerSec.toFixed(0)} spk/s
      </text>
      <rect x={CUPULA_L.x - 45} y={CUPULA_L.y + 58} width={barL} height={12} fill="var(--vestibular)" opacity={0.8} />
      <rect x={CUPULA_L.x - 45} y={CUPULA_L.y + 58} width={90} height={12} fill="none" stroke="var(--panel-border)" />

      {/* Debris in the posterior canal when present. */}
      {positional > 0 && (
        <>
          <circle className={styles.debris} cx={280} cy={210 + (100 - Math.min(positional, 100)) * 0.3} r={7} />
          <text className={styles.alarm} x={300} y={222}>
            canalith debris provoking — geotropic torsional nystagmus
          </text>
        </>
      )}

      {/* Nystagmus trace: slow drift with fast resets. */}
      <line className={styles.axis} x1={40} x2={520} y1={290} y2={290} />
      <text className={styles.label} x={40} y={272}>
        NYSTAGMUS TRACE
      </text>
      {totalNystagmus > 1 ? (
        <g>
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              className={styles.eyeDrift}
              d={`M ${60 + i * 160} ${290 - clamp(totalNystagmus / 4, 4, 46)}
                  q 60 ${spv >= 0 ? 14 : -14} 120 0
                  l ${spv >= 0 ? -18 : 18} 0`}
              transform={`translate(${(i * 37) % 30},0)`}
            />
          ))}
          <text className={styles.caption} x={430} y={310}>
            fast phases {spv > 0 || positional > 0 ? 'rightward' : 'leftward'} · SPV {Math.abs(spv).toFixed(1)} °/s
          </text>
        </g>
      ) : (
        <line className={styles.eyeDrift} x1={60} x2={500} y1={290} y2={290} />
      )}

      <text className={styles.caption} x={40} y={338}>
        VOR gain {derived.vorGain.toFixed(2)} · vertigo {derived.vertigoIntensityPct.toFixed(0)}% · oscillopsia{' '}
        {derived.oscillopsiaPct.toFixed(0)}% · Romberg {derived.rombergUnsteadinessPct.toFixed(0)}%
      </text>
      {derived.headImpulsePositive && (
        <text className={styles.alarm} x={40} y={352}>
          Head impulse POSITIVE — corrective saccade betrays the deficit
        </text>
      )}

      <text className={styles.verdict} x={40} y={374}>
        {derived.classification}
      </text>
      <text className={styles.label} x={40} y={392}>
        {derived.patternSummary}
      </text>
    </DiagramFrame>
  );
}
