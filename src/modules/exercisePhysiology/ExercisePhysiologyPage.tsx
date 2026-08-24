import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
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
  EXERCISE_PRESET_ORDER,
  DEFAULT_EXERCISE_INPUTS,
  type ExercisePresetName,
} from './engine/presets';
import type { ExerciseInputs } from './engine/types';

export function ExercisePhysiologyPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<ExerciseInputs>('exercisePhysiology', DEFAULT_EXERCISE_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, exerciseLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'exercisePhysiology',
    questions: EXERCISE_QUESTIONS,
    presets: EXERCISE_PRESETS,
    inputs,
    defaultInputs: DEFAULT_EXERCISE_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  function handleChange<K extends keyof ExerciseInputs>(key: K, value: ExerciseInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: ExercisePresetName) {
    setInputs((prev) => ({ ...prev, ...EXERCISE_PRESETS[name] }));
  }

  const hrHistory = history.map((h) => h.hr);
  const hrBaseline = baseline.history?.map((h) => h.hr) ?? null;
  const vo2History = history.map((h) => h.vo2 / 100);
  const vo2Baseline = baseline.history?.map((h) => h.vo2 / 100) ?? null;
  const lactateHistory = history.map((h) => h.lactate);
  const lactateBaseline = baseline.history?.map((h) => h.lactate) ?? null;
  const fatigueHistory = history.map((h) => h.fatigue);
  const fatigueBaseline = baseline.history?.map((h) => h.fatigue) ?? null;

  return (
    <ModulePage
      moduleId="exercisePhysiology"
      title="Exercise Physiology"
      subtitle="every system answers one question: how much oxygen do the muscles need"
      accentVar="var(--exercise)"
      presets={
        <PresetBar
          order={EXERCISE_PRESET_ORDER}
          labels={EXERCISE_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[
            { label: 'Anaerobic surge', onClick: () => perturb(perturbSprintSurge), variant: 'danger' },
          ]}
          onShare={shareLink}
          onReset={reset}
          disabled={session.blinded}
        />
      }
      diagram={<ExerciseDiagram derived={snapshot.derived} />}
      readouts={<ExerciseReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={EXERCISE_PRESET_LABELS} />}
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
