import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { caseInputs, useModuleCase } from '@/shared/hooks/useModuleCase';
import { useModuleCases } from '@/shared/hooks/useModuleCases';
import { ELECTROLYTE_CASES } from './cases';
import { CompartmentDiagram } from './components/CompartmentDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { ELECTROLYTE_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { electrolyteBalanceContent } from './content';
import { electrolyteLoopConfig } from './engine/loopConfig';
import { perturbGiveInsulin, perturbPotassiumBolus, perturbSalineBolus } from './engine/engine';
import {
  DEFAULT_ELECTROLYTE_INPUTS,
  ELECTROLYTE_PRESETS,
  ELECTROLYTE_PRESET_LABELS,
  ELECTROLYTE_PRESET_GLOSS,
  ELECTROLYTE_PRESET_ORDER,
} from './engine/presets';
import type { ElectrolyteInputs } from './engine/types';

export function ElectrolyteBalancePage() {
  // Opened from the ward round, or null for the catalogue route. The seed means the engine
  // settles the patient directly rather than settling a healthy body and then jumping.
  const patient = useModuleCase(ELECTROLYTE_CASES);
  const { inputs, setInputs, shareLink } = useShareableInputs<ElectrolyteInputs>(
    'electrolyteBalance',
    DEFAULT_ELECTROLYTE_INPUTS,
    caseInputs(patient, DEFAULT_ELECTROLYTE_INPUTS, ELECTROLYTE_PRESETS),
  );
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, electrolyteLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    // At a bedside, Reset means "back to this patient". Returning a learner who is mid-case to
    // a healthy volunteer would discard the thing they came to look at.
    defaults: caseInputs(patient, DEFAULT_ELECTROLYTE_INPUTS, ELECTROLYTE_PRESETS) ?? DEFAULT_ELECTROLYTE_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  // Tab, question sets, session, bedside and the three bedded nodes. Everything downstream of
  // the engine that every bedded page repeats lives in the hook; what stays here is this
  // module's physiology and its presentation.
  const cases = useModuleCases({
    moduleId: 'electrolyteBalance',
    patient,
    cases: ELECTROLYTE_CASES,
    questions: ELECTROLYTE_QUESTIONS,
    presets: ELECTROLYTE_PRESETS,
    defaultInputs: DEFAULT_ELECTROLYTE_INPUTS,
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
    presetLabels: ELECTROLYTE_PRESET_LABELS,
    presetGloss: ELECTROLYTE_PRESET_GLOSS,
  });
  const { session } = cases;
  const { derived } = snapshot;
  const sodiumHistory = useSeries(history, (h) => h.sodium);
  const potassiumHistory = useSeries(history, (h) => h.potassium);
  const totalBodyPotassiumHistory = useSeries(history, (h) => h.totalBodyPotassiumPct);
  const ecfVolumeHistory = useSeries(history, (h) => h.ecfVolume);

  const handleChange = useInputSetter(setInputs);

  return (
    <ModulePage
      historyCapacity={electrolyteLoopConfig.historyCapacity}
      moduleId="electrolyteBalance"
      title="Potassium & Sodium-Water Balance"
      subtitle="serum versus total body, and tonicity versus volume"
      accentVar="var(--potassium)"
      presets={
        <PresetBar
          order={ELECTROLYTE_PRESET_ORDER}
          labels={ELECTROLYTE_PRESET_LABELS}
          onApply={cases.applyPreset}
          actions={[
            { label: 'Give insulin', onClick: () => perturb((s) => perturbGiveInsulin(s)), variant: 'impulse' },
            { label: 'Saline bolus', onClick: () => perturb((s) => perturbSalineBolus(s)), variant: 'impulse' },
            { label: 'K+ bolus', onClick: () => perturb((s) => perturbPotassiumBolus(s)), variant: 'danger' },
          ]}
          onShare={cases.shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      {...cases.page}
      diagram={<CompartmentDiagram derived={derived} />}
      readouts={<ReadoutPanel derived={derived} />}
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
