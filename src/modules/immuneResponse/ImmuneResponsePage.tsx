import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { IMMUNE_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { QuestionSet } from '@/shared/components/QuestionSet/QuestionSet';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { immuneResponseContent } from './content';
import { buildImmuneResponsePresentation } from './presentation';
import { getPresentationContext } from '@/shared/presentation/context';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import { immuneLoopConfig } from './engine/loopConfig';
import { perturbInfect, perturbVaccinate } from './engine/engine';
import { DEFAULT_IMMUNE_INPUTS, IMMUNE_PRESETS, IMMUNE_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { ImmuneDerived, ImmuneHistoryPoint, ImmuneInputs, ImmuneState } from './engine/types';

export function ImmuneResponsePage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<ImmuneInputs>('immuneResponse', DEFAULT_IMMUNE_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, immuneLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_IMMUNE_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'immuneResponse',
    questions: IMMUNE_QUESTIONS,
    presets: IMMUNE_PRESETS,
    inputs,
    defaultInputs: DEFAULT_IMMUNE_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  const handleChange = useInputSetter(setInputs);

  /* One drawing, not two. The schema's readouts, controls and charts were verified identical to
   * the components they replace; its diagram now also carries the HOST — resident macrophages, the
   * CD4 count as the helper cell's own radius, and the suppression over the whole node. */
  const ctx = getPresentationContext<ImmuneState, ImmuneDerived, ImmuneInputs, ImmuneHistoryPoint>(
    snapshot,
    history,
    baseline,
    inputs,
  );
  const slots = usePresentationSlots('immuneResponse', buildImmuneResponsePresentation(ctx), ctx, inputs, handleChange);

  const applyPreset = useScenarioPreset({
    setInputs,
    defaults: DEFAULT_IMMUNE_INPUTS,
    presets: IMMUNE_PRESETS,
    resetEngine: reset,
  });


  return (
    <ModulePage
      historyCapacity={immuneLoopConfig.historyCapacity}
      moduleId="immuneResponse"
      title="Immune Response"
      subtitle="innate to adaptive, and how memory changes everything"
      accentVar="var(--memory)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={IMMUNE_PRESET_LABELS}
          onApply={applyPreset}
          actions={[{ label: 'Vaccinate', onClick: () => perturb((state) => perturbVaccinate(state)), variant: 'impulse' }, { label: 'Infect', onClick: () => perturb((state) => perturbInfect(state)), variant: 'danger' }]}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={slots.diagram}
      readouts={slots.readouts}
      questions={
        <QuestionSet
          count={IMMUNE_QUESTIONS.length}
          beds={[]}
          schedule={summary.schedule}
          snapshot={snapshot}
          question={session.question}
        >
          <QuizPanel session={session} summary={summary} presetLabels={IMMUNE_PRESET_LABELS} />
        </QuestionSet>
      }
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={slots.charts}
      blindControls={session.blinded}
      controls={slots.controls}
      explainer={<ExplainerPanel content={immuneResponseContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of the immune response — not a clinical or diagnostic tool. The best way to use it: click "Infect" on a healthy host and watch the primary response run its course, then — once it has cleared — click "Infect" again. Nothing about the inputs has changed, only the memory the first infection left behind, and the second course is barely an illness. "Vaccinate" reaches the same protected state without any infection at all. One simulated second is roughly one day.'}
    />
  );
}
