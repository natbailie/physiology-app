import { getPresentationContext } from '@/shared/presentation/context';
import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { RF_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { respiratoryFailureContent } from './content';
import { respiratoryFailureLoopConfig } from './engine/loopConfig';
import { DEFAULT_RF_INPUTS, RF_PRESETS, RF_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import { buildRespiratoryFailurePresentation } from './presentation';
import type { RfDerived, RfHistoryPoint, RfInputs, RfState } from './engine/types';

export function RespiratoryFailurePage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<RfInputs>('respiratoryFailure', DEFAULT_RF_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, respiratoryFailureLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_RF_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'respiratoryFailure',
    questions: RF_QUESTIONS,
    presets: RF_PRESETS,
    inputs,
    defaultInputs: DEFAULT_RF_INPUTS,
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
    defaults: DEFAULT_RF_INPUTS,
    presets: RF_PRESETS,
    resetEngine: reset,
  });

  const ctx = getPresentationContext<RfState, RfDerived, RfInputs, RfHistoryPoint>(snapshot, history, baseline, inputs);
  const slots = usePresentationSlots('respiratoryFailure', buildRespiratoryFailurePresentation(ctx), ctx, inputs, handleChange);

  return (
    <ModulePage
      moduleId="respiratoryFailure"
      title="Respiratory Failure & V/Q Mismatch"
      subtitle="the oxygen axis, the CO2 axis, and knowing which one is failing"
      accentVar="var(--o2)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={RF_PRESET_LABELS}
          onApply={applyPreset}
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
      explainer={<ExplainerPanel content={respiratoryFailureContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of respiratory failure — not a clinical or diagnostic tool. The patient is a point on the PaO2-vs-PaCO2 map, so where the point sits IS the diagnosis: low PaO2 alone is type I, high PaCO2 alone is type II, both is mixed. Oxygen and ventilation fix different axes — the COPD preset shows that raising FiO2 moves the oxygen and leaves the CO2 sitting exactly where it was, while ventilation clears the CO2 and leaves a big shunt still stealing oxygen. Flip the Course toggle on a hypercapnic preset to see why the pH, not the CO2, tells acute from chronic. Use the quiz and the baseline PaO2 trace to compare a patient against normal gas exchange.'}
    />
  );
}