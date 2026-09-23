import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { caseInputs, useModuleCase } from '@/shared/hooks/useModuleCase';
import { useModuleCases } from '@/shared/hooks/useModuleCases';
import { EXERCISE_CASES } from './cases';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { ExerciseDiagram } from './components/ExerciseDiagram';
import { ExerciseReadoutPanel } from './components/ExerciseReadoutPanel';
import { ControlPanel as ExerciseControlPanel } from './components/ExerciseControlPanel';
import { EXERCISE_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { exercisePhysiologyContent } from './content';
import { exerciseLoopConfig } from './engine/loopConfig';
import { perturbSprintSurge } from './engine/engine';
import {
  EXERCISE_PRESETS,
  EXERCISE_PRESET_LABELS,
  EXERCISE_PRESET_GLOSS,
  EXERCISE_PRESET_ORDER,
  DEFAULT_EXERCISE_INPUTS,
} from './engine/presets';
import type { ExerciseInputs } from './engine/types';

export function ExercisePhysiologyPage() {
  // Opened from the ward round, or null for the catalogue route. The seed means the engine
  // settles the patient directly rather than settling a healthy body and then jumping.
  const patient = useModuleCase(EXERCISE_CASES);
  const { inputs, setInputs, shareLink } = useShareableInputs<ExerciseInputs>(
    'exercisePhysiology',
    DEFAULT_EXERCISE_INPUTS,
    caseInputs(patient, DEFAULT_EXERCISE_INPUTS, EXERCISE_PRESETS),
  );
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, exerciseLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    // At a bedside, Reset means "back to this patient". Returning a learner who is mid-case to
    // a healthy volunteer would discard the thing they came to look at.
    defaults: caseInputs(patient, DEFAULT_EXERCISE_INPUTS, EXERCISE_PRESETS) ?? DEFAULT_EXERCISE_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  // Tab, question sets, session, bedside and the three bedded nodes. Everything downstream of
  // the engine that every bedded page repeats lives in the hook; what stays here is this
  // module's physiology and its presentation.
  const cases = useModuleCases({
    moduleId: 'exercisePhysiology',
    patient,
    cases: EXERCISE_CASES,
    questions: EXERCISE_QUESTIONS,
    presets: EXERCISE_PRESETS,
    defaultInputs: DEFAULT_EXERCISE_INPUTS,
    inputs,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
    shareLink,
    snapshot,
    transport,
    baselineFrozen: baseline.history !== null,
    presetLabels: EXERCISE_PRESET_LABELS,
    presetGloss: EXERCISE_PRESET_GLOSS,
  });
  const { session } = cases;

  const handleChange = useInputSetter(setInputs);

  const hrHistory = useSeries(history, (h) => h.hr);
  const hrBaseline = useSeries(baseline.history, (h) => h.hr);
  const vo2History = useSeries(history, (h) => h.vo2 / 100);
  const vo2Baseline = useSeries(baseline.history, (h) => h.vo2 / 100);
  const lactateHistory = useSeries(history, (h) => h.lactate);
  const lactateBaseline = useSeries(baseline.history, (h) => h.lactate);
  const fatigueHistory = useSeries(history, (h) => h.fatigue);
  const fatigueBaseline = useSeries(baseline.history, (h) => h.fatigue);

  return (
    <ModulePage
      historyCapacity={exerciseLoopConfig.historyCapacity}
      moduleId="exercisePhysiology"
      title="Exercise Physiology"
      subtitle="every system answers one question: how much oxygen do the muscles need"
      accentVar="var(--exercise)"
      presets={
        <PresetBar
          order={EXERCISE_PRESET_ORDER}
          labels={EXERCISE_PRESET_LABELS}
          onApply={cases.applyPreset}
          actions={[
            { label: 'Anaerobic surge', onClick: () => perturb(perturbSprintSurge), variant: 'danger' },
          ]}
          onShare={cases.shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      {...cases.page}
      diagram={<ExerciseDiagram derived={snapshot.derived} />}
      readouts={<ExerciseReadoutPanel derived={snapshot.derived} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Heart rate"
            unit="bpm"
            data={hrHistory}
            baselineData={hrBaseline}
            domainMin={40}
            domainMax={200}
            colorVar="var(--artery)"
          />
          <Sparkline
            label="VO2"
            unit="×100 mL/min"
            data={vo2History}
            baselineData={vo2Baseline}
            domainMin={0}
            domainMax={450}
            colorVar="var(--o2)"
          />
          <Sparkline
            label="Lactate"
            unit="mmol/L"
            data={lactateHistory}
            baselineData={lactateBaseline}
            domainMin={0}
            domainMax={12}
            colorVar="var(--nociception)"
          />
          <Sparkline
            label="Fatigue"
            unit="%"
            data={fatigueHistory}
            baselineData={fatigueBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--danger)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ExerciseControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={exercisePhysiologyContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified integrative model of the acute response to graded dynamic exercise — not a clinical or diagnostic tool. Cycling ergometry is the reference modality; anaerobic contribution is represented by lactate and fatigue rather than a separate energy system; blood pressure and baroreflex behaviour are summarised as a falling resistance index; and training adaptations are compressed into a single fitness slider. For where this heat goes, see Thermoregulation."
    />
  );
}
