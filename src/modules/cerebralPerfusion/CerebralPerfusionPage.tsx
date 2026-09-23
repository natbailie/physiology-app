import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { useInputNudge } from '@/shared/hooks/useInputNudge';
import { CEREBRAL_CONTROLS } from './presentation';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { QuestionSet } from '@/shared/components/QuestionSet/QuestionSet';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { CerebralDiagram } from './components/CerebralDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { CEREBRAL_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { cerebralPerfusionContent } from './content';
import { cerebralLoopConfig } from './engine/loopConfig';
import { perturbDrainCsf } from './engine/engine';
import {
  CEREBRAL_PRESETS,
  CEREBRAL_PRESET_LABELS,
  CEREBRAL_PRESET_ORDER,
  DEFAULT_CEREBRAL_INPUTS,
} from './engine/presets';
import type { CerebralInputs } from './engine/types';

export function CerebralPerfusionPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<CerebralInputs>('cerebralPerfusion', DEFAULT_CEREBRAL_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, cerebralLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_CEREBRAL_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'cerebralPerfusion',
    questions: CEREBRAL_QUESTIONS,
    presets: CEREBRAL_PRESETS,
    inputs,
    defaultInputs: DEFAULT_CEREBRAL_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  const handleChange = useInputSetter(setInputs);
  // A haematoma is a MASS in the box, and it stays there — it does not resorb over the minutes a
  // learner watches. It used to be added to the CSF volume instead, which is the wrong compartment
  // and left the intracranial-mass slider reading zero through an intracranial bleed.
  const nudge = useInputNudge(setInputs, CEREBRAL_CONTROLS);

  const applyPreset = useScenarioPreset({
    setInputs,
    defaults: DEFAULT_CEREBRAL_INPUTS,
    presets: CEREBRAL_PRESETS,
    resetEngine: reset,
  });

  const icpHistory = useSeries(history, (h) => h.icp);
  const icpHistoryBaseline = useSeries(baseline.history, (h) => h.icp);
  const cppHistory = useSeries(history, (h) => h.cpp);
  const cppHistoryBaseline = useSeries(baseline.history, (h) => h.cpp);
  const cbfHistory = useSeries(history, (h) => h.cbf);
  const cbfHistoryBaseline = useSeries(baseline.history, (h) => h.cbf);
  const cbvHistory = useSeries(history, (h) => h.cbv);
  const cbvHistoryBaseline = useSeries(baseline.history, (h) => h.cbv);

  return (
    <ModulePage
      historyCapacity={cerebralLoopConfig.historyCapacity}
      moduleId="cerebralPerfusion"
      title="Cerebral Perfusion, ICP & CSF"
      subtitle="a box that cannot expand, and the pressure that gets you perfused"
      accentVar="var(--vm)"
      presets={
        <PresetBar
          order={CEREBRAL_PRESET_ORDER}
          labels={CEREBRAL_PRESET_LABELS}
          onApply={applyPreset}
          actions={[
            { label: 'Drain CSF', onClick: () => perturb((s) => perturbDrainCsf(s, 12)), variant: 'impulse' },
            { label: 'Acute bleed', onClick: () => nudge({ massVolumeMl: 20 }), variant: 'danger' },
          ]}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={<CerebralDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      questions={
        <QuestionSet
          count={CEREBRAL_QUESTIONS.length}
          beds={[]}
          schedule={summary.schedule}
          snapshot={snapshot}
          question={session.question}
        >
          <QuizPanel session={session} summary={summary} presetLabels={CEREBRAL_PRESET_LABELS} />
        </QuestionSet>
      }
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="ICP"
            unit="mmHg"
            data={icpHistory}
            baselineData={icpHistoryBaseline}
            domainMin={0}
            domainMax={70}
            colorVar="var(--danger)"
          />
          <Sparkline
            label="CPP"
            unit="mmHg"
            data={cppHistory}
            baselineData={cppHistoryBaseline}
            domainMin={0}
            domainMax={140}
            colorVar="var(--artery)"
          />
          <Sparkline
            label="Cerebral blood flow"
            data={cbfHistory}
            baselineData={cbfHistoryBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--o2)"
          />
          <Sparkline
            label="Cerebral blood volume"
            unit="mL"
            data={cbvHistory}
            baselineData={cbvHistoryBaseline}
            domainMin={30}
            domainMax={170}
            colorVar="var(--venous)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={cerebralPerfusionContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified, conceptual model of intracranial pressure-volume relationships — not a clinical or diagnostic tool. The cranium is treated as one compartment, so pressure gradients between compartments and the herniation syndromes that follow from them are outside its scope; cerebral blood flow is a whole-brain average rather than regional. Simulated time runs faster than real life so CSF accumulation, which takes hours, is watchable. For the systemic circulation supplying this one, see Shock States; for the CO2 handling that sets the vasodilator, see Respiratory & Acid-Base."
    />
  );
}
