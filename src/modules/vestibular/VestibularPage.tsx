import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { caseInputs, useModuleCase } from '@/shared/hooks/useModuleCase';
import { useModuleCases } from '@/shared/hooks/useModuleCases';
import { VESTIBULAR_CASES } from './cases';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { VestibularDiagram } from './components/VestibularDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { VESTIBULAR_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { vestibularContent } from './content';
import { vestibularLoopConfig } from './engine/loopConfig';
import { perturbHeadImpulse, perturbPerformHallpike } from './engine/engine';
import {
  VESTIBULAR_PRESETS,
  VESTIBULAR_PRESET_LABELS,
  VESTIBULAR_PRESET_GLOSS,
  VESTIBULAR_PRESET_ORDER,
  DEFAULT_VESTIBULAR_INPUTS,
} from './engine/presets';
import type { VestibularInputs } from './engine/types';

export function VestibularPage() {
  // Opened from the ward round, or null for the catalogue route. The seed means the engine
  // settles the patient directly rather than settling a healthy body and then jumping.
  const patient = useModuleCase(VESTIBULAR_CASES);
  const { inputs, setInputs, shareLink } = useShareableInputs<VestibularInputs>(
    'vestibular',
    DEFAULT_VESTIBULAR_INPUTS,
    caseInputs(patient, DEFAULT_VESTIBULAR_INPUTS, VESTIBULAR_PRESETS),
  );
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, vestibularLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    // At a bedside, Reset means "back to this patient". Returning a learner who is mid-case to
    // a healthy volunteer would discard the thing they came to look at.
    defaults: caseInputs(patient, DEFAULT_VESTIBULAR_INPUTS, VESTIBULAR_PRESETS) ?? DEFAULT_VESTIBULAR_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  // Tab, question sets, session, bedside and the three bedded nodes. Everything downstream of
  // the engine that every bedded page repeats lives in the hook; what stays here is this
  // module's physiology and its presentation.
  const cases = useModuleCases({
    moduleId: 'vestibular',
    patient,
    cases: VESTIBULAR_CASES,
    questions: VESTIBULAR_QUESTIONS,
    presets: VESTIBULAR_PRESETS,
    defaultInputs: DEFAULT_VESTIBULAR_INPUTS,
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
    presetLabels: VESTIBULAR_PRESET_LABELS,
    presetGloss: VESTIBULAR_PRESET_GLOSS,
  });
  const { session } = cases;

  const handleChange = useInputSetter(setInputs);

  const spvHistory = useSeries(history, (h) => h.spv);
  const spvBaseline = useSeries(baseline.history, (h) => h.spv);
  const vertigoHistory = useSeries(history, (h) => h.vertigo);
  const vertigoBaseline = useSeries(baseline.history, (h) => h.vertigo);
  const cupulaHistory = useSeries(history, (h) => h.cupula);
  const cupulaBaseline = useSeries(baseline.history, (h) => h.cupula);

  return (
    <ModulePage
      historyCapacity={vestibularLoopConfig.historyCapacity}
      moduleId="vestibular"
      title="Vestibular System & Vertigo"
      subtitle="vertigo is a firing mismatch between two nerves, and time changes what it means"
      accentVar="var(--vestibular)"
      presets={
        <PresetBar
          order={VESTIBULAR_PRESET_ORDER}
          labels={VESTIBULAR_PRESET_LABELS}
          onApply={cases.applyPreset}
          actions={[
            { label: 'Dix-Hallpike', onClick: () => perturb(perturbPerformHallpike), variant: 'impulse' },
            { label: 'Head impulse', onClick: () => perturb(perturbHeadImpulse), variant: 'impulse' },
          ]}
          onShare={cases.shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      {...cases.page}
      diagram={<VestibularDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Slow-phase velocity"
            unit="°/s"
            data={spvHistory}
            baselineData={spvBaseline}
            domainMin={-30}
            domainMax={30}
            colorVar="var(--vestibular)"
          />
          <Sparkline
            label="Vertigo"
            unit="%"
            data={vertigoHistory}
            baselineData={vertigoBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--danger)"
          />
          <Sparkline
            label="Cupula deflection"
            unit="%"
            data={cupulaHistory}
            baselineData={cupulaBaseline}
            domainMin={-100}
            domainMax={100}
            colorVar="var(--o2)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={vestibularContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified conceptual model of the horizontal canals, the VOR and central compensation — not a clinical or diagnostic tool. Vertical canals and the otolith-driven VOR are folded into a single otolith function affecting posture only; compensation is set by slider rather than emerging over days, so its consequences can be compared directly. The nystagmus trace is schematic: slow-phase speed is modelled faithfully, fast-phase timing is illustrative. Runs near real time — the cupula time constant is seconds, as in life."
    />
  );
}
