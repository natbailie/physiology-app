import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { ANS_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { getPresentationContext } from '@/shared/presentation/context';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import { buildAutonomicNervousPresentation } from './presentation';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { autonomicNervousContent } from './content';
import { ansLoopConfig } from './engine/loopConfig';
import { ANS_PRESETS, DEFAULT_ANS_INPUTS, ANS_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { AnsDerived, AnsHistoryPoint, AnsInputs, AnsState } from './engine/types';

export function AutonomicNervousPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<AnsInputs>('autonomicNervous', DEFAULT_ANS_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, ansLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_ANS_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'autonomicNervous',
    questions: ANS_QUESTIONS,
    presets: ANS_PRESETS,
    inputs,
    defaultInputs: DEFAULT_ANS_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  const handleChange = useInputSetter(setInputs);


  const ctx = getPresentationContext<AnsState, AnsDerived, AnsInputs, AnsHistoryPoint>(snapshot, history, baseline, inputs);

  const slots = usePresentationSlots('autonomicNervous', buildAutonomicNervousPresentation(ctx), ctx, inputs, handleChange);

  const applyPreset = useScenarioPreset({
    setInputs,
    defaults: DEFAULT_ANS_INPUTS,
    presets: ANS_PRESETS,
    resetEngine: reset,
  });

  return (
    <ModulePage
      moduleId="autonomicNervous"
      title="Autonomic Nervous System"
      subtitle="sympathetic/parasympathetic balance across organ effectors"
      accentVar="var(--sympathetic)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={ANS_PRESET_LABELS}
          onApply={applyPreset}
          onShare={shareLink}
          onReset={resetScenario}
        />
      }
      diagram={slots.diagram}
      readouts={slots.readouts}
      practice={<QuizPanel session={session} summary={summary} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={slots.charts}
      controls={slots.controls}
      explainer={<ExplainerPanel content={autonomicNervousContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of autonomic control — not a clinical or diagnostic tool. Compare the "Fight or flight" and "Rest & digest" presets and watch the heart and gut tiles move in opposite directions, then contrast the "Atropine" and "Organophosphate" toxidromes, which mirror each other sign for sign. Simulated time runs faster than real time so each organ\'s response settles within a few seconds.'}
    />
  );
}
