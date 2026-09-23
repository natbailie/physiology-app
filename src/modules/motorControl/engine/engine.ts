import { DBS, LEVODOPA, MOTOR_SIMULATION } from './constants';
import {
  achievedAmplitudePct,
  ballismAmp,
  bradykinesiaIndex,
  choreaAmp,
  classifyMotor,
  cocontractionIndex,
  dystoniaAmp,
  dysmetriaPct,
  gaitClass,
  initiationLatencyMs,
  intentionTremorAmp,
  patternSummary,
  posturalTremorAmp,
  restingTremorAmp,
} from './motorMechanics';
import { clamp } from '@/shared/lib/math';
import type { MotorDerived, MotorInputs, MotorInternalState, MotorSnapshot } from './types';

export function createInitialState(): MotorInternalState {
  return {
    simTimeSeconds: 0,
    levodopaBurst: 0,
    dbsActive: false,
  };
}

/** Whether the stimulator is running: the SETTING, or the state a direct `perturbToggleDbs` left
 * behind — which is how this module's own engine test drives it. */
function dbsOn(inputs: MotorInputs, state: MotorInternalState): boolean {
  return inputs.deepBrainStimulation === 'on' || state.dbsActive;
}

export function computeDerived(state: MotorInternalState, inputs: MotorInputs): MotorDerived {
  const effectiveDopaminePct = clamp(
    inputs.dopamineFraction + (state.levodopaBurst * LEVODOPA.BURST_FRACTION) / 100,
    0,
    130,
  );
  const bradykinesia = bradykinesiaIndex(effectiveDopaminePct) * (dbsOn(inputs, state) ? DBS.BRADYKINESIA_EASING : 1);
  const latency = initiationLatencyMs(bradykinesia);
  const command = clamp(inputs.movementCommandAmplitude, 0, 100);
  const achieved = achievedAmplitudePct(command, bradykinesia);
  const dysmetria = dysmetriaPct(inputs.cerebellarCalibration);
  const amplitudeErrorPct = clamp(
    (Math.abs(command - achieved) / Math.max(command, 1)) * 100 + dysmetria,
    0,
    100,
  );

  const rest = restingTremorAmp(bradykinesia, command, dbsOn(inputs, state));
  const intent = intentionTremorAmp(inputs.cerebellarCalibration, command);
  const postural = posturalTremorAmp(inputs);
  const chorea = choreaAmp(inputs.striatalOutputLoss, dbsOn(inputs, state));
  const ballism = ballismAmp(inputs.subthalamicLesion, dbsOn(inputs, state));

  const dystonia = dystoniaAmp(inputs.dystoniaSeverityPct);
  const coContraction = cocontractionIndex(inputs.dystoniaSeverityPct);

  const classificationPattern = {
    subthalamicLesionPct: clamp(inputs.subthalamicLesion, 0, 100),
    striatalOutputLossPct: clamp(inputs.striatalOutputLoss, 0, 100),
    effectiveDopaminePct,
    cerebellarCalibrationPct: clamp(inputs.cerebellarCalibration, 0, 100),
    corticospinalIntegrityPct: clamp(inputs.corticospinalIntegrity, 0, 100),
    essentialTremorDrivePct: clamp(inputs.essentialTremorDrive, 0, 100),
    dystoniaSeverityPct: clamp(inputs.dystoniaSeverityPct, 0, 100),
  };

  return {
    effectiveDopaminePct,
    bradykinesiaIndex: bradykinesia,
    initiationLatencyMs: latency,
    achievedAmplitudePct: achieved,
    amplitudeErrorPct,
    dysmetriaPct: dysmetria,
    restingTremorAmp: rest,
    intentionTremorAmp: intent,
    posturalTremorAmp: postural,
    choreaAmp: chorea,
    ballismAmp: ballism,
    involuntaryMovementIndex: chorea + ballism,
    rigidityScore: bradykinesia * 10,
    spasticityScore: (1 - clamp(inputs.corticospinalIntegrity, 0, 100) / 100) * 10,
    dystoniaAmp: dystonia,
    cocontractionIndex: coContraction,
    gaitClass: gaitClass({
      parkinsonian: effectiveDopaminePct <= 55,
      cerebellar: clamp(inputs.cerebellarCalibration, 0, 100) <= 30,
      spastic: clamp(inputs.corticospinalIntegrity, 0, 100) <= 30,
      choreiform: clamp(inputs.striatalOutputLoss, 0, 100) >= 50,
      dystonic: inputs.dystoniaSeverityPct >= 40,
    }),
    classification: classifyMotor(classificationPattern),
    patternSummary: patternSummary({
      ...classificationPattern,
      classification: classifyMotor(classificationPattern),
      initiationLatencyMs: latency,
      restingTremorAmp: rest,
      intentionTremorAmp: intent,
      posturalTremorAmp: postural,
      rigidityScore: bradykinesia * 10,
      spasticityScore: (1 - clamp(inputs.corticospinalIntegrity, 0, 100) / 100) * 10,
      cocontractionIndex: coContraction,
    }),
  };
}

export function tick(
  state: MotorInternalState,
  derived: MotorDerived,
  dtSeconds: number,
): MotorInternalState {
  void derived;
  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    // A levodopa dose wears off over simulated hours — the "wearing-off" patients describe.
    levodopaBurst: state.levodopaBurst * Math.exp(-dtSeconds / LEVODOPA.DECAY_TAU_SECONDS),
    dbsActive: state.dbsActive,
  };
}

export function step(state: MotorInternalState, inputs: MotorInputs, dtSeconds: number): MotorSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

/** A dose of levodopa: transient dopamine on top of whatever the input represents. */
export function perturbLevodopaDose(state: MotorInternalState): MotorInternalState {
  return { ...state, levodopaBurst: Math.min(200, state.levodopaBurst + 100) };
}

/** Deep brain stimulation toggle. */
export function perturbToggleDbs(state: MotorInternalState): MotorInternalState {
  return { ...state, dbsActive: !state.dbsActive };
}

export { MOTOR_SIMULATION };
