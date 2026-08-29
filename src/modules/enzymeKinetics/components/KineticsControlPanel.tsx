import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import { ToggleGroup } from '@/shared/components/ToggleGroup/ToggleGroup';
import type { InhibitorType, KineticsInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: KineticsInputs;
  onChange: <K extends keyof KineticsInputs>(key: K, value: KineticsInputs[K]) => void;
}

const INHIBITOR_OPTIONS: { value: InhibitorType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'competitive', label: 'Competitive' },
  { value: 'noncompetitive', label: 'Noncomp.' },
  { value: 'uncompetitive', label: 'Uncomp.' },
];

function KineticsControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <ToggleGroup
        label="Inhibitor class"
        value={inputs.inhibitorType}
        options={INHIBITOR_OPTIONS}
        colorVar="var(--ecg-trace)"
        onChange={(value) => onChange('inhibitorType', value)}
      />
      <Slider
        label="Substrate [S]"
        value={inputs.substrateMm}
        min={0}
        max={20}
        step={0.05}
        unit=" mmol/L"
        formatValue={(v) => v.toFixed(2)}
        onChange={(v) => onChange('substrateMm', v)}
      />
      <Slider
        label="Vmax"
        value={inputs.vmaxUmPerMin}
        min={5}
        max={200}
        step={5}
        unit=" µmol/min"
        onChange={(v) => onChange('vmaxUmPerMin', v)}
      />
      <Slider
        label="Km"
        value={inputs.kmMm}
        min={0.05}
        max={10}
        step={0.05}
        unit=" mmol/L"
        formatValue={(v) => v.toFixed(2)}
        onChange={(v) => onChange('kmMm', v)}
      />
      <Slider
        label="Inhibitor [I]"
        value={inputs.inhibitorUm}
        min={0}
        max={100}
        step={1}
        unit=" µmol/L"
        onChange={(v) => onChange('inhibitorUm', v)}
      />
      <Slider
        label="Ki"
        value={inputs.kiUm}
        min={0.2}
        max={50}
        step={0.2}
        unit=" µmol/L"
        formatValue={(v) => v.toFixed(1)}
        onChange={(v) => onChange('kiUm', v)}
      />
      <Slider
        label="Temperature"
        value={inputs.temperatureC}
        min={10}
        max={50}
        step={1}
        unit=" °C"
        onChange={(v) => onChange('temperatureC', v)}
      />
      <Slider
        label="pH"
        value={inputs.ph}
        min={4}
        max={9}
        step={0.1}
        formatValue={(v) => v.toFixed(1)}
        onChange={(v) => onChange('ph', v)}
      />
    </ControlRail>
  );
}

export const KineticsControlPanel = memo(KineticsControlPanelBase);
