import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { MembraneInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: MembraneInputs;
  onChange: <K extends keyof MembraneInputs>(key: K, value: MembraneInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Stimulus current"
        value={inputs.stimulusIntensity}
        min={0}
        max={50}
        step={1}
        onChange={(v) => onChange('stimulusIntensity', v)}
      />
      <Slider
        label="Extracellular K+"
        value={inputs.extracellularK}
        min={2}
        max={10}
        step={0.1}
        unit=" mEq/L"
        formatValue={(v) => v.toFixed(1)}
        onChange={(v) => onChange('extracellularK', v)}
      />
      <Slider
        label="Extracellular Na+"
        value={inputs.extracellularNa}
        min={100}
        max={160}
        step={1}
        unit=" mEq/L"
        onChange={(v) => onChange('extracellularNa', v)}
      />
      <Slider
        label="Na+ channel density"
        value={inputs.gNaMaxDensity}
        min={0}
        max={2}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('gNaMaxDensity', v)}
      />
      <Slider
        label="K+ channel density"
        value={inputs.gKMaxDensity}
        min={0}
        max={2}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('gKMaxDensity', v)}
      />
      <Slider
        label="Temperature"
        value={inputs.temperature}
        min={30}
        max={42}
        step={0.5}
        unit="°C"
        formatValue={(v) => v.toFixed(1)}
        onChange={(v) => onChange('temperature', v)}
      />
      <Slider
        label="Myelination"
        value={inputs.myelination}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('myelination', v)}
      />
    
    </ControlRail>
  );
}
