import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { CARDIORENAL_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { cardiorenalContent } from './content';
import { cardiorenalLoopConfig } from './engine/loopConfig';
import { perturbBloodVolume } from './engine/engine';
import { DEFAULT_INPUTS, PRESETS, PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import { SIMULATION } from './engine/constants';
import { getPresentationContext } from '@/shared/presentation/context';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import { buildCardiorenalPresentation } from './presentation';
import type { DerivedValues, HistoryPoint, SimInputs, SimState } from './engine/types';

export function CardiorenalPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<SimInputs>('cardiorenal', DEFAULT_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, cardiorenalLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'cardiorenal',
    questions: CARDIORENAL_QUESTIONS,
    presets: PRESETS,
    inputs,
    defaultInputs: DEFAULT_INPUTS,
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
    defaults: DEFAULT_INPUTS,
    presets: PRESETS,
    resetEngine: reset,
  });

  function triggerHemorrhage() {
    perturb((state) => perturbBloodVolume(state, SIMULATION.HEMORRHAGE_BV_MULTIPLIER));
  }

  const ctx = getPresentationContext<SimState, DerivedValues, SimInputs, HistoryPoint>(snapshot, history, baseline, inputs);
  const slots = usePresentationSlots('cardiorenal', buildCardiorenalPresentation(ctx), ctx, inputs, handleChange);

  return (
    <ModulePage
      moduleId="cardiorenal"
      title="Cardiorenal Monitor"
      subtitle="heart & kidney feedback simulator"
      accentVar="var(--artery)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={PRESET_LABELS}
          onApply={applyPreset}
          actions={[{ label: 'Hemorrhage', onClick: triggerHemorrhage, variant: 'danger' }]}
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
      explainer={<ExplainerPanel content={cardiorenalContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified, conceptual model of cardiorenal physiology — not a clinical or diagnostic tool. GFR and urine output are shown in normalized units (baseline = 100), not literal mL/min. Simulated time runs faster than real time so RAAS/ANP responses (which take minutes physiologically) are watchable within roughly a minute."
    />
  );
}
