import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { MedullaInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: MedullaInputs;
  onChange: <K extends keyof MedullaInputs>(key: K, value: MedullaInputs[K]) => void;
}

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Tumour secretion"
        value={inputs.tumourSecretionRate}
        min={0}
        max={100}
        step={1}
        onChange={(v) => onChange('tumourSecretionRate', v)}
      />
      <Slider
        label="Noradrenaline share"
        value={inputs.noradrenalineFractionPct}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('noradrenalineFractionPct', v)}
      />
      <Slider
        label="Alpha blockade"
        value={inputs.alphaBlockadePct}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('alphaBlockadePct', v)}
      />
      <Slider
        label="Beta blockade"
        value={inputs.betaBlockadePct}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('betaBlockadePct', v)}
      />
    </ControlRail>
  );
}
