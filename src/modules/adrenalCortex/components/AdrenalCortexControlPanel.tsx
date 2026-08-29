import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { AdrenalCortexInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: AdrenalCortexInputs;
  onChange: <K extends keyof AdrenalCortexInputs>(key: K, value: AdrenalCortexInputs[K]) => void;
}

function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="ACTH drive"
        value={inputs.acthDrivePct}
        min={0}
        max={200}
        step={5}
        unit="%"
        formatValue={(v) => Math.round(v).toString()}
        onChange={(v) => onChange('acthDrivePct', v)}
      />
      <Slider
        label="21-hydroxylase block"
        value={inputs.block21Pct}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('block21Pct', v)}
      />
      <Slider
        label="11β-hydroxylase block"
        value={inputs.block11Pct}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('block11Pct', v)}
      />
      <Slider
        label="17α-hydroxylase block"
        value={inputs.block17Pct}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('block17Pct', v)}
      />
      <Slider
        label="3β-HSD block"
        value={inputs.block3bhsdPct}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('block3bhsdPct', v)}
      />
      <Slider
        label="Replacement therapy"
        value={inputs.replacementTherapyPct}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('replacementTherapyPct', v)}
      />
    </ControlRail>
  );
}

export const ControlPanel = memo(ControlPanelBase);
