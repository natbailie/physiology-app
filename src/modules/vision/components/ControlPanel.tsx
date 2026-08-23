import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { VisionInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: VisionInputs;
  onChange: <K extends keyof VisionInputs>(key: K, value: VisionInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Scene luminance"
        value={inputs.sceneLuminanceLogCd}
        min={-5}
        max={4}
        step={0.5}
        unit=" log cd/m²"
        onChange={(v) => onChange('sceneLuminanceLogCd', v)}
      />
      <Slider
        label="Rod integrity"
        value={inputs.rodIntegrity}
        min={0}
        max={1}
        step={0.02}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('rodIntegrity', v)}
      />
      <Slider
        label="Foveal cone integrity"
        value={inputs.coneIntegrity}
        min={0}
        max={1}
        step={0.02}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('coneIntegrity', v)}
      />
      <Slider
        label="Left optic nerve (afferent)"
        value={inputs.leftOpticNerveAfferent}
        min={0}
        max={1}
        step={0.02}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('leftOpticNerveAfferent', v)}
      />
      <Slider
        label="Right pupil efferent"
        value={inputs.rightPupilEfferentGain}
        min={0}
        max={1}
        step={0.02}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('rightPupilEfferentGain', v)}
      />
    </ControlRail>
  );
}
