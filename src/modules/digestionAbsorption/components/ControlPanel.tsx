import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlGroup, ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { DigestionInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: DigestionInputs;
  onChange: <K extends keyof DigestionInputs>(key: K, value: DigestionInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <ControlGroup label="The meal">
        <Slider
          label="Fat content"
          value={inputs.mealFatGrams}
          min={0}
          max={80}
          step={2}
          unit=" g"
          onChange={(v) => onChange('mealFatGrams', v)}
        />
        <Slider
          label="Lactose content"
          value={inputs.mealLactoseGrams}
          min={0}
          max={50}
          step={2}
          unit=" g"
          onChange={(v) => onChange('mealLactoseGrams', v)}
        />
      </ControlGroup>

      <ControlGroup label="Hydrolysis & emulsion">
        <Slider
          label="Pancreatic enzymes"
          value={inputs.pancreaticEnzymeCapacityPct}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={(v) => onChange('pancreaticEnzymeCapacityPct', v)}
        />
        <Slider
          label="Liver synthesis capacity"
          value={inputs.hepaticSynthesisCapacityPct}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => onChange('hepaticSynthesisCapacityPct', v)}
        />
        <Slider
          label="Ileal salt recycling"
          value={inputs.ilealReabsorptionFraction}
          min={0}
          max={1}
          step={0.01}
          unit="%"
          formatValue={percent}
          onChange={(v) => onChange('ilealReabsorptionFraction', v)}
        />
      </ControlGroup>

      <ControlGroup label="The wall">
        <Slider
          label="Mucosal surface area"
          value={inputs.mucosalSurfaceAreaPct}
          min={0}
          max={100}
          step={2}
          unit="%"
          onChange={(v) => onChange('mucosalSurfaceAreaPct', v)}
        />
        <Slider
          label="Terminal ileum function"
          value={inputs.terminalIlealFunctionPct}
          min={0}
          max={100}
          step={2}
          unit="%"
          onChange={(v) => onChange('terminalIlealFunctionPct', v)}
        />
        <Slider
          label="Lactase activity"
          value={inputs.lactaseActivityPct}
          min={0}
          max={100}
          step={2}
          unit="%"
          onChange={(v) => onChange('lactaseActivityPct', v)}
        />
      </ControlGroup>

      <ControlGroup label="Colon & transit">
        <Slider
          label="Colonic function"
          value={inputs.colonicFunctionPct}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => onChange('colonicFunctionPct', v)}
        />
        <Slider
          label="Secretory drive"
          value={inputs.secretoryDrivePct}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => onChange('secretoryDrivePct', v)}
        />
        <Slider
          label="Transit speed"
          value={inputs.transitMultiplier}
          min={0.5}
          max={3}
          step={0.1}
          unit="x"
          formatValue={(v) => `${v.toFixed(1)}x`}
          onChange={(v) => onChange('transitMultiplier', v)}
        />
      </ControlGroup>
    </ControlRail>
  );
}

export const ControlPanel = memo(ControlPanelBase);
