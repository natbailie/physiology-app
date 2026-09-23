import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { HYPERSENSITIVITY_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { QuestionSet } from '@/shared/components/QuestionSet/QuestionSet';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { hypersensitivityContent } from './content';
import { buildHypersensitivityPresentation } from './presentation';
import { getPresentationContext } from '@/shared/presentation/context';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import { hypersensitivityLoopConfig } from './engine/loopConfig';
import { perturbAdrenaline, perturbChallenge, perturbDiurese, perturbTransfuse } from './engine/engine';
import {
  DEFAULT_HYPERSENSITIVITY_INPUTS,
  HYPERSENSITIVITY_PRESETS,
  HYPERSENSITIVITY_PRESET_LABELS,
  MECHANISM_PRESET_ORDER,
  PRESET_ORDER,
  TRANSFUSION_PRESET_ORDER,
} from './engine/presets';
import type { HypersensitivityDerived, HypersensitivityHistoryPoint, HypersensitivityInputs, HypersensitivityState } from './engine/types';

export function HypersensitivityPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<HypersensitivityInputs>('hypersensitivity', DEFAULT_HYPERSENSITIVITY_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, hypersensitivityLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_HYPERSENSITIVITY_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'hypersensitivity',
    questions: HYPERSENSITIVITY_QUESTIONS,
    presets: HYPERSENSITIVITY_PRESETS,
    inputs,
    defaultInputs: DEFAULT_HYPERSENSITIVITY_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  const handleChange = useInputSetter(setInputs);

  /* One drawing, not two — and this module is where the duplication had visibly failed: the
   * hand-written MechanismDiagram published `--arm-i` … `--arm-iv` and its stylesheet turned them
   * into a colour wash, while the schema stated four dead `styleVars: { opacity }` that nothing in
   * either project reads. The web showed arm activity and the phone never did. */
  const ctx = getPresentationContext<HypersensitivityState, HypersensitivityDerived, HypersensitivityInputs, HypersensitivityHistoryPoint>(
    snapshot,
    history,
    baseline,
    inputs,
  );
  const slots = usePresentationSlots('hypersensitivity', buildHypersensitivityPresentation(ctx), ctx, inputs, handleChange);

  const applyPreset = useScenarioPreset({
    setInputs,
    defaults: DEFAULT_HYPERSENSITIVITY_INPUTS,
    presets: HYPERSENSITIVITY_PRESETS,
    resetEngine: reset,
  });


  return (
    <ModulePage
      historyCapacity={hypersensitivityLoopConfig.historyCapacity}
      moduleId="hypersensitivity"
      title="Hypersensitivity"
      subtitle="four mechanisms, four timescales, and every transfusion reaction among them"
      accentVar="var(--ige)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          groups={[
            { label: 'Mechanism', order: MECHANISM_PRESET_ORDER },
            { label: 'Transfusion', order: TRANSFUSION_PRESET_ORDER },
          ]}
          labels={HYPERSENSITIVITY_PRESET_LABELS}
          onApply={applyPreset}
          actions={[
            { label: 'Adrenaline', onClick: () => perturb((state) => perturbAdrenaline(state)), variant: 'impulse' },
            { label: 'Diurese', onClick: () => perturb((state) => perturbDiurese(state)), variant: 'impulse' },
            {
              label: 'Challenge',
              onClick: () => perturb((state) => perturbChallenge(state, inputs.antigenDose)),
              variant: 'danger',
            },
            { label: 'Transfuse', onClick: () => perturb((state) => perturbTransfuse(state)), variant: 'danger' },
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
          count={HYPERSENSITIVITY_QUESTIONS.length}
          beds={[]}
          schedule={summary.schedule}
          snapshot={snapshot}
          question={session.question}
        >
          <QuizPanel session={session} summary={summary} presetLabels={HYPERSENSITIVITY_PRESET_LABELS} />
        </QuestionSet>
      }
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={slots.charts}
      blindControls={session.blinded}
      controls={slots.controls}
      explainer={<ExplainerPanel content={hypersensitivityContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={
        'A simplified, conceptual model of hypersensitivity — not a clinical or diagnostic tool. The best way to use it: pick a MECHANISM preset and press "Challenge", or a TRANSFUSION preset and press "Transfuse", then watch the reaction timeline. Its time axis is LOGARITHMIC because a type I reaction peaks in minutes and a type IV in days, and no linear axis can hold both. Start with the naive host, where a maximal dose does nothing at all, then challenge the sensitised one on an identical dose — and note that blood is the exception to that rule, since anti-A and anti-B need no prior exposure. Each preset isolates a single arm so the timings and labs read cleanly; a real patient can have more than one at once. Two simplifications worth knowing: hypotension in this model tracks histamine only, so the ABO reaction here is less shocked than a real one; and only the injury of an infarcting reaction is modelled, not the marrow response to it. One simulated second is about one hour. For how sensitisation is laid down in the first place, see the Immune Response module.'
      }
    />
  );
}
