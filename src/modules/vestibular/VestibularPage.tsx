import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
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
  VESTIBULAR_PRESET_ORDER,
  DEFAULT_VESTIBULAR_INPUTS,
  type VestibularPresetName,
} from './engine/presets';
import type { VestibularInputs } from './engine/types';

export function VestibularPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<VestibularInputs>('vestibular', DEFAULT_VESTIBULAR_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, vestibularLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'vestibular',
    questions: VESTIBULAR_QUESTIONS,
    presets: VESTIBULAR_PRESETS,
    inputs,
    defaultInputs: DEFAULT_VESTIBULAR_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  function handleChange<K extends keyof VestibularInputs>(key: K, value: VestibularInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: VestibularPresetName) {
    setInputs((prev) => ({ ...prev, ...VESTIBULAR_PRESETS[name] }));
  }

  const spvHistory = history.map((h) => h.spv);
  const spvBaseline = baseline.history?.map((h) => h.spv) ?? null;
  const vertigoHistory = history.map((h) => h.vertigo);
  const vertigoBaseline = baseline.history?.map((h) => h.vertigo) ?? null;
  const cupulaHistory = history.map((h) => h.cupula);
  const cupulaBaseline = baseline.history?.map((h) => h.cupula) ?? null;

  return (
    <ModulePage
      moduleId="vestibular"
      title="Vestibular System & Vertigo"
      subtitle="vertigo is a firing mismatch between two nerves, and time changes what it means"
      accentVar="var(--vestibular)"
      presets={
        <PresetBar
          order={VESTIBULAR_PRESET_ORDER}
          labels={VESTIBULAR_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[
            { label: 'Dix-Hallpike', onClick: () => perturb(perturbPerformHallpike), variant: 'impulse' },
            { label: 'Head impulse', onClick: () => perturb(perturbHeadImpulse), variant: 'impulse' },
          ]}
          onShare={shareLink}
          onReset={reset}
          disabled={session.blinded}
        />
      }
      diagram={<VestibularDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={VESTIBULAR_PRESET_LABELS} />}
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
