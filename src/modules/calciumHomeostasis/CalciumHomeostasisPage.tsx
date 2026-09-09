import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { CALCIUM_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { getPresentationContext } from '@/shared/presentation/context';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import { buildCalciumHomeostasisPresentation } from './presentation';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { calciumHomeostasisContent } from './content';
import { calciumLoopConfig } from './engine/loopConfig';
import { perturbCalciumInfusion } from './engine/engine';
import { CALCIUM_PRESETS, DEFAULT_CALCIUM_INPUTS, CALCIUM_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { CalciumDerived, CalciumHistoryPoint, CalciumInputs, CalciumState } from './engine/types';

export function CalciumHomeostasisPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<CalciumInputs>('calciumHomeostasis', DEFAULT_CALCIUM_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, calciumLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_CALCIUM_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'calciumHomeostasis',
    questions: CALCIUM_QUESTIONS,
    presets: CALCIUM_PRESETS,
    inputs,
    defaultInputs: DEFAULT_CALCIUM_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  const handleChange = useInputSetter(setInputs);


  const ctx = getPresentationContext<CalciumState, CalciumDerived, CalciumInputs, CalciumHistoryPoint>(snapshot, history, baseline, inputs);

  const slots = usePresentationSlots('calciumHomeostasis', buildCalciumHomeostasisPresentation(ctx), ctx, inputs, handleChange);

  const applyPreset = useScenarioPreset({
    setInputs,
    defaults: DEFAULT_CALCIUM_INPUTS,
    presets: CALCIUM_PRESETS,
    resetEngine: reset,
  });

  function triggerCalciumInfusion() {
    perturb((state) => perturbCalciumInfusion(state));
  }

  return (
    <ModulePage
      moduleId="calciumHomeostasis"
      title="Calcium & Bone/Mineral Homeostasis"
      subtitle="PTH, calcitriol & phosphate regulation"
      accentVar="var(--pth)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={CALCIUM_PRESET_LABELS}
          onApply={applyPreset}
          actions={[{ label: 'Calcium infusion', onClick: triggerCalciumInfusion, variant: 'impulse' }]}
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
      explainer={<ExplainerPanel content={calciumHomeostasisContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of calcium and phosphate homeostasis — not a clinical or diagnostic tool. Compare the presets by watching calcium and phosphate move in opposite directions: primary hyperparathyroidism raises calcium while dropping phosphate, hypoparathyroidism does the reverse, and hypomagnesemia produces hypocalcemia with PTH stuck near zero. Simulated time runs much faster than real time so PTH (minutes) and calcitriol (hours to days) responses are both watchable within a session.'}
    />
  );
}
