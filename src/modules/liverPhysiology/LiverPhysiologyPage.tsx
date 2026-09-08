import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { buildLiverPhysiologyPresentation } from './presentation';
import { getPresentationContext } from '@/shared/presentation/context';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import { LIVER_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { liverPhysiologyContent } from './content';
import { liverLoopConfig } from './engine/loopConfig';
import { perturbAlcoholBinge, perturbHaemolyticEpisode, perturbStentObstruction } from './engine/engine';
import {
  LIVER_PRESETS,
  LIVER_PRESET_LABELS,
  LIVER_PRESET_ORDER,
  DEFAULT_LIVER_INPUTS,
} from './engine/presets';
import type { LiverDerived, LiverHistoryPoint, LiverInputs, LiverInternalState } from './engine/types';

export function LiverPhysiologyPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<LiverInputs>('liverPhysiology', DEFAULT_LIVER_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, liverLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_LIVER_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'liverPhysiology',
    questions: LIVER_QUESTIONS,
    presets: LIVER_PRESETS,
    inputs,
    defaultInputs: DEFAULT_LIVER_INPUTS,
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
    defaults: DEFAULT_LIVER_INPUTS,
    presets: LIVER_PRESETS,
    resetEngine: reset,
  });

  const ctx = getPresentationContext<LiverInternalState, LiverDerived, LiverInputs, LiverHistoryPoint>(snapshot, history, baseline, inputs);
  const slots = usePresentationSlots('liverPhysiology', buildLiverPhysiologyPresentation(ctx), ctx, inputs, handleChange);

  return (
    <ModulePage
      moduleId="liverPhysiology"
      title="Liver & Bilirubin Metabolism"
      subtitle="one pigment, three places to fail, and a urine dipstick that tells you which"
      accentVar="var(--liver)"
      presets={
        <PresetBar
          order={LIVER_PRESET_ORDER}
          labels={LIVER_PRESET_LABELS}
          onApply={applyPreset}
          actions={[
            { label: 'Haemolytic episode', onClick: () => perturb(perturbHaemolyticEpisode), variant: 'danger' },
            { label: 'Alcohol binge', onClick: () => perturb(perturbAlcoholBinge), variant: 'danger' },
            { label: 'ERCP stent', onClick: () => perturb(perturbStentObstruction), variant: 'impulse' },
          ]}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={slots.diagram}
      readouts={slots.readouts}
      practice={<QuizPanel session={session} summary={summary} presetLabels={LIVER_PRESET_LABELS} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={slots.charts}
      blindControls={session.blinded}
      controls={slots.controls}
      explainer={<ExplainerPanel content={liverPhysiologyContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified conceptual model of the bilirubin pathway and its failure modes — not a clinical or diagnostic tool. Albumin binding is represented as a single capacity rather than competitive binding; enzyme levels are modelled as multiples of ULN driven by injury and pressure rather than individual isoforms; and the encephalopathy grade is an ammonia-based simplification of a clinical scoring system. Pools equilibrate over simulated days; acute bursts decay within hours."
    />
  );
}
