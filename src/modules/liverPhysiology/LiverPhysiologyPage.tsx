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
import { LiverDiagram } from './components/LiverDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { LIVER_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { liverPhysiologyContent } from './content';
import { liverLoopConfig } from './engine/loopConfig';
import { perturbAlcoholBinge, perturbHaemolyticEpisode, perturbStentObstruction } from './engine/engine';
import {
  LIVER_PRESETS,
  LIVER_PRESET_LABELS,
  LIVER_PRESET_ORDER,
  DEFAULT_LIVER_INPUTS,
} from './engine/presets';
import type { LiverInputs } from './engine/types';

export function LiverPhysiologyPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<LiverInputs>('liverPhysiology', DEFAULT_LIVER_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, liverLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_LIVER_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'liverPhysiology',
    questions: LIVER_QUESTIONS,
    presets: LIVER_PRESETS,
    inputs,
    defaultInputs: DEFAULT_LIVER_INPUTS,
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
    defaults: DEFAULT_LIVER_INPUTS,
    presets: LIVER_PRESETS,
    resetEngine: reset,
  });

  const totalHistory = useSeries(history, (h) => h.total);
  const totalBaseline = useSeries(baseline.history, (h) => h.total);
  const uncHistory = useSeries(history, (h) => h.unconjugated);
  const uncBaseline = useSeries(baseline.history, (h) => h.unconjugated);
  const conjHistory = useSeries(history, (h) => h.conjugated);
  const conjBaseline = useSeries(baseline.history, (h) => h.conjugated);
  const ammoniaHistory = useSeries(history, (h) => h.ammonia);
  const ammoniaBaseline = useSeries(baseline.history, (h) => h.ammonia);

  return (
    <ModulePage
      moduleId="liverPhysiology"
      title="Liver & Bilirubin Metabolism"
      subtitle="one pigment, three places to fail, and a urine dipstick that tells you which"
      accentVar="var(--liver)"
      presets={
        <PresetBar
          order={LIVER_PRESET_ORDER}
          labels={LIVER_PRESET_LABELS}
          onApply={applyPreset}
          actions={[
            { label: 'Haemolytic episode', onClick: () => perturb(perturbHaemolyticEpisode), variant: 'danger' },
            { label: 'Alcohol binge', onClick: () => perturb(perturbAlcoholBinge), variant: 'danger' },
            { label: 'ERCP stent', onClick: () => perturb(perturbStentObstruction), variant: 'impulse' },
          ]}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={<LiverDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={LIVER_PRESET_LABELS} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Total bilirubin"
            unit="µmol/L"
            data={totalHistory}
            baselineData={totalBaseline}
            domainMin={0}
            domainMax={400}
            colorVar="var(--warn)"
          />
          <Sparkline
            label="Unconjugated"
            unit="µmol/L"
            data={uncHistory}
            baselineData={uncBaseline}
            domainMin={0}
            domainMax={300}
            colorVar="var(--danger)"
          />
          <Sparkline
            label="Conjugated"
            unit="µmol/L"
            data={conjHistory}
            baselineData={conjBaseline}
            domainMin={0}
            domainMax={300}
            colorVar="var(--liver)"
          />
          <Sparkline
            label="Ammonia"
            unit="µmol/L"
            data={ammoniaHistory}
            baselineData={ammoniaBaseline}
            domainMin={0}
            domainMax={220}
            colorVar="var(--nociception)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={liverPhysiologyContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified conceptual model of the bilirubin pathway and its failure modes — not a clinical or diagnostic tool. Albumin binding is represented as a single capacity rather than competitive binding; enzyme levels are modelled as multiples of ULN driven by injury and pressure rather than individual isoforms; and the encephalopathy grade is an ammonia-based simplification of a clinical scoring system. Pools equilibrate over simulated days; acute bursts decay within hours."
    />
  );
}
