import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlGroup, ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { ErythroInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: ErythroInputs;
  onChange: <K extends keyof ErythroInputs>(key: K, value: ErythroInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();
const times = (v: number) => `${v.toFixed(1)}x`;

function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <ControlGroup label="The loop">
        <Slider
          label="Renal function"
          value={inputs.renalFunction}
          min={0}
          max={1.5}
          step={0.05}
          unit="%"
          formatValue={percent}
          onChange={(v) => onChange('renalFunction', v)}
        />
        <Slider
          label="Marrow function"
          value={inputs.marrowFunction}
          min={0}
          max={1.5}
          step={0.05}
          unit="%"
          formatValue={percent}
          onChange={(v) => onChange('marrowFunction', v)}
        />
        <Slider
          label="Inspired oxygen"
          value={inputs.inspiredOxygen}
          min={40}
          max={150}
          step={1}
          unit="%"
          onChange={(v) => onChange('inspiredOxygen', v)}
        />
      </ControlGroup>

      <ControlGroup label="Substrates & losses">
        <Slider
          label="Iron availability"
          value={inputs.ironAvailability}
          min={0}
          max={150}
          step={1}
          unit="%"
          onChange={(v) => onChange('ironAvailability', v)}
        />
        <Slider
          label="B12 / folate"
          value={inputs.b12FolateStatus}
          min={0}
          max={150}
          step={1}
          unit="%"
          onChange={(v) => onChange('b12FolateStatus', v)}
        />
        <Slider
          label="Chronic blood loss"
          value={inputs.bloodLossRate}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={(v) => onChange('bloodLossRate', v)}
        />
        <Slider
          label="Hemolysis"
          value={inputs.hemolysisRate}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={(v) => onChange('hemolysisRate', v)}
        />
      </ControlGroup>

      <ControlGroup label="Iron regulation (hepcidin)">
        <Slider
          label="Inflammation (IL-6)"
          value={inputs.inflammationLevelPct}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => onChange('inflammationLevelPct', v)}
        />
        <Slider
          label="Liver synthetic function"
          value={inputs.liverSyntheticFunctionPct}
          min={0}
          max={100}
          step={2}
          unit="%"
          onChange={(v) => onChange('liverSyntheticFunctionPct', v)}
        />
        <Slider
          label="Erythropoietic drive"
          value={inputs.erythropoieticDriveMultiplier}
          min={0.5}
          max={3}
          step={0.1}
          unit="%"
          formatValue={times}
          onChange={(v) => onChange('erythropoieticDriveMultiplier', v)}
        />
        <Slider
          label="Iron sensing (HFE)"
          value={inputs.ironSensingIntegrityPct}
          min={0}
          max={100}
          step={2}
          unit="%"
          onChange={(v) => onChange('ironSensingIntegrityPct', v)}
        />
      </ControlGroup>
    </ControlRail>
  );
}

export const ControlPanel = memo(ControlPanelBase);
