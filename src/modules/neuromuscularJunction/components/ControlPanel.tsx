import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { NmjInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: NmjInputs;
  onChange: <K extends keyof NmjInputs>(key: K, value: NmjInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Vesicle release"
        value={inputs.vesicleReleaseCapacity}
        min={0}
        max={1.5}
        step={0.02}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('vesicleReleaseCapacity', v)}
      />
      <Slider
        label="Calcium channels"
        value={inputs.calciumChannelFunction}
        min={0}
        max={1.5}
        step={0.02}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('calciumChannelFunction', v)}
      />
      <Slider
        label="Receptor density"
        value={inputs.receptorDensity}
        min={0}
        max={1.5}
        step={0.02}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('receptorDensity', v)}
      />
      <Slider
        label="Cholinesterase"
        value={inputs.acetylcholinesteraseActivity}
        min={0}
        max={2}
        step={0.02}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('acetylcholinesteraseActivity', v)}
      />
      <Slider
        label="Non-depolarising blocker"
        value={inputs.nondepolarisingBlocker}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('nondepolarisingBlocker', v)}
      />
      <Slider
        label="Depolarising blocker"
        value={inputs.depolarisingBlocker}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('depolarisingBlocker', v)}
      />
      <Slider
        label="Stimulation rate"
        value={inputs.stimulationFrequencyHz}
        min={0.5}
        max={50}
        step={0.5}
        unit=" Hz"
        onChange={(v) => onChange('stimulationFrequencyHz', v)}
      />
    </ControlRail>
  );
}
