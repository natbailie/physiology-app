import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { CerebralInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: CerebralInputs;
  onChange: <K extends keyof CerebralInputs>(key: K, value: CerebralInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Mean arterial pressure"
        value={inputs.meanArterialPressureMmHg}
        min={40}
        max={170}
        step={1}
        unit=" mmHg"
        onChange={(v) => onChange('meanArterialPressureMmHg', v)}
      />
      <Slider
        label="Intracranial mass"
        value={inputs.massVolumeMl}
        min={0}
        max={150}
        step={1}
        unit=" mL"
        onChange={(v) => onChange('massVolumeMl', v)}
      />
      <Slider
        label="PaCO₂"
        value={inputs.paCO2MmHg}
        min={15}
        max={80}
        step={1}
        unit=" mmHg"
        onChange={(v) => onChange('paCO2MmHg', v)}
      />
      <Slider
        label="PaO₂"
        value={inputs.paO2MmHg}
        min={25}
        max={150}
        step={1}
        unit=" mmHg"
        onChange={(v) => onChange('paO2MmHg', v)}
      />
      <Slider
        label="CSF production"
        value={inputs.csfProductionRate}
        min={0}
        max={2.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('csfProductionRate', v)}
      />
      <Slider
        label="CSF absorption"
        value={inputs.csfAbsorptionCapacity}
        min={0}
        max={1.5}
        step={0.02}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('csfAbsorptionCapacity', v)}
      />
      <Slider
        label="Autoregulation"
        value={inputs.autoregulationIntegrity}
        min={0}
        max={1}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('autoregulationIntegrity', v)}
      />
      <Slider
        label="Venous outflow pressure"
        value={inputs.venousOutflowPressureMmHg}
        min={0}
        max={25}
        step={0.5}
        unit=" mmHg"
        onChange={(v) => onChange('venousOutflowPressureMmHg', v)}
      />
      <Slider
        label="BBB permeability"
        value={inputs.bbbPermeabilityPct}
        min={0}
        max={200}
        step={5}
        unit="%"
        formatValue={(v) => Math.round(v).toString()}
        onChange={(v) => onChange('bbbPermeabilityPct', v)}
      />
    </ControlRail>
  );
}

export const ControlPanel = memo(ControlPanelBase);
