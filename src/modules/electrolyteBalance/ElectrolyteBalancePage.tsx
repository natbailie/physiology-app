import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { CompartmentDiagram } from './components/CompartmentDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { ELECTROLYTE_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { electrolyteBalanceContent } from './content';
import { electrolyteLoopConfig } from './engine/loopConfig';
import { perturbGiveInsulin, perturbPotassiumBolus, perturbSalineBolus } from './engine/engine';
import {
  DEFAULT_ELECTROLYTE_INPUTS,
  ELECTROLYTE_PRESETS,
  ELECTROLYTE_PRESET_LABELS,
  ELECTROLYTE_PRESET_ORDER,
} from './engine/presets';
import type { ElectrolyteInputs } from './engine/types';

export function ElectrolyteBalancePage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<ElectrolyteInputs>('electrolyteBalance', DEFAULT_ELECTROLYTE_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, electrolyteLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_ELECTROLYTE_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'electrolyteBalance',
    questions: ELECTROLYTE_QUESTIONS,
    presets: ELECTROLYTE_PRESETS,
    inputs,
    defaultInputs: DEFAULT_ELECTROLYTE_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });
  const { derived } = snapshot;
  const sodiumHistory = useSeries(history, (h) => h.sodium);
  const potassiumHistory = useSeries(history, (h) => h.potassium);
  const totalBodyPotassiumHistory = useSeries(history, (h) => h.totalBodyPotassiumPct);
  const ecfVolumeHistory = useSeries(history, (h) => h.ecfVolume);

  const handleChange = useInputSetter(setInputs);

  const applyPreset = useScenarioPreset({
    setInputs,
    defaults: DEFAULT_ELECTROLYTE_INPUTS,
    presets: ELECTROLYTE_PRESETS,
    resetEngine: reset,
  });

  return (
    <ModulePage
      moduleId="electrolyteBalance"
      title="Potassium & Sodium-Water Balance"
      subtitle="serum versus total body, and tonicity versus volume"
      accentVar="var(--potassium)"
      presets={
        <PresetBar
          order={ELECTROLYTE_PRESET_ORDER}
          labels={ELECTROLYTE_PRESET_LABELS}
          onApply={applyPreset}
          actions={[
            { label: 'Give insulin', onClick: () => perturb((s) => perturbGiveInsulin(s)), variant: 'impulse' },
            { label: 'Saline bolus', onClick: () => perturb((s) => perturbSalineBolus(s)), variant: 'impulse' },
            { label: 'K+ bolus', onClick: () => perturb((s) => perturbPotassiumBolus(s)), variant: 'danger' },
          ]}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={<CompartmentDiagram derived={derived} />}
      readouts={<ReadoutPanel derived={derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={ELECTROLYTE_PRESET_LABELS} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Serum Na+"
            unit="mEq/L"
            data={sodiumHistory}
            domainMin={105}
            domainMax={165}
            colorVar="var(--sodium)"
          />
          {/* The two potassium traces share an axis deliberately: when they separate, the serum
              level is no longer telling you anything about the size of the deficit. */}
          <Sparkline
            label="Serum K+"
            secondaryLabel="total body K+"
            unit="mEq/L"
            data={potassiumHistory}
            secondaryData={totalBodyPotassiumHistory}
            secondaryColorVar="var(--text-dim)"
            domainMin={1.5}
            domainMax={8}
            colorVar="var(--potassium)"
          />
          <Sparkline
            label="ECF volume"
            unit="L"
            data={ecfVolumeHistory}
            domainMin={8}
            domainMax={20}
            colorVar="var(--artery)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={electrolyteBalanceContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={`A simplified, conceptual model of water and electrolyte balance — not a clinical or dosing tool. One second of real time is about one simulated hour, so a disorder that takes days to develop or correct plays out over roughly a minute. Current assessment: ${derived.disorderClassification}.`}
    />
  );
}
