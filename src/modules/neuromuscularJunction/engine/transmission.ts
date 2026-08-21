import { BLOCKADE, CLASSIFICATION, ENDPLATE, RELEASE } from './constants';
import { clamp } from '@/shared/lib/math';
import type { NmjClassification, NmjInputs } from './types';

/**
 * Quanta released by one impulse.
 *
 * Calcium entry drives release with a steep power, which is why losing a fraction of the
 * presynaptic calcium channels costs far more release than the fraction suggests — and why
 * Lambert-Eaton is a presynaptic disease with profound weakness despite a normal end plate.
 */
export function quantalContent(inputs: NmjInputs, vesiclePool: number, residualCalcium: number): number {
  const calciumEntry = clamp(inputs.calciumChannelFunction, 0, 1.5) * (1 + RELEASE.FACILITATION_GAIN * residualCalcium);
  return (
    RELEASE.BASELINE_QUANTAL_CONTENT *
    clamp(inputs.vesicleReleaseCapacity, 0, 1.5) *
    Math.pow(clamp(calciumEntry, 0, 3), RELEASE.CALCIUM_POWER) *
    clamp(vesiclePool, 0, 1)
  );
}

/** Fraction of receptors available to respond: density that survives, less anything a
 * competitive blocker is occupying, less whatever has desensitised. */
export function receptorAvailability(inputs: NmjInputs, desensitisation: number): number {
  const competitive = 1 - clamp(inputs.nondepolarisingBlocker / BLOCKADE.NONDEPOLARISING_FULL, 0, 1);
  // End plates held depolarised are inexcitable regardless of how much transmitter arrives.
  const inexcitable =
    1 - BLOCKADE.DEPOLARISING_INEXCITABILITY * clamp(inputs.depolarisingBlocker / 100, 0, 1);
  return (
    clamp(inputs.receptorDensity, 0, 1.5) * competitive * inexcitable * (1 - clamp(desensitisation, 0, 1))
  );
}

/**
 * End-plate potential, mV.
 *
 * Losing acetylcholinesterase makes each quantum bigger and longer-lasting, because the
 * transmitter is not cleared — the mechanism by which pyridostigmine treats myasthenia, and by
 * which an organophosphate does harm.
 */
export function endPlatePotential(inputs: NmjInputs, quanta: number, availability: number): number {
  const esteraseFactor =
    1 + ENDPLATE.ESTERASE_AMPLIFICATION * (1 - clamp(inputs.acetylcholinesteraseActivity, 0, 2));
  return Math.min(ENDPLATE.MAX_EPP_MV, quanta * ENDPLATE.MV_PER_QUANTUM * availability * esteraseFactor);
}

/**
 * The safety factor: how many times over the end-plate potential exceeds the threshold it must
 * reach. Normally around four.
 *
 * This single number explains why neuromuscular disease is silent until it is severe. Losing
 * half the receptors changes nothing a patient would notice, because half of a fourfold reserve
 * still fires the fibre. Weakness appears only once the reserve is spent — and then it appears
 * quickly.
 */
export function safetyFactor(eppMv: number): number {
  return eppMv / ENDPLATE.THRESHOLD_MV;
}

/** Probability a fibre actually fires. Steep around a safety factor of 1, because transmission
 * is all-or-none at each junction — the graded weakness a patient shows is the fraction of
 * junctions failing, not each one working less well. */
export function transmissionProbability(factor: number): number {
  return clamp(1 / (1 + Math.exp(-(factor - 1) * 5)), 0, 1);
}

/**
 * Runs four stimuli and reports the amplitude of each, relative to a normal first twitch.
 *
 * The train-of-four is the most informative thing that can be done to a junction, because it
 * asks what happens when transmission is REPEATED. A healthy junction has enough reserve that
 * depletion never crosses threshold, so all four are equal. Take reserve away and the same
 * depletion now matters, so the later responses fail — fade. And a junction whose problem is
 * too little calcium entry gets BETTER with repetition, because residual calcium accumulates.
 */
