import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { caseInputs, useModuleCase } from '@/shared/hooks/useModuleCase';
import { useModuleCases } from '@/shared/hooks/useModuleCases';
import { THERMO_CASES } from './cases';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { ThermoDiagram } from './components/ThermoDiagram';
import { ThermoReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel as ThermoControlPanel } from './components/ThermoControlPanel';
import { THERMO_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { thermoregulationContent } from './content';
import { thermoLoopConfig } from './engine/loopConfig';
import { perturbActiveCooling, perturbActiveRewarming, perturbGiveAntipyretic } from './engine/engine';
import {
  THERMO_PRESETS,
  THERMO_PRESET_LABELS,
  THERMO_PRESET_GLOSS,
  THERMO_PRESET_ORDER,
  DEFAULT_THERMO_INPUTS,
} from './engine/presets';
import type { ThermoInputs } from './engine/types';

export function ThermoregulationPage() {
  // Opened from the ward round, or null for the catalogue route. The seed means the engine
  // settles the patient directly rather than settling a healthy body and then jumping.
  const patient = useModuleCase(THERMO_CASES);
  const { inputs, setInputs, shareLink } = useShareableInputs<ThermoInputs>(
    'thermoregulation',
    DEFAULT_THERMO_INPUTS,
    caseInputs(patient, DEFAULT_THERMO_INPUTS, THERMO_PRESETS),
  );
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, thermoLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    // At a bedside, Reset means "back to this patient". Returning a learner who is mid-case to
    // a healthy volunteer would discard the thing they came to look at.
    defaults: caseInputs(patient, DEFAULT_THERMO_INPUTS, THERMO_PRESETS) ?? DEFAULT_THERMO_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  // Tab, question sets, session, bedside and the three bedded nodes. Everything downstream of
  // the engine that every bedded page repeats lives in the hook; what stays here is this
  // module's physiology and its presentation.
  const cases = useModuleCases({
    moduleId: 'thermoregulation',
    patient,
    cases: THERMO_CASES,
    questions: THERMO_QUESTIONS,
    presets: THERMO_PRESETS,
    defaultInputs: DEFAULT_THERMO_INPUTS,
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
    presetLabels: THERMO_PRESET_LABELS,
    presetGloss: THERMO_PRESET_GLOSS,
  });
  const { session } = cases;

  const handleChange = useInputSetter(setInputs);

  const coreHistory = useSeries(history, (h) => h.core);
  const coreBaseline = useSeries(baseline.history, (h) => h.core);
  const setPointHistory = useSeries(history, (h) => h.setPoint);
  const setPointBaseline = useSeries(baseline.history, (h) => h.setPoint);
  const skinHistory = useSeries(history, (h) => h.skin);
  const skinBaseline = useSeries(baseline.history, (h) => h.skin);

  return (
    <ModulePage
      historyCapacity={thermoLoopConfig.historyCapacity}
      moduleId="thermoregulation"
      title="Thermoregulation, Fever & Heat Illness"
      subtitle="fever is defended and hyperthermia is overwhelmed — the set point tells you which"
      accentVar="var(--thermal)"
      presets={
        <PresetBar
          order={THERMO_PRESET_ORDER}
          labels={THERMO_PRESET_LABELS}
          onApply={cases.applyPreset}
          actions={[
            { label: 'Antipyretic', onClick: () => perturb(perturbGiveAntipyretic), variant: 'impulse' },
            { label: 'Active cooling', onClick: () => perturb(perturbActiveCooling), variant: 'impulse' },
            { label: 'Active rewarming', onClick: () => perturb(perturbActiveRewarming), variant: 'impulse' },
          ]}
          onShare={cases.shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      {...cases.page}
      diagram={<ThermoDiagram derived={snapshot.derived} />}
      readouts={<ThermoReadoutPanel derived={snapshot.derived} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Core temperature"
            unit="°C"
            data={coreHistory}
            baselineData={coreBaseline}
            domainMin={28}
            domainMax={42}
            colorVar="var(--danger)"
          />
          <Sparkline
            label="Set point"
            unit="°C"
            data={setPointHistory}
            baselineData={setPointBaseline}
            domainMin={36}
            domainMax={41}
            colorVar="var(--warn)"
          />
          <Sparkline
            label="Skin temperature"
            unit="°C"
            data={skinHistory}
            baselineData={skinBaseline}
            domainMin={10}
            domainMax={40}
            colorVar="var(--o2)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ThermoControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={thermoregulationContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified conceptual model of whole-body heat balance and hypothalamic defence — not a clinical or diagnostic tool. The body is one lumped compartment with a single skin shell; radiation, convection and clothing are folded into one dry-loss coefficient modulated by wind and wetness; and fever is represented by a pyrogen-to-prostaglandin shift without individual cytokine detail. Neonatal brown-fat thermogenesis is outside its scope. Core changes run on compressed tens of minutes."
    />
  );
}
