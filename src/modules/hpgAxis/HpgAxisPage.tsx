import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { HpgDiagram } from './components/HpgDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { HPG_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { QuestionSet } from '@/shared/components/QuestionSet/QuestionSet';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { hpgAxisContent } from './content';
import { hpgLoopConfig } from './engine/loopConfig';
import { DEFAULT_HPG_INPUTS, HPG_PRESETS, HPG_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { HpgInputs } from './engine/types';

export function HpgAxisPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<HpgInputs>('hpgAxis', DEFAULT_HPG_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, hpgLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_HPG_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'hpgAxis',
    questions: HPG_QUESTIONS,
    presets: HPG_PRESETS,
    inputs,
    defaultInputs: DEFAULT_HPG_INPUTS,
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
    defaults: DEFAULT_HPG_INPUTS,
    presets: HPG_PRESETS,
    resetEngine: reset,
  });

  const isFemale = snapshot.derived.sex === 'female';
  const lhHistory = useSeries(history, (h) => h.lh * 100);
  const lhHistoryBaseline = useSeries(baseline.history, (h) => h.lh * 100);
  const fshHistory = useSeries(history, (h) => h.fsh * 100);
  const fshHistoryBaseline = useSeries(baseline.history, (h) => h.fsh * 100);
  const steroidHistory = useSeries(history, (h) => h.gonadalSteroid * 100);
  const steroidHistoryBaseline = useSeries(baseline.history, (h) => h.gonadalSteroid * 100);

  return (
    <ModulePage
      historyCapacity={hpgLoopConfig.historyCapacity}
      moduleId="hpgAxis"
      title="HPG Axis"
      subtitle="GnRH, LH/FSH & the ovulatory LH surge"
      accentVar="var(--lh)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={HPG_PRESET_LABELS}
          onApply={applyPreset}
          onShare={shareLink}
          onReset={resetScenario}
        />
      }
      diagram={<HpgDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      questions={
        <QuestionSet
          count={HPG_QUESTIONS.length}
          beds={[]}
          schedule={summary.schedule}
          snapshot={snapshot}
          question={session.question}
        >
          <QuizPanel session={session} summary={summary} />
        </QuestionSet>
      }
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
  <Sparkline label="LH" unit="%" data={lhHistory} baselineData={lhHistoryBaseline} domainMin={0} domainMax={100} colorVar="var(--lh)" />
  <Sparkline label="FSH" unit="%" data={fshHistory} baselineData={fshHistoryBaseline} domainMin={0} domainMax={100} colorVar="var(--fsh)" />
  <Sparkline
    label={isFemale ? 'Estrogen' : 'Testosterone'}
    unit="%"
    data={steroidHistory} baselineData={steroidHistoryBaseline}
    domainMin={0}
    domainMax={100}
    colorVar={isFemale ? 'var(--estrogen)' : 'var(--testosterone)'}
  />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      blindControls={session.blinded}
      explainer={<ExplainerPanel content={hpgAxisContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of reproductive endocrinology — not a clinical or diagnostic tool. Leave the normal female cycle running and the LH surge will fire on its own once follicular estrogen has been high for long enough: the surge is emergent, not scheduled on a fixed day. Watch the feedback arrow flip from inhibitory to stimulatory as it happens, then try the Combined OCP preset, where the surge never comes. One simulated cycle takes roughly a minute of real time.'}
    />
  );
}
