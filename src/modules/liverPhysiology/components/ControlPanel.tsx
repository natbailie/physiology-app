import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { LiverInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: LiverInputs;
  onChange: <K extends keyof LiverInputs>(key: K, value: LiverInputs[K]) => void;
}

const percent = (v: number) => Math.round(v).toString();

function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Haemolysis"
        value={inputs.haemolysisMultiplier}
        min={1}
        max={8}
        step={0.1}
        unit="× normal"
        formatValue={percent}
        onChange={(v) => onChange('haemolysisMultiplier', v)}
      />
      <Slider
        label="UGT (conjugation) activity"
        value={inputs.ugtActivity}
        min={0}
        max={1}
        step={0.01}
        unit="%"
        formatValue={(v) => Math.round(v * 100).toString()}
        onChange={(v) => onChange('ugtActivity', v)}
      />
      <Slider
        label="Hepatocyte excretion"
        value={inputs.hepatocyteExcretionPct}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('hepatocyteExcretionPct', v)}
      />
      <Slider
        label="Acute hepatocyte injury"
        value={inputs.hepatocyteInjuryPct}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('hepatocyteInjuryPct', v)}
      />
      <Slider
        label="Bile duct obstruction"
        value={inputs.biliaryObstructionPct}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(v) => onChange('biliaryObstructionPct', v)}
      />
      <Slider
        label="Albumin"
        value={inputs.albuminGPerL}
        min={20}
        max={50}
        step={1}
        unit=" g/L"
        onChange={(v) => onChange('albuminGPerL', v)}
      />
    </ControlRail>
  );
}

export const ControlPanel = memo(ControlPanelBase);
