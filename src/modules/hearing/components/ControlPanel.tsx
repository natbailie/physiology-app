import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { HearingInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: HearingInputs;
  onChange: <K extends keyof HearingInputs>(key: K, value: HearingInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Stimulus frequency"
        value={inputs.stimulusFrequencyHz}
        min={125}
        max={8000}
        step={5}
        unit=" Hz"
        onChange={(v) => onChange('stimulusFrequencyHz', v)}
      />
      <Slider
        label="Stimulus level"
        value={inputs.stimulusLevelDbHl}
        min={-10}
        max={110}
        step={1}
        unit=" dB HL"
        onChange={(v) => onChange('stimulusLevelDbHl', v)}
      />
      <Slider
        label="Outer hair cells"
        value={inputs.outerHairCellIntegrity}
        min={0}
        max={1}
        step={0.02}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('outerHairCellIntegrity', v)}
      />
      <Slider
        label="Inner hair cells"
        value={inputs.innerHairCellIntegrity}
        min={0}
        max={1}
        step={0.02}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('innerHairCellIntegrity', v)}
      />
      <Slider
        label="Conductive loss"
        value={inputs.conductiveLossDb}
        min={0}
        max={60}
        step={1}
        unit=" dB"
        onChange={(v) => onChange('conductiveLossDb', v)}
      />
      <Slider
        label="Noise notch depth (4 kHz)"
        value={inputs.noiseNotchDepthDb}
        min={0}
        max={60}
        step={1}
        unit=" dB"
        onChange={(v) => onChange('noiseNotchDepthDb', v)}
      />
      <Slider
        label="Presbycusis severity"
        value={inputs.presbycusisSeverity}
        min={0}
        max={1}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('presbycusisSeverity', v)}
      />
      <Slider
        label="Ménière low-frequency loss"
        value={inputs.meniereLowFreqLossDb}
        min={0}
        max={60}
        step={1}
        unit=" dB"
        onChange={(v) => onChange('meniereLowFreqLossDb', v)}
      />
    </ControlRail>
  );
}
