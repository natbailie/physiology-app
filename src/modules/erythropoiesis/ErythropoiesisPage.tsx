import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { getPresentationContext } from '@/shared/presentation/context';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import { buildErythropoiesisPresentation } from './presentation';
import { ERYTHROPOIESIS_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { erythropoiesisContent } from './content';
import { erythroLoopConfig } from './engine/loopConfig';
import { perturbAcuteBloodLoss } from './engine/engine';
import { DEFAULT_ERYTHRO_INPUTS, ERYTHRO_PRESETS, ERYTHRO_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { ErythroDerived, ErythroHistoryPoint, ErythroInputs, ErythroState } from './engine/types';

export function ErythropoiesisPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<ErythroInputs>('erythropoiesis', DEFAULT_ERYTHRO_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, erythroLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_ERYTHRO_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'erythropoiesis',
    questions: ERYTHROPOIESIS_QUESTIONS,
    presets: ERYTHRO_PRESETS,
    inputs,
    defaultInputs: DEFAULT_ERYTHRO_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  const handleChange = useInputSetter(setInputs);

  const ctx = getPresentationContext<ErythroState, ErythroDerived, ErythroInputs, ErythroHistoryPoint>(
    snapshot,
    history,
    baseline,
    inputs,
  );
  const slots = usePresentationSlots('erythropoiesis', buildErythropoiesisPresentation(ctx), ctx, inputs, handleChange);

  const applyPreset = useScenarioPreset({
    setInputs,
    defaults: DEFAULT_ERYTHRO_INPUTS,
    presets: ERYTHRO_PRESETS,
    resetEngine: reset,
  });

  function triggerAcuteBleed() {
    perturb((state) => perturbAcuteBloodLoss(state));
  }

  return (
    <ModulePage
      moduleId="erythropoiesis"
      title="Erythropoiesis & Anemia"
      subtitle="EPO feedback, iron & B12, and classifying an anemia"
      accentVar="var(--hemoglobin)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={ERYTHRO_PRESET_LABELS}
          onApply={applyPreset}
          actions={[{ label: 'Acute bleed', onClick: triggerAcuteBleed, variant: 'danger' }]}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={slots.diagram}
      readouts={slots.readouts}
      practice={<QuizPanel session={session} summary={summary} presetLabels={ERYTHRO_PRESET_LABELS} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={slots.charts}
      blindControls={session.blinded}
      controls={slots.controls}
      explainer={<ExplainerPanel content={erythropoiesisContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of red cell production and iron regulation — not a clinical or diagnostic tool. Compare the presets on MCV and reticulocyte index together rather than on haemoglobin alone: that pair is what classifies an anemia, and the iron studies (saturation, TIBC, ferritin) separate the patterns MCV cannot. Ferritin carries an acute-phase veil under inflammation by design — read it alongside the hepcidin row. Simulated time is heavily compressed, since erythropoiesis plays out over weeks; store depletion and overload move faster here than in life. For where dietary iron actually comes from, see Digestion & Absorption.'}
    />
  );
}
