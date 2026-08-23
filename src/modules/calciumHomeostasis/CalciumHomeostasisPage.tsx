import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { CalciumDiagram } from './components/CalciumDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { CALCIUM_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { calciumHomeostasisContent } from './content';
import { calciumLoopConfig } from './engine/loopConfig';
import { perturbCalciumInfusion } from './engine/engine';
import { CALCIUM_PRESETS, DEFAULT_CALCIUM_INPUTS, type CalciumPresetName, CALCIUM_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { CalciumInputs } from './engine/types';

export function CalciumHomeostasisPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<CalciumInputs>('calciumHomeostasis', DEFAULT_CALCIUM_INPUTS);
  const { snapshot, history, perturb, reset, transport, baseline } = useEngineLoop(inputs, calciumLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'calciumHomeostasis',
    questions: CALCIUM_QUESTIONS,
    presets: CALCIUM_PRESETS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
  });

  function handleChange<K extends keyof CalciumInputs>(key: K, value: CalciumInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: CalciumPresetName) {
    setInputs((prev) => ({ ...prev, ...CALCIUM_PRESETS[name] }));
  }

  function triggerCalciumInfusion() {
    perturb((state) => perturbCalciumInfusion(state));
  }

  const calciumHistory = history.map((h) => h.calcium);
  const calciumHistoryBaseline = baseline.history?.map((h) => h.calcium) ?? null;
  const phosphateHistory = history.map((h) => h.phosphate);
  const phosphateHistoryBaseline = baseline.history?.map((h) => h.phosphate) ?? null;
  const pthHistory = history.map((h) => h.pth * 100);
  const pthHistoryBaseline = baseline.history?.map((h) => h.pth * 100) ?? null;

  return (
    <ModulePage
      title="Calcium & Bone/Mineral Homeostasis"
      subtitle="PTH, calcitriol & phosphate regulation"
      accentVar="var(--pth)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={CALCIUM_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[{ label: 'Calcium infusion', onClick: triggerCalciumInfusion, variant: 'impulse' }]}
          onShare={shareLink}
          onReset={reset}
        />
      }
      diagram={<CalciumDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
  <Sparkline label="Serum calcium" unit="mg/dL" data={calciumHistory} baselineData={calciumHistoryBaseline} domainMin={4} domainMax={16} colorVar="var(--calcium)" />
  <Sparkline label="Serum phosphate" unit="mg/dL" data={phosphateHistory} baselineData={phosphateHistoryBaseline} domainMin={0} domainMax={12} colorVar="var(--phosphate)" />
  <Sparkline label="PTH" unit="%" data={pthHistory} baselineData={pthHistoryBaseline} domainMin={0} domainMax={100} colorVar="var(--pth)" />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={calciumHomeostasisContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of calcium and phosphate homeostasis — not a clinical or diagnostic tool. Compare the presets by watching calcium and phosphate move in opposite directions: primary hyperparathyroidism raises calcium while dropping phosphate, hypoparathyroidism does the reverse, and hypomagnesemia produces hypocalcemia with PTH stuck near zero. Simulated time runs much faster than real time so PTH (minutes) and calcitriol (hours to days) responses are both watchable within a session.'}
    />
  );
}
