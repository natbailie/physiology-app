import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { InflammationDiagram } from './components/InflammationDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { INFLAMMATION_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { inflammationContent } from './content';
import { inflammationLoopConfig } from './engine/loopConfig';
import { perturbNewInsult, perturbDrainAbscess } from './engine/engine';
import {
  INFLAMMATION_PRESETS,
  INFLAMMATION_PRESET_LABELS,
  INFLAMMATION_PRESET_ORDER,
  DEFAULT_INFLAMMATION_INPUTS,
} from './engine/presets';
import type { InflammationInputs } from './engine/types';

export function InflammationPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<InflammationInputs>('inflammation', DEFAULT_INFLAMMATION_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, inflammationLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_INFLAMMATION_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'inflammation',
    questions: INFLAMMATION_QUESTIONS,
    presets: INFLAMMATION_PRESETS,
    inputs,
    defaultInputs: DEFAULT_INFLAMMATION_INPUTS,
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
    defaults: DEFAULT_INFLAMMATION_INPUTS,
    presets: INFLAMMATION_PRESETS,
    resetEngine: reset,
  });

  const loadHistory = useSeries(history, (h) => h.insultLoad);
  const loadHistoryBaseline = useSeries(baseline.history, (h) => h.insultLoad);
  const crpHistory = useSeries(history, (h) => h.crpMgL);
  const crpHistoryBaseline = useSeries(baseline.history, (h) => h.crpMgL);
  const neutHistory = useSeries(history, (h) => h.neutrophilCount10e9PerL);
  const neutHistoryBaseline = useSeries(baseline.history, (h) => h.neutrophilCount10e9PerL);

  return (
    <ModulePage
      moduleId="inflammation"
      title="Inflammation"
      subtitle="acute response, resolution, and the conditions that prevent it"
      accentVar="var(--danger)"
      presets={
        <PresetBar
          order={INFLAMMATION_PRESET_ORDER}
          labels={INFLAMMATION_PRESET_LABELS}
          onApply={applyPreset}
          actions={[
            { label: 'New insult', onClick: () => perturb((s) => perturbNewInsult(s, inputs.insultSeverityPct || 50)), variant: 'impulse' },
            { label: 'Drain abscess', onClick: () => perturb((s) => perturbDrainAbscess(s, 0.8)), variant: 'danger' },
          ]}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={<InflammationDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={INFLAMMATION_PRESET_LABELS} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Bacterial load"
            data={loadHistory}
            baselineData={loadHistoryBaseline}
            domainMin={0}
            domainMax={2.4}
            colorVar="var(--danger)"
          />
          <Sparkline
            label="CRP"
            unit="mg/L"
            data={crpHistory}
            baselineData={crpHistoryBaseline}
            domainMin={0}
            domainMax={320}
            colorVar="var(--artery)"
          />
          <Sparkline
            label="Neutrophils"
            unit="×10⁹/L"
            data={neutHistory}
            baselineData={neutHistoryBaseline}
            domainMin={0}
            domainMax={30}
            colorVar="var(--o2)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={inflammationContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified, conceptual model of the acute inflammatory response — not a clinical or diagnostic tool. Insults are deposited as events; antibiotics, steroids and source control act on different arms of the same cascade. The CRP and fever track systemic spillover from the local war, and resolution requires the insult to be cleared — which is why a foreign body, unlike bacteria, turns the response chronic."
    />
  );
}
