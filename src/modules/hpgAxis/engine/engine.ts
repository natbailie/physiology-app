import { FEMALE, GNRH, GONADOTROPINS, MALE } from './constants';
import { gnrhDriveTarget, pituitaryResponsiveness } from './gnrh';
import { fshTarget, lhTarget } from './lhFsh';
import { shouldTriggerSurge, surgeWindowOpen, tickEstrogenExposure } from './lhSurgeLogic';
import { estrogenTarget, follicleSizeTarget, inhibinTarget, progesteroneTarget, testosteroneTarget } from './gonadalSteroid';
import { advanceCycle, cycleDay, cyclePhaseName, inFollicularPhase } from './cycleClock';
import { approach, clamp } from '@/shared/lib/math';
import type { HpgDerived, HpgInputs, HpgSnapshot, HpgState } from './types';

export function createInitialState(): HpgState {
  return {
    simTimeSeconds: 0,
    gnrhDrive: 0.5,
    lhLevel: 0.3,
    fshLevel: 0.3,
    testosteroneLevel: 0.3,
    inhibinLevel: 0.3,
    cycleDayFraction: 0,
    follicleSize: 0,
    estrogenLevel: 0.1,
    progesteroneLevel: 0,
    sustainedHighEstrogenExposure: 0,
    corpusLuteumActivity: 0,
    inPositiveFeedback: false,
  };
}

/** The combined steroid feedback signal reaching the hypothalamus and pituitary, including
 * any exogenous hormone — which is precisely why exogenous testosterone or a combined oral
 * contraceptive suppresses the endogenous axis. */
function steroidFeedbackSignal(state: HpgState, inputs: HpgInputs): number {
  if (inputs.sex === 'male') {
    return clamp(state.testosteroneLevel + inputs.exogenousTestosterone * MALE.EXOGENOUS_FEEDBACK_GAIN, 0, 1.5);
  }
  const endogenous = Math.max(state.estrogenLevel, state.progesteroneLevel * 0.9);
  return clamp(endogenous + inputs.exogenousEstrogenProgesterone * MALE.EXOGENOUS_FEEDBACK_GAIN, 0, 1.5);
}

export function computeDerived(state: HpgState, inputs: HpgInputs): HpgDerived {
  return {
    sex: inputs.sex,
    gnrhDrive: state.gnrhDrive,
    lhLevel: state.lhLevel,
    fshLevel: state.fshLevel,
    testosteroneLevel: state.testosteroneLevel,
    inhibinLevel: state.inhibinLevel,
    estrogenLevel: state.estrogenLevel,
    progesteroneLevel: state.progesteroneLevel,
    follicleSize: state.follicleSize,
    corpusLuteumActivity: state.corpusLuteumActivity,
    cycleDayFraction: state.cycleDayFraction,
    cycleDay: cycleDay(state.cycleDayFraction),
    cyclePhase: inputs.sex === 'male' ? 'steadyState' : cyclePhaseName(state.cycleDayFraction, state.inPositiveFeedback, state.corpusLuteumActivity),
    feedbackMode: state.inPositiveFeedback ? 'positive' : 'negative',
    pituitaryResponsiveness: pituitaryResponsiveness(inputs.gnrhPulseFrequency),
    gnrhPulseFrequency: inputs.gnrhPulseFrequency,
    hypothalamicSuppression: inputs.hypothalamicSuppression,
    gonadalFunction: inputs.gonadalFunction,
    exogenousTestosterone: inputs.exogenousTestosterone,
    exogenousEstrogenProgesterone: inputs.exogenousEstrogenProgesterone,
  };
}

