import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { AnsDiagram } from './components/AnsDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { ANS_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { autonomicNervousContent } from './content';
import { ansLoopConfig } from './engine/loopConfig';
import { ANS_PRESETS, DEFAULT_ANS_INPUTS, ANS_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { AnsInputs } from './engine/types';

export function AutonomicNervousPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<AnsInputs>('autonomicNervous', DEFAULT_ANS_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, ansLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_ANS_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'autonomicNervous',
    questions: ANS_QUESTIONS,
    presets: ANS_PRESETS,
    inputs,
    defaultInputs: DEFAULT_ANS_INPUTS,
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
    defaults: DEFAULT_ANS_INPUTS,
    presets: ANS_PRESETS,
    resetEngine: reset,
  });

  const heartRateHistory = useSeries(history, (h) => h.heartRate);
  const heartRateHistoryBaseline = useSeries(baseline.history, (h) => h.heartRate);
  const giMotilityHistory = useSeries(history, (h) => h.giMotility);
  const giMotilityHistoryBaseline = useSeries(baseline.history, (h) => h.giMotility);
  const pupilHistory = useSeries(history, (h) => h.pupilDiameter);
  const pupilHistoryBaseline = useSeries(baseline.history, (h) => h.pupilDiameter);

  return (
    <ModulePage
      moduleId="autonomicNervous"
      title="Autonomic Nervous System"
      subtitle="sympathetic/parasympathetic balance across organ effectors"
      accentVar="var(--sympathetic)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={ANS_PRESET_LABELS}
          onApply={applyPreset}
          onShare={shareLink}
          onReset={resetScenario}
        />
      }
      diagram={<AnsDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
  <Sparkline label="Heart rate" unit="bpm" data={heartRateHistory} baselineData={heartRateHistoryBaseline} domainMin={30} domainMax={200} colorVar="var(--sympathetic)" />
  <Sparkline label="Gut motility" data={giMotilityHistory} baselineData={giMotilityHistoryBaseline} domainMin={0} domainMax={100} colorVar="var(--parasympathetic)" />
  <Sparkline label="Pupil" unit="mm" data={pupilHistory} baselineData={pupilHistoryBaseline} domainMin={1} domainMax={9} colorVar="var(--sympathetic)" />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={autonomicNervousContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of autonomic control — not a clinical or diagnostic tool. Compare the "Fight or flight" and "Rest & digest" presets and watch the heart and gut tiles move in opposite directions, then contrast the "Atropine" and "Organophosphate" toxidromes, which mirror each other sign for sign. Simulated time runs faster than real time so each organ\'s response settles within a few seconds.'}
    />
  );
}
