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
import { QuestionSet } from '@/shared/components/QuestionSet/QuestionSet';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { CoronaryDiagram } from './components/CoronaryDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { CORONARY_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { coronaryCirculationContent } from './content';
import { coronaryLoopConfig } from './engine/loopConfig';
import { perturbExertion, perturbVasospasm } from './engine/engine';
import {
  CORONARY_PRESETS,
  CORONARY_PRESET_LABELS,
  CORONARY_PRESET_ORDER,
  DEFAULT_CORONARY_INPUTS,
} from './engine/presets';
import type { CoronaryInputs } from './engine/types';

export function CoronaryCirculationPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<CoronaryInputs>('coronaryCirculation', DEFAULT_CORONARY_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, coronaryLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_CORONARY_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'coronaryCirculation',
    questions: CORONARY_QUESTIONS,
    presets: CORONARY_PRESETS,
    inputs,
    defaultInputs: DEFAULT_CORONARY_INPUTS,
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
    defaults: DEFAULT_CORONARY_INPUTS,
    presets: CORONARY_PRESETS,
    resetEngine: reset,
  });

  const demandHistory = useSeries(history, (h) => h.requiredFlow);
  const demandHistoryBaseline = useSeries(baseline.history, (h) => h.requiredFlow);
  const supplyHistory = useSeries(history, (h) => h.maximalFlowCapacity);
  const supplyHistoryBaseline = useSeries(baseline.history, (h) => h.maximalFlowCapacity);
  const ischaemiaHistory = useSeries(history, (h) => h.ischaemiaLevel * 100);
  const ischaemiaHistoryBaseline = useSeries(baseline.history, (h) => h.ischaemiaLevel * 100);
  const diastoleHistory = useSeries(history, (h) => h.diastolicTimeFraction * 100);
  const diastoleHistoryBaseline = useSeries(baseline.history, (h) => h.diastolicTimeFraction * 100);

  return (
    <ModulePage
      historyCapacity={coronaryLoopConfig.historyCapacity}
      moduleId="coronaryCirculation"
      title="Coronary Circulation"
      subtitle="supply, demand & the reserve in between"
      accentVar="var(--artery)"
      presets={
        <PresetBar
          order={CORONARY_PRESET_ORDER}
          labels={CORONARY_PRESET_LABELS}
          onApply={applyPreset}
          actions={[
            { label: 'Exertion', onClick: () => perturb((s) => perturbExertion(s)), variant: 'impulse' },
            { label: 'Vasospasm', onClick: () => perturb((s) => perturbVasospasm(s)), variant: 'danger' },
          ]}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={<CoronaryDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      questions={
        <QuestionSet
          count={CORONARY_QUESTIONS.length}
          beds={[]}
          schedule={summary.schedule}
          snapshot={snapshot}
          question={session.question}
        >
          <QuizPanel session={session} summary={summary} presetLabels={CORONARY_PRESET_LABELS} />
        </QuestionSet>
      }
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Maximal supply"
            secondaryLabel="demand"
            unit="× rest"
            data={supplyHistory}
            baselineData={supplyHistoryBaseline}
            secondaryData={demandHistory}
            secondaryBaselineData={demandHistoryBaseline}
            secondaryColorVar="var(--danger)"
            domainMin={0}
            domainMax={5}
            colorVar="var(--o2)"
          />
          <Sparkline
            label="Ischaemia"
            unit="%"
            data={ischaemiaHistory}
            baselineData={ischaemiaHistoryBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--danger)"
          />
          <Sparkline
            label="Diastolic window"
            unit="%"
            data={diastoleHistory}
            baselineData={diastoleHistoryBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--artery)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={coronaryCirculationContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified, conceptual model of myocardial oxygen balance — not a clinical or diagnostic tool. The aortic pressures are inputs, so the systemic consequences of pump failure (and the compensation that follows) live in Shock States and Venous Return; the ECG signatures themselves — territorial ST elevation versus diffuse subendocardial depression — are drawn lead by lead in ECG & Cardiac Conduction. Exertion and vasospasm decay over simulated minutes, which run faster than real time."
    />
  );
}
