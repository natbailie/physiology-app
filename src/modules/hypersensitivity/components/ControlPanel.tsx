import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { HypersensitivityInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: HypersensitivityInputs;
  onChange: <K extends keyof HypersensitivityInputs>(key: K, value: HypersensitivityInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
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
      <Slider
        label="ABO compatibility"
        value={inputs.aboCompatibility}
        min={0}
        max={1}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('aboCompatibility', v)}
      />
      <Slider
        label="Recipient IgA deficiency"
        value={inputs.recipientIgaDeficiency}
        min={0}
        max={1}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('recipientIgaDeficiency', v)}
      />
      <Slider
        label="Product leukocyte load"
        value={inputs.productLeukocyteLoad}
        min={0}
        max={100}
        step={5}
        unit="%"
        onChange={(v) => onChange('productLeukocyteLoad', v)}
      />
      <Slider
        label="Donor anti-leukocyte antibody"
        value={inputs.donorAntileukocyteAntibody}
        min={0}
        max={1}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('donorAntileukocyteAntibody', v)}
      />
      <Slider
        label="Anamnestic recall (minor antigen)"
        value={inputs.anamnesticRecall}
        min={0}
        max={1}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('anamnesticRecall', v)}
      />
      <Slider
        label="Cardiac / renal reserve"
        value={inputs.cardiacReserve}
        min={0}
        max={1.5}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('cardiacReserve', v)}
      />
    </ControlRail>
  );
}

export const ControlPanel = memo(ControlPanelBase);
