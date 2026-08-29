import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ToggleGroup } from '@/shared/components/ToggleGroup/ToggleGroup';
import { ControlGroup, ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { CapillaryInputs, TissueBed } from '../engine/types';

interface ControlPanelProps {
  inputs: CapillaryInputs;
  onChange: <K extends keyof CapillaryInputs>(key: K, value: CapillaryInputs[K]) => void;
  /** Selecting a bed also loads its characteristic pressures and reflection coefficient, since
   * those are properties of the vessel wall rather than free choices. */
  onSelectBed: (bed: TissueBed) => void;
}

const multiple = (v: number) => `${v.toFixed(1)}x`;

const BED_OPTIONS: { value: TissueBed; label: string }[] = [
  { value: 'systemic', label: 'Systemic' },
  { value: 'pulmonary', label: 'Lung' },
  { value: 'hepatic', label: 'Liver' },
  { value: 'glomerulus', label: 'Glomerulus' },
];

function ControlPanelBase({ inputs, onChange, onSelectBed }: ControlPanelProps) {
  return (
    <ControlRail>
      <ToggleGroup
        label="Tissue bed"
        value={inputs.tissueBed}
        options={BED_OPTIONS}
        colorVar="var(--capillary)"
        onChange={onSelectBed}
      />

      <ControlGroup label="Hydrostatic">
        <Slider
          label="Inflow pressure"
          value={inputs.arterialInflowPressure}
          min={5}
          max={180}
          step={1}
          unit=" mmHg"
          onChange={(v) => onChange('arterialInflowPressure', v)}
        />
        <Slider
          label="Outflow pressure"
          value={inputs.venousOutflowPressure}
          min={0}
          max={40}
          step={1}
          unit=" mmHg"
          onChange={(v) => onChange('venousOutflowPressure', v)}
        />
        <Slider
          label="Precapillary tone"
          value={inputs.precapillaryTone}
          min={0.2}
          max={3}
          step={0.05}
          formatValue={multiple}
          onChange={(v) => onChange('precapillaryTone', v)}
        />
      </ControlGroup>

      <ControlGroup label="Oncotic">
        <Slider
          label="Plasma albumin"
          value={inputs.plasmaAlbuminGDl}
          min={1}
          max={5.5}
          step={0.1}
          unit=" g/dL"
          formatValue={(v) => v.toFixed(1)}
          onChange={(v) => onChange('plasmaAlbuminGDl', v)}
        />
        <Slider
          label="Reflection coefficient"
          value={inputs.reflectionCoefficient}
          min={0.05}
          max={1}
          step={0.05}
          formatValue={(v) => v.toFixed(2)}
          onChange={(v) => onChange('reflectionCoefficient', v)}
        />
      </ControlGroup>

      <ControlGroup label="Wall & drainage">
        <Slider
          label="Permeability (Kf)"
          value={inputs.capillaryPermeability}
          min={0.2}
          max={5}
          step={0.1}
          formatValue={multiple}
          onChange={(v) => onChange('capillaryPermeability', v)}
        />
        <Slider
          label="Lymphatic capacity"
          value={inputs.lymphaticFlowCapacity}
          min={0}
          max={3}
          step={0.02}
          formatValue={multiple}
          onChange={(v) => onChange('lymphaticFlowCapacity', v)}
        />
        <Slider
          label="Interstitial compliance"
          value={inputs.interstitialCompliance}
          min={0.3}
          max={3}
          step={0.05}
          formatValue={multiple}
          onChange={(v) => onChange('interstitialCompliance', v)}
        />
      </ControlGroup>
    </ControlRail>
  );
}

export const ControlPanel = memo(ControlPanelBase);
