import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
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
import { perturbLevodopaDose, perturbToggleDbs } from './engine/engine';
import {
  MOTOR_PRESETS,
  MOTOR_PRESET_LABELS,
  MOTOR_PRESET_ORDER,
  DEFAULT_MOTOR_INPUTS,
  type MotorPresetName,
} from './engine/presets';
import type { MotorInputs } from './engine/types';

export function MotorControlPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<MotorInputs>('motorControl', DEFAULT_MOTOR_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, motorLoopConfig);

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

  function handleChange<K extends keyof MotorInputs>(key: K, value: MotorInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: MotorPresetName) {
    setInputs((prev) => ({ ...prev, ...MOTOR_PRESETS[name] }));
  }

  const latencyHistory = history.map((h) => h.latency);
  const latencyBaseline = baseline.history?.map((h) => h.latency) ?? null;
  const restHistory = history.map((h) => h.restTremor);
  const restBaseline = baseline.history?.map((h) => h.restTremor) ?? null;
  const involuntaryHistory = history.map((h) => h.involuntary);
  const involuntaryBaseline = baseline.history?.map((h) => h.involuntary) ?? null;

  return (
    <ModulePage
      moduleId="motorControl"
      title="Motor Control: Basal Ganglia & Cerebellum"
      subtitle="slowness means dopamine, error means cerebellum, and release means involuntary movement"
      accentVar="var(--basal-ganglia)"
      presets={
        <PresetBar
          order={MOTOR_PRESET_ORDER}
          labels={MOTOR_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[
            { label: 'Levodopa dose', onClick: () => perturb(perturbLevodopaDose), variant: 'impulse' },
            { label: 'Deep brain stimulation', onClick: () => perturb(perturbToggleDbs), variant: 'impulse' },
          ]}
          onShare={shareLink}
          onReset={reset}
          disabled={session.blinded}
        />
      }
      diagram={<MotorDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={MOTOR_PRESET_LABELS} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
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
