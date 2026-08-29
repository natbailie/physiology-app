import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail, ControlGroup } from '@/shared/components/ControlRail/ControlRail';
import type { MicturitionInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: MicturitionInputs;
  onChange: <K extends keyof MicturitionInputs>(key: K, value: MicturitionInputs[K]) => void;
}

function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <ControlGroup label="Filling">
        <Slider
          label="Urine production"
          value={inputs.urineProductionMLperMin}
          min={0.5}
          max={5}
          step={0.5}
          unit=" mL/min"
          onChange={(v) => onChange('urineProductionMLperMin', v)}
        />
      </ControlGroup>
      <ControlGroup label="Autonomic control">
        <Slider
          label="Parasympathetic (pelvic nerve)"
          value={inputs.parasympatheticPct}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => onChange('parasympatheticPct', v)}
        />
        <Slider
          label="Sympathetic (hypogastric nerve)"
          value={inputs.sympatheticPct}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => onChange('sympatheticPct', v)}
        />
      </ControlGroup>
      <ControlGroup label="Voluntary control">
        <Slider
          label="External sphincter"
          value={inputs.voluntarySphincterPct}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => onChange('voluntarySphincterPct', v)}
        />
        <Slider
          label="Cortex inhibition of reflex"
          value={inputs.cortexInhibitsMicturition ? 100 : 0}
          min={0}
          max={100}
          step={100}
          unit="%"
          onChange={(v) => onChange('cortexInhibitsMicturition', v >= 50)}
        />
      </ControlGroup>
    </ControlRail>
  );
}

export const ControlPanel = memo(ControlPanelBase);
