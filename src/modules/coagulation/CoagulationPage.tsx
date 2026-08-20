import { useState } from 'react';
import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { CoagulationDiagram } from './components/CoagulationDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { coagulationContent } from './content';
import { coagLoopConfig } from './engine/loopConfig';
import { perturbInjury } from './engine/engine';
import { COAG_PRESETS, DEFAULT_COAG_INPUTS, type CoagPresetName, COAG_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { CoagInputs } from './engine/types';

export function CoagulationPage() {
  const [inputs, setInputs] = useState<CoagInputs>(DEFAULT_COAG_INPUTS);
  const { snapshot, history, perturb, reset } = useEngineLoop(inputs, coagLoopConfig);

  function handleChange<K extends keyof CoagInputs>(key: K, value: CoagInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: CoagPresetName) {
    setInputs((prev) => ({ ...prev, ...COAG_PRESETS[name] }));
  }

  function triggerInjury() {
    perturb((state) => perturbInjury(state));
  }

  const thrombinHistory = history.map((h) => h.thrombin * 100);
  const fibrinHistory = history.map((h) => h.fibrin * 100);
  const plugHistory = history.map((h) => h.plateletPlug * 100);

  return (
    <ModulePage
      title="Coagulation & Hemostasis"
      subtitle="the clotting cascade, PT/APTT & anticoagulants"
      accentVar="var(--fibrin)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={COAG_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[{ label: 'Injure vessel', onClick: triggerInjury, variant: 'danger' }]}
          onReset={reset}
        />
      }
      diagram={<CoagulationDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      charts={
        <>
  <Sparkline label="Thrombin" unit="%" data={thrombinHistory} domainMin={0} domainMax={100} colorVar="var(--thrombin)" />
  <Sparkline label="Fibrin" unit="%" data={fibrinHistory} domainMin={0} domainMax={100} colorVar="var(--fibrin)" />
  <Sparkline label="Platelet plug" unit="%" data={plugHistory} domainMin={0} domainMax={100} colorVar="var(--platelet)" />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={coagulationContent} />}
      footnote={'A simplified, conceptual model of haemostasis — not a clinical or diagnostic tool, and the clotting times are illustrative rather than calibrated to any particular laboratory\'s reagents. Pick a preset and read the PATTERN across PT, APTT, platelets and bleeding time rather than any single value — that combination is what localises the defect. Then click "Injure vessel" to fire the cascade and watch whether a clot actually forms: haemophilia has a perfectly normal PT and still fails to seal.'}
    />
  );
}
