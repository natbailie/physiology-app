import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuestionSet } from '@/shared/components/QuestionSet/QuestionSet';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { MotorDiagram } from './components/MotorDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { MOTOR_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { motorControlContent } from './content';
import { motorLoopConfig } from './engine/loopConfig';
import { perturbLevodopaDose } from './engine/engine';
import {
  MOTOR_PRESETS,
  MOTOR_PRESET_LABELS,
  MOTOR_PRESET_ORDER,
  DEFAULT_MOTOR_INPUTS,
} from './engine/presets';
import type { MotorInputs } from './engine/types';
import { TremorStrip } from './components/TremorStrip';

export function MotorControlPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<MotorInputs>('motorControl', DEFAULT_MOTOR_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, motorLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_MOTOR_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'motorControl',
    questions: MOTOR_QUESTIONS,
    presets: MOTOR_PRESETS,
    inputs,
    defaultInputs: DEFAULT_MOTOR_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  const handleChange = useInputSetter(setInputs);

  const applyPreset = useScenarioPreset({
    setInputs,
    defaults: DEFAULT_MOTOR_INPUTS,
    presets: MOTOR_PRESETS,
    resetEngine: reset,
  });

  const latencyHistory = useSeries(history, (h) => h.latency);
  const latencyBaseline = useSeries(baseline.history, (h) => h.latency);
  const restHistory = useSeries(history, (h) => h.restTremor);
  const restBaseline = useSeries(baseline.history, (h) => h.restTremor);
  const involuntaryHistory = useSeries(history, (h) => h.involuntary);
  const involuntaryBaseline = useSeries(baseline.history, (h) => h.involuntary);

  return (
    <ModulePage
      historyCapacity={motorLoopConfig.historyCapacity}
      moduleId="motorControl"
      title="Motor Control: Basal Ganglia & Cerebellum"
      subtitle="slowness means dopamine, error means cerebellum, and release means involuntary movement"
      accentVar="var(--basal-ganglia)"
      presets={
        <PresetBar
          order={MOTOR_PRESET_ORDER}
          labels={MOTOR_PRESET_LABELS}
          onApply={applyPreset}
          actions={[
            { label: 'Levodopa dose', onClick: () => perturb(perturbLevodopaDose), variant: 'impulse' },
            { label: 'Deep brain stimulation', onClick: () => handleChange('deepBrainStimulation', inputs.deepBrainStimulation === 'on' ? 'off' : 'on'), variant: 'impulse' },
          ]}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={<MotorDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      questions={
        <QuestionSet
          count={MOTOR_QUESTIONS.length}
          beds={[]}
          schedule={summary.schedule}
          snapshot={snapshot}
          question={session.question}
        >
          <QuizPanel session={session} summary={summary} presetLabels={MOTOR_PRESET_LABELS} />
        </QuestionSet>
      }
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <TremorStrip derived={snapshot.derived} />
          <Sparkline
            label="Initiation latency"
            unit="ms"
            data={latencyHistory}
            baselineData={latencyBaseline}
            domainMin={0}
            domainMax={1400}
            colorVar="var(--basal-ganglia)"
          />
          <Sparkline
            label="Resting tremor"
            data={restHistory}
            baselineData={restBaseline}
            domainMin={0}
            domainMax={12}
            colorVar="var(--nociception)"
          />
          <Sparkline
            label="Involuntary movement"
            data={involuntaryHistory}
            baselineData={involuntaryBaseline}
            domainMin={0}
            domainMax={20}
            colorVar="var(--danger)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={motorControlContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified conceptual model of movement gating and calibration — not a clinical or diagnostic tool. Laterality is not modelled (hemiballismus is described as contralateral in prose); tremors are drawn as schematic envelopes rather than true oscillators, since sampling an oscillator cannot be verified; and each lesion class stands for a family of diseases rather than one diagnosis. Levodopa decay runs on compressed hours so wearing-off is watchable."
    />
  );
}
