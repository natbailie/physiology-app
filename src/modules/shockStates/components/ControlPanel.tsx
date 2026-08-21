import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { ShockInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: ShockInputs;
  onChange: <K extends keyof ShockInputs>(key: K, value: ShockInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Blood volume"
        value={inputs.bloodVolumeMl}
        min={2000}
        max={6500}
        step={50}
        unit=" mL"
        onChange={(v) => onChange('bloodVolumeMl', v)}
      />
      <Slider
        label="Contractility"
        value={inputs.contractility}
        min={0}
        max={2}
        step={0.02}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('contractility', v)}
      />
      <Slider
        label="Vascular resistance"
        value={inputs.systemicVascularResistance}
        min={0.15}
        max={3}
        step={0.01}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('systemicVascularResistance', v)}
      />
      <Slider
        label="Pericardial pressure"
        value={inputs.pericardialPressureMmHg}
        min={0}
        max={28}
        step={0.5}
        unit=" mmHg"
        onChange={(v) => onChange('pericardialPressureMmHg', v)}
      />
      <Slider
        label="Pulmonary resistance"
        value={inputs.pulmonaryVascularResistance}
        min={1}
        max={9}
        step={0.1}
        unit="x"
        onChange={(v) => onChange('pulmonaryVascularResistance', v)}
      />
      <Slider
        label="Tissue extraction"
        value={inputs.tissueExtractionCapacity}
        min={0.2}
        max={1.3}
        step={0.02}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('tissueExtractionCapacity', v)}
      />
      <Slider
        label="Oxygen demand"
        value={inputs.oxygenDemandMlPerMin}
        min={120}
        max={600}
        step={10}
        unit=" mL/min"
        onChange={(v) => onChange('oxygenDemandMlPerMin', v)}
      />
      <Slider
        label="Haemoglobin"
        value={inputs.haemoglobinGDl}
        min={3}
        max={18}
        step={0.5}
        unit=" g/dL"
        onChange={(v) => onChange('haemoglobinGDl', v)}
      />
      <Slider
        label="Baroreflex gain"
        value={inputs.baroreflexGain}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('baroreflexGain', v)}
      />
    </ControlRail>
  );
}
