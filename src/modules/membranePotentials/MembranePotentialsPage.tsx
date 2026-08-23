import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { MembraneDiagram } from './components/MembraneDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { MEMBRANE_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { membranePotentialsContent } from './content';
import { membraneLoopConfig } from './engine/loopConfig';
import { perturbStimulate } from './engine/engine';
import { DEFAULT_MEMBRANE_INPUTS, MEMBRANE_PRESETS, type MembranePresetName, MEMBRANE_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import { CONDUCTANCE } from './engine/constants';
import type { MembraneInputs } from './engine/types';

export function MembranePotentialsPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<MembraneInputs>('membranePotentials', DEFAULT_MEMBRANE_INPUTS);
  const { snapshot, history, perturb, reset, transport, baseline } = useEngineLoop(inputs, membraneLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'membranePotentials',
    questions: MEMBRANE_QUESTIONS,
    presets: MEMBRANE_PRESETS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
  });

  function handleChange<K extends keyof MembraneInputs>(key: K, value: MembraneInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: MembranePresetName) {
    setInputs((prev) => ({ ...prev, ...MEMBRANE_PRESETS[name] }));
  }

  function triggerStimulate() {
    perturb((state) => perturbStimulate(state));
  }

  const vmHistory = history.map((h) => h.vm);
  const vmHistoryBaseline = baseline.history?.map((h) => h.vm) ?? null;
  const gNaHistory = history.map((h) => h.gNa);
  const gNaHistoryBaseline = baseline.history?.map((h) => h.gNa) ?? null;
  const gKHistory = history.map((h) => h.gK);
  const gKHistoryBaseline = baseline.history?.map((h) => h.gK) ?? null;

  return (
    <ModulePage
      moduleId="membranePotentials"
      title="Membrane & Action Potentials"
      subtitle="ion conductances, Nernst/GHK & the action potential"
      accentVar="var(--vm)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={MEMBRANE_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[{ label: 'Stimulate', onClick: triggerStimulate, variant: 'impulse' }]}
          onShare={shareLink}
          onReset={reset}
        />
      }
      diagram={<MembraneDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
  <Sparkline label="Membrane potential" unit="mV" data={vmHistory} baselineData={vmHistoryBaseline} domainMin={-100} domainMax={60} colorVar="var(--vm)" />
  <Sparkline
    label="Na+ conductance"
    data={gNaHistory} baselineData={gNaHistoryBaseline}
    domainMin={0}
    domainMax={CONDUCTANCE.MAX_GNA * 0.6}
    colorVar="var(--na-current)"
  />
  <Sparkline
    label="K+ conductance"
    data={gKHistory} baselineData={gKHistoryBaseline}
    domainMin={0}
    domainMax={CONDUCTANCE.MAX_GK * 0.6}
    colorVar="var(--k-current)"
  />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={membranePotentialsContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of membrane excitability — not a clinical or diagnostic tool. Click "Stimulate" to fire a single action potential, or raise the stimulus current slider past threshold for repetitive firing. Unlike every other module here, this one runs much SLOWER than real time: an action potential lasts about two milliseconds, so the upstroke, repolarization and refractory period would otherwise be far too fast to see.'}
    />
  );
}
