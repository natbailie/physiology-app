import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { ANAESTHESIA_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { QuestionSet } from '@/shared/components/QuestionSet/QuestionSet';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { anaesthesiaContent } from './content';
import { anaesthesiaLoopConfig } from './engine/loopConfig';
import {
  DEFAULT_ANAESTHESIA_INPUTS,
  ANAESTHESIA_PRESETS,
  ANAESTHESIA_PRESET_LABELS,
  ANAESTHESIA_PRESET_ORDER,
} from './engine/presets';
import { buildAnaesthesiaPresentation } from './presentation';
import { getPresentationContext } from '@/shared/presentation/context';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import type {
  AnaesthesiaDerived,
  AnaesthesiaHistoryPoint,
  AnaesthesiaInputs,
  AnaesthesiaInternalState,
} from './engine/types';

export function AnaesthesiaPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<AnaesthesiaInputs>('anaesthesia', DEFAULT_ANAESTHESIA_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, anaesthesiaLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_ANAESTHESIA_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'anaesthesia',
    questions: ANAESTHESIA_QUESTIONS,
    presets: ANAESTHESIA_PRESETS,
    inputs,
    defaultInputs: DEFAULT_ANAESTHESIA_INPUTS,
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
    defaults: DEFAULT_ANAESTHESIA_INPUTS,
    presets: ANAESTHESIA_PRESETS,
    resetEngine: reset,
  });

  const ctx = getPresentationContext<AnaesthesiaInternalState, AnaesthesiaDerived, AnaesthesiaInputs, AnaesthesiaHistoryPoint>(
    snapshot,
    history,
    baseline,
    inputs,
  );
  const slots = usePresentationSlots('anaesthesia', buildAnaesthesiaPresentation(ctx), ctx, inputs, handleChange);

  return (
    <ModulePage
      historyCapacity={anaesthesiaLoopConfig.historyCapacity}
      moduleId="anaesthesia"
      title="Anaesthesia & Gas Uptake"
      subtitle="the dial, the circuit & the solubility race"
      accentVar="var(--oxygen)"
      presets={
        <PresetBar
          order={ANAESTHESIA_PRESET_ORDER}
          labels={ANAESTHESIA_PRESET_LABELS}
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
          count={ANAESTHESIA_QUESTIONS.length}
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
      explainer={<ExplainerPanel content={anaesthesiaContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of volatile anaesthetic uptake on a circle system — not a clinical or diagnostic tool. The circuit mixes its own volume, the blood:gas coefficient drives both the lag and the ceiling through an efficiency factor, and the brain follows the alveolar level along its own slower constant, but no single model replaces real monitoring or the anaesthetist in the room. Simulated time advances faster than real time so a slow halothane wash-in is watchable within a session.'}
    />
  );
}