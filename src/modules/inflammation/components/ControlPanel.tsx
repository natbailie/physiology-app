import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail, ControlGroup } from '@/shared/components/ControlRail/ControlRail';
import type { InflammationInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: InflammationInputs;
  onChange: <K extends keyof InflammationInputs>(key: K, value: InflammationInputs[K]) => void;
}

function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <ControlGroup label="The challenge">
        <Slider
          label="Insult severity"
          value={inputs.insultSeverityPct}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => onChange('insultSeverityPct', v)}
        />
      </ControlGroup>
      <ControlGroup label="Defence & treatment">
        <Slider
          label="Innate immunity"
          value={inputs.innateImmuneFunctionPct}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => onChange('innateImmuneFunctionPct', v)}
        />
        <Slider
          label="Antibiotic efficacy"
          value={inputs.antibioticEfficacyPct}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => onChange('antibioticEfficacyPct', v)}
        />
        <Slider
          label="Steroid dose"
          value={inputs.steroidDosePct}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => onChange('steroidDosePct', v)}
        />
        <Slider
          label="Source control"
          value={inputs.sourceControlPct}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => onChange('sourceControlPct', v)}
        />
      </ControlGroup>
    </ControlRail>
  );
}

export const ControlPanel = memo(ControlPanelBase);
