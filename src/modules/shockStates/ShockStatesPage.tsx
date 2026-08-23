import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { ShockDiagram } from './components/ShockDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { SHOCK_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { shockStatesContent } from './content';
import { shockLoopConfig } from './engine/loopConfig';
import { perturbFluidBolus, perturbHaemorrhage } from './engine/engine';
import {
  DEFAULT_SHOCK_INPUTS,
  SHOCK_PRESETS,
  SHOCK_PRESET_LABELS,
  SHOCK_PRESET_ORDER,
  type ShockPresetName,
} from './engine/presets';
import type { ShockInputs } from './engine/types';

export function ShockStatesPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<ShockInputs>('shockStates', DEFAULT_SHOCK_INPUTS);
  const { snapshot, history, perturb, reset, transport, baseline } = useEngineLoop(inputs, shockLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'shockStates',
    questions: SHOCK_QUESTIONS,
    presets: SHOCK_PRESETS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
  });

  function handleChange<K extends keyof ShockInputs>(key: K, value: ShockInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: ShockPresetName) {
    setInputs((prev) => ({ ...prev, ...SHOCK_PRESETS[name] }));
  }

  const mapHistory = history.map((h) => h.map);
  const mapHistoryBaseline = baseline.history?.map((h) => h.map) ?? null;
  const cardiacOutputHistory = history.map((h) => h.cardiacOutput);
  const cardiacOutputHistoryBaseline = baseline.history?.map((h) => h.cardiacOutput) ?? null;
  const cvpHistory = history.map((h) => h.cvp);
  const cvpHistoryBaseline = baseline.history?.map((h) => h.cvp) ?? null;
  const lactateHistory = history.map((h) => h.lactate);
  const lactateHistoryBaseline = baseline.history?.map((h) => h.lactate) ?? null;
  const svo2History = history.map((h) => h.svo2);
  const svo2HistoryBaseline = baseline.history?.map((h) => h.svo2) ?? null;

  return (
    <ModulePage
      title="Shock States"
      subtitle="four ways to fail, and the numbers that separate them"
      accentVar="var(--artery)"
      presets={
        <PresetBar
          order={SHOCK_PRESET_ORDER}
          labels={SHOCK_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[
            { label: 'Fluid bolus', onClick: () => perturb((s) => perturbFluidBolus(s, 1000)), variant: 'impulse' },
            { label: 'Haemorrhage', onClick: () => perturb((s) => perturbHaemorrhage(s, 1000)), variant: 'danger' },
          ]}
          onShare={shareLink}
          onReset={reset}
          disabled={session.blinded}
        />
      }
      diagram={<ShockDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={SHOCK_PRESET_LABELS} />}
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
