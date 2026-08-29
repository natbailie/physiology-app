import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { HpaDiagram } from './components/HpaDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { HPA_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { hpaAxisContent } from './content';
import { hpaLoopConfig } from './engine/loopConfig';
import { perturbAcuteStressor } from './engine/engine';
import { DEFAULT_HPA_INPUTS, HPA_PRESETS, HPA_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { HpaInputs } from './engine/types';

export function HpaPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<HpaInputs>('hpaAxis', DEFAULT_HPA_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, hpaLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_HPA_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'hpaAxis',
    questions: HPA_QUESTIONS,
    presets: HPA_PRESETS,
    inputs,
    defaultInputs: DEFAULT_HPA_INPUTS,
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
    defaults: DEFAULT_HPA_INPUTS,
    presets: HPA_PRESETS,
    resetEngine: reset,
  });

  function triggerAcuteStressor() {
    perturb((state) => perturbAcuteStressor(state));
  }

  const cortisolHistory = useSeries(history, (h) => h.cortisol);
  const cortisolHistoryBaseline = useSeries(baseline.history, (h) => h.cortisol);
  const acthHistory = useSeries(history, (h) => h.acth * 100);
  const acthHistoryBaseline = useSeries(baseline.history, (h) => h.acth * 100);
  const reserveHistory = useSeries(history, (h) => h.adrenalReserve * 100);
  const reserveHistoryBaseline = useSeries(baseline.history, (h) => h.adrenalReserve * 100);

  return (
    <ModulePage
      moduleId="hpaAxis"
      title="HPA Axis"
      subtitle="cortisol, stress response & adrenal insufficiency simulator"
      accentVar="var(--cortisol)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={HPA_PRESET_LABELS}
          onApply={applyPreset}
          actions={[{ label: 'Acute stressor', onClick: triggerAcuteStressor, variant: 'danger' }]}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={<HpaDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={HPA_PRESET_LABELS} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
  <Sparkline label="Cortisol" unit="µg/dL" data={cortisolHistory} baselineData={cortisolHistoryBaseline} domainMin={0} domainMax={40} colorVar="var(--cortisol)" />
  <Sparkline label="ACTH" unit="%" data={acthHistory} baselineData={acthHistoryBaseline} domainMin={0} domainMax={100} colorVar="var(--acth)" />
  <Sparkline label="Adrenal reserve" unit="%" data={reserveHistory} baselineData={reserveHistoryBaseline} domainMin={0} domainMax={100} colorVar="var(--text)" />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={hpaAxisContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of HPA axis physiology — not a clinical or diagnostic tool. Simulated time runs much faster than real time: one diurnal cortisol cycle completes in about 4 minutes, and the adrenal-atrophy/recovery dynamics (physiologically weeks) are compressed to be watchable within a session — try the "Steroid therapy" preset for a while, then set exogenous glucocorticoid back to 0.'}
    />
  );
}
