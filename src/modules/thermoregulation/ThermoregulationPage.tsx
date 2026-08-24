import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
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
  THERMO_PRESET_ORDER,
  DEFAULT_THERMO_INPUTS,
  type ThermoPresetName,
} from './engine/presets';
import type { ThermoInputs } from './engine/types';

export function ThermoregulationPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<ThermoInputs>('thermoregulation', DEFAULT_THERMO_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, thermoLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'thermoregulation',
    questions: THERMO_QUESTIONS,
    presets: THERMO_PRESETS,
    inputs,
    defaultInputs: DEFAULT_THERMO_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  function handleChange<K extends keyof ThermoInputs>(key: K, value: ThermoInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: ThermoPresetName) {
    setInputs((prev) => ({ ...prev, ...THERMO_PRESETS[name] }));
  }

  const coreHistory = history.map((h) => h.core);
  const coreBaseline = baseline.history?.map((h) => h.core) ?? null;
  const setPointHistory = history.map((h) => h.setPoint);
  const setPointBaseline = baseline.history?.map((h) => h.setPoint) ?? null;
  const skinHistory = history.map((h) => h.skin);
  const skinBaseline = baseline.history?.map((h) => h.skin) ?? null;

  return (
    <ModulePage
      moduleId="thermoregulation"
      title="Thermoregulation, Fever & Heat Illness"
      subtitle="fever is defended and hyperthermia is overwhelmed — the set point tells you which"
      accentVar="var(--thermal)"
      presets={
        <PresetBar
          order={THERMO_PRESET_ORDER}
          labels={THERMO_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[
            { label: 'Antipyretic', onClick: () => perturb(perturbGiveAntipyretic), variant: 'impulse' },
            { label: 'Active cooling', onClick: () => perturb(perturbActiveCooling), variant: 'impulse' },
            { label: 'Active rewarming', onClick: () => perturb(perturbActiveRewarming), variant: 'impulse' },
          ]}
          onShare={shareLink}
          onReset={reset}
          disabled={session.blinded}
        />
      }
      diagram={<ThermoDiagram derived={snapshot.derived} />}
      readouts={<ThermoReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={THERMO_PRESET_LABELS} />}
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
