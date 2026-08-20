import { useState } from 'react';
import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { EcgDiagram } from './components/EcgDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { EcgStrip } from '@/shared/components/EcgStrip/EcgStrip';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { ecgConductionContent } from './content';
import { ecgLoopConfig } from './engine/loopConfig';
import { DEFAULT_ECG_INPUTS, ECG_PRESETS, type EcgPresetName, ECG_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { EcgInputs } from './engine/types';

export function EcgConductionPage() {
  const [inputs, setInputs] = useState<EcgInputs>(DEFAULT_ECG_INPUTS);
  const { snapshot, history, reset } = useEngineLoop(inputs, ecgLoopConfig);

  function handleChange<K extends keyof EcgInputs>(key: K, value: EcgInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: EcgPresetName) {
    setInputs((prev) => ({ ...prev, ...ECG_PRESETS[name] }));
  }

  const trace = history.map((point) => point.voltageMv);

  return (
    <ModulePage
      title="ECG & Cardiac Conduction"
      subtitle="how depolarisation and repolarisation write each wave"
      accentVar="var(--ecg-trace)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={ECG_PRESET_LABELS}
          onApply={handleApplyPreset}
          onReset={reset}
        />
      }
      diagram={
        <>
          <EcgDiagram derived={snapshot.derived} />
          <EcgStrip
            label={`Lead ${snapshot.derived.lead}`}
            data={trace}
            mvRange={1}
            colorVar="var(--ecg-trace)"
            currentSegment={snapshot.derived.currentSegment}
          />
        </>
      }
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={ecgConductionContent} />}
      footnote={'A simplified, conceptual model of cardiac activation — not a clinical or diagnostic tool, and it models only the six frontal-plane limb leads, so chest-lead findings such as the RSR\' of right bundle branch block are outside its scope. The trace is computed from the activation sequence rather than drawn, so the heart diagram and the strip are driven by one clock and are always in step; time runs slower than real life so the wavefront is watchable as its wave is inscribed. For the mechanical consequences of the same cycle — preload, afterload and the pressure-volume loop — see the Cardiac Cycle module.'}
    />
  );
}
