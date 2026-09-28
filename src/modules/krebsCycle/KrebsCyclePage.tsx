import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { KREBS_CYCLE_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { QuestionSet } from '@/shared/components/QuestionSet/QuestionSet';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { krebsCycleContent } from './content';
import { krebsCycleLoopConfig } from './engine/loopConfig';
import {
  DEFAULT_KREBS_CYCLE_INPUTS,
  KREBS_CYCLE_PRESETS,
  KREBS_CYCLE_PRESET_LABELS,
  KREBS_CYCLE_PRESET_ORDER,
} from './engine/presets';
import { buildKrebsCyclePresentation } from './presentation';
import { getPresentationContext } from '@/shared/presentation/context';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import type {
  KrebsCycleDerived,
  KrebsCycleHistoryPoint,
  KrebsCycleInputs,
  KrebsCycleInternalState,
} from './engine/types';

export function KrebsCyclePage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<KrebsCycleInputs>('krebsCycle', DEFAULT_KREBS_CYCLE_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, krebsCycleLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_KREBS_CYCLE_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'krebsCycle',
    questions: KREBS_CYCLE_QUESTIONS,
    presets: KREBS_CYCLE_PRESETS,
    inputs,
    defaultInputs: DEFAULT_KREBS_CYCLE_INPUTS,
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
    defaults: DEFAULT_KREBS_CYCLE_INPUTS,
    presets: KREBS_CYCLE_PRESETS,
    resetEngine: reset,
  });

  const ctx = getPresentationContext<KrebsCycleInternalState, KrebsCycleDerived, KrebsCycleInputs, KrebsCycleHistoryPoint>(
    snapshot,
    history,
    baseline,
    inputs,
  );
  const slots = usePresentationSlots('krebsCycle', buildKrebsCyclePresentation(ctx), ctx, inputs, handleChange);

  return (
    <ModulePage
      historyCapacity={krebsCycleLoopConfig.historyCapacity}
      moduleId="krebsCycle"
      title="Krebs Cycle & Mitochondrial Flux"
      subtitle="eight turns, two doors, one electron sink"
      accentVar="var(--exercise)"
      presets={
        <PresetBar
          order={KREBS_CYCLE_PRESET_ORDER}
          labels={KREBS_CYCLE_PRESET_LABELS}
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
          count={KREBS_CYCLE_QUESTIONS.length}
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
      explainer={<ExplainerPanel content={krebsCycleContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of mitochondrial TCA flux — not a clinical or diagnostic tool. Flux is normalised so resting balance reads as one turn, and gas exchange is scaled onto textbook resting values. Simulated time runs faster than real time so pool turnover is watchable within a session.'}
    />
  );
}
