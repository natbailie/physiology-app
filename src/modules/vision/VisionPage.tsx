import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { VisionDiagram } from './components/VisionDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { VISION_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { visionContent } from './content';
import { visionLoopConfig } from './engine/loopConfig';
import { perturbBrightGlare, perturbLightsOut, perturbShineTorch, perturbTorchOff } from './engine/engine';
import {
  VISION_PRESETS,
  VISION_PRESET_LABELS,
  VISION_PRESET_ORDER,
  DEFAULT_VISION_INPUTS,
  type VisionPresetName,
} from './engine/presets';
import type { VisionInputs } from './engine/types';

export function VisionPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<VisionInputs>('vision', DEFAULT_VISION_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, visionLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'vision',
    questions: VISION_QUESTIONS,
    presets: VISION_PRESETS,
    inputs,
    defaultInputs: DEFAULT_VISION_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  function handleChange<K extends keyof VisionInputs>(key: K, value: VisionInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: VisionPresetName) {
    setInputs((prev) => ({ ...prev, ...VISION_PRESETS[name] }));
  }

  const brightnessHistory = history.map((h) => h.brightness);
  const brightnessBaseline = baseline.history?.map((h) => h.brightness) ?? null;
  const pupilHistory = history.map((h) => h.pupilR);
  const pupilBaseline = baseline.history?.map((h) => h.pupilR) ?? null;
  const bleachHistory = history.map((h) => h.bleached);
  const bleachBaseline = baseline.history?.map((h) => h.bleached) ?? null;

  return (
    <ModulePage
      moduleId="vision"
      title="Vision & Phototransduction"
      subtitle="two receptor systems share one retina, and each owns a different blindness"
      accentVar="var(--retina)"
      presets={
        <PresetBar
          order={VISION_PRESET_ORDER}
          labels={VISION_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[
            { label: 'Lights out', onClick: () => perturb(perturbLightsOut), variant: 'impulse' },
            { label: 'Torch → right', onClick: () => perturb((s) => perturbShineTorch(s, 1)), variant: 'impulse' },
            { label: 'Torch → left', onClick: () => perturb((s) => perturbShineTorch(s, -1)), variant: 'impulse' },
            { label: 'Torch off', onClick: () => perturb(perturbTorchOff), variant: 'impulse' },
            { label: 'Camera flash', onClick: () => perturb(perturbBrightGlare), variant: 'danger' },
          ]}
          onShare={shareLink}
          onReset={reset}
          disabled={session.blinded}
        />
      }
      diagram={<VisionDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={VISION_PRESET_LABELS} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Perceived brightness"
            unit="%"
            data={brightnessHistory}
            baselineData={brightnessBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--o2)"
          />
          <Sparkline
            label="Right pupil"
            unit="mm"
            data={pupilHistory}
            baselineData={pupilBaseline}
            domainMin={2}
            domainMax={8}
            colorVar="var(--artery)"
          />
          <Sparkline
            label="Rod pigment bleached"
            unit="%"
            data={bleachHistory}
            baselineData={bleachBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--danger)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={visionContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified conceptual model of the dual receptor system, dark adaptation and the pupil reflexes — not a clinical or diagnostic tool. Colour processing is outside its scope: cone integrity here stands for the whole foveal mosaic rather than the L/M/S classes individually. Dark adaptation is compressed to run in minutes of simulated time; pupil responses stay snappy at that scale. For the ion channels underneath the photoreceptor potential, see Membrane & Action Potentials."
    />
  );
}
