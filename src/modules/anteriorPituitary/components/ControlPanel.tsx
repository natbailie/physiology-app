import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { PituitaryInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: PituitaryInputs;
  onChange: <K extends keyof PituitaryInputs>(key: K, value: PituitaryInputs[K]) => void;
}

const percent = (v: number) => Math.round(v).toString();

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="GH adenoma secretion"
        value={inputs.ghAdenomaSecretion}
        min={0}
        max={100}
        step={1}
        onChange={(v) => onChange('ghAdenomaSecretion', v)}
      />
      <Slider
        label="Prolactinoma secretion"
        value={inputs.prolactinomaSecretion}
        min={0}
        max={100}
        step={1}
        onChange={(v) => onChange('prolactinomaSecretion', v)}
      />
      <Slider
        label="Non-functioning mass"
        value={inputs.nonfunctioningMass}
        min={0}
        max={100}
        step={1}
        onChange={(v) => onChange('nonfunctioningMass', v)}
      />
      <Slider
        label="Dopamine tone"
        value={inputs.dopamineTonePct}
        min={0}
        max={100}
        step={1}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('dopamineTonePct', v)}
      />
      <Slider
        label="D2 receptor block (drugs)"
        value={inputs.d2ReceptorBlockPct}
        min={0}
        max={100}
        step={1}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('d2ReceptorBlockPct', v)}
      />
      <Slider
        label="TRH drive"
        value={inputs.trhStimulusUnits}
        min={0}
        max={100}
        step={1}
        onChange={(v) => onChange('trhStimulusUnits', v)}
      />
      <Slider
        label="Epiphyses open"
        value={inputs.epiphysesOpen}
        min={0}
        max={1}
        step={1}
        formatValue={(v) => (v >= 0.5 ? 'yes' : 'fused')}
        onChange={(v) => onChange('epiphysesOpen', v)}
      />
    </ControlRail>
  );
}
