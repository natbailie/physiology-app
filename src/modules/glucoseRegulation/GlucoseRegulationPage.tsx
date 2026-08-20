import { useState } from 'react';
import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { GlucoseDiagram } from './components/GlucoseDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { glucoseRegulationContent } from './content';
import { glucoseLoopConfig } from './engine/loopConfig';
import { perturbEatMeal, perturbGiveInsulin } from './engine/engine';
import { DEFAULT_GLUCOSE_INPUTS, GLUCOSE_PRESETS, type GlucosePresetName, GLUCOSE_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { GlucoseInputs } from './engine/types';

export function GlucoseRegulationPage() {
  const [inputs, setInputs] = useState<GlucoseInputs>(DEFAULT_GLUCOSE_INPUTS);
  const { snapshot, history, perturb, reset } = useEngineLoop(inputs, glucoseLoopConfig);

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
  const insulinHistory = history.map((h) => h.insulin * 100);
  const glucagonHistory = history.map((h) => h.glucagon * 100);

  return (
    <ModulePage
      title="Glucose Regulation"
      subtitle="insulin, glucagon & counter-regulatory hormones"
      accentVar="var(--glucose)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={GLUCOSE_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[{ label: 'Eat meal', onClick: triggerEatMeal, variant: 'impulse' }, { label: 'Give insulin', onClick: triggerGiveInsulin, variant: 'impulse' }]}
          onReset={reset}
        />
      }
      diagram={<GlucoseDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      charts={
        <>
  <Sparkline label="Blood glucose" unit="mg/dL" data={glucoseHistory} domainMin={20} domainMax={400} colorVar="var(--glucose)" />
  <Sparkline label="Insulin" unit="%" data={insulinHistory} domainMin={0} domainMax={200} colorVar="var(--insulin)" />
  <Sparkline label="Glucagon" unit="%" data={glucagonHistory} domainMin={0} domainMax={100} colorVar="var(--glucagon)" />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={glucoseRegulationContent} />}
      footnote={'A simplified, conceptual model of glucose regulation — not a clinical or diagnostic tool. Pick a preset (or set the sliders yourself), then click "Eat meal" to deliver the carbohydrate load and "Give insulin" to deliver the insulin dose. Try the Type 1 diabetes preset, eat a meal, and watch glucose climb unchecked — then give insulin. Simulated time runs faster than real time so a post-meal glucose excursion (physiologically a couple of hours) is watchable within a session.'}
    />
  );
}
