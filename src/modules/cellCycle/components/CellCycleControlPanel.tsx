import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { CellCycleInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: CellCycleInputs;
  onChange: <K extends keyof CellCycleInputs>(key: K, value: CellCycleInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

function CellCycleControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Growth factor drive"
        value={inputs.growthFactorDrive}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('growthFactorDrive', v)}
      />
      <Slider
        label="Oncogenic drive (MYC-class)"
        value={inputs.oncogeneDrive}
        min={0}
        max={1}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('oncogeneDrive', v)}
      />
      <Slider
        label="DNA damage"
        value={inputs.dnaDamage}
        min={0}
        max={1}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('dnaDamage', v)}
      />
      <Slider
        label="p53 function"
        value={inputs.p53Function}
        min={0}
        max={1}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('p53Function', v)}
      />
      <Slider
        label="RB1 function"
        value={inputs.rbFunction}
        min={0}
        max={1}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('rbFunction', v)}
      />
      <Slider
        label="CDK4/6 inhibitor"
        value={inputs.cdk46InhibitionPct}
        min={0}
        max={100}
        step={5}
        unit="%"
        onChange={(v) => onChange('cdk46InhibitionPct', v)}
      />
      <Slider
        label="Spindle poison (taxane)"
        value={inputs.spindlePoisonPct}
        min={0}
        max={100}
        step={5}
        unit="%"
        onChange={(v) => onChange('spindlePoisonPct', v)}
      />
      <Slider
        label="Replication blocker"
        value={inputs.replicationBlockPct}
        min={0}
        max={100}
        step={5}
        unit="%"
        onChange={(v) => onChange('replicationBlockPct', v)}
      />
    </ControlRail>
  );
}

export const CellCycleControlPanel = memo(CellCycleControlPanelBase);
