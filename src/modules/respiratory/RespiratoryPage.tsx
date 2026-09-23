import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { caseInputs, useModuleCase } from '@/shared/hooks/useModuleCase';
import { useModuleCases } from '@/shared/hooks/useModuleCases';
import { RESP_CASES } from './cases';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { RESPIRATORY_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { respiratoryContent } from './content';
import { respiratoryLoopConfig } from './engine/loopConfig';
import { perturbAirwayObstruction } from './engine/engine';
import {
  DEFAULT_RESP_INPUTS,
  RESP_PRESETS,
  RESP_PRESET_LABELS,
  RESP_PRESET_GLOSS,
  PRESET_ORDER,
} from './engine/presets';
import { getPresentationContext } from '@/shared/presentation/context';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import { buildRespiratoryPresentation } from './presentation';
import type { RespDerived, RespHistoryPoint, RespInputs, RespState } from './engine/types';

export function RespiratoryPage() {
  // Opened from the ward round, or null for the catalogue route. The seed means the engine
  // settles the patient directly rather than settling a healthy body and then jumping.
  const patient = useModuleCase(RESP_CASES);
  const { inputs, setInputs, shareLink } = useShareableInputs<RespInputs>(
    'respiratory',
    DEFAULT_RESP_INPUTS,
    caseInputs(patient, DEFAULT_RESP_INPUTS, RESP_PRESETS),
  );
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, respiratoryLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    // At a bedside, Reset means back to this patient — see ShockStatesPage.
    defaults: caseInputs(patient, DEFAULT_RESP_INPUTS, RESP_PRESETS) ?? DEFAULT_RESP_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  // Tab, question sets, session, bedside and the three bedded nodes. Everything downstream of
  // the engine that every bedded page repeats lives in the hook; what stays here is this
  // module's physiology and its presentation.
  const cases = useModuleCases({
    moduleId: 'respiratory',
    patient,
    cases: RESP_CASES,
    questions: RESPIRATORY_QUESTIONS,
    presets: RESP_PRESETS,
    defaultInputs: DEFAULT_RESP_INPUTS,
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
    presetLabels: RESP_PRESET_LABELS,
    presetGloss: RESP_PRESET_GLOSS,
  });
  const { session } = cases;

  const handleChange = useInputSetter(setInputs);

  function triggerBronchospasm() {
    perturb((state) => perturbAirwayObstruction(state));
  }

  const ctx = getPresentationContext<RespState, RespDerived, RespInputs, RespHistoryPoint>(snapshot, history, baseline, inputs);
  const slots = usePresentationSlots('respiratory', buildRespiratoryPresentation(ctx), ctx, inputs, handleChange);

  return (
    <ModulePage
      historyCapacity={respiratoryLoopConfig.historyCapacity}
      moduleId="respiratory"
      title="Respiratory & Acid-Base"
      subtitle="ventilation, gas exchange & acid-base feedback simulator"
      accentVar="var(--o2)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={RESP_PRESET_LABELS}
          onApply={cases.applyPreset}
          actions={[{ label: 'Bronchospasm', onClick: triggerBronchospasm, variant: 'danger' }]}
          onShare={cases.shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      {...cases.page}
      diagram={slots.diagram}
      readouts={slots.readouts}
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
