import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { caseInputs, useModuleCase } from '@/shared/hooks/useModuleCase';
import { useModuleCases } from '@/shared/hooks/useModuleCases';
import { GI_CASES } from './cases';
import { GI_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { gastrointestinalContent } from './content';
import { giLoopConfig } from './engine/loopConfig';
import { perturbEatMeal } from './engine/engine';
import { DEFAULT_GI_INPUTS, GI_PRESETS, GI_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import { buildGastrointestinalPresentation } from './presentation';
import { getPresentationContext } from '@/shared/presentation/context';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import type { GiDerived, GiHistoryPoint, GiInputs, GiState } from './engine/types';

export function GastrointestinalPage() {
  // Opened from the ward round, or null for the catalogue route. The seed means the engine
  // settles the patient directly rather than settling a healthy body and then jumping.
  const patient = useModuleCase(GI_CASES);
  const { inputs, setInputs, shareLink } = useShareableInputs<GiInputs>(
    'gastrointestinal',
    DEFAULT_GI_INPUTS,
    caseInputs(patient, DEFAULT_GI_INPUTS, GI_PRESETS),
  );
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, giLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    // At a bedside, Reset means "back to this patient". Returning a learner who is mid-case to
    // a healthy volunteer would discard the thing they came to look at.
    defaults: caseInputs(patient, DEFAULT_GI_INPUTS, GI_PRESETS) ?? DEFAULT_GI_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  // Tab, question sets, session, bedside and the three bedded nodes. Everything downstream of
  // the engine that every bedded page repeats lives in the hook; what stays here is this
  // module's physiology and its presentation.
  const cases = useModuleCases({
    moduleId: 'gastrointestinal',
    patient,
    cases: GI_CASES,
    questions: GI_QUESTIONS,
    presets: GI_PRESETS,
    defaultInputs: DEFAULT_GI_INPUTS,
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
  });
  const { session } = cases;

  const handleChange = useInputSetter(setInputs);

  function triggerEatMeal() {
    perturb((state) => perturbEatMeal(state));
  }

  const ctx = getPresentationContext<GiState, GiDerived, GiInputs, GiHistoryPoint>(snapshot, history, baseline, inputs);
  const slots = usePresentationSlots('gastrointestinal', buildGastrointestinalPresentation(ctx), ctx, inputs, handleChange);

  return (
    <ModulePage
      historyCapacity={giLoopConfig.historyCapacity}
      moduleId="gastrointestinal"
      title="GI Physiology"
      subtitle="gastric acid, gut hormones & motility along the meal"
      accentVar="var(--gastrin)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={GI_PRESET_LABELS}
          onApply={cases.applyPreset}
          actions={[{ label: 'Eat meal', onClick: triggerEatMeal, variant: 'impulse' }]}
          onShare={cases.shareLink}
          onReset={resetScenario}
        />
      }
      {...cases.page}
      diagram={slots.diagram}
      readouts={slots.readouts}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={slots.charts}
      controls={slots.controls}
      blindControls={session.blinded}
      explainer={<ExplainerPanel content={gastrointestinalContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of GI physiology — not a clinical or diagnostic tool. Adjust the meal composition and drug/tone sliders first, then click "Eat meal" to trigger digestion — or leave the stomach empty and just watch to see the migrating motor complex sweep through its interdigestive cycle. Simulated time runs much faster than real time so hormone responses and gastric emptying (physiologically hours) are watchable within a session.'}
    />
  );
}
