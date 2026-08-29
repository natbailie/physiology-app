import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { HptDiagram } from './components/HptDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { HPT_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { hptAxisContent } from './content';
import { hptLoopConfig } from './engine/loopConfig';
import { perturbAcuteIllness } from './engine/engine';
import { DEFAULT_HPT_INPUTS, HPT_PRESETS, HPT_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { HptInputs } from './engine/types';

export function HptPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<HptInputs>('hptAxis', DEFAULT_HPT_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, hptLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_HPT_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'hptAxis',
    questions: HPT_QUESTIONS,
    presets: HPT_PRESETS,
    inputs,
    defaultInputs: DEFAULT_HPT_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  const handleChange = useInputSetter(setInputs);

  const applyPreset = useScenarioPreset({
    setInputs,
    defaults: DEFAULT_HPT_INPUTS,
    presets: HPT_PRESETS,
    resetEngine: reset,
  });

  function triggerAcuteIllness() {
    perturb((state) => perturbAcuteIllness(state));
  }

  const tshHistory = useSeries(history, (h) => h.tsh);
  const tshHistoryBaseline = useSeries(baseline.history, (h) => h.tsh);
  const t4History = useSeries(history, (h) => h.t4);
  const t4HistoryBaseline = useSeries(baseline.history, (h) => h.t4);
  const t3History = useSeries(history, (h) => h.t3);
  const t3HistoryBaseline = useSeries(baseline.history, (h) => h.t3);

  return (
    <ModulePage
      moduleId="hptAxis"
      title="Thyroid (HPT) Axis"
      subtitle="TSH, T4/T3 & thyroid function test interpretation simulator"
      accentVar="var(--thyroid)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={HPT_PRESET_LABELS}
          onApply={applyPreset}
          actions={[{ label: 'Acute illness', onClick: triggerAcuteIllness, variant: 'danger' }]}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={<HptDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={HPT_PRESET_LABELS} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
  <Sparkline label="TSH" unit="%" data={tshHistory} baselineData={tshHistoryBaseline} domainMin={0} domainMax={100} colorVar="var(--tsh)" />
  <Sparkline label="T4" unit="µg/dL" data={t4History} baselineData={t4HistoryBaseline} domainMin={0} domainMax={30} colorVar="var(--thyroid)" />
  <Sparkline label="T3" unit="ng/dL*" data={t3History} baselineData={t3HistoryBaseline} domainMin={0} domainMax={250} colorVar="var(--thyroid)" />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={hptAxisContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of thyroid axis physiology — not a clinical or diagnostic tool. T3 is shown in normalized units (baseline ≈ 90-100), not literal ng/dL. Simulated time runs much faster than real time so T4\'s week-long turnover is compressed to be watchable within a session.'}
    />
  );
}
