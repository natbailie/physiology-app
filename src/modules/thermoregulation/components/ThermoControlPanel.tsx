import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { ThermoInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: ThermoInputs;
  onChange: <K extends keyof ThermoInputs>(key: K, value: ThermoInputs[K]) => void;
}

const percent = (v: number) => Math.round(v).toString();
const xTimes = (v: number) => `${Math.round(v * 10) / 10}×`;

function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Ambient temperature"
        value={inputs.ambientTemperatureC}
        min={-20}
        max={48}
        step={1}
        unit=" °C"
        onChange={(v) => onChange('ambientTemperatureC', v)}
      />
      <Slider
        label="Humidity"
        value={inputs.humidityPct}
        min={0}
        max={100}
        step={1}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('humidityPct', v)}
      />
      <Slider
        label="Wind / wet clothing"
        value={inputs.windWetnessPct}
        min={0}
        max={100}
        step={1}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('windWetnessPct', v)}
      />
      <Slider
        label="Metabolic rate"
        value={inputs.metabolicRateMultiplier}
        min={1}
        max={12}
        step={0.1}
        unit="× basal"
        formatValue={xTimes}
        onChange={(v) => onChange('metabolicRateMultiplier', v)}
      />
      <Slider
        label="Pyrogens"
        value={inputs.pyrogenLevel}
        min={0}
        max={100}
        step={1}
        onChange={(v) => onChange('pyrogenLevel', v)}
      />
      <Slider
        label="Sweating impairment"
        value={inputs.sweatImpairmentPct}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('sweatImpairmentPct', v)}
      />
    </ControlRail>
  );
}

export const ControlPanel = memo(ControlPanelBase);
