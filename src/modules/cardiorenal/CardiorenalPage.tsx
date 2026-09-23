import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { caseInputs, useModuleCase } from '@/shared/hooks/useModuleCase';
import { useModuleCases } from '@/shared/hooks/useModuleCases';
import { CARDIORENAL_CASES } from './cases';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
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
  // Opened from the ward round, or null for the catalogue route. The seed means the engine
  // settles the patient directly rather than settling a healthy body and then jumping.
  const patient = useModuleCase(CARDIORENAL_CASES);
  const { inputs, setInputs, shareLink } = useShareableInputs<SimInputs>(
    'cardiorenal',
    DEFAULT_INPUTS,
    caseInputs(patient, DEFAULT_INPUTS, PRESETS),
  );
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, cardiorenalLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    // At a bedside, Reset means back to this patient — see ShockStatesPage.
    defaults: caseInputs(patient, DEFAULT_INPUTS, PRESETS) ?? DEFAULT_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  // Tab, question sets, session, bedside and the three bedded nodes. Everything downstream of
  // the engine that every bedded page repeats lives in the hook; what stays here is this
  // module's physiology and its presentation.
  const cases = useModuleCases({
    moduleId: 'cardiorenal',
    patient,
    cases: CARDIORENAL_CASES,
    questions: CARDIORENAL_QUESTIONS,
    presets: PRESETS,
    defaultInputs: DEFAULT_INPUTS,
    inputs,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
    shareLink,
    snapshot,
    transport,
    baselineFrozen: baseline.history !== null,
  });
  const { session } = cases;

  const handleChange = useInputSetter(setInputs);

  function triggerHemorrhage() {
    perturb((state) => perturbBloodVolume(state, SIMULATION.HEMORRHAGE_BV_MULTIPLIER));
  }

  const ctx = getPresentationContext<SimState, DerivedValues, SimInputs, HistoryPoint>(snapshot, history, baseline, inputs);
  const slots = usePresentationSlots('cardiorenal', buildCardiorenalPresentation(ctx), ctx, inputs, handleChange);

  return (
    <ModulePage
      historyCapacity={cardiorenalLoopConfig.historyCapacity}
      moduleId="cardiorenal"
      title="Cardiorenal Monitor"
      subtitle="heart & kidney feedback simulator"
      accentVar="var(--artery)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={PRESET_LABELS}
          onApply={cases.applyPreset}
          actions={[{ label: 'Hemorrhage', onClick: triggerHemorrhage, variant: 'danger' }]}
          onShare={cases.shareLink}
          onReset={resetScenario}
        />
      }
      {...cases.page}
      diagram={slots.diagram}
      readouts={slots.readouts}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={slots.charts}
      blindControls={session.blinded}
      controls={slots.controls}
      explainer={<ExplainerPanel content={cardiorenalContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified, conceptual model of cardiorenal physiology — not a clinical or diagnostic tool. GFR and urine output are shown in normalized units (baseline = 100), not literal mL/min. Simulated time runs faster than real time so RAAS/ANP responses (which take minutes physiologically) are watchable within roughly a minute."
    />
  );
}
