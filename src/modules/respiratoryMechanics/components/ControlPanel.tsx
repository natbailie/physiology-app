import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { RespMechInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: RespMechInputs;
  onChange: <K extends keyof RespMechInputs>(key: K, value: RespMechInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Respiratory rate"
        value={inputs.respiratoryRate}
        min={8}
        max={40}
        step={1}
        unit=" /min"
        onChange={(v) => onChange('respiratoryRate', v)}
      />
      <Slider
        label="Tidal volume"
        value={inputs.tidalVolumeML}
        min={300}
        max={1000}
        step={25}
        unit=" mL"
        onChange={(v) => onChange('tidalVolumeML', v)}
      />
      <Slider
        label="Lung compliance"
        value={inputs.lungCompliance}
        min={20}
        max={150}
        step={5}
        unit=" mL/cmH2O"
        onChange={(v) => onChange('lungCompliance', v)}
      />
      <Slider
        label="Airway resistance"
        value={inputs.airwayResistance}
        min={0.5}
        max={20}
        step={0.5}
        unit=" cmH2O/L/s"
        formatValue={(v) => v.toFixed(1)}
        onChange={(v) => onChange('airwayResistance', v)}
      />
      <Slider
        label="Surfactant function"
        value={inputs.surfactantFunction}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('surfactantFunction', v)}
      />
      <Slider
        label="Dead space"
        value={inputs.deadSpaceFraction}
        min={0}
        max={70}
        step={5}
        unit="%"
        onChange={(v) => onChange('deadSpaceFraction', v)}
      />
      <Slider
        label="Shunt"
        value={inputs.shuntFraction}
        min={0}
        max={50}
        step={5}
        unit="%"
        onChange={(v) => onChange('shuntFraction', v)}
      />
      <Slider
        label="HPV strength"
        value={inputs.hpvStrength}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('hpvStrength', v)}
      />
    
    </ControlRail>
  );
}
