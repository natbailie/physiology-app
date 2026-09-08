import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { GI_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { gastrointestinalContent } from './content';
import { giLoopConfig } from './engine/loopConfig';
import { perturbEatMeal } from './engine/engine';
import { DEFAULT_GI_INPUTS, GI_PRESETS, GI_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import { buildGastrointestinalPresentation } from './presentation';
import { getPresentationContext } from '@/shared/presentation/context';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import type { GiDerived, GiHistoryPoint, GiInputs, GiState } from './engine/types';

export function GastrointestinalPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<GiInputs>('gastrointestinal', DEFAULT_GI_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, giLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_GI_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'gastrointestinal',
    questions: GI_QUESTIONS,
    presets: GI_PRESETS,
    inputs,
    defaultInputs: DEFAULT_GI_INPUTS,
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
    defaults: DEFAULT_GI_INPUTS,
    presets: GI_PRESETS,
    resetEngine: reset,
  });

  function triggerEatMeal() {
    perturb((state) => perturbEatMeal(state));
  }

  const ctx = getPresentationContext<GiState, GiDerived, GiInputs, GiHistoryPoint>(snapshot, history, baseline, inputs);
  const slots = usePresentationSlots('gastrointestinal', buildGastrointestinalPresentation(ctx), ctx, inputs, handleChange);

  return (
    <ModulePage
      moduleId="gastrointestinal"
      title="GI Physiology"
      subtitle="gastric acid, gut hormones & motility along the meal"
      accentVar="var(--gastrin)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={GI_PRESET_LABELS}
          onApply={applyPreset}
          actions={[{ label: 'Eat meal', onClick: triggerEatMeal, variant: 'impulse' }]}
          onShare={shareLink}
          onReset={resetScenario}
        />
      }
      diagram={slots.diagram}
      readouts={slots.readouts}
      practice={<QuizPanel session={session} summary={summary} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={slots.charts}
      controls={slots.controls}
      explainer={<ExplainerPanel content={gastrointestinalContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of GI physiology — not a clinical or diagnostic tool. Adjust the meal composition and drug/tone sliders first, then click "Eat meal" to trigger digestion — or leave the stomach empty and just watch to see the migrating motor complex sweep through its interdigestive cycle. Simulated time runs much faster than real time so hormone responses and gastric emptying (physiologically hours) are watchable within a session.'}
    />
  );
}
