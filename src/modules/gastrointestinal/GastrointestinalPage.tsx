import { useState } from 'react';
import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { GiDiagram } from './components/GiDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { gastrointestinalContent } from './content';
import { giLoopConfig } from './engine/loopConfig';
import { perturbEatMeal } from './engine/engine';
import { DEFAULT_GI_INPUTS, GI_PRESETS, type GiPresetName, GI_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { GiInputs } from './engine/types';

export function GastrointestinalPage() {
  const [inputs, setInputs] = useState<GiInputs>(DEFAULT_GI_INPUTS);
  const { snapshot, history, perturb, reset } = useEngineLoop(inputs, giLoopConfig);

  function handleChange<K extends keyof GiInputs>(key: K, value: GiInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: GiPresetName) {
    setInputs((prev) => ({ ...prev, ...GI_PRESETS[name] }));
  }

  function triggerEatMeal() {
    perturb((state) => perturbEatMeal(state));
  }

  const gastricPHHistory = history.map((h) => h.gastricPH);
  const duodenalPHHistory = history.map((h) => h.duodenalPH);
  const gastrinHistory = history.map((h) => h.gastrinDrive * 100);

  return (
    <ModulePage
      title="GI Physiology"
      subtitle="gastric acid, gut hormones & motility along the meal"
      accentVar="var(--gastrin)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={GI_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[{ label: 'Eat meal', onClick: triggerEatMeal, variant: 'impulse' }]}
          onReset={reset}
        />
      }
      diagram={<GiDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      charts={
        <>
  <Sparkline label="Gastric pH" data={gastricPHHistory} domainMin={1} domainMax={7} colorVar="var(--gastrin)" />
  <Sparkline label="Duodenal pH" data={duodenalPHHistory} domainMin={2} domainMax={8} colorVar="var(--secretin)" />
  <Sparkline label="Gastrin" unit="%" data={gastrinHistory} domainMin={0} domainMax={100} colorVar="var(--gastrin)" />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={gastrointestinalContent} />}
      footnote={'A simplified, conceptual model of GI physiology — not a clinical or diagnostic tool. Adjust the meal composition and drug/tone sliders first, then click "Eat meal" to trigger digestion — or leave the stomach empty and just watch to see the migrating motor complex sweep through its interdigestive cycle. Simulated time runs much faster than real time so hormone responses and gastric emptying (physiologically hours) are watchable within a session.'}
    />
  );
}
