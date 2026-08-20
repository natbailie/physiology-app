import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { AnsInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: AnsInputs;
  onChange: <K extends keyof AnsInputs>(key: K, value: AnsInputs[K]) => void;
}

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Sympathetic tone"
        value={inputs.sympatheticTone}
        min={0}
        max={100}
        step={5}
        unit="%"
        onChange={(v) => onChange('sympatheticTone', v)}
      />
      <Slider
        label="Parasympathetic tone"
        value={inputs.parasympatheticTone}
        min={0}
        max={100}
        step={5}
        unit="%"
        onChange={(v) => onChange('parasympatheticTone', v)}
      />
      <Slider
        label="Circulating epinephrine"
        value={inputs.circulatingEpinephrine}
        min={0}
        max={100}
        step={5}
        unit="%"
        onChange={(v) => onChange('circulatingEpinephrine', v)}
      />
      <Slider
        label="Beta blockade"
        value={inputs.betaBlockade}
        min={0}
        max={100}
        step={5}
        unit="%"
        onChange={(v) => onChange('betaBlockade', v)}
      />
      <Slider
        label="Muscarinic blockade"
        value={inputs.muscarinicBlockade}
        min={0}
        max={100}
        step={5}
        unit="%"
        onChange={(v) => onChange('muscarinicBlockade', v)}
      />
      <Slider
        label="Alpha-1 blockade"
        value={inputs.alphaBlockade}
        min={0}
        max={100}
        step={5}
        unit="%"
        onChange={(v) => onChange('alphaBlockade', v)}
      />
      <Slider
        label="Cholinesterase inhibition"
        value={inputs.cholinesteraseInhibition}
        min={0}
        max={100}
        step={5}
        unit="%"
        onChange={(v) => onChange('cholinesteraseInhibition', v)}
      />
    
    </ControlRail>
  );
}
