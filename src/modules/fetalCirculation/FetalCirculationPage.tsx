import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { useInputNudge } from '@/shared/hooks/useInputNudge';
import { FETAL_CONTROLS } from './presentation';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { QuestionSet } from '@/shared/components/QuestionSet/QuestionSet';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { FetalDiagram } from './components/FetalDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { FETAL_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { fetalCirculationContent } from './content';
import { fetalLoopConfig } from './engine/loopConfig';
import {
  DEFAULT_FETAL_INPUTS,
  FETAL_PRESETS,
  FETAL_PRESET_LABELS,
  FETAL_PRESET_ORDER,
  FETAL_PRESET_SETTLE_SECONDS,
} from './engine/presets';
import type { FetalInputs } from './engine/types';

export function FetalCirculationPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<FetalInputs>('fetalCirculation', DEFAULT_FETAL_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, fetalLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_FETAL_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'fetalCirculation',
    questions: FETAL_QUESTIONS,
    presets: FETAL_PRESETS,
    inputs,
    defaultInputs: DEFAULT_FETAL_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  const handleChange = useInputSetter(setInputs);
  // A duct is held open BY prostaglandin, for as long as the infusion runs — so the button raises
  // the infusion and the slider shows it, rather than writing the patency directly and leaving the
  // learner no way to see what is holding it or to turn it off.
  const nudge = useInputNudge(setInputs, FETAL_CONTROLS);

  const applyPreset = useScenarioPreset({
    setInputs,
    defaults: DEFAULT_FETAL_INPUTS,
    presets: FETAL_PRESETS,
    resetEngine: reset,
    settleOverrides: FETAL_PRESET_SETTLE_SECONDS,
    fastForward,
  });

  const preHistory = useSeries(history, (h) => h.preDuctal);
  const preHistoryBaseline = useSeries(baseline.history, (h) => h.preDuctal);
  const postHistory = useSeries(history, (h) => h.postDuctal);
  const pvrHistory = useSeries(history, (h) => h.pvr);
  const pvrHistoryBaseline = useSeries(baseline.history, (h) => h.pvr);
  const ductusHistory = useSeries(history, (h) => h.ductus);
  const ductusHistoryBaseline = useSeries(baseline.history, (h) => h.ductus);
  const pulmonaryFlowHistory = useSeries(history, (h) => h.pulmonaryFlow);
  const pulmonaryFlowHistoryBaseline = useSeries(baseline.history, (h) => h.pulmonaryFlow);

  return (
    <ModulePage
      historyCapacity={fetalLoopConfig.historyCapacity}
      moduleId="fetalCirculation"
      title="Fetal & Neonatal Circulation"
      subtitle="two circulations in parallel, and the minute they become one"
      accentVar="var(--o2)"
      presets={
        <PresetBar
          order={FETAL_PRESET_ORDER}
          labels={FETAL_PRESET_LABELS}
          onApply={applyPreset}
          actions={[{ label: 'Reopen duct', onClick: () => nudge({ prostaglandinLevel: 60 }), variant: 'impulse' }]}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={<FetalDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      questions={
        <QuestionSet
          count={FETAL_QUESTIONS.length}
          beds={[]}
          schedule={summary.schedule}
          snapshot={snapshot}
          question={session.question}
        >
          <QuizPanel session={session} summary={summary} presetLabels={FETAL_PRESET_LABELS} />
        </QuestionSet>
      }
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Pre-ductal SpO₂"
            unit="%"
            data={preHistory}
            baselineData={preHistoryBaseline}
            secondaryData={postHistory}
            secondaryLabel="post-ductal"
            secondaryColorVar="var(--danger)"
            domainMin={20}
            domainMax={100}
            colorVar="var(--o2)"
          />
          <Sparkline
            label="Pulmonary resistance"
            unit="x"
            data={pvrHistory}
            baselineData={pvrHistoryBaseline}
            domainMin={0}
            domainMax={13}
            colorVar="var(--venous)"
          />
          <Sparkline
            label="Duct patency"
            unit="%"
            data={ductusHistory}
            baselineData={ductusHistoryBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--venous)"
          />
          <Sparkline
            label="Pulmonary flow"
            unit="%"
            data={pulmonaryFlowHistory}
            baselineData={pulmonaryFlowHistoryBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--o2)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={fetalCirculationContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified, conceptual model of the fetal circulation and its transition — not a clinical or diagnostic tool. Flow is partitioned between the pulmonary bed and the duct by conductance rather than simulated beat by beat, and the atrial pressures are surrogates rather than waveforms. Simulated time runs faster than real life so ductal closure, which takes hours, is watchable. For the pulmonary vasoconstriction that keeps fetal resistance high, see the V/Q section of Respiratory Mechanics; for the shunt physiology in an adult circulation, see Shock States."
    />
  );
}
