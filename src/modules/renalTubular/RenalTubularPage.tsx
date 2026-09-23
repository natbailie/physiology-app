import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { useInputNudge } from '@/shared/hooks/useInputNudge';
import { caseInputs, useModuleCase } from '@/shared/hooks/useModuleCase';
import { useModuleCases } from '@/shared/hooks/useModuleCases';
import { RENAL_TUBULAR_CASES } from './cases';
import { RENAL_TUBULAR_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { renalTubularContent } from './content';
import { RENAL_TUBULAR_CONTROLS, buildRenalTubularPresentation } from './presentation';
import { getPresentationContext } from '@/shared/presentation/context';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import { renalTubularLoopConfig } from './engine/loopConfig';
import { DEFAULT_RENAL_TUBULAR_INPUTS, RENAL_TUBULAR_PRESETS, RENAL_TUBULAR_PRESET_LABELS, RENAL_TUBULAR_PRESET_GLOSS, PRESET_ORDER } from './engine/presets';
import type { RenalTubularDerived, RenalTubularHistoryPoint, RenalTubularInputs, RenalTubularState } from './engine/types';

export function RenalTubularPage() {
  // Opened from the ward round, or null for the catalogue route. The seed means the engine
  // settles the patient directly rather than settling a healthy body and then jumping.
  const patient = useModuleCase(RENAL_TUBULAR_CASES);
  const { inputs, setInputs, shareLink } = useShareableInputs<RenalTubularInputs>(
    'renalTubular',
    DEFAULT_RENAL_TUBULAR_INPUTS,
    caseInputs(patient, DEFAULT_RENAL_TUBULAR_INPUTS, RENAL_TUBULAR_PRESETS),
  );
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, renalTubularLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    // At a bedside, Reset means "back to this patient". Returning a learner who is mid-case to
    // a healthy volunteer would discard the thing they came to look at.
    defaults: caseInputs(patient, DEFAULT_RENAL_TUBULAR_INPUTS, RENAL_TUBULAR_PRESETS) ?? DEFAULT_RENAL_TUBULAR_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  // Tab, question sets, session, bedside and the three bedded nodes. Everything downstream of
  // the engine that every bedded page repeats lives in the hook; what stays here is this
  // module's physiology and its presentation.
  const cases = useModuleCases({
    moduleId: 'renalTubular',
    patient,
    cases: RENAL_TUBULAR_CASES,
    questions: RENAL_TUBULAR_QUESTIONS,
    presets: RENAL_TUBULAR_PRESETS,
    defaultInputs: DEFAULT_RENAL_TUBULAR_INPUTS,
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
    presetLabels: RENAL_TUBULAR_PRESET_LABELS,
    presetGloss: RENAL_TUBULAR_PRESET_GLOSS,
  });
  const { session } = cases;

  const handleChange = useInputSetter(setInputs);

  /* One drawing, not two. This page rendered a hand-written NephronDiagram, ReadoutPanel,
   * ControlPanel and three Sparklines while `presentation.ts` described all four for the phone —
   * and the two had already drifted, with the schema's osmolality markers and aquaporin arrows
   * painted at zero opacity because their style variables sat on a parent group the schema
   * renderer never reads. The schema's controls, readouts and charts were verified identical to
   * the components they replace before this conversion. */
  const ctx = getPresentationContext<RenalTubularState, RenalTubularDerived, RenalTubularInputs, RenalTubularHistoryPoint>(
    snapshot,
    history,
    baseline,
    inputs,
  );
  const slots = usePresentationSlots('renalTubular', buildRenalTubularPresentation(ctx), ctx, inputs, handleChange);


  /* Water deprivation is the CAUSE, not the plasma osmolality it produces.
   *
   * This used to hand-write a twelve-milliosmole step into the plant, which is the reading the
   * module exists to explain — and it left the water-intake slider sitting at its normal value
   * through a deprivation test. Driving the intake to zero lets the osmolality rise out of the
   * model instead, and the rail shows what was done to the patient. */
  const nudge = useInputNudge(setInputs, RENAL_TUBULAR_CONTROLS);
  const triggerWaterDeprivation = () => nudge({ waterIntakeRate: -300 });


  return (
    <ModulePage
      historyCapacity={renalTubularLoopConfig.historyCapacity}
      moduleId="renalTubular"
      title="Renal Tubular Physiology"
      subtitle="nephron segments, countercurrent multiplication & ADH"
      accentVar="var(--tubule)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={RENAL_TUBULAR_PRESET_LABELS}
          onApply={cases.applyPreset}
          actions={[{ label: 'Water deprivation', onClick: triggerWaterDeprivation, variant: 'danger' }]}
          onShare={cases.shareLink}
          onReset={resetScenario}
        />
      }
      {...cases.page}
      diagram={slots.diagram}
      readouts={slots.readouts}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={slots.charts}
      controls={slots.controls}
      blindControls={session.blinded}
      explainer={<ExplainerPanel content={renalTubularContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of nephron function — not a clinical or diagnostic tool. The best way to use it: pick "Central DI", note the dilute urine, then raise "Exogenous ADH (DDAVP)" and watch the urine concentrate sharply — then repeat with "Nephrogenic DI", where the same dose changes almost nothing. That contrast is the water deprivation test. Simulated time runs faster than real time so ADH responses (minutes) and medullary gradient washout (hours) are both watchable within a session.'}
    />
  );
}