export function tick(state: HpgState, derived: HpgDerived, dtSeconds: number, inputs: HpgInputs): HpgState {
  const feedback = steroidFeedbackSignal(state, inputs);
  const responsiveness = derived.pituitaryResponsiveness;

  const targetGnrh = gnrhDriveTarget(feedback, derived.hypothalamicSuppression, state.inPositiveFeedback);
  const gnrhDrive = approach(state.gnrhDrive, targetGnrh, dtSeconds, GNRH.TAU_SECONDS);

  // The surge rises much faster than ordinary gonadotropin regulation.
  const gonadotropinTau = state.inPositiveFeedback ? GONADOTROPINS.SURGE_TAU_SECONDS : GONADOTROPINS.TAU_SECONDS;
  const lhLevel = approach(
    state.lhLevel,
    lhTarget(gnrhDrive, responsiveness, feedback, state.inPositiveFeedback),
    dtSeconds,
    gonadotropinTau,
  );
  const fshLevel = approach(
    state.fshLevel,
    fshTarget(gnrhDrive, responsiveness, feedback, state.inhibinLevel, state.inPositiveFeedback),
    dtSeconds,
    gonadotropinTau,
  );

  if (inputs.sex === 'male') {
    return {
      ...state,
      simTimeSeconds: state.simTimeSeconds + dtSeconds,
      gnrhDrive,
      lhLevel,
      fshLevel,
      testosteroneLevel: approach(
        state.testosteroneLevel,
        testosteroneTarget(lhLevel, derived.gonadalFunction),
        dtSeconds,
        MALE.TESTOSTERONE_TAU_SECONDS,
      ),
      inhibinLevel: approach(state.inhibinLevel, inhibinTarget(fshLevel, derived.gonadalFunction), dtSeconds, MALE.INHIBIN_TAU_SECONDS),
      // Female-only state stays inert on the male axis.
      inPositiveFeedback: false,
      sustainedHighEstrogenExposure: 0,
    };
  }

  // --- Female cycle ---
  const cycleDayFraction = advanceCycle(state.cycleDayFraction, dtSeconds);
  const follicular = inFollicularPhase(cycleDayFraction);

  const follicleSize = approach(
    state.follicleSize,
    follicleSizeTarget(fshLevel, derived.gonadalFunction, follicular, state.follicleSize),
    dtSeconds,
    FEMALE.FOLLICLE_TAU_SECONDS,
  );

  // Accumulate sustained-high-estrogen exposure; crossing the threshold flips feedback.
  const exposure = tickEstrogenExposure(state.sustainedHighEstrogenExposure, state.estrogenLevel, dtSeconds);
  const triggering = shouldTriggerSurge(exposure, state.inPositiveFeedback);

  let inPositiveFeedback = state.inPositiveFeedback;
  let sustainedHighEstrogenExposure = exposure;
  let corpusLuteumActivity = state.corpusLuteumActivity;

  if (triggering) {
    // Ovulation: the window opens, and the exposure integrator resets so the surge fires once.
    inPositiveFeedback = true;
    sustainedHighEstrogenExposure = -FEMALE.SURGE_DURATION_SECONDS * FEMALE.EXPOSURE_ACCUMULATION_PER_SECOND;
  } else if (state.inPositiveFeedback) {
    // While the window is open, the (negative) exposure counter runs back up toward zero and
    // the window closes when it gets there.
    sustainedHighEstrogenExposure = state.sustainedHighEstrogenExposure + FEMALE.EXPOSURE_ACCUMULATION_PER_SECOND * dtSeconds;
    const elapsed = (sustainedHighEstrogenExposure + FEMALE.SURGE_DURATION_SECONDS * FEMALE.EXPOSURE_ACCUMULATION_PER_SECOND) /
      FEMALE.EXPOSURE_ACCUMULATION_PER_SECOND;
    if (!surgeWindowOpen(elapsed)) {
      // Ovulation complete: the ruptured follicle becomes the corpus luteum, whose
      // progesterone restores negative feedback.
      inPositiveFeedback = false;
      corpusLuteumActivity = 1;
      sustainedHighEstrogenExposure = 0;
    }
  }

  // The corpus luteum decays over ~14 days unless pregnancy rescues it; that decay is what
  // withdraws progesterone support and triggers menstruation, restarting the cycle.
  if (!inPositiveFeedback && corpusLuteumActivity > 0) {
    corpusLuteumActivity = approach(corpusLuteumActivity, 0, dtSeconds, FEMALE.CORPUS_LUTEUM_DECAY_TAU_SECONDS);
  }

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    gnrhDrive,
    lhLevel,
    fshLevel,
    testosteroneLevel: 0,
    inhibinLevel: 0,
    cycleDayFraction,
    follicleSize,
    estrogenLevel: approach(
      state.estrogenLevel,
      estrogenTarget(follicleSize, corpusLuteumActivity, derived.gonadalFunction),
      dtSeconds,
      FEMALE.ESTROGEN_TAU_SECONDS,
    ),
    progesteroneLevel: approach(
      state.progesteroneLevel,
      progesteroneTarget(corpusLuteumActivity, derived.gonadalFunction),
      dtSeconds,
      FEMALE.PROGESTERONE_TAU_SECONDS,
    ),
    sustainedHighEstrogenExposure,
    corpusLuteumActivity,
    inPositiveFeedback,
  };
}

export function step(state: HpgState, inputs: HpgInputs, dtSeconds: number): HpgSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds, inputs), derived };
}
