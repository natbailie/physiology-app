import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { RESPIRATORY_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { respiratoryContent } from './content';
import { respiratoryLoopConfig } from './engine/loopConfig';
import { perturbAirwayObstruction } from './engine/engine';
import { DEFAULT_RESP_INPUTS, RESP_PRESETS, RESP_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import { getPresentationContext } from '@/shared/presentation/context';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import { buildRespiratoryPresentation } from './presentation';
import type { RespDerived, RespHistoryPoint, RespInputs, RespState } from './engine/types';

export function RespiratoryPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<RespInputs>('respiratory', DEFAULT_RESP_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, respiratoryLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_RESP_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'respiratory',
    questions: RESPIRATORY_QUESTIONS,
    presets: RESP_PRESETS,
    inputs,
    defaultInputs: DEFAULT_RESP_INPUTS,
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
    defaults: DEFAULT_RESP_INPUTS,
    presets: RESP_PRESETS,
    resetEngine: reset,
  });

  function triggerBronchospasm() {
    perturb((state) => perturbAirwayObstruction(state));
  }

  const ctx = getPresentationContext<RespState, RespDerived, RespInputs, RespHistoryPoint>(snapshot, history, baseline, inputs);
  const slots = usePresentationSlots('respiratory', buildRespiratoryPresentation(ctx), ctx, inputs, handleChange);

  return (
    <ModulePage
      moduleId="respiratory"
      title="Respiratory & Acid-Base"
      subtitle="ventilation, gas exchange & acid-base feedback simulator"
      accentVar="var(--o2)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={RESP_PRESET_LABELS}
          onApply={applyPreset}
          actions={[{ label: 'Bronchospasm', onClick: triggerBronchospasm, variant: 'danger' }]}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={slots.diagram}
      readouts={slots.readouts}
      practice={<QuizPanel session={session} summary={summary} presetLabels={RESP_PRESET_LABELS} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={slots.charts}
      blindControls={session.blinded}
      controls={slots.controls}
      explainer={<ExplainerPanel content={respiratoryContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={
        'A simplified, conceptual model of respiratory and acid-base physiology — not a clinical or diagnostic tool. Simulated time runs faster than real time so chemoreceptor responses (seconds-minutes) and renal compensation (physiologically days) are both watchable within roughly a minute — which means a settled run is by definition a CHRONIC picture, and the acute one is what you see on the way there. Watch the trail on the Davenport diagram: it is the path from the acute position to the compensated one. The anion gap is modelled as a consequence of what kind of acid is being produced, so it moves only when an organic acid is the cause; lactate, ketones and salicylate are not distinguished from one another.'
      }
    />
  );
}
