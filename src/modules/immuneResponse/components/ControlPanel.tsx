import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import { ToggleGroup } from '@/shared/components/ToggleGroup/ToggleGroup';
import type { ImmuneInputs, PathogenType } from '../engine/types';

interface ControlPanelProps {
  inputs: ImmuneInputs;
  onChange: <K extends keyof ImmuneInputs>(key: K, value: ImmuneInputs[K]) => void;
}

const PATHOGEN_OPTIONS: { value: PathogenType; label: string }[] = [
  { value: 'extracellular', label: 'Extracellular' },
  { value: 'intracellular', label: 'Intracellular' },
];

const percent = (v: number) => Math.round(v * 100).toString();

function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <ToggleGroup
        label="Pathogen type"
        value={inputs.pathogenType}
        options={PATHOGEN_OPTIONS}
        colorVar="var(--adaptive)"
        onChange={(value) => onChange('pathogenType', value)}
      />
      <Slider
        label="Pathogen virulence"
        value={inputs.pathogenVirulence}
        min={0}
        max={200}
        step={5}
        unit="%"
        onChange={(v) => onChange('pathogenVirulence', v)}
      />
      <Slider
        label="Innate immunity"
        value={inputs.innateImmuneFunction}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('innateImmuneFunction', v)}
      />
      <Slider
        label="Helper T cell count"
        value={inputs.helperTCellCount}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('helperTCellCount', v)}
      />
      <Slider
        label="B cell function"
        value={inputs.bCellFunction}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('bCellFunction', v)}
      />
      <Slider
        label="Immunosuppression"
        value={inputs.immunosuppression}
        min={0}
        max={100}
        step={5}
        unit="%"
        onChange={(v) => onChange('immunosuppression', v)}
      />
    
    </ControlRail>
  );
}

export const ControlPanel = memo(ControlPanelBase);
