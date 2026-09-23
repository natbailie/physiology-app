import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { MvDiagram } from './components/MvDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { MV_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { QuestionSet } from '@/shared/components/QuestionSet/QuestionSet';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { mechanicalVentilationContent } from './content';
import { mvLoopConfig } from './engine/loopConfig';
import { DEFAULT_MV_INPUTS, MV_PRESETS, MV_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { MvInputs } from './engine/types';

export function MechanicalVentilationPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<MvInputs>('mechanicalVentilation', DEFAULT_MV_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, mvLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_MV_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'mechanicalVentilation',
    questions: MV_QUESTIONS,
    presets: MV_PRESETS,
    inputs,
    defaultInputs: DEFAULT_MV_INPUTS,
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
    defaults: DEFAULT_MV_INPUTS,
    presets: MV_PRESETS,
    resetEngine: reset,
  });

  const airwayHistory = useSeries(history, (h) => h.pressure);
  const airwayBaseline = useSeries(baseline.history, (h) => h.pressure);

  return (
    <ModulePage
      historyCapacity={mvLoopConfig.historyCapacity}
      moduleId="mechanicalVentilation"
      title="Mechanical Ventilation & Ventilator Pressures"
      subtitle="PEEP, pressure support, driving pressure & how much of the breath is yours"
      accentVar="var(--vq)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={MV_PRESET_LABELS}
          onApply={applyPreset}
          onShare={shareLink}
          onReset={resetScenario}
        />
      }
      diagram={<MvDiagram derived={snapshot.derived} inputs={inputs} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      questions={
        <QuestionSet
          count={MV_QUESTIONS.length}
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
        <Sparkline
          label="Airway pressure"
          unit="cmH2O"
          data={airwayHistory}
          baselineData={airwayBaseline}
          domainMin={0}
          domainMax={35}
          colorVar="var(--vq)"
        />
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      blindControls={session.blinded}
      explainer={<ExplainerPanel content={mechanicalVentilationContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of mechanical ventilation — not a clinical or diagnostic tool. The scenario bar carries a PATIENT (choose ARDS, COPD, OSA or neuromuscular weakness); the rail tunes the ventilator against them. Watch what actually moves: PEEP reopens an ARDS shunt but CPAP alone splints the floppy OSA airway; a higher set rate packs in breaths before an obstructed lung has emptied and auto-PEEP stacks on the dial; and oxygen fixes a shunt but never clears CO2. Use the quiz and the baseline trace to compare a ventilator setting against normal breathing.'}
    />
  );
}