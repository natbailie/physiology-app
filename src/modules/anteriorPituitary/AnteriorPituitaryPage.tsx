import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { PituitaryDiagram } from './components/PituitaryDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { PITUITARY_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { anteriorPituitaryContent } from './content';
import { pituitaryLoopConfig } from './engine/loopConfig';
import { perturbBromocriptineDose, perturbGlucoseLoad } from './engine/engine';
import {
  PITUITARY_PRESETS,
  PITUITARY_PRESET_LABELS,
  PITUITARY_PRESET_ORDER,
  DEFAULT_PITUITARY_INPUTS,
  type PituitaryPresetName,
} from './engine/presets';
import type { PituitaryInputs } from './engine/types';

export function AnteriorPituitaryPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<PituitaryInputs>('anteriorPituitary', DEFAULT_PITUITARY_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, pituitaryLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'anteriorPituitary',
    questions: PITUITARY_QUESTIONS,
    presets: PITUITARY_PRESETS,
    inputs,
    defaultInputs: DEFAULT_PITUITARY_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  function handleChange<K extends keyof PituitaryInputs>(key: K, value: PituitaryInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: PituitaryPresetName) {
    setInputs((prev) => ({ ...prev, ...PITUITARY_PRESETS[name] }));
  }

  const ghHistory = history.map((h) => h.gh);
  const ghBaseline = baseline.history?.map((h) => h.gh) ?? null;
  const prlHistory = history.map((h) => h.prolactin);
  const prlBaseline = baseline.history?.map((h) => h.prolactin) ?? null;
  const igfHistory = history.map((h) => h.igf1);
  const igfBaseline = baseline.history?.map((h) => h.igf1) ?? null;

  return (
    <ModulePage
      moduleId="anteriorPituitary"
      title="Anterior Pituitary: GH & Prolactin"
      subtitle="one hormone is held down by the brain, and that fact organises a differential"
      accentVar="var(--pituitary)"
      presets={
        <PresetBar
          order={PITUITARY_PRESET_ORDER}
          labels={PITUITARY_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[
            { label: 'Oral glucose load', onClick: () => perturb(perturbGlucoseLoad), variant: 'impulse' },
            { label: 'Bromocriptine dose', onClick: () => perturb(perturbBromocriptineDose), variant: 'impulse' },
          ]}
          onShare={shareLink}
          onReset={reset}
          disabled={session.blinded}
        />
      }
      diagram={<PituitaryDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={PITUITARY_PRESET_LABELS} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="GH"
            unit="ng/mL"
            data={ghHistory}
            baselineData={ghBaseline}
            domainMin={0}
            domainMax={30}
            colorVar="var(--basal-ganglia)"
          />
          <Sparkline
            label="Prolactin"
            unit="ng/mL"
            data={prlHistory}
            baselineData={prlBaseline}
            domainMin={0}
            domainMax={400}
            colorVar="var(--ige)"
          />
          <Sparkline
            label="IGF-1 (×10 ng/mL)"
            data={igfHistory}
            baselineData={igfBaseline}
            domainMin={8}
            domainMax={80}
            colorVar="var(--ok)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={anteriorPituitaryContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified conceptual model of the GH and prolactin axes — not a clinical or diagnostic tool. GH pulsatility is represented by its settled average rather than pulses; IGF-1 stands in for the whole somatomedin axis; mass effect is one volume proxy for what is anatomically directional growth; and the glucose-suppression test is modelled as a two-minute window of hypothalamic withdrawal. Hormonal timescales run on compressed days."
    />
  );
}
