import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
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
  type ElectrolytePresetName,
} from './engine/presets';
import type { ElectrolyteInputs } from './engine/types';

export function ElectrolyteBalancePage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<ElectrolyteInputs>('electrolyteBalance', DEFAULT_ELECTROLYTE_INPUTS);
  const { snapshot, history, perturb, reset, transport, baseline } = useEngineLoop(inputs, electrolyteLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'electrolyteBalance',
    questions: ELECTROLYTE_QUESTIONS,
    presets: ELECTROLYTE_PRESETS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
  });
  const { derived } = snapshot;

  function handleChange<K extends keyof ElectrolyteInputs>(key: K, value: ElectrolyteInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: ElectrolytePresetName) {
    setInputs((prev) => ({ ...prev, ...ELECTROLYTE_PRESETS[name] }));
  }

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
          onApply={handleApplyPreset}
          actions={[
            { label: 'Give insulin', onClick: () => perturb((s) => perturbGiveInsulin(s)), variant: 'impulse' },
            { label: 'Saline bolus', onClick: () => perturb((s) => perturbSalineBolus(s)), variant: 'impulse' },
            { label: 'K+ bolus', onClick: () => perturb((s) => perturbPotassiumBolus(s)), variant: 'danger' },
          ]}
          onShare={shareLink}
          onReset={reset}
        />
      }
      diagram={<CompartmentDiagram derived={derived} />}
      readouts={<ReadoutPanel derived={derived} />}
      practice={<QuizPanel session={session} summary={summary} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Serum Na+"
            unit="mEq/L"
            data={history.map((h) => h.sodium)}
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
            data={history.map((h) => h.potassium)}
            secondaryData={history.map((h) => h.totalBodyPotassiumPct)}
            secondaryColorVar="var(--text-dim)"
            domainMin={1.5}
            domainMax={8}
            colorVar="var(--potassium)"
          />
          <Sparkline
            label="ECF volume"
            unit="L"
            data={history.map((h) => h.ecfVolume)}
            domainMin={8}
            domainMax={20}
            colorVar="var(--artery)"
          />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={electrolyteBalanceContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={`A simplified, conceptual model of water and electrolyte balance — not a clinical or dosing tool. One second of real time is about one simulated hour, so a disorder that takes days to develop or correct plays out over roughly a minute. Current assessment: ${derived.disorderClassification}.`}
    />
  );
}
