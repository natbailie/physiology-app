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
import { NmjDiagram } from './components/NmjDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { NMJ_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { neuromuscularJunctionContent } from './content';
import { nmjLoopConfig } from './engine/loopConfig';
import { perturbRest, perturbTetanicBurst } from './engine/engine';
import {
  DEFAULT_NMJ_INPUTS,
  NMJ_PRESETS,
  NMJ_PRESET_LABELS,
  NMJ_PRESET_ORDER,
} from './engine/presets';
import type { NmjInputs } from './engine/types';
import { TrainOfFour } from './components/TrainOfFour';

export function NeuromuscularJunctionPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<NmjInputs>('neuromuscularJunction', DEFAULT_NMJ_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, nmjLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_NMJ_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'neuromuscularJunction',
    questions: NMJ_QUESTIONS,
    presets: NMJ_PRESETS,
    inputs,
    defaultInputs: DEFAULT_NMJ_INPUTS,
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
    defaults: DEFAULT_NMJ_INPUTS,
    presets: NMJ_PRESETS,
    resetEngine: reset,
  });

  const eppHistory = useSeries(history, (h) => h.epp);
  const eppHistoryBaseline = useSeries(baseline.history, (h) => h.epp);
  const forceHistory = useSeries(history, (h) => h.force);
  const forceHistoryBaseline = useSeries(baseline.history, (h) => h.force);
  const safetyHistory = useSeries(history, (h) => h.safetyFactor);
  const safetyHistoryBaseline = useSeries(baseline.history, (h) => h.safetyFactor);
  const tofHistory = useSeries(history, (h) => h.tofRatio);
  const tofHistoryBaseline = useSeries(baseline.history, (h) => h.tofRatio);

  return (
    <ModulePage
      historyCapacity={nmjLoopConfig.historyCapacity}
      moduleId="neuromuscularJunction"
      title="Neuromuscular Junction"
      subtitle="a reserve so large that losing it is invisible until it is gone"
      accentVar="var(--vm)"
      presets={
        <PresetBar
          order={NMJ_PRESET_ORDER}
          labels={NMJ_PRESET_LABELS}
          onApply={applyPreset}
          actions={[
            { label: 'Tetanic burst', onClick: () => perturb(perturbTetanicBurst), variant: 'impulse' },
            { label: 'Rest', onClick: () => perturb(perturbRest) },
          ]}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={<NmjDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      questions={
        <QuestionSet
          count={NMJ_QUESTIONS.length}
          beds={[]}
          schedule={summary.schedule}
          snapshot={snapshot}
          question={session.question}
        >
          <QuizPanel session={session} summary={summary} presetLabels={NMJ_PRESET_LABELS} />
        </QuestionSet>
      }
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <TrainOfFour derived={snapshot.derived} />
          <Sparkline
            label="Muscle force"
            unit="%"
            data={forceHistory}
            baselineData={forceHistoryBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--sarcomere)"
          />
          <Sparkline
            label="Safety factor"
            data={safetyHistory}
            baselineData={safetyHistoryBaseline}
            domainMin={0}
            domainMax={6}
            colorVar="var(--vm)"
          />
          <Sparkline
            label="End-plate potential"
            unit="mV"
            data={eppHistory}
            baselineData={eppHistoryBaseline}
            domainMin={0}
            domainMax={70}
            colorVar="var(--o2)"
          />
          <Sparkline
            label="Train-of-four ratio"
            unit="%"
            data={tofHistory}
            baselineData={tofHistoryBaseline}
            domainMin={0}
            domainMax={120}
            colorVar="var(--artery)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={neuromuscularJunctionContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified, conceptual model of neuromuscular transmission — not a clinical or diagnostic tool. The train-of-four and the high-rate test are computed from a rested junction, as they are performed in practice, rather than from whatever the terminal happens to be doing; the readily releasable and reserve vesicle pools are represented as one store with two depletion rates. Simulated time runs slower than real life because the events here are milliseconds apart. For what happens once the fibre does fire, see Muscle & EC Coupling; for the receptor pharmacology in other tissues, see the Autonomic Nervous System."
    />
  );
}
