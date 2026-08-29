import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { CoronaryInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: CoronaryInputs;
  onChange: <K extends keyof CoronaryInputs>(key: K, value: CoronaryInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();

function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Heart rate"
        value={inputs.heartRateBpm}
        min={40}
        max={180}
        step={1}
        unit=" bpm"
        onChange={(v) => onChange('heartRateBpm', v)}
      />
      <Slider
        label="Systolic pressure"
        value={inputs.aorticSystolicPressureMmHg}
        min={70}
        max={210}
        step={1}
        unit=" mmHg"
        onChange={(v) => onChange('aorticSystolicPressureMmHg', v)}
      />
      <Slider
        label="Diastolic pressure"
        value={inputs.aorticDiastolicPressureMmHg}
        min={30}
        max={130}
        step={1}
        unit=" mmHg"
        onChange={(v) => onChange('aorticDiastolicPressureMmHg', v)}
      />
      <Slider
        label="End-diastolic volume"
        value={inputs.endDiastolicVolumeMl}
        min={50}
        max={280}
        step={5}
        unit=" mL"
        onChange={(v) => onChange('endDiastolicVolumeMl', v)}
      />
      <Slider
        label="Contractility"
        value={inputs.contractilityFraction}
        min={0}
        max={2}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('contractilityFraction', v)}
      />
      <Slider
        label="Stenosis (diameter)"
        value={inputs.stenosisPercentDiameter}
        min={0}
        max={98}
        step={1}
        unit="%"
        onChange={(v) => onChange('stenosisPercentDiameter', v)}
      />
      <Slider
        label="Constrictor tone"
        value={inputs.coronaryTonePercent}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('coronaryTonePercent', v)}
      />
      <Slider
        label="Collaterals"
        value={inputs.collateralFraction}
        min={0}
        max={1}
        step={0.05}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('collateralFraction', v)}
      />
      <Slider
        label="Haemoglobin"
        value={inputs.haemoglobinGPerDl}
        min={4}
        max={18}
        step={0.5}
        unit=" g/dL"
        onChange={(v) => onChange('haemoglobinGPerDl', v)}
      />
      <Slider
        label="Oxygen saturation"
        value={inputs.arterialOxygenSaturationPct}
        min={70}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('arterialOxygenSaturationPct', v)}
      />
      <Slider
        label="Nitrates"
        value={inputs.nitrateDosePercent}
        min={0}
        max={100}
        step={5}
        unit="%"
        onChange={(v) => onChange('nitrateDosePercent', v)}
      />
      <Slider
        label="Beta-blocker"
        value={inputs.betaBlockerDosePercent}
        min={0}
        max={100}
        step={5}
        unit="%"
        onChange={(v) => onChange('betaBlockerDosePercent', v)}
      />
    </ControlRail>
  );
}

export const ControlPanel = memo(ControlPanelBase);
