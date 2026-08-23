import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { GlucoseDiagram } from './components/GlucoseDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { GLUCOSE_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { glucoseRegulationContent } from './content';
import { glucoseLoopConfig } from './engine/loopConfig';
import { perturbEatMeal, perturbGiveInsulin } from './engine/engine';
import { DEFAULT_GLUCOSE_INPUTS, GLUCOSE_PRESETS, type GlucosePresetName, GLUCOSE_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { GlucoseInputs } from './engine/types';

export function GlucoseRegulationPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<GlucoseInputs>('glucoseRegulation', DEFAULT_GLUCOSE_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, glucoseLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'glucoseRegulation',
    questions: GLUCOSE_QUESTIONS,
    presets: GLUCOSE_PRESETS,
    inputs,
    defaultInputs: DEFAULT_GLUCOSE_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  function handleChange<K extends keyof GlucoseInputs>(key: K, value: GlucoseInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: GlucosePresetName) {
    setInputs((prev) => ({ ...prev, ...GLUCOSE_PRESETS[name] }));
  }

  function triggerEatMeal() {
    perturb((state) => perturbEatMeal(state, inputs.mealCarbLoadGrams));
  }

  function triggerGiveInsulin() {
    perturb((state) => perturbGiveInsulin(state, inputs.exogenousInsulinUnits));
  }

  const glucoseHistory = history.map((h) => h.bloodGlucose);
  const glucoseHistoryBaseline = baseline.history?.map((h) => h.bloodGlucose) ?? null;
  const insulinHistory = history.map((h) => h.insulin * 100);
  const insulinHistoryBaseline = baseline.history?.map((h) => h.insulin * 100) ?? null;
  const glucagonHistory = history.map((h) => h.glucagon * 100);
  const glucagonHistoryBaseline = baseline.history?.map((h) => h.glucagon * 100) ?? null;

  return (
    <ModulePage
      moduleId="glucoseRegulation"
      title="Glucose Regulation"
      subtitle="insulin, glucagon & counter-regulatory hormones"
      accentVar="var(--glucose)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={GLUCOSE_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[{ label: 'Eat meal', onClick: triggerEatMeal, variant: 'impulse' }, { label: 'Give insulin', onClick: triggerGiveInsulin, variant: 'impulse' }]}
          onShare={shareLink}
          onReset={reset}
        />
      }
      diagram={<GlucoseDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
  <Sparkline label="Blood glucose" unit="mg/dL" data={glucoseHistory} baselineData={glucoseHistoryBaseline} domainMin={20} domainMax={400} colorVar="var(--glucose)" />
  <Sparkline label="Insulin" unit="%" data={insulinHistory} baselineData={insulinHistoryBaseline} domainMin={0} domainMax={200} colorVar="var(--insulin)" />
  <Sparkline label="Glucagon" unit="%" data={glucagonHistory} baselineData={glucagonHistoryBaseline} domainMin={0} domainMax={100} colorVar="var(--glucagon)" />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={glucoseRegulationContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of glucose regulation — not a clinical or diagnostic tool. Pick a preset (or set the sliders yourself), then click "Eat meal" to deliver the carbohydrate load and "Give insulin" to deliver the insulin dose. Try the Type 1 diabetes preset, eat a meal, and watch glucose climb unchecked — then give insulin. Simulated time runs faster than real time so a post-meal glucose excursion (physiologically a couple of hours) is watchable within a session.'}
    />
  );
}
