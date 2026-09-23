import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { COGNITION_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { QuestionSet } from '@/shared/components/QuestionSet/QuestionSet';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { cognitionContent } from './content';
import { cognitiveNeuroscienceLoopConfig } from './engine/loopConfig';
import {
  DEFAULT_COGNITION_INPUTS,
  COGNITION_PRESETS,
  COGNITION_PRESET_LABELS,
  COGNITION_PRESET_ORDER,
} from './engine/presets';
import { buildCognitionPresentation } from './presentation';
import { getPresentationContext } from '@/shared/presentation/context';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import type {
  CognitionDerived,
  CognitionHistoryPoint,
  CognitionInputs,
  CognitionInternalState,
} from './engine/types';

export function CognitiveNeurosciencePage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<CognitionInputs>('cognitiveNeuroscience', DEFAULT_COGNITION_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, cognitiveNeuroscienceLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_COGNITION_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'cognitiveNeuroscience',
    questions: COGNITION_QUESTIONS,
    presets: COGNITION_PRESETS,
    inputs,
    defaultInputs: DEFAULT_COGNITION_INPUTS,
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
    defaults: DEFAULT_COGNITION_INPUTS,
    presets: COGNITION_PRESETS,
    resetEngine: reset,
  });

  const ctx = getPresentationContext<CognitionInternalState, CognitionDerived, CognitionInputs, CognitionHistoryPoint>(
    snapshot,
    history,
    baseline,
    inputs,
  );
  const slots = usePresentationSlots('cognitiveNeuroscience', buildCognitionPresentation(ctx), ctx, inputs, handleChange);

  return (
    <ModulePage
      historyCapacity={cognitiveNeuroscienceLoopConfig.historyCapacity}
      moduleId="cognitiveNeuroscience"
      title="Cognitive Neurophysiology"
      subtitle="arousal, working memory & the executive reserve"
      accentVar="var(--axon)"
      presets={
        <PresetBar
          order={COGNITION_PRESET_ORDER}
          labels={COGNITION_PRESET_LABELS}
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
          count={COGNITION_QUESTIONS.length}
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
      explainer={<ExplainerPanel content={cognitionContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of the Yerkes-Dodson inverted-U, the 7±2 working-memory ceiling and an executive reserve that fatigue erodes — it is a teaching sketch of the classic experiments, not a measure of any individual\'s real cognition. The task optimum moves with difficulty, effort is spent from a reserve, and performance collapses past a demand cliff, but none of the indices are calibrated to a clinical population. Time advances at real time because everything happens by hand on the dials.'}
    />
  );
}