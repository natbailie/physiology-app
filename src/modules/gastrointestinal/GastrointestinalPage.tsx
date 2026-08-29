import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { GiDiagram } from './components/GiDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { GI_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { gastrointestinalContent } from './content';
import { giLoopConfig } from './engine/loopConfig';
import { perturbEatMeal } from './engine/engine';
import { DEFAULT_GI_INPUTS, GI_PRESETS, GI_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { GiInputs } from './engine/types';

export function GastrointestinalPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<GiInputs>('gastrointestinal', DEFAULT_GI_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, giLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_GI_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'gastrointestinal',
    questions: GI_QUESTIONS,
    presets: GI_PRESETS,
    inputs,
    defaultInputs: DEFAULT_GI_INPUTS,
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
    defaults: DEFAULT_GI_INPUTS,
    presets: GI_PRESETS,
    resetEngine: reset,
  });

  function triggerEatMeal() {
    perturb((state) => perturbEatMeal(state));
  }

  const gastricPHHistory = useSeries(history, (h) => h.gastricPH);
  const gastricPHHistoryBaseline = useSeries(baseline.history, (h) => h.gastricPH);
  const duodenalPHHistory = useSeries(history, (h) => h.duodenalPH);
  const duodenalPHHistoryBaseline = useSeries(baseline.history, (h) => h.duodenalPH);
  const gastrinHistory = useSeries(history, (h) => h.gastrinDrive * 100);
  const gastrinHistoryBaseline = useSeries(baseline.history, (h) => h.gastrinDrive * 100);

  return (
    <ModulePage
      moduleId="gastrointestinal"
      title="GI Physiology"
      subtitle="gastric acid, gut hormones & motility along the meal"
      accentVar="var(--gastrin)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={GI_PRESET_LABELS}
          onApply={applyPreset}
          actions={[{ label: 'Eat meal', onClick: triggerEatMeal, variant: 'impulse' }]}
          onShare={shareLink}
          onReset={resetScenario}
        />
      }
      diagram={<GiDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
  <Sparkline label="Gastric pH" data={gastricPHHistory} baselineData={gastricPHHistoryBaseline} domainMin={1} domainMax={7} colorVar="var(--gastrin)" />
  <Sparkline label="Duodenal pH" data={duodenalPHHistory} baselineData={duodenalPHHistoryBaseline} domainMin={2} domainMax={8} colorVar="var(--secretin)" />
  <Sparkline label="Gastrin" unit="%" data={gastrinHistory} baselineData={gastrinHistoryBaseline} domainMin={0} domainMax={100} colorVar="var(--gastrin)" />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={gastrointestinalContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of GI physiology — not a clinical or diagnostic tool. Adjust the meal composition and drug/tone sliders first, then click "Eat meal" to trigger digestion — or leave the stomach empty and just watch to see the migrating motor complex sweep through its interdigestive cycle. Simulated time runs much faster than real time so hormone responses and gastric emptying (physiologically hours) are watchable within a session.'}
    />
  );
}
