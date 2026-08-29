import { EndocrineAxis } from '@/shared/components/EndocrineAxis/EndocrineAxis';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import type { HpgDerived } from '../engine/types';
import { GonadGland } from './GonadGland';
import styles from './Diagram.module.css';

interface HpgDiagramProps {
  derived: HpgDerived;
}

const PULSE_STRIP = { x: 196, y: 240, width: 150 };

/**
 * The HPG axis on the shared endocrine scaffold, plus the two things that are peculiar to it.
 *
 * GnRH has to arrive in PULSES. A steady infusion of the same hormone shuts the axis down
 * instead of driving it, which is why a GnRH agonist is a treatment for prostate cancer rather
 * than a stimulant — so the pulse train is drawn, and it visibly runs together into a continuous
 * line as pulsatility is lost while the anterior lobe stops responding.
 *
 * And this is the one axis whose feedback changes sign. For most of the cycle oestrogen inhibits;
 * above a threshold held for long enough it switches to driving, and that switch is the LH surge.
 * The scaffold's feedback marker flips with it — crossbar to arrowhead.
 */
export function HpgDiagram({ derived }: HpgDiagramProps) {
  const isFemale = derived.sex === 'female';
  const steroid = isFemale ? derived.estrogenLevel : derived.testosteroneLevel;
  const positive = derived.feedbackMode === 'positive';
  const pulse = clamp(derived.gnrhPulseFrequency, 0, 2);

  // Pulses run together as frequency rises; at zero the strip is one continuous line, which is
  // exactly the state that silences the pituitary.
  const pulseCount = Math.max(1, Math.round(pulse * 5));
  const exogenous = isFemale ? derived.exogenousEstrogenProgesterone : derived.exogenousTestosterone;

  return (
    <EndocrineAxis
      ariaLabel="The hypothalamic-pituitary-gonadal axis: pulsatile GnRH down the portal vessels, LH and FSH through the circulation to the gonad, and gonadal steroids feeding back on the axis — negatively for most of the cycle and positively at the surge"
      releasing={{ label: 'GnRH', level: clamp(derived.gnrhDrive, 0, 1), colorVar: 'var(--gnrh)' }}
      trophic={{ label: 'LH / FSH', level: clamp(derived.lhLevel, 0, 1), colorVar: 'var(--lh)' }}
      product={{
        label: isFemale ? 'Oestrogen' : 'Testosterone',
        level: clamp(steroid, 0, 1),
        colorVar: isFemale ? 'var(--estrogen)' : 'var(--testosterone)',
      }}
      pituitaryFunction={clamp(derived.pituitaryResponsiveness, 0, 1)}
      glandFunction={clamp(derived.gonadalFunction, 0, 1)}
      glandLabel={isFemale ? 'Ovary' : 'Testis'}
      renderGland={(intensity) => (
        <GonadGland
          isFemale={isFemale}
          intensity={intensity}
          follicleSize={derived.follicleSize}
          corpusLuteum={derived.corpusLuteumActivity}
        />
      )}
      exogenous={{
        label: isFemale ? 'Oestrogen / progestin' : 'Exogenous testosterone',
        level: clamp(exogenous / 100, 0, 1),
      }}
      feedbackPositive={positive}
      targetTissue={{
        label: isFemale ? 'Endometrium · breast · bone' : 'Muscle · bone · spermatogenesis',
        detail: isFemale
          ? 'proliferation then secretory change, and bone kept dense'
          : 'anabolism, bone density, and sperm production alongside FSH',
      }}
    >
      {/* GnRH pulsatility: the axis's own peculiarity, drawn as a pulse train. */}
      <text className={styles.pulseLabel} x={PULSE_STRIP.x} y={PULSE_STRIP.y - 10}>
        GnRH pulses
      </text>
      <line
        className={styles.pulseBaseline}
        x1={PULSE_STRIP.x}
        y1={PULSE_STRIP.y + 14}
        x2={PULSE_STRIP.x + PULSE_STRIP.width}
        y2={PULSE_STRIP.y + 14}
      />
      {pulse < 0.12 ? (
        <line
          className={styles.pulseContinuous}
          x1={PULSE_STRIP.x}
          y1={PULSE_STRIP.y + 2}
          x2={PULSE_STRIP.x + PULSE_STRIP.width}
          y2={PULSE_STRIP.y + 2}
        />
      ) : (
        Array.from({ length: pulseCount }, (_, i) => {
          const x = PULSE_STRIP.x + ((i + 0.5) / pulseCount) * PULSE_STRIP.width;
          return <line key={i} className={styles.pulseSpike} x1={x} y1={PULSE_STRIP.y + 14} x2={x} y2={PULSE_STRIP.y} />;
        })
      )}
      <text className={styles.pulseTick} x={PULSE_STRIP.x} y={PULSE_STRIP.y + 28}>
        {pulse < 0.12
          ? 'continuous — the pituitary stops responding'
          : `×${pulse.toFixed(2)} · responsiveness ${(derived.pituitaryResponsiveness * 100).toFixed(0)}%`}
      </text>

      <text className={styles.label} x={20} y={410}>
        LH {(derived.lhLevel * 100).toFixed(0)}% · FSH {(derived.fshLevel * 100).toFixed(0)}%
        {isFemale ? ` · day ${derived.cycleDay} ${derived.cyclePhase}` : ''}
      </text>
      <DiagramText className={styles.caption} x={20} y={430} maxWidth={520}>
        {isFemale
          ? `E2 ${(derived.estrogenLevel * 100).toFixed(0)}% · P4 ${(derived.progesteroneLevel * 100).toFixed(0)}% · follicle ${(derived.follicleSize * 100).toFixed(0)}%`
          : `testosterone ${(derived.testosteroneLevel * 100).toFixed(0)}% · inhibin ${(derived.inhibinLevel * 100).toFixed(0)}%`}
      </DiagramText>
    </EndocrineAxis>
  );
}
