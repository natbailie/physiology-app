import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { caseInputs, useModuleCase } from '@/shared/hooks/useModuleCase';
import { useModuleCases } from '@/shared/hooks/useModuleCases';
import { MICTURITION_CASES } from './cases';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { BladderDiagram } from './components/Diagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { MICTURITION_QUESTIONS } from './questions';
import { micturitionContent } from './content';
import { micturitionLoopConfig } from './engine/loopConfig';
import {
  MICTURITION_PRESETS,
  MICTURITION_PRESET_LABELS,
  MICTURITION_PRESET_GLOSS,
  MICTURITION_PRESET_ORDER,
  DEFAULT_MICTURITION_INPUTS,
} from './engine/presets';
import type { MicturitionInputs } from './engine/types';

export function MicturitionPage() {
  // Opened from the ward round, or null for the catalogue route. The seed means the engine
  // settles the patient directly rather than settling a healthy body and then jumping.
  const patient = useModuleCase(MICTURITION_CASES);
  const { inputs, setInputs, shareLink } = useShareableInputs<MicturitionInputs>(
    'micturition',
    DEFAULT_MICTURITION_INPUTS,
    caseInputs(patient, DEFAULT_MICTURITION_INPUTS, MICTURITION_PRESETS),
  );
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(
    inputs,
    micturitionLoopConfig,
  );
  const resetScenario = useScenarioReset({
    setInputs,
    // At a bedside, Reset means "back to this patient". Returning a learner who is mid-case to
    // a healthy volunteer would discard the thing they came to look at.
    defaults: caseInputs(patient, DEFAULT_MICTURITION_INPUTS, MICTURITION_PRESETS) ?? DEFAULT_MICTURITION_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  // Tab, question sets, session, bedside and the three bedded nodes. Everything downstream of
  // the engine that every bedded page repeats lives in the hook; what stays here is this
  // module's physiology and its presentation.
  //
  // Note the real perturb and fast-forward below. This page used to pass no-ops, so a pattern
  // question showed whatever the live bladder happened to hold while the fairness check had
  // verified a perturbed, settled one. A trajectory has no steady state to protect — jumping
  // it forward an hour is exactly what the questions assume — so the loads are canonical now.
  const cases = useModuleCases({
    moduleId: 'micturition',
    patient,
    cases: MICTURITION_CASES,
    questions: MICTURITION_QUESTIONS,
    presets: MICTURITION_PRESETS,
    defaultInputs: DEFAULT_MICTURITION_INPUTS,
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
    presetLabels: MICTURITION_PRESET_LABELS,
    presetGloss: MICTURITION_PRESET_GLOSS,
  });
  const { session } = cases;

  const handleChange = useInputSetter(setInputs);

  const volumeHistory = useSeries(history, (h) => h.bladderVolumeML);
  const volumeHistoryBaseline = useSeries(baseline.history, (h) => h.bladderVolumeML);
  const pressureHistory = useSeries(history, (h) => h.intravesicalPressureCmH2O);
  const pressureHistoryBaseline = useSeries(baseline.history, (h) => h.intravesicalPressureCmH2O);
  const detrusorHistory = useSeries(history, (h) => h.detrusorTone);
  const detrusorHistoryBaseline = useSeries(baseline.history, (h) => h.detrusorTone);

  return (
    <ModulePage
      historyCapacity={micturitionLoopConfig.historyCapacity}
      moduleId="micturition"
      title="Micturition"
      subtitle="bladder filling, storage and the voluntary control of voiding"
      accentVar="var(--o2)"
      presets={
        <PresetBar
          order={MICTURITION_PRESET_ORDER}
          labels={MICTURITION_PRESET_LABELS}
          onApply={cases.applyPreset}
          onShare={cases.shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      {...cases.page}
      diagram={<BladderDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Bladder volume"
            unit="mL"
            data={volumeHistory}
            baselineData={volumeHistoryBaseline}
            domainMin={0}
            domainMax={600}
            colorVar="var(--o2)"
          />
          <Sparkline
            label="Intravesical pressure"
            unit="cmH₂O"
            data={pressureHistory}
            baselineData={pressureHistoryBaseline}
            domainMin={0}
            domainMax={60}
            colorVar="var(--artery)"
          />
          <Sparkline
            label="Detrusor tone"
            data={detrusorHistory}
            baselineData={detrusorHistoryBaseline}
            domainMin={0}
            domainMax={1}
            colorVar="var(--danger)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={
        <ExplainerPanel
          content={micturitionContent}
          startCollapsed={session.phase !== 'idle'}
        />
      }
      footnote="A simplified model of lower urinary tract physiology — not a clinical or diagnostic tool. The micturition reflex, autonomic innervation and voluntary sphincter control are represented as interacting tone variables. Real urodynamics involve complex pressure-flow relationships and multiple nerve pathways not captured here."
    />
  );
}
