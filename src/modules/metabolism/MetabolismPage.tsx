import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { METABOLISM_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { QuestionSet } from '@/shared/components/QuestionSet/QuestionSet';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { metabolismContent } from './content';
import { metabolismLoopConfig } from './engine/loopConfig';
import {
  DEFAULT_METABOLISM_INPUTS,
  METABOLISM_PRESETS,
  METABOLISM_PRESET_LABELS,
  METABOLISM_PRESET_ORDER,
} from './engine/presets';
import { buildMetabolismPresentation } from './presentation';
import { getPresentationContext } from '@/shared/presentation/context';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import type {
  MetabolismDerived,
  MetabolismHistoryPoint,
  MetabolismInputs,
  MetabolismInternalState,
} from './engine/types';

export function MetabolismPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<MetabolismInputs>('metabolism', DEFAULT_METABOLISM_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, metabolismLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_METABOLISM_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'metabolism',
    questions: METABOLISM_QUESTIONS,
    presets: METABOLISM_PRESETS,
    inputs,
    defaultInputs: DEFAULT_METABOLISM_INPUTS,
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
    defaults: DEFAULT_METABOLISM_INPUTS,
    presets: METABOLISM_PRESETS,
    resetEngine: reset,
  });

  const ctx = getPresentationContext<MetabolismInternalState, MetabolismDerived, MetabolismInputs, MetabolismHistoryPoint>(
    snapshot,
    history,
    baseline,
    inputs,
  );
  const slots = usePresentationSlots('metabolism', buildMetabolismPresentation(ctx), ctx, inputs, handleChange);

  return (
    <ModulePage
      historyCapacity={metabolismLoopConfig.historyCapacity}
      moduleId="metabolism"
      title="Metabolism & Energy Balance"
      subtitle="fuel mix, ketosis & the cost of catabolic stress"
      accentVar="var(--glucose)"
      presets={
        <PresetBar
          order={METABOLISM_PRESET_ORDER}
          labels={METABOLISM_PRESET_LABELS}
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
          count={METABOLISM_QUESTIONS.length}
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
      explainer={<ExplainerPanel content={metabolismContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of fuel selection and energy balance — not a clinical or diagnostic tool. The "hours since last meal" slider IS the meal: drag it to zero to eat, and forward to fast. Simulated time runs faster than real time so a sixty-hour starvation is watchable within a session.'}
    />
  );
}