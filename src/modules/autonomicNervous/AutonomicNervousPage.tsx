import { useState } from 'react';
import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
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
import { ANS_PRESETS, DEFAULT_ANS_INPUTS, type AnsPresetName, ANS_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { AnsInputs } from './engine/types';

export function AutonomicNervousPage() {
  const [inputs, setInputs] = useState<AnsInputs>(DEFAULT_ANS_INPUTS);
  const { snapshot, history, perturb, reset, transport, baseline } = useEngineLoop(inputs, ansLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'autonomicNervous',
    questions: ANS_QUESTIONS,
    presets: ANS_PRESETS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
  });

  function handleChange<K extends keyof AnsInputs>(key: K, value: AnsInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: AnsPresetName) {
    setInputs((prev) => ({ ...prev, ...ANS_PRESETS[name] }));
  }

  const heartRateHistory = history.map((h) => h.heartRate);
  const heartRateHistoryBaseline = baseline.history?.map((h) => h.heartRate) ?? null;
  const giMotilityHistory = history.map((h) => h.giMotility);
  const giMotilityHistoryBaseline = baseline.history?.map((h) => h.giMotility) ?? null;
  const pupilHistory = history.map((h) => h.pupilDiameter);
  const pupilHistoryBaseline = baseline.history?.map((h) => h.pupilDiameter) ?? null;

  return (
    <ModulePage
      title="Autonomic Nervous System"
      subtitle="sympathetic/parasympathetic balance across organ effectors"
      accentVar="var(--sympathetic)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={ANS_PRESET_LABELS}
          onApply={handleApplyPreset}
          onReset={reset}
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
