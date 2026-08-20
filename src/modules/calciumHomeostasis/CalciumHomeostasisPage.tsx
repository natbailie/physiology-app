import { useState } from 'react';
import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { CalciumDiagram } from './components/CalciumDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { calciumHomeostasisContent } from './content';
import { calciumLoopConfig } from './engine/loopConfig';
import { perturbCalciumInfusion } from './engine/engine';
import { CALCIUM_PRESETS, DEFAULT_CALCIUM_INPUTS, type CalciumPresetName, CALCIUM_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { CalciumInputs } from './engine/types';

export function CalciumHomeostasisPage() {
  const [inputs, setInputs] = useState<CalciumInputs>(DEFAULT_CALCIUM_INPUTS);
  const { snapshot, history, perturb, reset } = useEngineLoop(inputs, calciumLoopConfig);

  function handleChange<K extends keyof CalciumInputs>(key: K, value: CalciumInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: CalciumPresetName) {
    setInputs((prev) => ({ ...prev, ...CALCIUM_PRESETS[name] }));
  }

  function triggerCalciumInfusion() {
    perturb((state) => perturbCalciumInfusion(state));
  }

  const calciumHistory = history.map((h) => h.calcium);
  const phosphateHistory = history.map((h) => h.phosphate);
  const pthHistory = history.map((h) => h.pth * 100);

  return (
    <ModulePage
      title="Calcium & Bone/Mineral Homeostasis"
      subtitle="PTH, calcitriol & phosphate regulation"
      accentVar="var(--pth)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={CALCIUM_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[{ label: 'Calcium infusion', onClick: triggerCalciumInfusion, variant: 'impulse' }]}
          onReset={reset}
        />
      }
      diagram={<CalciumDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      charts={
        <>
  <Sparkline label="Serum calcium" unit="mg/dL" data={calciumHistory} domainMin={4} domainMax={16} colorVar="var(--calcium)" />
  <Sparkline label="Serum phosphate" unit="mg/dL" data={phosphateHistory} domainMin={0} domainMax={12} colorVar="var(--phosphate)" />
  <Sparkline label="PTH" unit="%" data={pthHistory} domainMin={0} domainMax={100} colorVar="var(--pth)" />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={calciumHomeostasisContent} />}
      footnote={'A simplified, conceptual model of calcium and phosphate homeostasis — not a clinical or diagnostic tool. Compare the presets by watching calcium and phosphate move in opposite directions: primary hyperparathyroidism raises calcium while dropping phosphate, hypoparathyroidism does the reverse, and hypomagnesemia produces hypocalcemia with PTH stuck near zero. Simulated time runs much faster than real time so PTH (minutes) and calcitriol (hours to days) responses are both watchable within a session.'}
    />
  );
}
