import { useState } from 'react';
import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { PhysiologyDiagram } from './components/PhysiologyDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { ControlPanel } from './components/ControlPanel';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { cardiorenalContent } from './content';
import { cardiorenalLoopConfig } from './engine/loopConfig';
import { perturbBloodVolume } from './engine/engine';
import { DEFAULT_INPUTS, PRESETS, PRESET_LABELS, PRESET_ORDER, type PresetName } from './engine/presets';
import { SIMULATION } from './engine/constants';
import type { SimInputs } from './engine/types';

export function CardiorenalPage() {
  const [inputs, setInputs] = useState<SimInputs>(DEFAULT_INPUTS);
  const { snapshot, history, perturb, reset, transport, baseline } = useEngineLoop(inputs, cardiorenalLoopConfig);

  function handleChange<K extends keyof SimInputs>(key: K, value: SimInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: PresetName) {
    setInputs((prev) => ({ ...prev, ...PRESETS[name] }));
  }

  function triggerHemorrhage() {
    perturb((state) => perturbBloodVolume(state, SIMULATION.HEMORRHAGE_BV_MULTIPLIER));
  }

  const mapHistory = history.map((h) => h.map);
  const mapHistoryBaseline = baseline.history?.map((h) => h.map) ?? null;
  const gfrHistory = history.map((h) => h.gfr);
  const gfrHistoryBaseline = baseline.history?.map((h) => h.gfr) ?? null;
  const bvHistory = history.map((h) => h.bloodVolume);
  const bvHistoryBaseline = baseline.history?.map((h) => h.bloodVolume) ?? null;

  return (
    <ModulePage
      title="Cardiorenal Monitor"
      subtitle="heart & kidney feedback simulator"
      accentVar="var(--artery)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[{ label: 'Hemorrhage', onClick: triggerHemorrhage, variant: 'danger' }]}
          onReset={reset}
        />
      }
      diagram={<PhysiologyDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel state={snapshot.state} derived={snapshot.derived} inputs={inputs} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline label="MAP" unit="mmHg" data={mapHistory} baselineData={mapHistoryBaseline} domainMin={30} domainMax={180} colorVar="var(--artery)" />
          <Sparkline label="GFR" unit="*" data={gfrHistory} baselineData={gfrHistoryBaseline} domainMin={0} domainMax={150} colorVar="var(--kidney)" />
          <Sparkline
            label="Blood volume"
            unit="%"
            data={bvHistory} baselineData={bvHistoryBaseline}
            domainMin={40}
            domainMax={220}
            colorVar="var(--text)"
          />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={cardiorenalContent} />}
      footnote="A simplified, conceptual model of cardiorenal physiology — not a clinical or diagnostic tool. GFR and urine output are shown in normalized units (baseline = 100), not literal mL/min. Simulated time runs faster than real time so RAAS/ANP responses (which take minutes physiologically) are watchable within roughly a minute."
    />
  );
}
