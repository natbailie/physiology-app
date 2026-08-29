import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { PregnancyInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: PregnancyInputs;
  onChange: <K extends keyof PregnancyInputs>(key: K, value: PregnancyInputs[K]) => void;
}

const percent = (v: number) => Math.round(v).toString();

function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <Slider
        label="Gestational age"
        value={inputs.gestationalWeeks}
        min={4}
        max={42}
        step={1}
        unit=" weeks"
        onChange={(v) => onChange('gestationalWeeks', v)}
      />
      <Slider
        label="Twin gestation"
        value={inputs.twinGestation}
        min={0}
        max={1}
        step={1}
        unit="%"
        formatValue={(v) => (v >= 0.5 ? 'twins' : 'singleton')}
        onChange={(v) => onChange('twinGestation', v)}
      />
      <Slider
        label="Placental function"
        value={inputs.placentalFunctionPct}
        min={0}
        max={100}
        step={1}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('placentalFunctionPct', v)}
      />
      <Slider
        label="Delivered (puerperium)"
        value={inputs.deliveredMode}
        min={0}
        max={1}
        step={1}
        formatValue={(v) => (v >= 0.5 ? 'yes' : 'no')}
        onChange={(v) => onChange('deliveredMode', v)}
      />
      <Slider
        label="Suckling frequency"
        value={inputs.sucklingDrivePct}
        min={0}
        max={100}
        step={1}
        unit="%"
        formatValue={percent}
        onChange={(v) => onChange('sucklingDrivePct', v)}
      />
      <Slider
        label="Pre-pregnancy Hb"
        value={inputs.baselineHaemoglobinGPerDl}
        min={9}
        max={15}
        step={0.1}
        unit=" g/dL"
        onChange={(v) => onChange('baselineHaemoglobinGPerDl', v)}
      />
    </ControlRail>
  );
}

export const ControlPanel = memo(ControlPanelBase);
