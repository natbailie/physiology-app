import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { HypersensitivityInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: HypersensitivityInputs;
  onChange: <K extends keyof HypersensitivityInputs>(key: K, value: HypersensitivityInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Antigen dose"
        value={inputs.antigenDose}
        min={0}
        max={200}
        step={5}
        unit="%"
        onChange={(v) => onChange('antigenDose', v)}
      />
      <Slider
        label="IgE sensitisation (type I)"
        value={inputs.igeSensitisation}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('igeSensitisation', v)}
      />
      <Slider
        label="IgG vs cell surface (type II)"
        value={inputs.iggAgainstCellSurface}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('iggAgainstCellSurface', v)}
      />
      <Slider
        label="IgG for complexes (type III)"
        value={inputs.circulatingIggForComplexes}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('circulatingIggForComplexes', v)}
      />
      <Slider
        label="Sensitised T cells (type IV)"
        value={inputs.sensitisedTCells}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('sensitisedTCells', v)}
      />
      <Slider
        label="Complement function"
        value={inputs.complementFunction}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('complementFunction', v)}
      />
      <Slider
        label="Mast cell / histamine blockade"
        value={inputs.mastCellStabilisation}
        min={0}
        max={100}
        step={5}
        unit="%"
        onChange={(v) => onChange('mastCellStabilisation', v)}
      />
    </ControlRail>
  );
}
