import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
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
} from './engine/presets';
import type { VisionInputs } from './engine/types';

export function VisionPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<VisionInputs>('vision', DEFAULT_VISION_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, visionLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_VISION_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

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

  const handleChange = useInputSetter(setInputs);

  const applyPreset = useScenarioPreset({
    setInputs,
    defaults: DEFAULT_VISION_INPUTS,
    presets: VISION_PRESETS,
    resetEngine: reset,
  });

  const brightnessHistory = useSeries(history, (h) => h.brightness);
  const brightnessBaseline = useSeries(baseline.history, (h) => h.brightness);
  const pupilHistory = useSeries(history, (h) => h.pupilR);
  const pupilBaseline = useSeries(baseline.history, (h) => h.pupilR);
  const bleachHistory = useSeries(history, (h) => h.bleached);
  const bleachBaseline = useSeries(baseline.history, (h) => h.bleached);

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
          onApply={applyPreset}
          actions={[
            { label: 'Lights out', onClick: () => perturb(perturbLightsOut), variant: 'impulse' },
            { label: 'Torch → right', onClick: () => perturb((s) => perturbShineTorch(s, 1)), variant: 'impulse' },
            { label: 'Torch → left', onClick: () => perturb((s) => perturbShineTorch(s, -1)), variant: 'impulse' },
            { label: 'Torch off', onClick: () => perturb(perturbTorchOff), variant: 'impulse' },
            { label: 'Camera flash', onClick: () => perturb(perturbBrightGlare), variant: 'danger' },
          ]}
          onShare={shareLink}
          onReset={resetScenario}
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
      footnote="A simplified conceptual model of the dual receptor system, dark adaptation, the pupil reflexes, the aqueous circulation and the visual pathways — not a clinical or diagnostic tool. Colour processing is outside its scope: cone integrity here stands for the whole foveal mosaic rather than the L/M/S classes individually. Dark adaptation is compressed to run in minutes of simulated time; pupil responses stay snappy at that scale. Intraocular pressure relaxes over simulated hours, so glaucomatous scenarios are settled by the question harness before they are shown. Field defects map lesion site to territory as fixed anatomy rather than modelling tumour growth or demyelination. For the ion channels underneath the photoreceptor potential, see Membrane & Action Potentials."
    />
  );
}
