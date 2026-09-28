import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { UREA_CYCLE_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { QuestionSet } from '@/shared/components/QuestionSet/QuestionSet';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { ureaCycleContent } from './content';
import { ureaCycleLoopConfig } from './engine/loopConfig';
import {
  DEFAULT_UREA_CYCLE_INPUTS,
  UREA_CYCLE_PRESETS,
  UREA_CYCLE_PRESET_LABELS,
  UREA_CYCLE_PRESET_ORDER,
} from './engine/presets';
import { buildUreaCyclePresentation } from './presentation';
import { getPresentationContext } from '@/shared/presentation/context';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import type {
  UreaCycleDerived,
  UreaCycleHistoryPoint,
  UreaCycleInputs,
  UreaCycleInternalState,
} from './engine/types';

export function UreaCyclePage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<UreaCycleInputs>('ureaCycle', DEFAULT_UREA_CYCLE_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, ureaCycleLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_UREA_CYCLE_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'ureaCycle',
    questions: UREA_CYCLE_QUESTIONS,
    presets: UREA_CYCLE_PRESETS,
    inputs,
    defaultInputs: DEFAULT_UREA_CYCLE_INPUTS,
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
    defaults: DEFAULT_UREA_CYCLE_INPUTS,
    presets: UREA_CYCLE_PRESETS,
    resetEngine: reset,
  });

  const ctx = getPresentationContext<UreaCycleInternalState, UreaCycleDerived, UreaCycleInputs, UreaCycleHistoryPoint>(
    snapshot,
    history,
    baseline,
    inputs,
  );
  const slots = usePresentationSlots('ureaCycle', buildUreaCyclePresentation(ctx), ctx, inputs, handleChange);

  return (
    <ModulePage
      historyCapacity={ureaCycleLoopConfig.historyCapacity}
      moduleId="ureaCycle"
      title="Urea Cycle & Nitrogen Disposal"
      subtitle="ammonia in, urea out, and where the cycle fails"
      accentVar="var(--liver)"
      presets={
        <PresetBar
          order={UREA_CYCLE_PRESET_ORDER}
          labels={UREA_CYCLE_PRESET_LABELS}
          onApply={applyPreset}
          actions={[]}
          onShare={shareLink}
          onReset={resetScenario}
        />
      }
      diagram={slots.diagram}
      readouts={slots.readouts}
      questions={
        <QuestionSet
          count={UREA_CYCLE_QUESTIONS.length}
          beds={[]}
          schedule={summary.schedule}
          snapshot={snapshot}
          question={session.question}
        >
          <QuizPanel session={session} summary={summary} />
        </QuestionSet>
      }
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={slots.charts}
      controls={slots.controls}
      blindControls={session.blinded}
      explainer={<ExplainerPanel content={ureaCycleContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of hepatic nitrogen disposal — not a clinical or diagnostic tool. Enzyme capacity stands in for the five cycle enzymes as one residual activity; specific defects are staged through the presets. Simulated time runs faster than real time so nitrogen pools equilibrate within a session.'}
    />
  );
}
