import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { COAGULATION_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { QuestionSet } from '@/shared/components/QuestionSet/QuestionSet';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { coagulationContent } from './content';
import { buildCoagulationPresentation } from './presentation';
import { getPresentationContext } from '@/shared/presentation/context';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import { coagLoopConfig } from './engine/loopConfig';
import { perturbInjury } from './engine/engine';
import { COAG_PRESETS, DEFAULT_COAG_INPUTS, COAG_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { CoagDerived, CoagHistoryPoint, CoagInputs, CoagState } from './engine/types';

export function CoagulationPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<CoagInputs>('coagulation', DEFAULT_COAG_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, coagLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_COAG_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'coagulation',
    questions: COAGULATION_QUESTIONS,
    presets: COAG_PRESETS,
    inputs,
    defaultInputs: DEFAULT_COAG_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  const handleChange = useInputSetter(setInputs);

  /* One drawing, not two. The schema's readouts, controls and charts were verified identical to
   * the components they replace before this conversion; its diagram now also carries what the
   * patient HAS, not only what is happening to them. */
  const ctx = getPresentationContext<CoagState, CoagDerived, CoagInputs, CoagHistoryPoint>(
    snapshot,
    history,
    baseline,
    inputs,
  );
  const slots = usePresentationSlots('coagulation', buildCoagulationPresentation(ctx), ctx, inputs, handleChange);

  const applyPreset = useScenarioPreset({
    setInputs,
    defaults: DEFAULT_COAG_INPUTS,
    presets: COAG_PRESETS,
    resetEngine: reset,
  });

  function triggerInjury() {
    perturb((state) => perturbInjury(state));
  }


  return (
    <ModulePage
      historyCapacity={coagLoopConfig.historyCapacity}
      moduleId="coagulation"
      title="Coagulation & Hemostasis"
      subtitle="the clotting cascade, PT/APTT & anticoagulants"
      accentVar="var(--fibrin)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={COAG_PRESET_LABELS}
          onApply={applyPreset}
          actions={[{ label: 'Injure vessel', onClick: triggerInjury, variant: 'danger' }]}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={slots.diagram}
      readouts={slots.readouts}
      questions={
        <QuestionSet
          count={COAGULATION_QUESTIONS.length}
          beds={[]}
          schedule={summary.schedule}
          snapshot={snapshot}
          question={session.question}
        >
          <QuizPanel session={session} summary={summary} presetLabels={COAG_PRESET_LABELS} />
        </QuestionSet>
      }
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={slots.charts}
      blindControls={session.blinded}
      controls={slots.controls}
      explainer={<ExplainerPanel content={coagulationContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of haemostasis — not a clinical or diagnostic tool, and the clotting times are illustrative rather than calibrated to any particular laboratory\'s reagents. Pick a preset and read the PATTERN across PT, APTT, platelets and bleeding time rather than any single value — that combination is what localises the defect. Then click "Injure vessel" to fire the cascade and watch whether a clot actually forms: haemophilia has a perfectly normal PT and still fails to seal.'}
    />
  );
}