export function repetitiveResponses(
  inputs: NmjInputs,
  frequencyHz: number,
  count: number,
  startingPool: number,
  desensitisation: number,
): number[] {
  const intervalSeconds = 1 / Math.max(frequencyHz, 0.1);
  const availability = receptorAvailability(inputs, desensitisation);
  // Presynaptic autoreceptor blockade cripples the mobilisation that normally keeps the pool
  // topped up during a train. This is why a competitive blocker fades and an agonist does not.
  const mobilisation =
    1 -
    RELEASE.PRESYNAPTIC_MOBILISATION_BLOCK * clamp(inputs.nondepolarisingBlocker / BLOCKADE.NONDEPOLARISING_FULL, 0, 1);

  let pool = startingPool;
  let calcium = 0;
  const responses: number[] = [];

  for (let i = 0; i < count; i += 1) {
    const quanta = quantalContent(inputs, pool, calcium);
    responses.push(transmissionProbability(safetyFactor(endPlatePotential(inputs, quanta, availability))));

    pool = clamp(pool - RELEASE.POOL_USE_PER_IMPULSE, 0, 1);
    calcium += RELEASE.CALCIUM_PER_IMPULSE;
    calcium *= Math.exp(-intervalSeconds / RELEASE.CALCIUM_DECAY_TAU_SECONDS);
    pool = clamp(
      pool + (1 - pool) * mobilisation * (1 - Math.exp(-intervalSeconds / RELEASE.POOL_REFILL_TAU_SECONDS)),
      0,
      1,
    );
  }

  return responses;
}

/**
 * The train-of-four: four stimuli at a low rate.
 *
 * A healthy junction has enough reserve that depletion never crosses threshold, so all four are
 * equal. Take reserve away and the same depletion now matters, so the later responses fail —
 * fade. Decrement at a LOW rate is the fingerprint of a postsynaptic problem.
 */
export function trainOfFour(inputs: NmjInputs, desensitisation: number): number[] {
  // Delivered to a RESTED junction, as it is in practice. Starting from a pool already drawn
  // down by ongoing stimulation would hide the very depletion the test exists to reveal.
  return repetitiveResponses(inputs, inputs.stimulationFrequencyHz, 4, 1, desensitisation);
}

/**
 * Response to a HIGH-rate burst, last relative to first.
 *
 * At 30 Hz the intervals are far shorter than the decay of residual calcium, so calcium piles up
 * in the terminal and release probability climbs. In a presynaptic lesion — where too little
 * calcium entry was the whole problem — that produces a dramatic INCREMENT, and the patient is
 * briefly stronger after exercising. Where release was never the limiting step, depletion wins
 * instead and the response decrements further. One test, opposite answers.
 */
export function postTetanicRatio(inputs: NmjInputs, desensitisation: number): number {
  const responses = repetitiveResponses(
    inputs,
    RELEASE.TETANIC_TEST_HZ,
    RELEASE.TETANIC_TEST_COUNT,
    1,
    desensitisation,
  );
  const first = responses[0] ?? 0;
  const last = responses[responses.length - 1] ?? 0;
  if (first <= 0.002) return last > 0.02 ? 3 : 1;
  return clamp(last / first, 0, 6);
}

export function classify(inputs: NmjInputs, tofRatio: number, ptRatio: number, factor: number): NmjClassification {
  if (inputs.depolarisingBlocker > 25) return 'depolarising block';
  if (inputs.nondepolarisingBlocker > 20) return 'non-depolarising block';
  if (inputs.acetylcholinesteraseActivity < 0.3) return 'cholinergic excess';
  if (inputs.vesicleReleaseCapacity < 0.35) return 'botulism';
  // A presynaptic lesion gets better with repetition; a postsynaptic one gets worse.
  // Both diseases decrement at low rates, so fade alone does not separate them. What does is
  // what happens at HIGH rates: only a presynaptic lesion, where calcium entry was the limiting
  // step, increments dramatically. That test is checked first for exactly that reason.
  if (ptRatio >= CLASSIFICATION.INCREMENT_RATIO) return 'Lambert-Eaton';
  if (tofRatio < CLASSIFICATION.FADE_RATIO) return 'myasthenia gravis';
  if (factor < CLASSIFICATION.LOW_SAFETY_FACTOR) return 'myasthenia gravis';
  return 'normal transmission';
}

export function patternSummary(tofRatio: number, ptRatio: number, factor: number): string {
  const train =
    tofRatio < CLASSIFICATION.FADE_RATIO ? 'train-of-four fade' : 'no fade';
  const repetition =
    ptRatio >= CLASSIFICATION.INCREMENT_RATIO
      ? 'improves with repetition'
      : ptRatio < 0.9
        ? 'worsens with repetition'
        : 'unchanged by repetition';
  const reserve = factor < CLASSIFICATION.LOW_SAFETY_FACTOR ? 'reserve spent' : 'reserve intact';
  return `${train}, ${repetition}, ${reserve}`;
}
