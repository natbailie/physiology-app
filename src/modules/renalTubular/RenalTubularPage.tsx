import { useState } from 'react';
import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { NephronDiagram } from './components/NephronDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { renalTubularContent } from './content';
import { renalTubularLoopConfig } from './engine/loopConfig';
import { perturbWaterDeprivation } from './engine/engine';
import { DEFAULT_RENAL_TUBULAR_INPUTS, RENAL_TUBULAR_PRESETS, type RenalTubularPresetName, RENAL_TUBULAR_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { RenalTubularInputs } from './engine/types';

export function RenalTubularPage() {
  const [inputs, setInputs] = useState<RenalTubularInputs>(DEFAULT_RENAL_TUBULAR_INPUTS);
  const { snapshot, history, perturb, reset, transport, baseline } = useEngineLoop(inputs, renalTubularLoopConfig);

  function handleChange<K extends keyof RenalTubularInputs>(key: K, value: RenalTubularInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: RenalTubularPresetName) {
    setInputs((prev) => ({ ...prev, ...RENAL_TUBULAR_PRESETS[name] }));
  }

  function triggerWaterDeprivation() {
    perturb((state) => perturbWaterDeprivation(state));
  }

  const plasmaHistory = history.map((h) => h.plasmaOsmolality);
  const plasmaHistoryBaseline = baseline.history?.map((h) => h.plasmaOsmolality) ?? null;
  const urineHistory = history.map((h) => h.urineOsmolality);
  const urineHistoryBaseline = baseline.history?.map((h) => h.urineOsmolality) ?? null;
  const adhHistory = history.map((h) => h.adhLevel * 100);
  const adhHistoryBaseline = baseline.history?.map((h) => h.adhLevel * 100) ?? null;

  return (
    <ModulePage
      title="Renal Tubular Physiology"
      subtitle="nephron segments, countercurrent multiplication & ADH"
      accentVar="var(--tubule)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={RENAL_TUBULAR_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[{ label: 'Water deprivation', onClick: triggerWaterDeprivation, variant: 'danger' }]}
          onReset={reset}
        />
      }
      diagram={<NephronDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
  <Sparkline
    label="Plasma osmolality"
    unit="mOsm/kg"
    data={plasmaHistory} baselineData={plasmaHistoryBaseline}
    domainMin={240}
    domainMax={360}
    colorVar="var(--tubule)"
  />
  <Sparkline
    label="Urine osmolality"
    unit="mOsm/kg"
    data={urineHistory} baselineData={urineHistoryBaseline}
    domainMin={0}
    domainMax={1200}
    colorVar="var(--urine)"
  />
  <Sparkline label="ADH" unit="%" data={adhHistory} baselineData={adhHistoryBaseline} domainMin={0} domainMax={100} colorVar="var(--adh)" />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={renalTubularContent} />}
      footnote={'A simplified, conceptual model of nephron function — not a clinical or diagnostic tool. The best way to use it: pick "Central DI", note the dilute urine, then raise "Exogenous ADH (DDAVP)" and watch the urine concentrate sharply — then repeat with "Nephrogenic DI", where the same dose changes almost nothing. That contrast is the water deprivation test. Simulated time runs faster than real time so ADH responses (minutes) and medullary gradient washout (hours) are both watchable within a session.'}
    />
  );
}
