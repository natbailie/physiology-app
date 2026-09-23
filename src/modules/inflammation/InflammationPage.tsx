import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { QuestionSet } from '@/shared/components/QuestionSet/QuestionSet';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { INFLAMMATION_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { inflammationContent } from './content';
import { buildInflammationPresentation } from './presentation';
import { getPresentationContext } from '@/shared/presentation/context';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import { inflammationLoopConfig } from './engine/loopConfig';
import { perturbNewInsult, perturbDrainAbscess } from './engine/engine';
import {
  INFLAMMATION_PRESETS,
  INFLAMMATION_PRESET_LABELS,
  INFLAMMATION_PRESET_ORDER,
  DEFAULT_INFLAMMATION_INPUTS,
} from './engine/presets';
import type { InflammationDerived, InflammationHistoryPoint, InflammationInputs, InflammationInternalState } from './engine/types';

export function InflammationPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<InflammationInputs>('inflammation', DEFAULT_INFLAMMATION_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, inflammationLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_INFLAMMATION_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'inflammation',
    questions: INFLAMMATION_QUESTIONS,
    presets: INFLAMMATION_PRESETS,
    inputs,
    defaultInputs: DEFAULT_INFLAMMATION_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  const handleChange = useInputSetter(setInputs);

  /* One drawing, not two — and the conversion GAINS the web a control: the schema has always
   * offered an insult-type toggle that the hand-written panel never rendered, so a bacterial,
   * crystal and foreign-body insult were selectable on the phone and not here. Readouts and charts
   * were verified identical first. */
  const ctx = getPresentationContext<InflammationInternalState, InflammationDerived, InflammationInputs, InflammationHistoryPoint>(
    snapshot,
    history,
    baseline,
    inputs,
  );
  const slots = usePresentationSlots('inflammation', buildInflammationPresentation(ctx), ctx, inputs, handleChange);

  const applyPreset = useScenarioPreset({
    setInputs,
    defaults: DEFAULT_INFLAMMATION_INPUTS,
    presets: INFLAMMATION_PRESETS,
    resetEngine: reset,
  });


  return (
    <ModulePage
      historyCapacity={inflammationLoopConfig.historyCapacity}
      moduleId="inflammation"
      title="Inflammation"
      subtitle="acute response, resolution, and the conditions that prevent it"
      accentVar="var(--danger)"
      presets={
        <PresetBar
          order={INFLAMMATION_PRESET_ORDER}
          labels={INFLAMMATION_PRESET_LABELS}
          onApply={applyPreset}
          actions={[
            { label: 'New insult', onClick: () => perturb((s) => perturbNewInsult(s, inputs.insultSeverityPct || 50)), variant: 'impulse' },
            { label: 'Drain abscess', onClick: () => perturb((s) => perturbDrainAbscess(s, 0.8)), variant: 'danger' },
          ]}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={slots.diagram}
      readouts={slots.readouts}
      questions={
        <QuestionSet
          count={INFLAMMATION_QUESTIONS.length}
          beds={[]}
          schedule={summary.schedule}
          snapshot={snapshot}
          question={session.question}
        >
          <QuizPanel session={session} summary={summary} presetLabels={INFLAMMATION_PRESET_LABELS} />
        </QuestionSet>
      }
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={slots.charts}
      blindControls={session.blinded}
      controls={slots.controls}
      explainer={<ExplainerPanel content={inflammationContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified, conceptual model of the acute inflammatory response — not a clinical or diagnostic tool. Insults are deposited as events; antibiotics, steroids and source control act on different arms of the same cascade. The CRP and fever track systemic spillover from the local war, and resolution requires the insult to be cleared — which is why a foreign body, unlike bacteria, turns the response chronic."
    />
  );
}
