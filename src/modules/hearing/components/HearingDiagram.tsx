import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { AUDIOGRAM_FREQS_HZ } from '../engine/constants';
import { clamp } from '@/shared/lib/math';
import type { HearingDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface HearingDiagramProps {
  derived: HearingDerived;
}

const PLOT = { x: 60, y: 50, width: 300, height: 180 };
const MAX_DB = 90;

const freqX = (index: number) =>
  PLOT.x + (index / (AUDIOGRAM_FREQS_HZ.length - 1)) * PLOT.width;
const dbY = (db: number) => PLOT.y + (clamp(db, 0, MAX_DB) / MAX_DB) * PLOT.height;

/** The audiogram generated live from the engine (air and bone lines), plus the basilar
 * membrane with the travelling-wave envelope peaking at the stimulus frequency. */
export function HearingDiagram({ derived }: HearingDiagramProps) {
  const airPath = derived.airConductionDb
    .map((db, i) => `${i === 0 ? 'M' : 'L'}${freqX(i).toFixed(1)},${dbY(db).toFixed(1)}`)
    .join(' ');
  const bonePath = derived.boneConductionDb
    .map((db, i) => `${i === 0 ? 'M' : 'L'}${freqX(i).toFixed(1)},${dbY(db).toFixed(1)}`)
    .join(' ');

  // Travelling wave: a skewed envelope whose peak sits at the stimulus frequency's place.
  const MEM = { x: 400, y: 120, width: 130, height: 46 };
  const place = Math.log2(clamp(derived.stimulusFrequencyHz, 125, 8000) / 125) / Math.log2(8000 / 125);
  const amplitude = clamp(derived.sensationLevelDb, 0, 70) / 70;
  const envPoints: string[] = [`M${MEM.x},${MEM.y + MEM.height}`];
  for (let t = 0; t <= 1; t += 0.05) {
    const x = MEM.x + t * MEM.width;
    const sigma = 0.16 * (1 + 0.6 * t);
    const g = amplitude * Math.exp(-Math.pow((t - place) / sigma, 2)) * (1 - 0.35 * t);
    envPoints.push(`L${x.toFixed(1)},${(MEM.y + MEM.height - g * MEM.height * 0.9).toFixed(1)}`);
  }
  envPoints.push(`L${MEM.x + MEM.width},${MEM.y + MEM.height} Z`);

  return (
    <DiagramFrame viewBox="0 0 560 400" ariaLabel="Audiogram with air and bone conduction, and the cochlear travelling wave">
      <text className={styles.label} x={PLOT.x} y={PLOT.y - 14}>
        AUDIOGRAM · dB HL vs FREQUENCY
      </text>

      {/* Gridlines at 20 dB steps. */}
      {[20, 40, 60, 80].map((db) => (
        <line key={db} className={styles.gridline} x1={PLOT.x} x2={PLOT.x + PLOT.width} y1={dbY(db)} y2={dbY(db)} />
      ))}
      {/* Speech band shading across 500 Hz-4 kHz. */}
      <rect
        className={styles.speechBand}
        x={freqX(1)}
        y={PLOT.y}
        width={freqX(4) - freqX(1)}
        height={PLOT.height}
      />
      {/* Noise-notch zone marker around 4 kHz. */}
      <rect className={styles.notchZone} x={freqX(4) - 26} y={PLOT.y} width={52} height={PLOT.height} />

      <path className={styles.airLine} d={airPath} />
      {derived.airConductionDb.map((db, i) => (
        <circle key={`air-${i}`} className={styles.airMarker} cx={freqX(i)} cy={dbY(db)} r={3.5} />
      ))}
      <path className={styles.boneLine} d={bonePath} />
      {derived.boneConductionDb.map((db, i) => (
        <path
          key={`bone-${i}`}
          className={styles.boneMarker}
          d={`M ${freqX(i) - 4} ${dbY(db)} l 4 -4 l 4 4 l -4 4 z`}
        />
      ))}

      <line className={styles.axis} x1={PLOT.x} x2={PLOT.x} y1={PLOT.y} y2={PLOT.y + PLOT.height} />
      <line className={styles.axis} x1={PLOT.x} x2={PLOT.x + PLOT.width} y1={PLOT.y + PLOT.height} y2={PLOT.y + PLOT.height} />
      {AUDIOGRAM_FREQS_HZ.map((f, i) => (
        <text key={f} className={styles.caption} x={freqX(i) - 12} y={PLOT.y + PLOT.height + 14}>
          {f >= 1000 ? `${f / 1000}k` : f}
        </text>
      ))}

      {/* Legend */}
      <circle className={styles.airMarker} cx={396} cy={54} r={3.5} />
      <text className={styles.caption} x={404} y={58}>
        air
      </text>
      <path className={styles.boneMarker} d="M 392 72 l 4 -4 l 4 4 l -4 4 z" />
      <text className={styles.caption} x={404} y={76}>
        bone
      </text>

      {/* Basilar membrane and travelling wave. */}
      <rect className={styles.membrane} x={MEM.x} y={MEM.y} width={MEM.width} height={MEM.height} rx={6} />
      <path className={styles.waveEnvelope} d={envPoints.join(' ')} />
      <text className={styles.label} x={MEM.x} y={MEM.y - 10}>
        BASILAR MEMBRANE
      </text>
      <text className={styles.caption} x={MEM.x} y={MEM.y + MEM.height + 16}>
        apex ← · → base
      </text>

      <text className={styles.caption} x={60} y={300}>
        stimulus {derived.stimulusFrequencyHz} Hz @ {derived.stimulusLevelDbHl.toFixed(0)} dB HL · sensation level{' '}
        {derived.sensationLevelDb.toFixed(0)} dB
      </text>
      <text className={styles.caption} x={60} y={318}>
        loudness {derived.loudnessPct.toFixed(0)}%{derived.recruitmentIndex > 1.3 ? ` · RECRUITMENT ×${derived.recruitmentIndex.toFixed(1)}` : ''} ·{' '}
        {derived.rinneResult} · Weber {derived.weberResult.toLowerCase()}
      </text>
      {derived.stapediusActive && (
        <text className={styles.alarm} x={60} y={338}>
          Stapedius reflex contracted — the ear's own limiter
        </text>
      )}

      <text className={styles.verdict} x={60} y={368}>
        {derived.classification}
      </text>
      <text className={styles.label} x={60} y={388}>
        {derived.patternSummary}
      </text>
    </DiagramFrame>
  );
}
