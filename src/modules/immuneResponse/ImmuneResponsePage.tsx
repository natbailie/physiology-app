import { useState } from 'react';
import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { ImmuneDiagram } from './components/ImmuneDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { immuneResponseContent } from './content';
import { immuneLoopConfig } from './engine/loopConfig';
import { perturbInfect, perturbVaccinate } from './engine/engine';
import { DEFAULT_IMMUNE_INPUTS, IMMUNE_PRESETS, type ImmunePresetName, IMMUNE_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { ImmuneInputs } from './engine/types';

export function ImmuneResponsePage() {
  const [inputs, setInputs] = useState<ImmuneInputs>(DEFAULT_IMMUNE_INPUTS);
  const { snapshot, history, perturb, reset, transport, baseline } = useEngineLoop(inputs, immuneLoopConfig);

  function handleChange<K extends keyof ImmuneInputs>(key: K, value: ImmuneInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: ImmunePresetName) {
    setInputs((prev) => ({ ...prev, ...IMMUNE_PRESETS[name] }));
  }

  const loadHistory = history.map((h) => h.pathogenLoad * 100);
  const loadHistoryBaseline = baseline.history?.map((h) => h.pathogenLoad * 100) ?? null;
  const iggHistory = history.map((h) => h.iggTitre * 100);
  const iggHistoryBaseline = baseline.history?.map((h) => h.iggTitre * 100) ?? null;
  const memoryHistory = history.map((h) => h.memoryLevel * 100);
  const memoryHistoryBaseline = baseline.history?.map((h) => h.memoryLevel * 100) ?? null;

  return (
    <ModulePage
      title="Immune Response"
      subtitle="innate to adaptive, and how memory changes everything"
      accentVar="var(--memory)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={IMMUNE_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[{ label: 'Vaccinate', onClick: () => perturb((state) => perturbVaccinate(state)), variant: 'impulse' }, { label: 'Infect', onClick: () => perturb((state) => perturbInfect(state)), variant: 'danger' }]}
          onReset={reset}
        />
      }
      diagram={<ImmuneDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
  <Sparkline label="Pathogen load" unit="%" data={loadHistory} baselineData={loadHistoryBaseline} domainMin={0} domainMax={100} colorVar="var(--pathogen)" />
  <Sparkline label="IgG" unit="%" data={iggHistory} baselineData={iggHistoryBaseline} domainMin={0} domainMax={100} colorVar="var(--antibody)" />
  <Sparkline label="Memory" unit="%" data={memoryHistory} baselineData={memoryHistoryBaseline} domainMin={0} domainMax={100} colorVar="var(--memory)" />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={immuneResponseContent} />}
      footnote={'A simplified, conceptual model of the immune response — not a clinical or diagnostic tool. The best way to use it: click "Infect" on a healthy host and watch the primary response run its course, then — once it has cleared — click "Infect" again. Nothing about the inputs has changed, only the memory the first infection left behind, and the second course is barely an illness. "Vaccinate" reaches the same protected state without any infection at all. One simulated second is roughly one day.'}
    />
  );
}
