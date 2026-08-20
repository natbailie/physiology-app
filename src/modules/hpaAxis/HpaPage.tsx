import { useState } from 'react';
import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { HpaDiagram } from './components/HpaDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { hpaAxisContent } from './content';
import { hpaLoopConfig } from './engine/loopConfig';
import { perturbAcuteStressor } from './engine/engine';
import { DEFAULT_HPA_INPUTS, HPA_PRESETS, type HpaPresetName, HPA_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { HpaInputs } from './engine/types';

export function HpaPage() {
  const [inputs, setInputs] = useState<HpaInputs>(DEFAULT_HPA_INPUTS);
  const { snapshot, history, perturb, reset } = useEngineLoop(inputs, hpaLoopConfig);

  function handleChange<K extends keyof HpaInputs>(key: K, value: HpaInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: HpaPresetName) {
    setInputs((prev) => ({ ...prev, ...HPA_PRESETS[name] }));
  }

  function triggerAcuteStressor() {
    perturb((state) => perturbAcuteStressor(state));
  }

  const cortisolHistory = history.map((h) => h.cortisol);
  const acthHistory = history.map((h) => h.acth * 100);
  const reserveHistory = history.map((h) => h.adrenalReserve * 100);

  return (
    <ModulePage
      title="HPA Axis"
      subtitle="cortisol, stress response & adrenal insufficiency simulator"
      accentVar="var(--cortisol)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={HPA_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[{ label: 'Acute stressor', onClick: triggerAcuteStressor, variant: 'danger' }]}
          onReset={reset}
        />
      }
      diagram={<HpaDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      charts={
        <>
  <Sparkline label="Cortisol" unit="µg/dL" data={cortisolHistory} domainMin={0} domainMax={40} colorVar="var(--cortisol)" />
  <Sparkline label="ACTH" unit="%" data={acthHistory} domainMin={0} domainMax={100} colorVar="var(--acth)" />
  <Sparkline label="Adrenal reserve" unit="%" data={reserveHistory} domainMin={0} domainMax={100} colorVar="var(--text)" />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={hpaAxisContent} />}
      footnote={'A simplified, conceptual model of HPA axis physiology — not a clinical or diagnostic tool. Simulated time runs much faster than real time: one diurnal cortisol cycle completes in about 4 minutes, and the adrenal-atrophy/recovery dynamics (physiologically weeks) are compressed to be watchable within a session — try the "Steroid therapy" preset for a while, then set exogenous glucocorticoid back to 0.'}
    />
  );
}
