import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { TOXICOLOGY_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { QuestionSet } from '@/shared/components/QuestionSet/QuestionSet';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { toxicologyContent } from './content';
import { toxicologyLoopConfig } from './engine/loopConfig';
import {
  DEFAULT_TOXICOLOGY_INPUTS,
  TOXICOLOGY_PRESETS,
  TOXICOLOGY_PRESET_LABELS,
  TOXICOLOGY_PRESET_ORDER,
} from './engine/presets';
import { buildToxicologyPresentation } from './presentation';
import { getPresentationContext } from '@/shared/presentation/context';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import type {
  ToxicologyDerived,
  ToxicologyHistoryPoint,
  ToxicologyInputs,
  ToxicologyInternalState,
} from './engine/types';

export function ToxicologyPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<ToxicologyInputs>('toxicology', DEFAULT_TOXICOLOGY_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, toxicologyLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_TOXICOLOGY_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'toxicology',
    questions: TOXICOLOGY_QUESTIONS,
    presets: TOXICOLOGY_PRESETS,
    inputs,
    defaultInputs: DEFAULT_TOXICOLOGY_INPUTS,
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
    defaults: DEFAULT_TOXICOLOGY_INPUTS,
    presets: TOXICOLOGY_PRESETS,
    resetEngine: reset,
  });

  const ctx = getPresentationContext<ToxicologyInternalState, ToxicologyDerived, ToxicologyInputs, ToxicologyHistoryPoint>(
    snapshot,
    history,
    baseline,
    inputs,
  );
  const slots = usePresentationSlots('toxicology', buildToxicologyPresentation(ctx), ctx, inputs, handleChange);

  return (
    <ModulePage
      historyCapacity={toxicologyLoopConfig.historyCapacity}
      moduleId="toxicology"
      title="Toxicology & Poisoning"
      subtitle="the nomogram, the antidote race & the eight-hour window"
      accentVar="var(--danger)"
      presets={
        <PresetBar
          order={TOXICOLOGY_PRESET_ORDER}
          labels={TOXICOLOGY_PRESET_LABELS}
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
          count={TOXICOLOGY_QUESTIONS.length}
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
      explainer={<ExplainerPanel content={toxicologyContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of paracetamol kinetics on the Rumack-Matthew nomogram — not a clinical or diagnostic tool. Plasma concentrations fall log-linearly with a fixed half-life and NAC protection follows the published eight-hour window, but no single model replaces a real toxicology consultation. Simulated time advances faster than real time so a missed window is watchable within a session.'}
    />
  );
}