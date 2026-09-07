import { memo } from 'react';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import { Slider } from '@/shared/components/Slider/Slider';
import { ToggleGroup } from '@/shared/components/ToggleGroup/ToggleGroup';
import type { MvInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: MvInputs;
  onChange: <K extends keyof MvInputs>(key: K, value: MvInputs[K]) => void;
}

const MODE_OPTIONS = [
  { value: 'cpap' as const, label: 'CPAP' },
  { value: 'niv' as const, label: 'BiPAP (NIV)' },
  { value: 'invasive' as const, label: 'Invasive' },
];

const percent = (v: number) => Math.round(v * 100).toString();

export const ControlPanel = memo(function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="PEEP / EPAP"
        value={inputs.epapPeepCmH2O}
        min={0}
        max={20}
        step={1}
        unit=" cmH2O"
        onChange={(v) => onChange('epapPeepCmH2O', v)}
      />
      <Slider
        label="IPAP / PIP"
        value={inputs.ipapPipCmH2O}
        min={0}
        max={35}
        step={1}
        unit=" cmH2O"
        onChange={(v) => onChange('ipapPipCmH2O', v)}
      />
      <Slider
        label="Ventilator rate"
        value={inputs.ventRatePerMin}
        min={4}
        max={40}
        step={1}
        unit=" /min"
        onChange={(v) => onChange('ventRatePerMin', v)}
      />
      <Slider
        label="Inspired O2"
        value={inputs.fiO2}
        min={0.21}
        max={1}
        step={0.01}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('fiO2', v)}
      />
      <ToggleGroup
        label="Ventilator mode"
        value={inputs.mode}
        options={MODE_OPTIONS}
        colorVar="var(--vq)"
        onChange={(value) => onChange('mode', value)}
      />
    </ControlRail>
  );
});