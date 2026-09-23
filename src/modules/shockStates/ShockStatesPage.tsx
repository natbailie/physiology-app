import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { useInputNudge } from '@/shared/hooks/useInputNudge';
import { caseInputs, useModuleCase } from '@/shared/hooks/useModuleCase';
import { useModuleCases } from '@/shared/hooks/useModuleCases';
import { SHOCK_CASES } from './cases';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { ShockDiagram } from './components/ShockDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { SHOCK_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { shockStatesContent } from './content';
import { shockLoopConfig } from './engine/loopConfig';
import { SHOCK_CONTROLS } from './presentation';
import {
  DEFAULT_SHOCK_INPUTS,
  SHOCK_PRESETS,
  SHOCK_PRESET_LABELS,
  SHOCK_PRESET_GLOSS,
  SHOCK_PRESET_ORDER,
} from './engine/presets';
import type { ShockInputs } from './engine/types';

export function ShockStatesPage() {
  // Opened from the ward round, or null for the catalogue route. The seed means the engine
  // settles the patient directly rather than settling a healthy body and then jumping.
  const patient = useModuleCase(SHOCK_CASES);
  const { inputs, setInputs, shareLink } = useShareableInputs<ShockInputs>(
    'shockStates',
    DEFAULT_SHOCK_INPUTS,
    caseInputs(patient, DEFAULT_SHOCK_INPUTS, SHOCK_PRESETS),
  );
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, shockLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    // At a bedside, Reset means "back to this patient". Returning a learner who is mid-case to
    // a healthy volunteer would discard the thing they came to look at.
    defaults: caseInputs(patient, DEFAULT_SHOCK_INPUTS, SHOCK_PRESETS) ?? DEFAULT_SHOCK_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  // Tab, question sets, session, bedside and the three bedded nodes. Everything downstream of
  // the engine that every bedded page repeats lives in the hook; what stays here is this
  // module's physiology and its presentation.
  const cases = useModuleCases({
    moduleId: 'shockStates',
    patient,
    cases: SHOCK_CASES,
    questions: SHOCK_QUESTIONS,
    presets: SHOCK_PRESETS,
    defaultInputs: DEFAULT_SHOCK_INPUTS,
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
    presetLabels: SHOCK_PRESET_LABELS,
    presetGloss: SHOCK_PRESET_GLOSS,
  });
  const { session } = cases;

  const handleChange = useInputSetter(setInputs);
  // A litre in or out is a change to the PATIENT, so it moves the blood-volume slider rather than a
  // hidden offset behind it. The engine state is left alone, so the filling pressure falls and the
  // baroreflex answers it in front of the learner instead of the scenario cutting to its endpoint.
  const nudge = useInputNudge(setInputs, SHOCK_CONTROLS);

  const mapHistory = useSeries(history, (h) => h.map);
  const mapHistoryBaseline = useSeries(baseline.history, (h) => h.map);
  const cardiacOutputHistory = useSeries(history, (h) => h.cardiacOutput);
  const cardiacOutputHistoryBaseline = useSeries(baseline.history, (h) => h.cardiacOutput);
  const cvpHistory = useSeries(history, (h) => h.cvp);
  const cvpHistoryBaseline = useSeries(baseline.history, (h) => h.cvp);
  const lactateHistory = useSeries(history, (h) => h.lactate);
  const lactateHistoryBaseline = useSeries(baseline.history, (h) => h.lactate);
  const svo2History = useSeries(history, (h) => h.svo2);
  const svo2HistoryBaseline = useSeries(baseline.history, (h) => h.svo2);

  return (
    <ModulePage
      historyCapacity={shockLoopConfig.historyCapacity}
      moduleId="shockStates"
      title="Shock States"
      subtitle="four ways to fail, and the numbers that separate them"
      accentVar="var(--artery)"
      presets={
        <PresetBar
          order={SHOCK_PRESET_ORDER}
          labels={SHOCK_PRESET_LABELS}
          onApply={cases.applyPreset}
          actions={[
            { label: 'Fluid bolus', onClick: () => nudge({ bloodVolumeMl: 1000 }), variant: 'impulse' },
            { label: 'Haemorrhage', onClick: () => nudge({ bloodVolumeMl: -1000 }), variant: 'danger' },
          ]}
          onShare={cases.shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      {...cases.page}
      diagram={<ShockDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="MAP"
            unit="mmHg"
            data={mapHistory}
            baselineData={mapHistoryBaseline}
            domainMin={20}
            domainMax={130}
            colorVar="var(--artery)"
          />
          <Sparkline
            label="Cardiac output"
            unit="L/min"
            data={cardiacOutputHistory}
            baselineData={cardiacOutputHistoryBaseline}
            domainMin={0}
            domainMax={12}
            colorVar="var(--artery)"
          />
          <Sparkline
            label="CVP"
            unit="mmHg"
            data={cvpHistory}
            baselineData={cvpHistoryBaseline}
            domainMin={-2}
            domainMax={28}
            colorVar="var(--venous)"
          />
          <Sparkline
            label="SvO₂"
            unit="%"
            data={svo2History}
            baselineData={svo2HistoryBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--o2)"
          />
          <Sparkline
            label="Lactate"
            unit="mmol/L"
            data={lactateHistory}
            baselineData={lactateHistoryBaseline}
            domainMin={0}
            domainMax={16}
            colorVar="var(--danger)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={shockStatesContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified, conceptual model of circulatory shock — not a clinical or diagnostic tool. Filling pressures are represented by a single systemic compartment plus a transpulmonary transit term, so wedge and CVP are surrogates for left- and right-sided filling rather than measured waveforms. Simulated time runs faster than real life so compensation and lactate clearance are watchable. For the two-curve analysis behind venous return, see the Venous Return module; for the pressure-volume consequences of a failing ventricle, see the Cardiac Cycle module."
    />
  );
}
