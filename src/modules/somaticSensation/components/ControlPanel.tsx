import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { SomaticInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: SomaticInputs;
  onChange: <K extends keyof SomaticInputs>(key: K, value: SomaticInputs[K]) => void;
}

function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Touch stimulus (Aβ)"
        value={inputs.touchStimulusDrive}
        min={0}
        max={100}
        step={1}
        onChange={(v) => onChange('touchStimulusDrive', v)}
      />
      <Slider
        label="Nociceptive drive"
        value={inputs.nociceptiveStimulusDrive}
        min={0}
        max={100}
        step={1}
        onChange={(v) => onChange('nociceptiveStimulusDrive', v)}
      />
      <Slider
        label="Rubbing / counterstimulus"
        value={inputs.rubbingGateDrive}
        min={0}
        max={100}
        step={1}
        onChange={(v) => onChange('rubbingGateDrive', v)}
      />
      <Slider
        label="Descending modulation"
        value={inputs.descendingModulation}
        min={0}
        max={100}
        step={1}
        onChange={(v) => onChange('descendingModulation', v)}
      />
      <Slider
        label="Local anaesthetic block"
        value={inputs.localAnaestheticBlock}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('localAnaestheticBlock', v)}
      />
      <Slider
        label="Peripheral sensitisation"
        value={inputs.peripheralSensitisation}
        min={0}
        max={100}
        step={1}
        onChange={(v) => onChange('peripheralSensitisation', v)}
      />
      <Slider
        label="Central wind-up gain"
        value={inputs.windUpGain}
        min={0}
        max={100}
        step={1}
        onChange={(v) => onChange('windUpGain', v)}
      />
      <Slider
        label="Left hemicord lesion"
        value={inputs.leftHemisectionSeverity}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('leftHemisectionSeverity', v)}
      />
      <Slider
        label="Right hemicord lesion"
        value={inputs.rightHemisectionSeverity}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('rightHemisectionSeverity', v)}
      />
      <Slider
        label="Anterior quadrants"
        value={inputs.anteriorQuadrantSeverity}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('anteriorQuadrantSeverity', v)}
      />
      <Slider
        label="Central canal (syrinx)"
        value={inputs.centralCanalSeverity}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('centralCanalSeverity', v)}
      />
    </ControlRail>
  );
}

export const ControlPanel = memo(ControlPanelBase);
